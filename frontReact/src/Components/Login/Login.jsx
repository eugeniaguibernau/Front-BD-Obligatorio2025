/**
 * Componente de Login
 * Formulario de autenticación de usuarios
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

    // Validaciones básicas
    if (!formData.correo || !formData.contraseña) {
      setLocalError('Por favor completa todos los campos');
      return;
    }

    if (!formData.correo.includes('@')) {
      setLocalError('Por favor ingresa un email válido');
      return;
    }

    const result = await login(formData.correo, formData.contraseña);

    if (!result.ok) {
      setLocalError(result.error);
    } else {
      setFormData({ correo: '', contraseña: '' });
    }
  };

  if (isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-success">
          <h2>✓ Sesión iniciada correctamente</h2>
          <p>Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="https://www.ucu.edu.uy/sites/default/files/logo_0.png" alt="UCU Logo" className="ucu-logo" />
          <h2 className="login-subtitle">Gestor de Salas</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="correo" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="tu@email.com"
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
              placeholder="••••••••"
              disabled={loading}
              className="form-input"
            />
          </div>

          {(error || localError) && (
            <div className="error-message">
              {error || localError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};
