import { useEffect, useState } from "react";
import api from "./api";

export default function Reservas() {
  const [reservas, setReservas] = useState([]);

  async function carregar() {
    const res = await api.get("/reservas");
    setReservas(res.data.reservas);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function devolver(id) {
    await api.post(`/reservas/${id}/devolver`);
    carregar();
  }

  return (
    <div className="container">
      <h1>Minhas Reservas</h1>

      {reservas.map((r) => (
        <div key={r.id} className="card">
          <h3>{r.ferramenta_nome}</h3>

          <p>Festa: {r.festa_nome}</p>
          <p>Status: {r.status}</p>
          <p>Retirada: {r.data_retirada}</p>

          {r.status === "pendente" && (
            <button
              className="btn-primary"
              onClick={() => devolver(r.id)}
            >
              Devolver
            </button>
          )}
        </div>
      ))}
    </div>
  );
}