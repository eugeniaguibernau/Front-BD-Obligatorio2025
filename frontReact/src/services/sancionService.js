import { getToken, logout } from './authService'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const buildHeaders = () => {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken() || (typeof localStorage !== 'undefined' && localStorage.getItem('auth_token'))
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

const handleResponse = async (res) => {
  let data = null
  try { data = await res.json() } catch (e) { /* ignore */ }
  if (res.status === 401) {
    try { logout() } catch (e) {}
    return { ok: false, unauthorized: true, error: (data && data.error) || 'No autorizado' }
  }
  return { res, data }
}

export const listarSanciones = async (ci) => {
  try {
    const url = ci ? `${API_BASE_URL}/participantes/${ci}/sanciones/` : `${API_BASE_URL}/sanciones/`
    const res = await fetch(url, { headers: buildHeaders() })
    const handled = await handleResponse(res)
    if (handled.unauthorized) return handled
    const data = handled.data
    if (!res.ok) return { ok: false, error: (data && data.error) || 'Error al listar sanciones' }
    // backend may return { sanciones: [...] } or an array
    return { ok: true, data: (data && (data.sanciones || data)) }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

export const procesarVencidas = async (payload = {}) => {
  try {
    const res = await fetch(`${API_BASE_URL}/sanciones/procesar-vencidas`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    })
    const handled = await handleResponse(res)
    if (handled.unauthorized) return handled
    const data = handled.data
    if (!res.ok) return { ok: false, error: (data && data.error) || 'Error procesando vencidas' }
    return { ok: true, data }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

export default { listarSanciones, procesarVencidas }
