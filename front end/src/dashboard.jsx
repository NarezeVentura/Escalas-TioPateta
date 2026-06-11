import { useEffect, useState } from "react";
import api from "./api";
import Escalas from "./escalas";
import Ferramentas from "./Ferramentas";
import Reservas from "./reservas";

export default function Dashboard({ user, onLogout }) {
  const [pagina, setPagina] = useState("escalas");
  const [funcionarioForm, setFuncionarioForm] = useState({ nome: "", email: "", senha: "" });
  const [criandoFuncionario, setCriandoFuncionario] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [credenciaisCriadas, setCredenciaisCriadas] = useState(null);
  const [minhasEscalas, setMinhasEscalas] = useState([]);
  const [carregandoMinhasEscalas, setCarregandoMinhasEscalas] = useState(false);
  const [erroMinhasEscalas, setErroMinhasEscalas] = useState("");
  const [escalaSelecionada, setEscalaSelecionada] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [erroUsuarios, setErroUsuarios] = useState("");
  const [senhasUsuarios, setSenhasUsuarios] = useState({});

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

  useEffect(() => {
    async function carregarUsuarios() {
      if (!isAdmin || pagina !== "usuarios") {
        return;
      }

      setCarregandoUsuarios(true);
      setErroUsuarios("");

      try {
        const res = await api.get("/usuarios");
        setUsuarios(res.data.usuarios || []);
      } catch (error) {
        setErroUsuarios(error?.response?.data?.msg || "Não foi possível carregar os usuários.");
      } finally {
        setCarregandoUsuarios(false);
      }
    }

    carregarUsuarios();
  }, [isAdmin, pagina]);

  async function criarFuncionario(e) {
    e.preventDefault();

    if (!funcionarioForm.nome.trim() || !funcionarioForm.email.trim() || !funcionarioForm.senha.trim()) {
      setMensagem("Informe nome, email e senha do funcionário.");
      return;
    }

    setCriandoFuncionario(true);
    setMensagem("");
    setCredenciaisCriadas(null);

    try {
      await api.post("/auth/registro", {
        nome: funcionarioForm.nome.trim(),
        email: funcionarioForm.email.trim(),
        senha: funcionarioForm.senha,
        role: "funcionario",
      });

      setCredenciaisCriadas({
        nome: funcionarioForm.nome.trim(),
        email: funcionarioForm.email.trim(),
        senha: funcionarioForm.senha,
      });
      setFuncionarioForm({ nome: "", email: "", senha: "" });
      setMensagem("Funcionário criado e salvo no banco com sucesso.");
    } catch (error) {
      setMensagem(error?.response?.data?.msg || "Não foi possível criar o funcionário.");
    } finally {
      setCriandoFuncionario(false);
    }
  }

  async function excluirUsuario(usuario) {
    const confirmacao = window.confirm(`Excluir o usuário ${usuario.nome}?`);
    if (!confirmacao) {
      return;
    }

    setMensagem("");
    setErroUsuarios("");

    try {
      await api.delete(`/usuarios/${usuario.id}`);
      setMensagem("Usuário excluído com sucesso.");

      const res = await api.get("/usuarios");
      setUsuarios(res.data.usuarios || []);
    } catch (error) {
      setErroUsuarios(error?.response?.data?.msg || "Não foi possível excluir o usuário.");
    }
  }

  async function redefinirSenha(usuario) {
    const senha = senhasUsuarios[usuario.id] || "";

    setMensagem("");
    setErroUsuarios("");

    try {
      const resposta = await api.post(`/usuarios/${usuario.id}/senha`, senha.trim() ? { senha } : {});
      setMensagem(`Senha de ${resposta.data.nome} redefinida com sucesso.`);

      setSenhasUsuarios((atual) => ({
        ...atual,
        [usuario.id]: resposta.data.senha,
      }));
    } catch (error) {
      setErroUsuarios(error?.response?.data?.msg || "Não foi possível redefinir a senha.");
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
          {isAdmin && <button onClick={() => setPagina("usuarios")}>🧑‍💼 Usuários</button>}
        </div>

        {pagina === "funcionarios" && isAdmin && (
          <form className="form section-block" onSubmit={criarFuncionario}>
            <h2>Criar funcionário</h2>
            <p className="subtitle">O admin define nome, email e senha. Isso já fica salvo no banco para o funcionário entrar depois.</p>

            <label>
              Nome
              <input
                value={funcionarioForm.nome}
                onChange={(e) => setFuncionarioForm({ ...funcionarioForm, nome: e.target.value })}
                placeholder="Nome do funcionário"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={funcionarioForm.email}
                onChange={(e) => setFuncionarioForm({ ...funcionarioForm, email: e.target.value })}
                placeholder="funcionario@empresa.com"
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                value={funcionarioForm.senha}
                onChange={(e) => setFuncionarioForm({ ...funcionarioForm, senha: e.target.value })}
                placeholder="Senha de acesso"
              />
            </label>

            <button className="btn-primary" type="submit" disabled={criandoFuncionario}>
              {criandoFuncionario ? "Criando..." : "Criar funcionário"}
            </button>

            {mensagem && <p className="error info-message">{mensagem}</p>}

            {credenciaisCriadas && (
              <div className="credentials-box">
                <p><strong>Nome:</strong> {credenciaisCriadas.nome}</p>
                <p><strong>Email:</strong> {credenciaisCriadas.email}</p>
                <p><strong>Senha:</strong> {credenciaisCriadas.senha}</p>
              </div>
            )}
          </form>
        )}

        {pagina === "usuarios" && isAdmin && (
          <div className="section-block">
            <h2>Usuários cadastrados</h2>
            <p className="subtitle">Aqui você vê todos os usuários criados e pode excluir os que não precisar mais.</p>

            {carregandoUsuarios ? (
              <p>Carregando usuários...</p>
            ) : erroUsuarios ? (
              <p className="error info-message">{erroUsuarios}</p>
            ) : usuarios.length === 0 ? (
              <p className="subtitle">Nenhum usuário cadastrado.</p>
            ) : (
              <div className="cards-list">
                {usuarios.map((usuario) => (
                  <div key={usuario.id} className="card section-block">
                    <h3>{usuario.nome}</h3>
                    <p><strong>Email:</strong> {usuario.email}</p>
                    <p><strong>Perfil:</strong> {usuario.role}</p>
                    <p><strong>Criado em:</strong> {usuario.criado_em}</p>

                    <label>
                      Nova senha
                      <input
                        type="text"
                        value={senhasUsuarios[usuario.id] || ""}
                        onChange={(e) => setSenhasUsuarios({
                          ...senhasUsuarios,
                          [usuario.id]: e.target.value,
                        })}
                        placeholder="Deixe em branco para gerar uma senha"
                      />
                    </label>

                    {senhasUsuarios[usuario.id] && (
                      <div className="credentials-box">
                        <p><strong>Senha visível agora:</strong> {senhasUsuarios[usuario.id]}</p>
                      </div>
                    )}

                    <div className="buttons buttons-row">
                      <button className="btn-secondary" type="button" onClick={() => redefinirSenha(usuario)}>
                        Redefinir senha
                      </button>

                      <button className="btn-danger" type="button" onClick={() => excluirUsuario(usuario)}>
                        Excluir usuário
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
              <div className="section-grid-admin">
                <div className="cards-list">
                  {minhasEscalas.map((escala) => (
                    <div key={escala.id} className="card section-block">
                      <h3>{escala.nome_festa}</h3>
                      <p><strong>Local:</strong> {escala.local_nome}</p>
                      <p><strong>Data:</strong> {escala.data_festa}</p>
                      <p><strong>Status:</strong> {escala.status}</p>
                      <p><strong>Atribuídos:</strong> {escala.total_atribuidos} de {escala.total_vagas}</p>

                      <button className="btn-primary" type="button" onClick={() => setEscalaSelecionada(escala)}>
                        Ver detalhes
                      </button>
                    </div>
                  ))}
                </div>

                {escalaSelecionada ? (
                  <div className="card section-block detail-box">
                    <h2>{escalaSelecionada.nome_festa}</h2>
                    <p><strong>Local:</strong> {escalaSelecionada.local_nome}</p>
                    <p><strong>Endereço:</strong> {escalaSelecionada.local_endereco}</p>
                    <p><strong>Data:</strong> {escalaSelecionada.data_festa}</p>
                    <p><strong>Horário:</strong> {escalaSelecionada.horario_inicio} - {escalaSelecionada.horario_fim}</p>
                    <p><strong>Produto:</strong> {escalaSelecionada.produto}</p>
                    <p><strong>Status:</strong> {escalaSelecionada.status}</p>
                    <p><strong>Vagas:</strong> {escalaSelecionada.total_atribuidos} / {escalaSelecionada.total_vagas}</p>

                    <div className="vagas-lista">
                      {escalaSelecionada.vagas.map((vaga) => (
                        <div key={vaga.vaga_id} className="vaga-item">
                          <div>
                            <strong>{vaga.nome || "Vaga aberta"}</strong>
                            <p className="subtitle">{vaga.email || "Sem email"}</p>
                          </div>
                          <span>{vaga.confirmado_em ? "Confirmado" : "Livre"}</span>
                        </div>
                      ))}
                    </div>

                    <button className="btn-secondary" type="button" onClick={() => setEscalaSelecionada(null)}>
                      Fechar detalhes
                    </button>
                  </div>
                ) : (
                  <div className="card section-block">
                    <p className="subtitle">Selecione uma escala para ver os detalhes e os funcionários atribuídos.</p>
                  </div>
                )}
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