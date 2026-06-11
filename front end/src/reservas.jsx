import { useEffect, useState } from "react";
import api from "./api";

export default function Reservas({ user }) {
  const [reservas, setReservas] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  async function carregar() {
    setLoading(true);
    setErro("");

    try {
      const res = await api.get("/reservas");
      setReservas(res.data.reservas || []);
    } catch (error) {
      setErro(error?.response?.data?.msg || "Não foi possível carregar as reservas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function devolver(id) {
    setErro("");
    setMensagem("");

    try {
      await api.post(`/reservas/${id}/devolver`);
      setMensagem("Devolução registrada com sucesso.");
      await carregar();
    } catch (error) {
      setErro(error?.response?.data?.msg || "Não foi possível registrar a devolução.");
    }
  }

  return (
    <div className="section-block">
      <h2>{user?.role === "admin" ? "Reservas da equipe" : "Minhas reservas"}</h2>
      <p className="subtitle">Acompanhe as reservas de ferramentas e registre devoluções quando necessário.</p>

      {mensagem && <p className="error info-message">{mensagem}</p>}
      {erro && <p className="error">{erro}</p>}

      {loading ? (
        <p>Carregando reservas...</p>
      ) : (
        <div className="cards-list">
          {reservas.map((reserva) => (
            <div key={reserva.id} className="card section-block">
              <h3>{reserva.ferramenta_nome}</h3>
              <p><strong>Escala:</strong> {reserva.festa_nome || "Sem escala vinculada"}</p>
              {user?.role === "admin" && <p><strong>Funcionário:</strong> {reserva.funcionario_nome}</p>}
              <p><strong>Status:</strong> {reserva.status}</p>
              <p><strong>Retirada:</strong> {reserva.data_retirada} às {reserva.hora_retirada}</p>

              {reserva.status === "pendente" && (
                <button className="btn-primary" type="button" onClick={() => devolver(reserva.id)}>
                  Registrar devolução
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}