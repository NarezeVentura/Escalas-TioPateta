import { useEffect, useState } from "react";
import api from "./api";

export default function Escalas() {
  const [escalas, setEscalas] = useState([]);

  async function carregar() {
    const res = await api.get("/escalas");
    setEscalas(res.data.escalas);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function inscrever(id) {
    await api.post(`/escalas/${id}/inscrever`);
    carregar();
  }

  return (
    <div className="container">
      <h1>Escalas Disponíveis</h1>

      {escalas.map((escala) => (
        <div key={escala.id} className="card">
          <h3>{escala.nome_festa}</h3>

          <p>📍 {escala.local_nome}</p>
          <p>📅 {escala.data_festa}</p>
          <p>🕒 {escala.horario_inicio}</p>

          <button
            className="btn-primary"
            onClick={() => inscrever(escala.id)}
          >
            Inscrever-se
          </button>
        </div>
      ))}
    </div>
  );
}