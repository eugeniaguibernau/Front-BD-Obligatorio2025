/**
 * Servicio de autenticación
 * Maneja la comunicación con el backend para login y gestión de tokens
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Realiza el login del usuario
 * @param {string} correo - Email del usuario
 * @param {string} contraseña - Contraseña del usuario
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export const loginUser = async (correo, contraseña) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // para CORS con cookies
      body: JSON.stringify({ correo, contraseña }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return {
        ok: false,
        error: data.mensaje || 'Error en el login',
      };
    }

    // Guardar el token en localStorage
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.data));
    }

    return {
      ok: true,
      data: data.data,
      token: data.token,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Error de conexión',
    };
  }
};

/**
 * Obtiene el token almacenado
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Obtiene los datos del usuario almacenados
 * @returns {object|null}
 */
export const getUserData = () => {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
};

/**
 * Cierra la sesión del usuario
 */
export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};
