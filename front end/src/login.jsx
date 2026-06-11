import { useState } from 'react';
import api from './api';

export default function Login({ onLogin }) {
  const [fields, setFields] = useState({ email: '', senha: '' });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', fields);
      localStorage.setItem('token', response.data.access_token);
      onLogin(response.data.user);
    } catch (err) {
      setError(err?.response?.data?.msg || 'Erro ao fazer login.');
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="logo-placeholder">🦆</div>
        <h1>Equipe Tio Pateta</h1>
        <p className="subtitle">Gerenciamento de Escalas</p>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={fields.email}
              onChange={(e) => setFields({ ...fields, email: e.target.value })}
              placeholder="seu@email.com"
              required
            />
          </label>
          <label>
            Senha
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={fields.senha}
              onChange={(e) => setFields({ ...fields, senha: e.target.value })}
              placeholder="••••••••"
              required
            />
          </label>

          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={mostrarSenha}
              onChange={(e) => setMostrarSenha(e.target.checked)}
            />
            Mostrar senha
          </label>

          <button type="submit" className="btn-primary">Entrar</button>
        </form>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
