import { useEffect, useState } from "react";
import api from "./api";

const estadoInicial = {
  nome_festa: "",
  local_nome: "",
  local_endereco: "",
  data_festa: "",
  horario_inicio: "",
  horario_fim: "",
  duracao_horas: "",
  produto: "",
  atracoes: "",
  total_vagas: "2",
  status: "aberta",
};

export default function Escalas({ user }) {
  const [escalas, setEscalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [selecionada, setSelecionada] = useState(null);
  const [form, setForm] = useState(estadoInicial);
  const [editandoId, setEditandoId] = useState(null);

  const isAdmin = user?.role === "admin";

  async function carregar() {
    setLoading(true);
    setErro("");

    try {
      const url = isAdmin ? "/escalas?futuras=false" : "/escalas";
      const res = await api.get(url);
      setEscalas(res.data.escalas || []);
    } catch (error) {
      setErro(error?.response?.data?.msg || "Não foi possível carregar as escalas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [isAdmin]);

  function limparFormulario() {
    setForm(estadoInicial);
    setEditandoId(null);
  }

  function abrirEdicao(escala) {
    setEditandoId(escala.id);
    setForm({
      nome_festa: escala.nome_festa || "",
      local_nome: escala.local_nome || "",
      local_endereco: escala.local_endereco || "",
      data_festa: escala.data_festa || "",
      horario_inicio: escala.horario_inicio || "",
      horario_fim: escala.horario_fim || "",
      duracao_horas: escala.duracao_horas ?? "",
      produto: escala.produto || "",
      atracoes: escala.atracoes || "",
      total_vagas: escala.total_vagas ?? "2",
      status: escala.status || "aberta",
    });
  }

  async function salvarEscala(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");

    const payload = {
      ...form,
      duracao_horas: Number(form.duracao_horas),
      total_vagas: Number(form.total_vagas),
    };

    try {
      if (editandoId) {
        await api.put(`/escalas/${editandoId}`, payload);
        setMensagem("Escala atualizada com sucesso.");
      } else {
        await api.post("/escalas", payload);
        setMensagem("Escala criada com sucesso.");
      }

      limparFormulario();
      await carregar();
    } catch (error) {
      setErro(error?.response?.data?.msg || "Não foi possível salvar a escala.");
    }
  }

  async function excluirEscala(id) {
    if (!window.confirm("Deseja excluir esta escala?")) {
      return;
    }

    setErro("");
    setMensagem("");

    try {
      await api.delete(`/escalas/${id}`);
      if (selecionada?.id === id) {
        setSelecionada(null);
      }
      if (editandoId === id) {
        limparFormulario();
      }
      setMensagem("Escala excluída com sucesso.");
      await carregar();
    } catch (error) {
      setErro(error?.response?.data?.msg || "Não foi possível excluir a escala.");
    }
  }

  async function abrirDetalhes(id) {
    setErro("");
    try {
      const res = await api.get(`/escalas/${id}`);
      setSelecionada(res.data);
    } catch (error) {
      setErro(error?.response?.data?.msg || "Não foi possível abrir a escala.");
    }
  }

  async function confirmarPresenca() {
    if (!selecionada) {
      return;
    }

    setErro("");
    setMensagem("");

    try {
      const inscrito = (selecionada.vagas || []).some((vaga) => vaga.usuario_id === user?.id);

      if (inscrito) {
        await api.post(`/escalas/${selecionada.id}/cancelar-inscricao`);
        setMensagem("Presença cancelada.");
      } else {
        await api.post(`/escalas/${selecionada.id}/inscrever`);
        setMensagem("Presença confirmada.");
      }

      await abrirDetalhes(selecionada.id);
      await carregar();
    } catch (error) {
      setErro(error?.response?.data?.msg || "Não foi possível atualizar a presença.");
    }
  }

  const inscritoNaSelecionada = selecionada
    ? (selecionada.vagas || []).some((vaga) => vaga.usuario_id === user?.id)
    : false;

  return (
    <div className="section-block">
      {isAdmin && (
        <form className="form section-block" onSubmit={salvarEscala}>
          <h2>{editandoId ? "Editar escala" : "Nova escala"}</h2>

          <div className="grid-2">
            <label>
              Nome da festa
              <input value={form.nome_festa} onChange={(e) => setForm({ ...form, nome_festa: e.target.value })} />
            </label>
            <label>
              Local
              <input value={form.local_nome} onChange={(e) => setForm({ ...form, local_nome: e.target.value })} />
            </label>
            <label className="span-2">
              Endereço
              <input value={form.local_endereco} onChange={(e) => setForm({ ...form, local_endereco: e.target.value })} />
            </label>
            <label>
              Data
              <input type="date" value={form.data_festa} onChange={(e) => setForm({ ...form, data_festa: e.target.value })} />
            </label>
            <label>
              Início
              <input type="time" value={form.horario_inicio} onChange={(e) => setForm({ ...form, horario_inicio: e.target.value })} />
            </label>
            <label>
              Fim
              <input type="time" value={form.horario_fim} onChange={(e) => setForm({ ...form, horario_fim: e.target.value })} />
            </label>
            <label>
              Duração
              <input type="number" step="0.5" value={form.duracao_horas} onChange={(e) => setForm({ ...form, duracao_horas: e.target.value })} />
            </label>
            <label>
              Produto
              <input value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })} />
            </label>
            <label className="span-2">
              Atrações
              <textarea rows="3" value={form.atracoes} onChange={(e) => setForm({ ...form, atracoes: e.target.value })} />
            </label>
            <label>
              Vagas
              <input type="number" min="1" value={form.total_vagas} onChange={(e) => setForm({ ...form, total_vagas: e.target.value })} />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="aberta">aberta</option>
                <option value="fechada">fechada</option>
              </select>
            </label>
          </div>

          <div className="buttons buttons-row">
            <button className="btn-primary" type="submit">{editandoId ? "Salvar edição" : "Criar escala"}</button>
            {editandoId && <button className="btn-secondary" type="button" onClick={limparFormulario}>Cancelar edição</button>}
          </div>
        </form>
      )}

      {mensagem && <p className="error info-message">{mensagem}</p>}
      {erro && <p className="error">{erro}</p>}

      {loading ? (
        <p>Carregando escalas...</p>
      ) : (
        <div className="cards-list">
          {escalas.map((escala) => (
            <div key={escala.id} className="card section-block">
              <h3>{escala.nome_festa}</h3>
              <p>📍 {escala.local_nome}</p>
              <p>📅 {escala.data_festa}</p>
              <p>🕒 {escala.horario_inicio} - {escala.horario_fim}</p>
              <p>Status: {escala.status}</p>

              <div className="buttons buttons-row">
                <button className="btn-secondary" type="button" onClick={() => abrirDetalhes(escala.id)}>Ver</button>
                {isAdmin ? (
                  <>
                    <button className="btn-secondary" type="button" onClick={() => abrirEdicao(escala)}>Editar</button>
                    <button className="btn-danger" type="button" onClick={() => excluirEscala(escala.id)}>Excluir</button>
                  </>
                ) : (
                  <button className="btn-primary" type="button" onClick={() => abrirDetalhes(escala.id)}>
                    Confirmar presença
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selecionada && (
        <div className="card section-block detail-box">
          <h2>{selecionada.nome_festa}</h2>
          <p><strong>Local:</strong> {selecionada.local_nome}</p>
          <p><strong>Endereço:</strong> {selecionada.local_endereco}</p>
          <p><strong>Data:</strong> {selecionada.data_festa}</p>
          <p><strong>Horário:</strong> {selecionada.horario_inicio} - {selecionada.horario_fim}</p>
          <p><strong>Produto:</strong> {selecionada.produto}</p>
          <p><strong>Atrações:</strong> {selecionada.atracoes || "Sem atrações cadastradas"}</p>
          <p><strong>Vagas:</strong> {selecionada.vagas_preenchidas} / {selecionada.total_vagas}</p>

          <div className="vagas-lista">
            {(selecionada.vagas || []).map((vaga) => (
              <div key={vaga.vaga_id} className="vaga-item">
                <strong>{vaga.nome || "Vaga aberta"}</strong>
                <span>{vaga.confirmado_em ? "Confirmado" : "Livre"}</span>
              </div>
            ))}
          </div>

          {!isAdmin && (
            <button className="btn-primary" type="button" onClick={confirmarPresenca}>
              {inscritoNaSelecionada ? "Cancelar presença" : "Confirmar presença"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}