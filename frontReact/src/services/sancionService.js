import { getAuthHeaders as getHeaders } from './apiUtils';
import { logout } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Listar sanciones
 * @param {number} ci - Opcional: CI del participante
 * @param {boolean} activas - Opcional: Solo sanciones activas
 */
async function listarSanciones(ci = null, activas = false) {
  try {
    const params = new URLSearchParams();
    if (ci) params.append('ci', ci);
    if (activas) params.append('activas', 'true');

    const queryString = params.toString();
    const url = `${API_URL}/sanciones${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (response.status === 401) {
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();

      return { ok: false, error: errorData.error || 'Error al listar sanciones' };
    }

    const data = await response.json();

    // Extraer resumen PRIMERO - puede venir en data.resumen o directamente en data
    let resumen = null;
    if (data.resumen) {

      resumen = data.resumen;
    } else if (data.total_sanciones !== undefined) {

      resumen = {
        total_sanciones: data.total_sanciones,
        total_dias_sancionados: data.total_dias_sancionados,
        datos_restantes_total: data.datos_restantes_total
      };

    } else {

    }
    
    // Extraer sanciones - puede venir en data.sanciones o directamente
    let sanciones = data.sanciones || data;
    
    // Si es un objeto (con with_auth_link), buscar el array
    if (sanciones && typeof sanciones === 'object' && !Array.isArray(sanciones)) {
      const firstArrayKey = Object.keys(sanciones).find(k => Array.isArray(sanciones[k]));
      if (firstArrayKey) {
        sanciones = sanciones[firstArrayKey];
      }
    }
    
    const resultado = { 
      ok: true, 
      data: Array.isArray(sanciones) ? sanciones : [],
      resumen: resumen
    };

    return resultado;
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * Crear una nueva sanción
 * @param {Object} sancionData
 * @param {number} sancionData.ci_participante - CI del participante
 * @param {string} sancionData.fecha_inicio - Fecha inicio YYYY-MM-DD
 * @param {string} sancionData.fecha_fin - Fecha fin YYYY-MM-DD
 */
async function crearSancion(sancionData) {
  try {
    const response = await fetch(`${API_URL}/sanciones/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sancionData)
    });

    if (response.status === 401) {
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al crear sanción' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * Eliminar una sanción
 * @param {number} ci_participante - CI del participante
 * @param {string} fecha_inicio - Fecha inicio YYYY-MM-DD
 * @param {string} fecha_fin - Fecha fin YYYY-MM-DD
 */
async function eliminarSancion(ci_participante, fecha_inicio, fecha_fin) {
  try {
    const payload = {
      ci_participante,
      fecha_inicio,
      fecha_fin
    };

    const response = await fetch(`${API_URL}/sanciones/`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      try { logout() } catch (e) { /* ignore */ }
      return { ok: false, unauthorized: true };
    }

    if (response.status === 404) {
      const errorData = await response.json();

      return { ok: false, error: 'Sanción no encontrada' };
    }

    if (!response.ok) {
      const errorData = await response.json();

      return { ok: false, error: errorData.error || 'Error al eliminar sanción' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * Actualizar (modificar) una sanción existente.
 * Implementación defensiva: intenta eliminar la sanción existente y crear una nueva
 * con las fechas actualizadas. Esto evita depender de un endpoint PUT/UPDATE
 * que pueda no estar disponible en el backend.
 * @param {number} ci_participante
 * @param {string} fecha_inicio_actual - YYYY-MM-DD
 * @param {string} fecha_fin_actual - YYYY-MM-DD
 * @param {string} fecha_inicio_nueva - YYYY-MM-DD
 * @param {string} fecha_fin_nueva - YYYY-MM-DD
 */
async function actualizarSancion(ci_participante, fecha_inicio_actual, fecha_fin_actual, fecha_inicio_nueva, fecha_fin_nueva) {
  try {
    // Primero eliminar la sanción antigua
    const delRes = await eliminarSancion(ci_participante, fecha_inicio_actual, fecha_fin_actual)
    if (!delRes.ok) {
      return { ok: false, error: delRes.error || 'No se pudo eliminar la sanción original' }
    }

    // Luego crear la nueva con las fechas actualizadas
    const payload = {
      ci_participante: ci_participante,
      fecha_inicio: fecha_inicio_nueva,
      fecha_fin: fecha_fin_nueva
    }
    const createRes = await crearSancion(payload)
    if (!createRes.ok) return { ok: false, error: createRes.error || 'No se pudo crear la sanción actualizada' }
    return { ok: true, data: createRes.data }
  } catch (error) {

    return { ok: false, error: 'Error de conexión' }
  }
}

/**
 * Actualizar sanción por ID usando el endpoint PATCH /sanciones/{id}
 * Permite actualizar solo fecha_inicio, solo fecha_fin, o ambas
 * @param {string|number} idSancion - ID de la sanción
 * @param {Object} cambios - Objeto con los campos a actualizar
 * @param {string} [cambios.fecha_inicio] - Nueva fecha inicio YYYY-MM-DD (opcional)
 * @param {string} [cambios.fecha_fin] - Nueva fecha fin YYYY-MM-DD (opcional)
 */
async function actualizarSancionPorId(idSancion, cambios) {
  try {
    // Construir el payload solo con los campos que se quieren cambiar
    const payload = {};
    if (cambios.fecha_inicio !== undefined) {
      payload.fecha_inicio = cambios.fecha_inicio;
    }
    if (cambios.fecha_fin !== undefined) {
      payload.fecha_fin = cambios.fecha_fin;
    }

    // Validar que al menos un campo esté presente
    if (Object.keys(payload).length === 0) {
      return { ok: false, error: 'Debe proporcionar al menos fecha_inicio o fecha_fin para actualizar' };
    }

    const response = await fetch(`${API_URL}/sanciones/${encodeURIComponent(idSancion)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      try { logout() } catch (e) { /* ignore */ }
      return { ok: false, unauthorized: true };
    }

    if (response.status === 400) {
      const err = await response.json().catch(() => ({}));
      return { ok: false, error: err.error || 'Datos inválidos para actualizar sanción' };
    }

    if (response.status === 404) {
      return { ok: false, error: 'Sanción no encontrada' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { ok: false, error: errorData.error || 'Error al actualizar sanción' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {
    console.error('Error al actualizar sanción:', error);
    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * Aplicar sanciones por reserva (si nadie asistió)
 * @param {number} idReserva - ID de la reserva
 * @param {number} sancionDias - Días de sanción (default: 60)
 */
async function aplicarSancionesPorReserva(idReserva, sancionDias = 60) {
  try {
    const response = await fetch(`${API_URL}/sanciones/aplicar/${idReserva}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sancion_dias: sancionDias })
    });

    if (response.status === 401) {
      try { logout() } catch (e) { /* ignore */ }
      return { ok: false, unauthorized: true };
    }

    if (response.status === 404) {
      return { ok: false, error: 'Reserva no encontrada' };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al aplicar sanciones' };
    }

    const data = await response.json();
    return { ok: true, data: data.resultado };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * Procesar reservas vencidas (genera sanciones automáticamente)
 * @param {number} sancionDias - Días de sanción (default: 60)
 */
async function procesarReservasVencidas(sancionDias = 60) {
  try {
    const response = await fetch(`${API_URL}/sanciones/procesar-vencidas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sancion_dias: sancionDias })
    });

    if (response.status === 401) {
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al procesar reservas vencidas' };
    }

    const data = await response.json();
    return { ok: true, data: data.resultado };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * Extender sanciones existentes a un mínimo de días
 * @param {number} minDias - Días mínimos de sanción (default: 60)
 */
async function extenderSanciones(minDias = 60) {
  try {
    const response = await fetch(`${API_URL}/sanciones/extender`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ min_dias: minDias })
    });

    if (response.status === 401) {
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al extender sanciones' };
    }

    const data = await response.json();
    return { ok: true, data: data.resultado };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

const sancionService = {
  listarSanciones,
  crearSancion,
  eliminarSancion,
  actualizarSancion,
  actualizarSancionPorId,
  aplicarSancionesPorReserva,
  procesarReservasVencidas,
  extenderSanciones
};

export default sancionService;
