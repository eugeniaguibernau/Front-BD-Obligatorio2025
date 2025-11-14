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
    // Mapear campo 'tipo' del formulario a 'tipo_participante' esperado por el backend
    const payload = { ...participante }
    // Asegurar que siempre enviamos 'tipo_participante' (fallbacks: tipo_participante | tipo | 'Estudiante')
    payload.tipo_participante = payload.tipo_participante || payload.tipo || 'Estudiante'
    // eliminar 'tipo' para no enviar claves duplicadas
    if (payload.tipo) delete payload.tipo

    const response = await fetch(`${API_BASE_URL}/participantes/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
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
    // Evitar mutar el objeto original
    const payloadDatos = { ...datos }
    // Asegurar que si se modifica/indica tipo se envíe como 'tipo_participante'
    if (payloadDatos.tipo || payloadDatos.tipo_participante) {
      payloadDatos.tipo_participante = payloadDatos.tipo_participante || payloadDatos.tipo || 'Estudiante'
      if (payloadDatos.tipo) delete payloadDatos.tipo
    }

    const response = await fetch(`${API_BASE_URL}/participantes/${ci}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payloadDatos),
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

    // Filtramos localmente por nombre, apellido, email o CI
    const terminoLower = String(termino).toLowerCase();
    const filtrados = resultado.data.filter(p => {
      const nombre = (p.nombre || '').toLowerCase()
      const apellido = (p.apellido || '').toLowerCase()
      const email = (p.email || '').toLowerCase()
      const ciStr = p.ci !== undefined && p.ci !== null ? String(p.ci).toLowerCase() : ''
      const tipoStr = (p.tipo_participante || p.tipo || '').toLowerCase()

      return (
        nombre.includes(terminoLower) ||
        apellido.includes(terminoLower) ||
        email.includes(terminoLower) ||
        ciStr.includes(terminoLower) ||
        tipoStr.includes(terminoLower)
      )
    });

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
