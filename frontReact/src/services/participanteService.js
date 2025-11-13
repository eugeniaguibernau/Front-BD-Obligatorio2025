/**
 * Servicio de Participantes
 * Maneja la comunicación con el backend para gestión de participantes
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Obtiene el token almacenado
 */
const getToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Headers comunes para peticiones autenticadas
 */
const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Lista todos los participantes
 * @param {number} limit - Límite de resultados
 * @param {number} offset - Desplazamiento para paginación
 * @returns {Promise<{ok: boolean, data?: array, error?: string}>}
 */
export const listarParticipantes = async (limit = null, offset = null) => {
  try {
    let url = `${API_BASE_URL}/participantes/`;
    const params = new URLSearchParams();
    
    if (limit !== null) params.append('limit', limit);
    if (offset !== null) params.append('offset', offset);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || data.mensaje || 'Error al listar participantes',
      };
    }

    return {
      ok: true,
      data: data.participantes || [],
      count: data.count || 0,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Error de conexión',
    };
  }
};

/**
 * Obtiene un participante por CI
 * @param {number} ci - CI del participante
 * @param {boolean} detailed - Si incluir programas académicos
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export const obtenerParticipante = async (ci, detailed = false) => {
  try {
    let url = `${API_BASE_URL}/participantes/${ci}`;
    if (detailed) {
      url += '?detailed=true';
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || data.mensaje || 'Error al obtener participante',
      };
    }

    return {
      ok: true,
      data: data.participante,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Error de conexión',
    };
  }
};

/**
 * Crea un nuevo participante
 * @param {object} participante - {ci, nombre, apellido, email}
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export const crearParticipante = async (participante) => {
  try {
    const response = await fetch(`${API_BASE_URL}/participantes/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(participante),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'Error al crear participante',
      };
    }

    return {
      ok: true,
      data: { ci: data.ci, created: data.created },
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Error de conexión',
    };
  }
};

/**
 * Actualiza un participante
 * @param {number} ci - CI del participante
 * @param {object} datos - {nombre?, apellido?, email?}
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export const actualizarParticipante = async (ci, datos) => {
  try {
    const response = await fetch(`${API_BASE_URL}/participantes/${ci}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(datos),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'Error al actualizar participante',
      };
    }

    return {
      ok: true,
      data: { updated: data.updated },
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Error de conexión',
    };
  }
};

/**
 * Elimina un participante
 * @param {number} ci - CI del participante
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export const eliminarParticipante = async (ci) => {
  try {
    const response = await fetch(`${API_BASE_URL}/participantes/${ci}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'Error al eliminar participante',
      };
    }

    return {
      ok: true,
      data: { deleted: data.deleted, ci: data.ci },
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Error de conexión',
    };
  }
};

/**
 * Obtiene las sanciones de un participante
 * @param {number} ci - CI del participante
 * @returns {Promise<{ok: boolean, data?: array, error?: string}>}
 */
export const obtenerSanciones = async (ci) => {
  try {
    const response = await fetch(`${API_BASE_URL}/participantes/${ci}/sanciones`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'Error al obtener sanciones',
      };
    }

    return {
      ok: true,
      data: data.sanciones || [],
      count: data.count || 0,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Error de conexión',
    };
  }
};

/**
 * Busca participantes por nombre o apellido
 * @param {string} termino - Término de búsqueda
 * @returns {Promise<{ok: boolean, data?: array, error?: string}>}
 */
export const buscarParticipantes = async (termino) => {
  try {
    // Primero obtenemos todos los participantes
    const resultado = await listarParticipantes();
    
    if (!resultado.ok) {
      return resultado;
    }

    // Filtramos localmente por nombre o apellido
    const terminoLower = termino.toLowerCase();
    const filtrados = resultado.data.filter(p => 
      p.nombre.toLowerCase().includes(terminoLower) ||
      p.apellido.toLowerCase().includes(terminoLower) ||
      p.email.toLowerCase().includes(terminoLower)
    );

    return {
      ok: true,
      data: filtrados,
      count: filtrados.length,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Error de conexión',
    };
  }
};
