## Sistema Lista de Tarefas

Sistema web de lista de tarefas desenvolvido para prova de estágio, com frontend em **React** e backend em **Node.js + Express + SQLite**.

### Principais funcionalidades

- Cadastro de tarefas com:
  - Nome da tarefa (obrigatório e não pode repetir)
  - Custo em reais (obrigatório, valor numérico ≥ 0)
  - Data-limite (obrigatória, data válida)
- Listagem das tarefas ordenadas pelo campo **Ordem de apresentação**.
- Destaque visual para tarefas com custo **≥ R$ 1.000,00**.
- Edição (popup) de nome, custo e data-limite, com validação e verificação de nome duplicado.
- Exclusão com confirmação (Sim/Não).
- Reordenação das tarefas usando botões de **subir** e **descer**, com ordem persistida no banco.
- Formatação brasileira para datas (DD/MM/AAAA) e valores monetários (R$ 1.234,56).

### Acesso à aplicação

- **Link da aplicação da tarefa**:`http://localhost:5173/`
