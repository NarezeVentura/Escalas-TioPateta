[README.md](https://github.com/user-attachments/files/28850499/README.md)
# Escalas Tio Pateta

Sistema completo para gerenciar escalas de eventos, cadastro de funcionarios, reservas de ferramentas e controle de devolucoes.

## Visao geral

O projeto e dividido em duas partes:

- Backend em Flask com autenticação JWT e banco SQLite.
- Frontend em React + Vite, consumindo a API local em `http://localhost:5000/api`.

### Principais recursos

- Login com JWT.
- Cadastro, edicao, listagem e exclusao de usuarios.
- Criacao e edicao de escalas.
- Inscricao e cancelamento de funcionarios em escalas abertas.
- Cadastro, edicao e exclusao de ferramentas.
- Reserva de ferramentas vinculada a uma escala.
- Controle de devolucao de reservas.
- Limpeza automatica de registros antigos.

## Tecnologias

- Python 3
- Flask
- Flask-JWT-Extended
- SQLite
- React 18
- Vite
- Axios

## Estrutura do projeto

```text
Escalas-TioPateta/
|-- app.py
|-- database.py
|-- README.md
`-- front end/
    |-- package.json
    |-- vite.config.js
    `-- src/
        |-- api.js
        |-- App.jsx
        |-- dashboard.jsx
        |-- escalas.jsx
        |-- Ferramentas.jsx
        |-- login.jsx
        |-- main.jsx
        |-- reservas.jsx
        `-- styles.css
```

## Como executar

### 1. Backend

Crie e ative um ambiente virtual, se quiser, e instale as dependencias do Flask manualmente.

Exemplo com pip:

```bash
pip install flask flask-jwt-extended werkzeug
```

Depois inicie o servidor:

```bash
python app.py
```

O backend sobe em:

```text
http://localhost:5000
```

### 2. Frontend

Entre na pasta do frontend:

```bash
cd "front end"
```

Instale as dependencias:

```bash
npm.cmd install
```

Inicie o ambiente de desenvolvimento:

```bash
npm.cmd run dev
```

O frontend normalmente fica em:

```text
http://localhost:5173
```

### 3. Build do frontend

Para gerar a versao de producao:

```bash
npm.cmd run build
```

## Banco de dados

O arquivo `database.py` cria automaticamente o banco `escala.db` com as tabelas principais:

- usuarios
- escalas
- escala_vagas
- ferramentas
- ferramenta_reservas

Na primeira inicializacao ele tambem:

- cria um administrador inicial;
- insere ferramentas padrao;
- garante a coluna `criado_por` na tabela de escalas.

## Acesso inicial

Para desenvolvimento local, o banco cria um administrador padrao:

- Email: `recreacaopatetatio@gmail.com`
- Senha: `TioPatet@1234`

Depois do primeiro acesso, troque essa senha se o projeto for ser usado fora do ambiente local.

## Regras de acesso

- Admin pode criar usuarios, escalas e ferramentas.
- Funcionario pode se inscrever em escalas abertas.
- Reservas de ferramentas podem ser feitas vinculando uma escala.
- Admin ve e gerencia tudo; funcionario ve apenas seus dados e reservas.

## API

Base URL:

```text
http://localhost:5000/api
```

Rotas principais:

- `POST /auth/login`
- `POST /auth/registro`
- `GET /usuarios/me`
- `GET /usuarios`
- `GET /escalas`
- `POST /escalas`
- `GET /escalas/:id`
- `PUT /escalas/:id`
- `DELETE /escalas/:id`
- `POST /escalas/:id/inscrever`
- `POST /escalas/:id/cancelar-inscricao`
- `GET /ferramentas`
- `POST /ferramentas`
- `PUT /ferramentas/:id`
- `DELETE /ferramentas/:id`
- `POST /ferramentas/:id/reservar`
- `GET /reservas`
- `POST /reservas/:id/devolver`

## Observacoes

- O frontend esta configurado para apontar para `http://localhost:5000/api`.
- No Windows, use `npm.cmd` no PowerShell para evitar problemas com `npm.ps1`.
- O backend usa CORS apenas para `http://localhost:5173` e `http://127.0.0.1:5173`.

## Licenca

Projeto interno/uso local. Adicione uma licenca se quiser distribuir publicamente.
