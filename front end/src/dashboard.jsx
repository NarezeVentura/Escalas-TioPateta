import { useState } from "react";

import Escalas from "./Escalas";
import Ferramentas from "./Ferramentas";
import Reservas from "./Reservas";
import Perfil from "./Perfil";

export default function Dashboard({ user, onLogout }) {
  const [pagina, setPagina] = useState("home");

  return (
    <div className="container">
      <div className="card">
        <div className="logo-placeholder">🦆</div>
        <h1>Equipe Tio Pateta</h1>
        <p className="subtitle">Olá, {user?.nome || "usuário"} 👋</p>

        {/* MENU */}
        <div className="buttons">
          <button onClick={() => setPagina("escalas")}>📅 Escalas</button>
          <button onClick={() => setPagina("ferramentas")}>🛠 Ferramentas</button>
          <button onClick={() => setPagina("reservas")}>📋 Reservas</button>
          <button onClick={() => setPagina("perfil")}>👤 Perfil</button>
        </div>

        <button className="btn-link" onClick={onLogout}>
          Sair
        </button>
      </div>

      {/* NAVEGAÇÃO ENTRE PÁGINAS */}
      {pagina === "escalas" && <Escalas />}
      {pagina === "ferramentas" && <Ferramentas />}
      {pagina === "reservas" && <Reservas />}
      {pagina === "perfil" && <Perfil />}
    </div>
  );
}