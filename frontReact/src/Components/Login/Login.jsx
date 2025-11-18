/**
 * Componente de Login (versión institucional UCU)
 */

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './Login.css';

export const Login = () => {
  const { login, loading, error, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    correo: '',
    contraseña: '',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.correo || !formData.contraseña) {
      setLocalError('Por favor completa todos los campos.');
      return;
    }

    if (!formData.correo.includes('@')) {
      setLocalError('Ingresa una dirección de correo electrónico válida.');
      return;
    }

    const result = await login(formData.correo, formData.contraseña);

    if (!result.ok) {
      setLocalError(result.error || 'No fue posible iniciar sesión.');
    } else {
      setFormData({ correo: '', contraseña: '' });
    }
  };

  if (isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-success">
          <h2>Sesión iniciada correctamente</h2>
          <p>Redirigiendo al sistema…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img
            src="data:image/png;base64,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"
            alt="UCU Logo"
            className="ucu-logo"
          />
          <h2 className="login-subtitle">Sistema de Gestión de Salas</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="correo" className="form-label">
              Correo institucional
            </label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="usuario@ucu.edu.uy"
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contraseña" className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              id="contraseña"
              name="contraseña"
              value={formData.contraseña}
              onChange={handleChange}
              placeholder="Ingresa tu contraseña"
              disabled={loading}
              className="form-input"
            />
          </div>

          {(error || localError) && (
            <div className="error-message">
              {error || localError}
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};
