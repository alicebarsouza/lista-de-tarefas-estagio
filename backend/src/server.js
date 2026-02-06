require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function mapRow(row) {
  return {
    id: row.id,
    nome: row.nome,
    custo: row.custo,
    dataLimite: row.data_limite,
    ordem: row.ordem,
  };
}

// Listar tarefas
app.get("/api/tarefas", (req, res) => {
  db.all("SELECT * FROM tarefas ORDER BY ordem ASC", [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao listar tarefas" });
    }
    res.json(rows.map(mapRow));
  });
});

// Incluir tarefa
app.post("/api/tarefas", (req, res) => {
  const { nome, custo, dataLimite } = req.body;

  if (!nome || nome.trim() === "" || custo === undefined || dataLimite === undefined) {
    return res.status(400).json({ message: "Nome, custo e data limite são obrigatórios" });
  }

  const custoNumber = Number(custo);
  if (Number.isNaN(custoNumber) || custoNumber < 0) {
    return res.status(400).json({ message: "Custo inválido" });
  }

  // Última ordem
  db.get("SELECT MAX(ordem) as maxOrdem FROM tarefas", [], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao buscar ordem" });
    }
    const nextOrder = (row?.maxOrdem || 0) + 1;

    const stmt = db.prepare(
      "INSERT INTO tarefas (nome, custo, data_limite, ordem) VALUES (?, ?, ?, ?)"
    );
    stmt.run(nome.trim(), custoNumber, dataLimite, nextOrder, function (insertErr) {
      if (insertErr) {
        if (insertErr.message.includes("UNIQUE") && insertErr.message.includes("nome")) {
          return res.status(400).json({ message: "Já existe uma tarefa com esse nome" });
        }
        console.error(insertErr);
        return res.status(500).json({ message: "Erro ao incluir tarefa" });
      }

      db.get("SELECT * FROM tarefas WHERE id = ?", [this.lastID], (selectErr, newRow) => {
        if (selectErr) {
          console.error(selectErr);
          return res.status(500).json({ message: "Erro ao buscar tarefa criada" });
        }
        res.status(201).json(mapRow(newRow));
      });
    });
  });
});

// Editar tarefa (nome, custo, data_limite)
app.put("/api/tarefas/:id", (req, res) => {
  const { id } = req.params;
  const { nome, custo, dataLimite } = req.body;

  if (!nome || nome.trim() === "" || custo === undefined || dataLimite === undefined) {
    return res.status(400).json({ message: "Nome, custo e data limite são obrigatórios" });
  }

  const custoNumber = Number(custo);
  if (Number.isNaN(custoNumber) || custoNumber < 0) {
    return res.status(400).json({ message: "Custo inválido" });
  }

  // Verificar se já existe outro registro com o mesmo nome
  db.get(
    "SELECT id FROM tarefas WHERE nome = ? AND id <> ?",
    [nome.trim(), id],
    (err, existing) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Erro ao validar nome da tarefa" });
      }
      if (existing) {
        return res.status(400).json({ message: "Já existe uma tarefa com esse nome" });
      }

      const stmt = db.prepare(
        "UPDATE tarefas SET nome = ?, custo = ?, data_limite = ? WHERE id = ?"
      );
      stmt.run(nome.trim(), custoNumber, dataLimite, id, function (updateErr) {
        if (updateErr) {
          console.error(updateErr);
          return res.status(500).json({ message: "Erro ao atualizar tarefa" });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: "Tarefa não encontrada" });
        }

        db.get("SELECT * FROM tarefas WHERE id = ?", [id], (selectErr, row) => {
          if (selectErr) {
            console.error(selectErr);
            return res.status(500).json({ message: "Erro ao buscar tarefa atualizada" });
          }
          res.json(mapRow(row));
        });
      });
    }
  );
});

// Excluir tarefa
app.delete("/api/tarefas/:id", (req, res) => {
  const { id } = req.params;

  const stmt = db.prepare("DELETE FROM tarefas WHERE id = ?");
  stmt.run(id, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao excluir tarefa" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    res.status(204).send();
  });
});

// Mover para cima
app.post("/api/tarefas/:id/mover-cima", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM tarefas WHERE id = ?", [id], (err, current) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao buscar tarefa" });
    }
    if (!current) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    db.get(
      "SELECT * FROM tarefas WHERE ordem < ? ORDER BY ordem DESC LIMIT 1",
      [current.ordem],
      (err2, above) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ message: "Erro ao reordenar tarefas" });
        }
        if (!above) {
          return res.status(400).json({ message: "Tarefa já está no topo" });
        }

        // Troca de ordem usando valor temporário para evitar conflitos
        db.serialize(() => {
          db.run(
            "UPDATE tarefas SET ordem = -1 WHERE id = ?",
            [current.id],
            (errTemp) => {
              if (errTemp) {
                console.error(errTemp);
                return res
                  .status(500)
                  .json({ message: "Erro ao reordenar tarefas" });
              }

              db.run(
                "UPDATE tarefas SET ordem = ? WHERE id = ?",
                [current.ordem, above.id],
                (errUp) => {
                  if (errUp) {
                    console.error(errUp);
                    return res
                      .status(500)
                      .json({ message: "Erro ao reordenar tarefas" });
                  }

                  db.run(
                    "UPDATE tarefas SET ordem = ? WHERE id = ?",
                    [above.ordem, current.id],
                    (errDown) => {
                      if (errDown) {
                        console.error(errDown);
                        return res
                          .status(500)
                          .json({ message: "Erro ao reordenar tarefas" });
                      }
                      res.json({ message: "Reordenado com sucesso" });
                    }
                  );
                }
              );
            }
          );
        });
      }
    );
  });
});

// Mover para baixo
app.post("/api/tarefas/:id/mover-baixo", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM tarefas WHERE id = ?", [id], (err, current) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao buscar tarefa" });
    }
    if (!current) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    db.get(
      "SELECT * FROM tarefas WHERE ordem > ? ORDER BY ordem ASC LIMIT 1",
      [current.ordem],
      (err2, below) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ message: "Erro ao reordenar tarefas" });
        }
        if (!below) {
          return res.status(400).json({ message: "Tarefa já está na última posição" });
        }

        // Troca de ordem usando valor temporário para evitar conflitos
        db.serialize(() => {
          db.run(
            "UPDATE tarefas SET ordem = -1 WHERE id = ?",
            [current.id],
            (errTemp) => {
              if (errTemp) {
                console.error(errTemp);
                return res
                  .status(500)
                  .json({ message: "Erro ao reordenar tarefas" });
              }

              db.run(
                "UPDATE tarefas SET ordem = ? WHERE id = ?",
                [current.ordem, below.id],
                (errDown) => {
                  if (errDown) {
                    console.error(errDown);
                    return res
                      .status(500)
                      .json({ message: "Erro ao reordenar tarefas" });
                  }

                  db.run(
                    "UPDATE tarefas SET ordem = ? WHERE id = ?",
                    [below.ordem, current.id],
                    (errUp) => {
                      if (errUp) {
                        console.error(errUp);
                        return res
                          .status(500)
                          .json({ message: "Erro ao reordenar tarefas" });
                      }
                      res.json({ message: "Reordenado com sucesso" });
                    }
                  );
                }
              );
            }
          );
        });
      }
    );
  });
});

app.listen(PORT, () => {
  console.log(`Backend ouvindo na porta ${PORT}`);
});

