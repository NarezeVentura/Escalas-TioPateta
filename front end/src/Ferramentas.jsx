import { useEffect, useState } from "react";
import api from "./api";

export default function Ferramentas({ user }) {
  const [ferramentas, setFerramentas] = useState([]);
  const [escalas, setEscalas] = useState([]);
  const [ferramentaAtiva, setFerramentaAtiva] = useState(null);
  const [form, setForm] = useState({ escala_id: "", data_retirada: "", hora_retirada: "" });
  const [adminForm, setAdminForm] = useState({ nome: "", descricao: "", quantidade_total: "0" });
  const [editandoFerramentaId, setEditandoFerramentaId] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  async function carregar() {
    setLoading(true);
    setErro("");

    try {
      const [ferramentasRes, escalasRes] = await Promise.all([
        api.get("/ferramentas"),
        api.get(user?.role === "admin" ? "/escalas?futuras=false" : "/escalas"),
      ]);

      setFerramentas(ferramentasRes.data.ferramentas || []);
      setEscalas(escalasRes.data.escalas || []);
    } catch (error) {
      setErro(error?.response?.data?.msg || "Não foi possível carregar as ferramentas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [user?.role]);

  function abrirReserva(ferramentaId) {
    setFerramentaAtiva(ferramentaId);
    setMensagem("");
    setErro("");
    setForm({
      escala_id: escalas[0]?.id ? String(escalas[0].id) : "",
      data_retirada: "",
      hora_retirada: "",
    });
  }

  function editarFerramenta(ferramenta) {
    setMensagem("");
    setErro("");
    setEditandoFerramentaId(ferramenta.id);
    setAdminForm({
      nome: ferramenta.nome || "",
      descricao: ferramenta.descricao || "",
      quantidade_total: String(ferramenta.quantidade_total ?? 0),
    });
  }

  function limparFormularioAdmin() {
    setEditandoFerramentaId(null);
    setAdminForm({ nome: "", descricao: "", quantidade_total: "0" });
  }

  async function salvarFerramentaAdmin(e) {
    e.preventDefault();

    if (!adminForm.nome.trim()) {
      setErro("Informe o nome da ferramenta.");
      return;
    }

    setMensagem("");
    setErro("");

    try {
      const payload = {
        nome: adminForm.nome.trim(),
        descricao: adminForm.descricao,
        quantidade_total: Number(adminForm.quantidade_total),
      };

      if (editandoFerramentaId) {
        await api.put(`/ferramentas/${editandoFerramentaId}`, payload);
        setMensagem("Ferramenta atualizada com sucesso.");
      } else {
        await api.post("/ferramentas", payload);
        setMensagem("Ferramenta cadastrada com sucesso.");
      }

      limparFormularioAdmin();
      await carregar();
    } catch (error) {
      setErro(error?.response?.data?.msg || "Não foi possível salvar a ferramenta.");
    }
  }

  async function excluirFerramenta(ferramenta) {
    const confirmacao = window.confirm(`Excluir a ferramenta ${ferramenta.nome}?`);
    if (!confirmacao) {
      return;
    }

    setMensagem("");
    setErro("");

    try {
      await api.delete(`/ferramentas/${ferramenta.id}`);

      if (editandoFerramentaId === ferramenta.id) {
        limparFormularioAdmin();
      }

      setMensagem("Ferramenta excluída com sucesso.");
      await carregar();
    } catch (error) {
      setErro(error?.response?.data?.msg || "Não foi possível excluir a ferramenta.");
    }
  }

  async function reservar(e) {
    e.preventDefault();

    if (!ferramentaAtiva) {
      return;
    }

    setMensagem("");
    setErro("");

    try {
      await api.post(`/ferramentas/${ferramentaAtiva}/reservar`, {
        escala_id: Number(form.escala_id),
        data_retirada: form.data_retirada,
        hora_retirada: form.hora_retirada,
      });

      setMensagem("Ferramenta reservada com sucesso.");
      setFerramentaAtiva(null);
      await carregar();
    } catch (error) {
      setErro(error?.response?.data?.msg || "Não foi possível reservar a ferramenta.");
    }
  }

  return (
    <div className="section-block">
      <h2>Ferramentas</h2>
      <p className="subtitle">
        {isAdmin
          ? "Cadastre novas ferramentas, altere descrições e ajuste quantidades sem reserva."
          : "Veja os itens disponíveis e faça reservas ligadas a uma escala."}
      </p>

      {isAdmin && (
        <form className="card section-block" onSubmit={salvarFerramentaAdmin}>
          <h3>{editandoFerramentaId ? "Editar ferramenta" : "Nova ferramenta"}</h3>

          <label>
            Nome
            <input
              value={adminForm.nome}
              onChange={(e) => setAdminForm({ ...adminForm, nome: e.target.value })}
              placeholder="Nome da ferramenta"
            />
          </label>

          <label>
            Descrição
            <input
              value={adminForm.descricao}
              onChange={(e) => setAdminForm({ ...adminForm, descricao: e.target.value })}
              placeholder="Descrição da ferramenta"
            />
          </label>

          <label>
            Quantidade disponível
            <input
              type="number"
              min="0"
              value={adminForm.quantidade_total}
              onChange={(e) => setAdminForm({ ...adminForm, quantidade_total: e.target.value })}
            />
          </label>

          <div className="buttons buttons-row">
            <button className="btn-primary" type="submit">
              {editandoFerramentaId ? "Salvar alterações" : "Cadastrar ferramenta"}
            </button>
            {editandoFerramentaId && (
              <button className="btn-secondary" type="button" onClick={limparFormularioAdmin}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      )}

      {mensagem && <p className="error info-message">{mensagem}</p>}
      {erro && <p className="error">{erro}</p>}

      {loading ? (
        <p>Carregando ferramentas...</p>
      ) : (
        <div className="cards-list">
          {ferramentas.map((ferramenta) => (
            <div key={ferramenta.id} className="card section-block">
              <h3>{ferramenta.nome}</h3>
              <p>{ferramenta.descricao || "Sem descrição"}</p>
              <p><strong>Disponíveis:</strong> {ferramenta.quantidade_disponivel}</p>

              {isAdmin ? (
                <div className="buttons buttons-row">
                  <button className="btn-secondary" type="button" onClick={() => editarFerramenta(ferramenta)}>
                    Editar
                  </button>
                  <button className="btn-danger" type="button" onClick={() => excluirFerramenta(ferramenta)}>
                    Excluir
                  </button>
                </div>
              ) : (
                <button className="btn-primary" type="button" onClick={() => abrirReserva(ferramenta.id)}>
                  Reservar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {ferramentaAtiva && (
        <form className="card section-block" onSubmit={reservar}>
          <h3>Nova reserva</h3>

          <label>
            Escala
            <select value={form.escala_id} onChange={(e) => setForm({ ...form, escala_id: e.target.value })}>
              <option value="">Selecione</option>
              {escalas.map((escala) => (
                <option key={escala.id} value={escala.id}>
                  {escala.nome_festa} - {escala.data_festa}
                </option>
              ))}
            </select>
          </label>

          <label>
            Data de retirada
            <input type="date" value={form.data_retirada} onChange={(e) => setForm({ ...form, data_retirada: e.target.value })} />
          </label>

          <label>
            Hora de retirada
            <input type="time" value={form.hora_retirada} onChange={(e) => setForm({ ...form, hora_retirada: e.target.value })} />
          </label>

          <div className="buttons buttons-row">
            <button className="btn-primary" type="submit">Confirmar reserva</button>
            <button className="btn-secondary" type="button" onClick={() => setFerramentaAtiva(null)}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}