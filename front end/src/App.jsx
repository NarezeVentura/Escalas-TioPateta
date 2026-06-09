import { useEffect, useState } from 'react';
import api from './api';

export default function App() {
  const [status, setStatus] = useState('Conectando ao backend...');
  const [login, setLogin] = useState({ email: '', senha: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/health')
      .then(() => setStatus('Backend Flask respondendo.'))
      .catch(() => setStatus('Backend não respondeu. Inicie o Flask em http://localhost:5000.'));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', login);
      localStorage.setItem('token', response.data.access_token);
      setStatus(`Login feito como ${response.data.user.nome}.`);
    } catch (err) {
      setError(err?.response?.data?.msg || 'Erro ao fazer login.');
    }
  }

  return (
    <main className="page">
      <section className="card hero">
        <p className="eyebrow">Escalas Tio Pateta</p>
        <h1>Front React pronto para conversar com o Flask.</h1>
        <p className="status">{status}</p>
      </section>

      <section className="card">
        <h2>Login</h2>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={login.email}
              onChange={(e) => setLogin({ ...login, email: e.target.value })}
              placeholder="seu@email.com"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={login.senha}
              onChange={(e) => setLogin({ ...login, senha: e.target.value })}
              placeholder="••••••••"
            />
          </label>
          <button type="submit">Entrar</button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>
    </main>
  );
}