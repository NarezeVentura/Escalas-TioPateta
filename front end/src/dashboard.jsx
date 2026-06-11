import { useEffect, useState } from "react";
import api from "./api";
import Escalas from "./escalas";
import Ferramentas from "./Ferramentas";
import Reservas from "./reservas";

function criarCredenciais(nome) {
  const slug = nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "funcionario";

  const sufixo = Math.random().toString(36).slice(2, 7);
  const email = `${slug}.${sufixo}@tiopateta.local`;
  const senha = `${Math.random().toString(36).slice(2, 10)}A1!`;

  return { email, senha };
}

export default function Dashboard({ user, onLogout }) {
  const [pagina, setPagina] = useState("escalas");
  const [nomeFuncionario, setNomeFuncionario] = useState("");
  const [criandoFuncionario, setCriandoFuncionario] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [credenciaisCriadas, setCredenciaisCriadas] = useState(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin && pagina === "funcionarios") {
      setPagina("escalas");
    }
  }, [isAdmin, pagina]);

  async function criarFuncionario(e) {
    e.preventDefault();

    if (!nomeFuncionario.trim()) {
      setMensagem("Informe o nome do funcionário.");
      return;
    }

    setCriandoFuncionario(true);
    setMensagem("");
    setCredenciaisCriadas(null);

    try {
      const credenciais = criarCredenciais(nomeFuncionario);
      await api.post("/auth/registro", {
        nome: nomeFuncionario.trim(),
        email: credenciais.email,
        senha: credenciais.senha,
        role: "funcionario",
      });

      setCredenciaisCriadas({ nome: nomeFuncionario.trim(), ...credenciais });
      setNomeFuncionario("");
      setMensagem("Funcionário criado com sucesso.");
    } catch (error) {
      setMensagem(error?.response?.data?.msg || "Não foi possível criar o funcionário.");
    } finally {
      setCriandoFuncionario(false);
    }
  }

  return (
    <div className="container app-layout">
      <div className="card dashboard-card">
        <div className="dashboard-header">
          <div>
            <div className="logo-placeholder">TP</div>
            <h1>Equipe Tio Pateta</h1>
            <p className="subtitle">Olá, {user?.nome || "usuário"}</p>
          </div>

          <button className="btn-link" onClick={onLogout}>Sair</button>
        </div>

        <div className="buttons buttons-row">
          <button onClick={() => setPagina("escalas")}>📅 Escalas</button>
          <button onClick={() => setPagina("ferramentas")}>🛠 Ferramentas</button>
          <button onClick={() => setPagina("reservas")}>📋 Reservas</button>
          {isAdmin && <button onClick={() => setPagina("funcionarios")}>👥 Funcionários</button>}
        </div>

        {pagina === "funcionarios" && isAdmin && (
          <form className="form section-block" onSubmit={criarFuncionario}>
            <h2>Criar funcionário</h2>
            <p className="subtitle">Digite apenas o nome; o sistema gera as credenciais internas.</p>

            <label>
              Nome
              <input
                value={nomeFuncionario}
                onChange={(e) => setNomeFuncionario(e.target.value)}
                placeholder="Nome do funcionário"
              />
            </label>

            <button className="btn-primary" type="submit" disabled={criandoFuncionario}>
              {criandoFuncionario ? "Criando..." : "Criar funcionário"}
            </button>

            {mensagem && <p className="error info-message">{mensagem}</p>}

            {credenciaisCriadas && (
              <div className="credentials-box">
                <p><strong>Nome:</strong> {credenciaisCriadas.nome}</p>
                <p><strong>Email interno:</strong> {credenciaisCriadas.email}</p>
                <p><strong>Senha interna:</strong> {credenciaisCriadas.senha}</p>
              </div>
            )}
          </form>
        )}

        {pagina === "escalas" && <Escalas user={user} />}
        {pagina === "ferramentas" && <Ferramentas user={user} />}
        {pagina === "reservas" && <Reservas user={user} />}
      </div>
    </div>
  );
}