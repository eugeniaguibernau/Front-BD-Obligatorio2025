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
      // Ya NO guardamos user_data, se extrae del token
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
 * Decodifica el payload de un JWT (sin verificar firma - solo para leer datos)
 * @param {string} token - JWT token
 * @returns {object|null}
 */
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decodificando JWT:', error);
    return null;
  }
};

/**
 * Obtiene los datos del usuario desde el token JWT
 * @returns {object|null}
 */
export const getUserData = () => {
  const token = getToken();
  if (!token) return null;

  // Decodificar el JWT para obtener los datos reales
  const payload = decodeJWT(token);
  if (!payload) return null;

  // El backend incluye estos campos en el JWT
  return {
    user_id: payload.user_id,
    user_type: payload.user_type,
    correo: payload.correo || payload.sub,
    exp: payload.exp // Fecha de expiración
  };
};

/**
 * Cierra la sesión del usuario
 */
export const logout = () => {
  localStorage.removeItem('auth_token');
  // Ya no hay user_data para eliminar
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  // Verificar si el token ha expirado
  const userData = getUserData();
  if (!userData || !userData.exp) return false;

  // exp está en segundos, Date.now() en milisegundos
  const isExpired = userData.exp * 1000 < Date.now();
  
  if (isExpired) {
    // Token expirado, limpiar
    logout();
    return false;
  }

  return true;
};
