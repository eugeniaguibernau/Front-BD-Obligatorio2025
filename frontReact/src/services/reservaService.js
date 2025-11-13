import { getToken, logout } from './authService'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const buildHeaders = () => {
	const headers = { 'Content-Type': 'application/json' }
	// fallback directly to localStorage in case getToken is not yet available
	const token = getToken() || (typeof localStorage !== 'undefined' && localStorage.getItem('auth_token'))
	if (token) headers['Authorization'] = `Bearer ${token}`
	return headers
}

const handleResponse = async (res) => {
	let data = null
	try {
		data = await res.json()
	} catch (e) {
		// ignore JSON parse errors
	}
	if (res.status === 401) {
		// auto logout on unauthorized (dev-friendly)
		try { logout() } catch (e) { /* ignore */ }
		return { ok: false, unauthorized: true, error: (data && data.error) || 'No autorizado' }
	}
	return { res, data }
}

export const listarReservas = async (params = {}) => {
	try {
		const qs = new URLSearchParams(params).toString()
		const url = `${API_BASE_URL}/reservas/${qs ? `?${qs}` : ''}`
		const res = await fetch(url, { headers: buildHeaders() })
		const handled = await handleResponse(res)
		if (handled.unauthorized) return handled
		const data = handled.data
		if (!res.ok) return { ok: false, error: (data && data.error) || 'Error al listar reservas' }
		return { ok: true, data: (data && (data.reservas || data)) }
	} catch (error) {
		return { ok: false, error: error.message }
	}
}

export const obtenerReserva = async (id) => {
	try {
		const res = await fetch(`${API_BASE_URL}/reservas/${id}`, { headers: buildHeaders() })
		const handled = await handleResponse(res)
		if (handled.unauthorized) return handled
		const data = handled.data
		if (!res.ok) return { ok: false, error: (data && data.error) || 'Reserva no encontrada' }
		return { ok: true, data: data && (data.reserva || data) }
	} catch (error) {
		return { ok: false, error: error.message }
	}
}

export const crearReserva = async (payload) => {
	try {
			const res = await fetch(`${API_BASE_URL}/reservas/`, {
				method: 'POST',
				headers: buildHeaders(),
				body: JSON.stringify(payload),
			})
			const handled = await handleResponse(res)
			if (handled.unauthorized) return handled
			const data = handled.data
			if (!res.ok) return { ok: false, error: (data && (data.error || data.mensaje)) || 'Error creando reserva' }
			return { ok: true, data }
	} catch (error) {
		return { ok: false, error: error.message }
	}
}

export const actualizarReserva = async (id, payload) => {
	try {
			const res = await fetch(`${API_BASE_URL}/reservas/${id}`, {
				method: 'PUT',
				headers: buildHeaders(),
				body: JSON.stringify(payload),
			})
			const handled = await handleResponse(res)
			if (handled.unauthorized) return handled
			const data = handled.data
			if (!res.ok) return { ok: false, error: (data && data.error) || 'Error actualizando' }
			return { ok: true, data }
	} catch (error) {
		return { ok: false, error: error.message }
	}
}

export const eliminarReserva = async (id) => {
	try {
			const res = await fetch(`${API_BASE_URL}/reservas/${id}`, {
				method: 'DELETE',
				headers: buildHeaders(),
			})
			const handled = await handleResponse(res)
			if (handled.unauthorized) return handled
			const data = handled.data
			if (!res.ok) return { ok: false, error: (data && data.error) || 'Error eliminando' }
			return { ok: true, data }
	} catch (error) {
		return { ok: false, error: error.message }
	}
}

export const marcarAsistencia = async (id_reserva, ci, asistencia) => {
	try {
			const res = await fetch(`${API_BASE_URL}/reservas/${id_reserva}/participantes/${ci}/asistencia`, {
				method: 'POST',
				headers: buildHeaders(),
				body: JSON.stringify({ asistencia }),
			})
			const handled = await handleResponse(res)
			if (handled.unauthorized) return handled
			const data = handled.data
			if (!res.ok) return { ok: false, error: (data && data.error) || 'Error marcando asistencia' }
			return { ok: true, data }
	} catch (error) {
		return { ok: false, error: error.message }
	}
}

export const listarParticipantesReserva = async (id_reserva) => {
	try {
			const res = await fetch(`${API_BASE_URL}/reservas/${id_reserva}/participantes`, {
				headers: buildHeaders()
			})
			const handled = await handleResponse(res)
			if (handled.unauthorized) return handled
			const data = handled.data
			if (!res.ok) return { ok: false, error: (data && data.error) || 'Error obteniendo participantes' }
			return { ok: true, data: (data && (data.participantes || data)) }
	} catch (error) {
		return { ok: false, error: error.message }
	}
}

// Default export moved to the end of the file so all functions (including listarSalas)
// are initialized before being referenced.
export const listarSalas = async () => {
	try {
		const res = await fetch(`${API_BASE_URL}/salas/`, { headers: buildHeaders() })
		const handled = await handleResponse(res)
		if (handled.unauthorized) return handled
		const data = handled.data
		if (!res.ok) return { ok: false, error: (data && data.error) || 'Error al listar salas' }
		return { ok: true, data: (data && (data.salas || data)) }
	} catch (error) {
		return { ok: false, error: error.message }
	}
}
export const listarTurnos = async (params = {}) => {
	try {
		const qs = new URLSearchParams(params).toString()
		const url = `${API_BASE_URL}/turnos/${qs ? `?${qs}` : ''}`
		const res = await fetch(url, { headers: buildHeaders() })
		const handled = await handleResponse(res)
		if (handled.unauthorized) return handled
		const data = handled.data
		if (!res.ok) return { ok: false, error: (data && data.error) || 'Error al listar turnos' }
		return { ok: true, data: (data && (data.turnos || data)) }
	} catch (error) {
		return { ok: false, error: error.message }
	}
}
export default {
	listarReservas,
	obtenerReserva,
	crearReserva,
	actualizarReserva,
	eliminarReserva,
	marcarAsistencia,
	listarParticipantesReserva,
	listarSalas,
	listarTurnos,
}
