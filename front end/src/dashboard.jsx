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
  const [minhasEscalas, setMinhasEscalas] = useState([]);
  const [carregandoMinhasEscalas, setCarregandoMinhasEscalas] = useState(false);
  const [erroMinhasEscalas, setErroMinhasEscalas] = useState("");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin && pagina === "funcionarios") {
      setPagina("escalas");
    }
  }, [isAdmin, pagina]);

  useEffect(() => {
    async function carregarMinhasEscalas() {
      if (!isAdmin || pagina !== "minhas-escalas") {
        return;
      }

      setCarregandoMinhasEscalas(true);
      setErroMinhasEscalas("");

      try {
        const res = await api.get("/admin/minhas-escalas");
        setMinhasEscalas(res.data.escalas || []);
      } catch (error) {
        setErroMinhasEscalas(error?.response?.data?.msg || "Não foi possível carregar suas escalas.");
      } finally {
        setCarregandoMinhasEscalas(false);
      }
    }

    carregarMinhasEscalas();
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
          {isAdmin && <button onClick={() => setPagina("minhas-escalas")}>📌 Minhas escalas</button>}
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

        {pagina === "minhas-escalas" && isAdmin && (
          <div className="section-block">
            <h2>Escalas que eu postei</h2>
            <p className="subtitle">Aqui aparecem apenas as escalas criadas por este administrador, com os funcionários atribuídos.</p>

            {carregandoMinhasEscalas ? (
              <p>Carregando escalas...</p>
            ) : erroMinhasEscalas ? (
              <p className="error info-message">{erroMinhasEscalas}</p>
            ) : minhasEscalas.length === 0 ? (
              <p className="subtitle">Nenhuma escala criada por você ainda.</p>
            ) : (
              <div className="cards-list">
                {minhasEscalas.map((escala) => (
                  <div key={escala.id} className="card section-block">
                    <h3>{escala.nome_festa}</h3>
                    <p><strong>Local:</strong> {escala.local_nome}</p>
                    <p><strong>Data:</strong> {escala.data_festa}</p>
                    <p><strong>Status:</strong> {escala.status}</p>
                    <p><strong>Atribuídos:</strong> {escala.total_atribuidos} de {escala.total_vagas}</p>

                    <div className="vagas-lista">
                      {escala.vagas.map((vaga) => (
                        <div key={vaga.vaga_id} className="vaga-item">
                          <strong>{vaga.nome || "Vaga aberta"}</strong>
                          <span>{vaga.confirmado_em ? "Confirmado" : "Livre"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pagina === "escalas" && <Escalas user={user} />}
        {pagina === "ferramentas" && <Ferramentas user={user} />}
        {pagina === "reservas" && <Reservas user={user} />}
      </div>
    </div>
  );
}