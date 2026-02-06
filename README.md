## Sistema Lista de Tarefas (React + Node)

Este projeto implementa o sistema de lista de tarefas exatamente conforme a especificação fornecida para a vaga de estágio.

- **Frontend**: React + Vite (`frontend/`)
- **Backend**: Node.js + Express + SQLite (`backend/`)

### Como rodar localmente

1. **Pré-requisitos**
   - Node.js instalado (versão LTS recomendada)

2. **Instalar dependências**

   ```bash
   cd backend
   npm install

   cd ../frontend
   npm install
   ```

3. **Subir o backend**

   ```bash
   cd backend
   npm run dev
   ```

   O backend ficará disponível em `http://localhost:4000`.

4. **Subir o frontend**

   Em outro terminal:

   ```bash
   cd frontend
   npm run dev
   ```

   A aplicação React ficará disponível em `http://localhost:5173`.

### Banco de dados

- Banco: **SQLite**
- Arquivo: criado automaticamente como `database.sqlite` dentro da pasta `backend`.
- Tabela `tarefas`:
  - `id` (INTEGER, chave primária, autoincremento)
  - `nome` (TEXT, obrigatório, **único**)
  - `custo` (REAL, obrigatório, **>= 0**)
  - `data_limite` (TEXT, obrigatório, data em formato ISO `AAAA-MM-DD`)
  - `ordem` (INTEGER, obrigatório, **único**, usado para ordenar a apresentação)

### Funcionalidades implementadas

- **Lista de Tarefas (página principal)**
  - Lista todas as tarefas cadastradas, ordenadas pelo campo `ordem`.
  - Exibe: Identificador, Nome da tarefa, Custo (R$), Data-limite (DD/MM/AAAA) e Ordem.
  - A linha da tarefa cujo **custo >= R$ 1.000,00** é destacada em amarelo.
  - Ao lado de cada registro existem botões de **Editar** e **Excluir**.
  - No rodapé da lista é exibido o **somatório dos custos** de todas as tarefas, em formato brasileiro.

- **Incluir**
  - Formulário para incluir nova tarefa na própria tela principal.
  - Campos obrigatórios: Nome da Tarefa, Custo (R$), Data-limite (DD/MM/AAAA).
  - Validação de:
    - Campos vazios
    - Custo numérico >= 0
    - Data válida (dia, mês e ano coerentes).
  - O identificador é gerado automaticamente pelo banco (auto-incremento).
  - O registro é incluído **no final da ordem de apresentação** (ordem = maior ordem + 1).
  - Não permite inclusão de tarefa com **nome repetido** (regra de negócio e constraint UNIQUE no banco).

- **Editar**
  - Edição feita em um **popup (modal)** com os 3 campos permitidos:
    - Nome da tarefa
    - Custo (R$)
    - Data-limite (DD/MM/AAAA)
  - Os três campos são obrigatórios.
  - Verificação de **nome duplicado** (não permite salvar se já existir outra tarefa com o mesmo nome).
  - Os demais campos (`id` e `ordem`) não podem ser alterados.

- **Excluir**
  - Botão **Excluir** para cada tarefa.
  - Ao clicar, abre um **popup de confirmação** (Sim/Não).
  - Se confirmado, o registro é excluído do banco.

- **Reordenação das tarefas**
  - Implementada pela opção **2** da especificação:
    - Em cada linha existem botões para **subir** (↑) e **descer** (↓) a tarefa na ordem de apresentação.
    - A primeira tarefa não pode subir; a última não pode descer (botões desabilitados).
  - A reordenação é persistida no banco, trocando as ordens das duas tarefas envolvidas.

- **Formatação brasileira**
  - Todas as **datas** exibidas na tela usam o formato **DD/MM/AAAA**.
  - Todos os **valores monetários** são exibidos no formato brasileiro (ex.: `R$ 1.234,56`).

### Publicação no GitHub

1. Crie um repositório no GitHub (por exemplo `lista-de-tarefas-estagio`).
2. No diretório raiz deste projeto (onde está este `README.md`), execute:

   ```bash
   git init
   git add .
   git commit -m "Sistema lista de tarefas (prova de estágio)"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   git push -u origin main
   ```

3. Substitua `SEU_USUARIO` e `SEU_REPO` pelos valores do seu GitHub.

### Sugestão de deploy (para permitir testes sem instalação)

Você pode publicar a aplicação em um serviço gratuito, por exemplo:

- **Backend (Node + SQLite)**: Render, Railway ou outro provedor que suporte Node.js.
- **Frontend (React)**: Vercel ou Netlify.

Passos gerais:

1. Faça deploy do **backend**:
   - Crie um novo serviço Node no provedor.
   - Configure o comando de start (`npm start`) e a porta (por exemplo 4000).
   - Garanta que o arquivo `database.sqlite` ficará em um diretório persistente se o provedor exigir.
2. Faça build do **frontend**:

   ```bash
   cd frontend
   npm run build
   ```

3. Publique a pasta `frontend/dist` em um hosting estático (Vercel/Netlify).
4. Ajuste no `vite.config.js` (ou via variável de ambiente) o endereço base da API se o backend não estiver em `http://localhost:4000`.

Ao final, inclua no README do repositório o **link público** do frontend para que o avaliador possa testar o sistema sem instalação.

