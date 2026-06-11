import { useEffect, useState } from 'react';
import api from './api';
import Login from './login';
import Dashboard from './dashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setChecking(false);
      return;
    }
    api.get('/usuarios/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setChecking(false));
  }, []);

  function handleLogin(userData) {
    setUser(userData);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  if (checking) {
    return (
      <div className="container">
        <div className="card">
          <p className="subtitle">Carregando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return <Login onLogin={handleLogin} />;
}

//  