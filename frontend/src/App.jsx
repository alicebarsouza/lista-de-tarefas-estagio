import React, { useEffect, useMemo, useState } from "react";
import { formatCurrencyBR, formatDateISOToBR } from "./formatters";

const emptyForm = { nome: "", custo: "", dataLimite: "" };

function App() {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formNova, setFormNova] = useState(emptyForm);
  const [salvandoNova, setSalvandoNova] = useState(false);

  const [editingTask, setEditingTask] = useState(null);
  const [formEdicao, setFormEdicao] = useState(emptyForm);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [tarefaParaExcluir, setTarefaParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    carregarTarefas();
  }, []);

  function carregarTarefas() {
    setLoading(true);
    setError("");
    fetch("/api/tarefas")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar tarefas");
        return res.json();
      })
      .then((data) => {
        setTarefas(data);
      })
      .catch((err) => {
        console.error(err);
        setError("Não foi possível carregar as tarefas.");
      })
      .finally(() => setLoading(false));
  }

  const totalCusto = useMemo(
    () => tarefas.reduce((acc, t) => acc + Number(t.custo || 0), 0),
    [tarefas]
  );

  function handleChangeNova(e) {
    const { name, value } = e.target;
    setFormNova((prev) => ({ ...prev, [name]: value }));
  }

  function handleChangeEdicao(e) {
    const { name, value } = e.target;
    setFormEdicao((prev) => ({ ...prev, [name]: value }));
  }

  function validarForm({ nome, custo, dataLimite }) {
    if (!nome.trim() || custo === "" || !dataLimite) {
      return "Todos os campos são obrigatórios.";
    }

    const custoNumber = Number(custo);
    if (Number.isNaN(custoNumber) || custoNumber < 0) {
      return "Custo inválido. Informe um valor numérico maior ou igual a zero.";
    }

    const data = new Date(dataLimite);
    if (Number.isNaN(data.getTime())) {
      return "Data-limite inválida.";
    }

    return null;
  }

  function parseCustoToNumber(custoStr) {
    return Number(custoStr);
  }

  function handleSubmitNova(e) {
    e.preventDefault();
    setError("");
    const erroValidacao = validarForm(formNova);
    if (erroValidacao) {
      setError(erroValidacao);
      return;
    }
    const body = {
      nome: formNova.nome.trim(),
      custo: parseCustoToNumber(formNova.custo),
      dataLimite: formNova.dataLimite,
    };

    setSalvandoNova(true);
    fetch("/api/tarefas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Erro ao incluir tarefa");
        }
        return res.json();
      })
      .then((nova) => {
        setTarefas((prev) => [...prev, nova].sort((a, b) => a.ordem - b.ordem));
        setFormNova(emptyForm);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setSalvandoNova(false));
  }

  function abrirEdicao(tarefa) {
    setEditingTask(tarefa);
    setFormEdicao({
      nome: tarefa.nome,
      custo: tarefa.custo.toString(),
      dataLimite: tarefa.dataLimite,
    });
    setError("");
  }

  function fecharEdicao() {
    setEditingTask(null);
    setFormEdicao(emptyForm);
    setSalvandoEdicao(false);
  }

  function handleSubmitEdicao(e) {
    e.preventDefault();
    if (!editingTask) return;
    setError("");

    const erroValidacao = validarForm(formEdicao);
    if (erroValidacao) {
      setError(erroValidacao);
      return;
    }

    const body = {
      nome: formEdicao.nome.trim(),
      custo: parseCustoToNumber(formEdicao.custo),
      dataLimite: formEdicao.dataLimite,
    };

    setSalvandoEdicao(true);
    fetch(`/api/tarefas/${editingTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Erro ao editar tarefa");
        }
        return res.json();
      })
      .then((atualizada) => {
        setTarefas((prev) =>
          prev
            .map((t) => (t.id === atualizada.id ? atualizada : t))
            .sort((a, b) => a.ordem - b.ordem)
        );
        fecharEdicao();
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setSalvandoEdicao(false));
  }

  function confirmarExcluir(tarefa) {
    setTarefaParaExcluir(tarefa);
    setError("");
  }

  function cancelarExcluir() {
    setTarefaParaExcluir(null);
    setExcluindo(false);
  }

  function executarExcluir() {
    if (!tarefaParaExcluir) return;
    setExcluindo(true);
    fetch(`/api/tarefas/${tarefaParaExcluir.id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok && res.status !== 204) {
          throw new Error("Erro ao excluir tarefa");
        }
        setTarefas((prev) => prev.filter((t) => t.id !== tarefaParaExcluir.id));
        cancelarExcluir();
      })
      .catch((err) => {
        console.error(err);
        setError("Não foi possível excluir a tarefa.");
        setExcluindo(false);
      });
  }

  function mover(id, direcao) {
    const endpoint =
      direcao === "cima"
        ? `/api/tarefas/${id}/mover-cima`
        : `/api/tarefas/${id}/mover-baixo`;
    fetch(endpoint, { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Erro ao reordenar");
        }
        carregarTarefas();
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  }

  return (
    <div className="app-container">
      <header>
        <h1>Lista de Tarefas</h1>
      </header>

      <main>
        {error && <div className="alert alert-error">{error}</div>}

        <section className="card">
          <h2>Incluir nova tarefa</h2>
          <form className="form-grid" onSubmit={handleSubmitNova}>
            <div className="form-field">
              <label htmlFor="nome">Nome da tarefa</label>
              <input
                id="nome"
                name="nome"
                type="text"
                placeholder="Ex: Pagar conta de energia"
                value={formNova.nome}
                onChange={handleChangeNova}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="custo">Custo (R$)</label>
              <input
                id="custo"
                name="custo"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 150.00"
                value={formNova.custo}
                onChange={handleChangeNova}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="dataLimite">Data-limite</label>
              <input
                id="dataLimite"
                name="dataLimite"
                type="date"
                placeholder="Ex: 2026-02-28"
                value={formNova.dataLimite}
                onChange={handleChangeNova}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={salvandoNova}>
                {salvandoNova ? "Salvando..." : "Incluir"}
              </button>
            </div>
          </form>
        </section>

        <section className="card">
          <div className="list-header">
            <h2>Lista de Tarefas</h2>
            <button className="secondary" onClick={carregarTarefas} disabled={loading}>
              Recarregar
            </button>
          </div>

          {loading ? (
            <p>Carregando tarefas...</p>
          ) : tarefas.length === 0 ? (
            <p>Nenhuma tarefa cadastrada.</p>
          ) : (
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Ordem de apresentação</th>
                  <th>Nome da tarefa</th>
                  <th>Custo (R$)</th>
                  <th>Data-limite</th>
                  <th>Reordenar</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tarefas.map((t, index) => {
                  const custoNumber = Number(t.custo || 0);
                  const destaque = custoNumber >= 1000;
                  const isFirst = index === 0;
                  const isLast = index === tarefas.length - 1;
                  return (
                    <tr
                      key={t.id}
                      className={destaque ? "task-row task-row-highlight" : "task-row"}
                    >
                      <td>{t.ordem}</td>
                      <td>{t.nome}</td>
                      <td>{formatCurrencyBR(custoNumber)}</td>
                      <td>{formatDateISOToBR(t.dataLimite)}</td>
                      <td className="reorder-cell">
                        <button
                          type="button"
                          onClick={() => mover(t.id, "cima")}
                          disabled={isFirst}
                          title="Subir tarefa"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => mover(t.id, "baixo")}
                          disabled={isLast}
                          title="Descer tarefa"
                        >
                          ↓
                        </button>
                      </td>
                      <td className="actions-cell">
                        <button type="button" onClick={() => abrirEdicao(t)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => confirmarExcluir(t)}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="footer-label">
                    Total de tarefas: {tarefas.length}
                  </td>
                  <td colSpan={4} className="footer-total">
                    Somatório dos custos: {formatCurrencyBR(totalCusto)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>
      </main>

      {editingTask && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Editar tarefa</h2>
            <form className="form-grid" onSubmit={handleSubmitEdicao}>
              <div className="form-field">
                <label htmlFor="edit-nome">Nome da tarefa</label>
                <input
                  id="edit-nome"
                  name="nome"
                  type="text"
                  placeholder="Ex: Pagar conta de energia"
                  value={formEdicao.nome}
                  onChange={handleChangeEdicao}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-custo">Custo (R$)</label>
                <input
                  id="edit-custo"
                  name="custo"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 150.00"
                  value={formEdicao.custo}
                  onChange={handleChangeEdicao}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-dataLimite">Data-limite</label>
                <input
                  id="edit-dataLimite"
                  name="dataLimite"
                  type="date"
                  placeholder="Ex: 2026-02-28"
                  value={formEdicao.dataLimite}
                  onChange={handleChangeEdicao}
                  required
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={fecharEdicao}
                  disabled={salvandoEdicao}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={salvandoEdicao}>
                  {salvandoEdicao ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tarefaParaExcluir && (
        <div className="modal-backdrop">
          <div className="modal small">
            <h2>Confirmar exclusão</h2>
            <p>
              Tem certeza que deseja excluir a tarefa{" "}
              <strong>{tarefaParaExcluir.nome}</strong>?
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={cancelarExcluir}
                disabled={excluindo}
              >
                Não
              </button>
              <button
                type="button"
                className="danger"
                onClick={executarExcluir}
                disabled={excluindo}
              >
                {excluindo ? "Excluindo..." : "Sim"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer>
        <small>Sistema Lista de Tarefas - Prova de estágio</small>
      </footer>
    </div>
  );
}

export default App;

