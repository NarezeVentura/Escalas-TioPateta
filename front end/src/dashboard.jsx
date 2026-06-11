export default function Dashboard({ user, onLogout }) {
  return (
    <div className="container">
      <div className="card">
        <div className="logo-placeholder">🦆</div>
        <h1>Equipe Tio Pateta</h1>
        <p className="subtitle">Olá, {user?.nome || 'usuário'} 👋</p>

        <div className="buttons">
          <button>📅 Escalas</button>
          <button>🛠 Ferramentas</button>
          <button>📋 Reservas</button>
          <button>👤 Perfil</button>
        </div>

        <button className="btn-link" onClick={onLogout}>Sair</button>
      </div>
    </div>
  );
}