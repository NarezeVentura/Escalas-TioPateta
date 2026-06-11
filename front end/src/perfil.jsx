import { useEffect, useState } from "react";
import api from "./api";

export default function Perfil() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const res = await api.get("/usuarios/me");
    setUser(res.data);
  }

  async function salvar() {
    await api.put(`/usuarios/${user.id}`, {
      nome: user.nome,
      email: user.email
    });

    alert("Perfil atualizado!");
  }

  if (!user) return <p>Carregando...</p>;

  return (
    <div className="container">
      <div className="card">
        <h1>Meu Perfil</h1>

        <label>
          Nome
          <input
            value={user.nome}
            onChange={(e) =>
              setUser({
                ...user,
                nome: e.target.value
              })
            }
          />
        </label>

        <label>
          Email
          <input
            value={user.email}
            onChange={(e) =>
              setUser({
                ...user,
                email: e.target.value
              })
            }
          />
        </label>

        <button
          className="btn-primary"
          onClick={salvar}
        >
          Salvar
        </button>
      </div>
    </div>
  );
}