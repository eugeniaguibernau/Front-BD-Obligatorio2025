/**
 * Utilidades compartidas para todos los servicios
 * Centraliza funciones comunes como obtención de token y headers
 */

/**
 * Obtiene el token JWT del localStorage
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Genera headers comunes para peticiones autenticadas
 * @returns {Object} Headers con Content-Type y Authorization
 */
export const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Construye query params eliminando valores null/undefined
 * @param {Object} params - Objeto con parámetros
 * @returns {string} Query string
 */
export const buildQueryString = (params) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });
  return queryParams.toString();
};
