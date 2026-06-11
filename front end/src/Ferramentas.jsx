import { useEffect, useState } from "react";
import api from "./api";

export default function Ferramentas({ user }) {
  const [ferramentas, setFerramentas] = useState([]);
  const [escalas, setEscalas] = useState([]);
  const [ferramentaAtiva, setFerramentaAtiva] = useState(null);
  const [form, setForm] = useState({ escala_id: "", data_retirada: "", hora_retirada: "" });
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

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
      <p className="subtitle">Veja os itens disponíveis e faça reservas ligadas a uma escala.</p>

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

              <button className="btn-primary" type="button" onClick={() => abrirReserva(ferramenta.id)}>
                Reservar
              </button>
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