/**
 * Servicio de Salas
 * Maneja la comunicación con el backend para gestión de salas
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
 * Tipos de sala válidos
 */
export const TIPOS_SALA = ['libre', 'posgrado', 'docente'];

/**
 * Lista todas las salas
 * @param {string} edificio - Filtrar por edificio
 * @param {string} tipo_sala - Filtrar por tipo
 * @param {number} min_capacidad - Capacidad mínima
 * @returns {Promise<{ok: boolean, data?: array, error?: string}>}
 */
export const listarSalas = async (edificio = null, tipo_sala = null, min_capacidad = null) => {
  try {
    let url = `${API_BASE_URL}/salas/`;
    const params = new URLSearchParams();
    
    if (edificio) params.append('edificio', edificio);
    if (tipo_sala) params.append('tipo_sala', tipo_sala);
    if (min_capacidad !== null) params.append('min_capacidad', min_capacidad);
    
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
        error: data.error || data.mensaje || 'Error al listar salas',
      };
    }

    return {
      ok: true,
      data: data.salas || [],
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Error de conexión',
    };
  }
};

/**
 * Obtiene una sala específica
 * @param {string} nombre_sala - Nombre de la sala
 * @param {string} edificio - Edificio
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export const obtenerSala = async (nombre_sala, edificio) => {
  try {
    const url = `${API_BASE_URL}/salas/${encodeURIComponent(edificio)}/${encodeURIComponent(nombre_sala)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || data.mensaje || 'Error al obtener sala',
      };
    }

    return {
      ok: true,
      data: data.sala,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Error de conexión',
    };
  }
};

/**
 * Crea una nueva sala
 * @param {object} sala - {nombre_sala, edificio, capacidad, tipo_sala}
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export const crearSala = async (sala) => {
  try {
    const response = await fetch(`${API_BASE_URL}/salas/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(sala),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'Error al crear sala',
      };
    }

    return {
      ok: true,
      data: { created: data.created },
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Error de conexión',
    };
  }
};

/**
 * Actualiza una sala
 * @param {string} nombre_sala - Nombre de la sala
 * @param {string} edificio - Edificio
 * @param {object} datos - {capacidad?, tipo_sala?}
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export const actualizarSala = async (nombre_sala, edificio, datos) => {
  try {
    const url = `${API_BASE_URL}/salas/${encodeURIComponent(edificio)}/${encodeURIComponent(nombre_sala)}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(datos),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'Error al actualizar sala',
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
 * Elimina una sala
 * @param {string} nombre_sala - Nombre de la sala
 * @param {string} edificio - Edificio
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export const eliminarSala = async (nombre_sala, edificio) => {
  try {
    const url = `${API_BASE_URL}/salas/${encodeURIComponent(edificio)}/${encodeURIComponent(nombre_sala)}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'Error al eliminar sala',
      };
    }

    return {
      ok: true,
      data: { deleted: data.deleted },
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Error de conexión',
    };
  }
};

/**
 * Busca salas por nombre o edificio
 * @param {string} termino - Término de búsqueda
 * @returns {Promise<{ok: boolean, data?: array, error?: string}>}
 */
export const buscarSalas = async (termino) => {
  try {
    // Obtenemos todas las salas
    const resultado = await listarSalas();
    
    if (!resultado.ok) {
      return resultado;
    }

    // Filtramos localmente por nombre o edificio
    const terminoLower = termino.toLowerCase();
    const filtradas = resultado.data.filter(s => 
      s.nombre_sala.toLowerCase().includes(terminoLower) ||
      s.edificio.toLowerCase().includes(terminoLower)
    );

    return {
      ok: true,
      data: filtradas,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Error de conexión',
    };
  }
};
