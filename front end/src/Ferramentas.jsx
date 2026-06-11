import { useEffect, useState } from "react";
import api from "./api";

export default function Ferramentas() {
  const [ferramentas, setFerramentas] = useState([]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const res = await api.get("/ferramentas");
    setFerramentas(res.data.ferramentas);
  }

  async function reservar(id) {
    const escala_id = prompt("ID da escala:");
    const data_retirada = prompt("Data retirada:");
    const hora_retirada = prompt("Hora retirada:");

    await api.post(`/ferramentas/${id}/reservar`, {
      escala_id,
      data_retirada,
      hora_retirada
    });

    alert("Ferramenta reservada!");
  }

  return (
    <div className="container">
      <h1>Ferramentas</h1>

      {ferramentas.map((f) => (
        <div key={f.id} className="card">
          <h3>{f.nome}</h3>

          <p>{f.descricao}</p>

          <p>
            Disponíveis: {f.quantidade_disponivel}
          </p>

          <button
            className="btn-primary"
            onClick={() => reservar(f.id)}
          >
            Reservar
          </button>
        </div>
      ))}
    </div>
  );
}