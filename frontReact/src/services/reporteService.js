import { getAuthHeaders as getHeaders, buildQueryString } from './apiUtils';
import { logout } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * 1. Salas Más Reservadas
 * @param {string} startDate - Fecha inicio YYYY-MM-DD
 * @param {string} endDate - Fecha fin YYYY-MM-DD
 * @param {number} limit - Número de resultados (default: 10)
 */
async function getSalasMasReservadas(startDate, endDate, limit = 10) {
  try {
    const params = buildQueryString({ start_date: startDate, end_date: endDate, limit });
    const response = await fetch(`${API_URL}/api/reports/most-reserved-rooms?${params}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (response.status === 401) {
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al obtener reporte' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * 2. Turnos Más Demandados
 */
async function getTurnosMasDemandados(startDate, endDate, limit = 5) {
  try {
    const params = buildQueryString({ start_date: startDate, end_date: endDate, limit });
    const response = await fetch(`${API_URL}/api/reports/most-demanded-turns?${params}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (response.status === 401) {
      try { logout() } catch (e) { /* ignore */ }
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al obtener reporte' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * 3. Promedio Participantes por Sala
 */
async function getPromedioParticipantesPorSala(startDate, endDate, edificio = null) {
  try {
    const params = buildQueryString({ start_date: startDate, end_date: endDate, edificio });
    const response = await fetch(`${API_URL}/api/reports/avg-participants-by-room?${params}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (response.status === 401) {
      try { logout() } catch (e) { /* ignore */ }
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al obtener reporte' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * 4. Reservas por Programa
 */
async function getReservasPorPrograma(startDate, endDate, facultad = null) {
  try {
    const params = buildQueryString({ start_date: startDate, end_date: endDate, facultad });
    const response = await fetch(`${API_URL}/api/reports/reservations-by-program?${params}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (response.status === 401) {
      try { logout() } catch (e) { /* ignore */ }
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al obtener reporte' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * 5. Ocupación por Edificio
 */
async function getOcupacionPorEdificio(startDate, endDate) {
  try {
    const params = buildQueryString({ start_date: startDate, end_date: endDate });
    const response = await fetch(`${API_URL}/api/reports/occupancy-by-building?${params}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (response.status === 401) {
      try { logout() } catch (e) { /* ignore */ }
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al obtener reporte' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * 6. Reservas y Asistencia por Rol
 */
async function getReservasYAsistenciaPorRol(startDate, endDate, rol = null) {
  try {
    const params = buildQueryString({ start_date: startDate, end_date: endDate, rol });
    const response = await fetch(`${API_URL}/api/reports/reservations-and-attendance-by-role?${params}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (response.status === 401) {
      try { logout() } catch (e) { /* ignore */ }
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al obtener reporte' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * 7. Sanciones por Rol
 */
async function getSancionesPorRol(startDate, endDate, rol = null) {
  try {
    const params = buildQueryString({ start_date: startDate, end_date: endDate, rol });
    const response = await fetch(`${API_URL}/api/reports/sanctions-by-role?${params}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (response.status === 401) {
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al obtener reporte' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * 8. Reservas Utilizadas vs Canceladas
 */
async function getReservasUtilizadasVsCanceladas(startDate, endDate) {
  try {
    const params = buildQueryString({ start_date: startDate, end_date: endDate });
    const response = await fetch(`${API_URL}/api/reports/used-vs-cancelled?${params}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (response.status === 401) {
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al obtener reporte' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * 9. Horas Pico por Sala
 */
async function getHorasPicoPorSala(startDate, endDate, edificio = null, limit = 5) {
  try {
    const params = buildQueryString({ start_date: startDate, end_date: endDate, edificio, limit });
    const response = await fetch(`${API_URL}/api/reports/peak-hours-by-room?${params}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (response.status === 401) {
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al obtener reporte' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * 10. Ocupación por Tipo de Sala
 */
async function getOcupacionPorTipoSala(startDate, endDate) {
  try {
    const params = buildQueryString({ start_date: startDate, end_date: endDate });
    const response = await fetch(`${API_URL}/api/reports/occupancy-by-room-type?${params}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (response.status === 401) {
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al obtener reporte' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * 11. Reincidentes en Sanciones
 */
async function getReincidentesEnSanciones(minSanciones = 2, onlyActive = true) {
  try {
    const params = buildQueryString({ min_sanctions: minSanciones, only_active: onlyActive });
    const response = await fetch(`${API_URL}/api/reports/repeat-offenders?${params}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (response.status === 401) {
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { ok: false, error: errorData.error || 'Error al obtener reporte' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {

    return { ok: false, error: 'Error de conexión' };
  }
}

const reporteService = {
  getSalasMasReservadas,
  getTurnosMasDemandados,
  getPromedioParticipantesPorSala,
  getReservasPorPrograma,
  getOcupacionPorEdificio,
  getReservasYAsistenciaPorRol,
  getSancionesPorRol,
  getReservasUtilizadasVsCanceladas,
  getHorasPicoPorSala,
  getOcupacionPorTipoSala,
  getReincidentesEnSanciones
};

export default reporteService;
