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
 * Lista programas académicos / carreras disponibles
 * Nota: asumimos el endpoint `/programas/` en el backend. Si difiere, ajustar ruta.
 */
export const listarProgramas = async () => {
  try {
    const url = `${API_BASE_URL}/programas/`;

    // Intento simple: hacer una GET sin headers ni credentials para evitar preflight CORS
    // Muchos endpoints públicos permiten esta llamada y con ello se evita el OPTIONS
    let response
    try {
      response = await fetch(url, { method: 'GET' })
    } catch (err) {
      // Si falla la llamada simple (p. ej. la API requiere auth o bloquea conexiones), reintentamos con auth
      console.warn('listarProgramas: simple fetch failed, retrying with auth headers', err)
      response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      })
    }

    if (response.status === 404) {
      // Backend no expone programas en este endpoint — devolver lista vacía para no romper la UI
      return { ok: true, data: [] };
    }

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data.error || 'Error al listar programas' };
    }

    // Intentar retornar una propiedad 'programas' si el backend la usa, o el body como lista
    return { ok: true, data: data.programas || data || [] };
  } catch (error) {
    return { ok: false, error: error.message || 'Error de conexión' };
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
    // Asegurar que siempre enviamos 'tipo_participante' y también 'tipo' por compatibilidad
    // Prefer values explicitly provided by the caller. Only default when missing.
    payload.tipo_participante = payload.tipo_participante || payload.tipo || 'Estudiante'
    // If caller already provided a readable `tipo`, keep it. Otherwise, derive a
    // readable `tipo` from the canonical `tipo_participante`.
    if (!payload.tipo) {
      // If backend canonical is 'alumno', prefer readable 'Estudiante'
      payload.tipo = payload.tipo_participante && payload.tipo_participante.toString().toLowerCase() === 'alumno'
        ? 'Estudiante'
        : (payload.tipo_participante ? payload.tipo_participante.charAt(0).toUpperCase() + payload.tipo_participante.slice(1) : '');
    }
    // Incluir programa si el formulario lo envía (soportar variantes de clave)
    payload.programa = participante.programa || participante.programa_id || participante.programa_academico || payload.programa || null

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
      // Ensure canonical value exists
      payloadDatos.tipo_participante = payloadDatos.tipo_participante || payloadDatos.tipo || 'Estudiante'
      // Only derive a readable `tipo` if the caller did NOT provide one. Do NOT
      // overwrite an explicit `tipo` sent by the frontend (e.g. 'Postgrado').
      if (!payloadDatos.tipo) {
        // If canonical is 'alumno' use readable 'Estudiante'
        if (payloadDatos.tipo_participante.toString().toLowerCase() === 'alumno') {
          payloadDatos.tipo = 'Estudiante'
        } else {
          payloadDatos.tipo = payloadDatos.tipo_participante.charAt(0).toUpperCase() + payloadDatos.tipo_participante.slice(1)
        }
      }
    }
    // Si se envía programa en los cambios, asegurarnos de usar la clave 'programa'
    if (payloadDatos.programa || payloadDatos.programa_id || payloadDatos.programa_academico) {
      payloadDatos.programa = payloadDatos.programa || payloadDatos.programa_id || payloadDatos.programa_academico
      // no borrar las variantes, backend debería aceptar 'programa'
    }

    // --- Debugging / normalization helper ---
    // Log payload so developer can inspect what is being enviado al backend
    try {
      console.log(`[participanteService] actualizarParticipante payload for CI ${ci}:`, payloadDatos)
    } catch (e) {
      // ignore console errors in non-browser environments
    }

    // Normalize `tipo` for better compatibility with backends that expect
    // capitalized values (e.g. 'Estudiante' / 'Docente') while still
    // keeping `tipo_participante` as the canonical internal key.
    if (payloadDatos.tipo_participante) {
      const t = payloadDatos.tipo_participante.toString()
      // backend sometimes expects 'alumno' while the UI uses 'estudiante'
      if (t.toLowerCase() === 'alumno') {
        payloadDatos.tipo = 'Estudiante'
        payloadDatos.tipo_participante = 'alumno'
      } else {
        // Capitalize the UI value for the `tipo` field (e.g. 'docente' -> 'Docente')
        payloadDatos.tipo = t.charAt(0).toUpperCase() + t.slice(1)
      }
    } else if (payloadDatos.tipo) {
      // ensure tipo is a string and capitalized
      const tt = payloadDatos.tipo.toString()
      payloadDatos.tipo = tt.charAt(0).toUpperCase() + tt.slice(1)
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
