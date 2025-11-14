const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Obtener el token JWT del localStorage
 */
function getToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Headers comunes para todas las peticiones
 */
function getHeaders() {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

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
    
    console.log('Llamando a:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (response.status === 401) {
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error del servidor:', errorData);
      return { ok: false, error: errorData.error || 'Error al listar sanciones' };
    }

    const data = await response.json();
    console.log('📥 Respuesta del servidor:', data);
    
    // Extraer resumen PRIMERO - puede venir en data.resumen o directamente en data
    let resumen = null;
    if (data.resumen) {
      console.log('✅ Encontré data.resumen');
      resumen = data.resumen;
    } else if (data.total_sanciones !== undefined) {
      console.log('✅ Construyendo resumen desde data directa');
      resumen = {
        total_sanciones: data.total_sanciones,
        total_dias_sancionados: data.total_dias_sancionados,
        datos_restantes_total: data.datos_restantes_total
      };
      console.log('📊 Resumen construido:', resumen);
    } else {
      console.log('❌ No hay total_sanciones en data');
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
    console.log('🎁 Retornando:', resultado);
    return resultado;
  } catch (error) {
    console.error('Error en listarSanciones:', error);
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
    console.error('Error en crearSancion:', error);
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
    
    console.log('🔥 Enviando DELETE con payload:', payload);
    
    const response = await fetch(`${API_URL}/sanciones/`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    console.log('📡 Respuesta del servidor:', response.status, response.statusText);

    if (response.status === 401) {
      return { ok: false, unauthorized: true };
    }

    if (response.status === 404) {
      const errorData = await response.json();
      console.log('❌ Error 404:', errorData);
      return { ok: false, error: 'Sanción no encontrada' };
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Error:', errorData);
      return { ok: false, error: errorData.error || 'Error al eliminar sanción' };
    }

    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {
    console.error('Error en eliminarSancion:', error);
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
    console.error('Error en aplicarSancionesPorReserva:', error);
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
    console.error('Error en procesarReservasVencidas:', error);
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
    console.error('Error en extenderSanciones:', error);
    return { ok: false, error: 'Error de conexión' };
  }
}

const sancionService = {
  listarSanciones,
  crearSancion,
  eliminarSancion,
  aplicarSancionesPorReserva,
  procesarReservasVencidas,
  extenderSanciones
};

export default sancionService;
