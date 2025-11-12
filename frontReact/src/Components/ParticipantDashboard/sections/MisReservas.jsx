/**
 * Mis Reservas - Tabla con todas mis reservas
 */
import { useEffect, useState } from 'react'
import reservaService from '../../../services/reservaService'
import { useAuth } from '../../../hooks/useAuth'

export default function MisReservas() {
  const { user, logout } = useAuth()
  const [reservas, setReservas] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // manual estado editing removed: states handled automatically
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editFecha, setEditFecha] = useState('')

  const fetchReservas = async () => {
    setLoading(true)
    setError(null)
    const res = await reservaService.listarReservas()
    if (res && res.unauthorized) {
      // force logout and redirect to login
      logout()
      setError('No autorizado')
      setReservas([])
    } else if (!res.ok) {
      setError(res.error || 'Error al cargar reservas')
      setReservas([])
    } else {
      setReservas(res.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReservas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // whenever reservas state changes, ensure past 'activa' reservations are marked
  useEffect(() => {
    markPastAsNoAsist(reservas)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservas])

  // derived filtered reservas according to query (search across sala, fecha, turno, estado)
  const q = (query || '').trim().toLowerCase()
  const filteredReservas = q === '' ? reservas : (reservas || []).filter(r => {
    const sala = `${r.nombre_sala || ''} ${r.edificio || ''}`.toLowerCase()
    const fecha = (r.fecha || '').toString().toLowerCase()
    const turno = (r.id_turno || r.turno || '').toString().toLowerCase()
    const estado = (r.estado || '').toString().toLowerCase()
    return sala.includes(q) || fecha.includes(q) || turno.includes(q) || estado.includes(q)
  })

  const onDelete = async (id) => {
    if (!window.confirm('¿Eliminar definitivamente esta reserva?')) return
    try {
      setActionLoading(true)
      setMessage(null)
      const res = await reservaService.eliminarReserva(id)
      if (!res.ok) {
        setMessage(res.error || 'Error al eliminar')
        return
      }
      setMessage('Reserva eliminada correctamente')
      fetchReservas()
    } finally {
      setActionLoading(false)
    }
  }

  // Cancel action: mark reservation as 'cancelada' (future) or 'sin asistencia' (past)
  const onCancel = async (r) => {
    const estadoLower = (r.estado || '').toString().toLowerCase()
    // Only active reservations may be cancelled from the UI
    if (estadoLower !== 'activa') {
      setMessage('Solo se pueden cancelar reservas en estado "activa"')
      return
    }
    const id = r.id_reserva || r.id
    if (!window.confirm('¿Cancelar esta reserva?')) return
    try {
      setActionLoading(true)
      setMessage(null)
      const now = new Date()
      const fecha = r.fecha ? new Date(r.fecha) : null
      let payload = { }
      if (fecha && !isNaN(fecha.getTime())) {
        if (fecha.getTime() > now.getTime()) {
          // future reservation -> mark as cancelada
          payload.estado = 'cancelada'
        } else {
          // date passed -> mark as sin asistencia
          payload.estado = 'sin asistencia'
        }
      } else {
        // unknown fecha: mark as cancelada
        payload.estado = 'cancelada'
      }
      const res = await reservaService.actualizarReserva(id, payload)
      if (!res.ok) {
        setMessage(res.error || 'Error al actualizar estado de la reserva')
        return
      }
      setMessage(`Reserva actualizada: ${payload.estado}`)
      fetchReservas()
    } finally {
      setActionLoading(false)
    }
  }

  // Edit handlers: only edit fecha, must be at least 2 days in the future
  const startEdit = (r) => {
    // only allow editing when reserva is active
    const estado = (r.estado || '').toString().toLowerCase()
    if (estado !== 'activa') {
      setMessage('Solo se puede editar la fecha de reservas en estado "activa"')
      return
    }
    const id = r.id_reserva || r.id
    setEditingId(id)
    // normalize fecha to YYYY-MM-DD for input[type=date]
    try {
      const d = r.fecha ? new Date(r.fecha) : null
      if (d && !isNaN(d.getTime())) {
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        setEditFecha(`${yyyy}-${mm}-${dd}`)
        return
      }
    } catch (e) {
      // fallback to empty
    }
    setEditFecha('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditFecha('')
  }

  const saveEdit = async (id) => {
    if (!editFecha) {
      setMessage('Seleccione una fecha válida')
      return
    }
    // extra safety: fetch the reserva from current state and ensure it's still activa
    const current = (reservas || []).find(rr => (rr.id_reserva || rr.id) === id)
    const estadoActual = (current && (current.estado || '')).toString().toLowerCase()
    if (estadoActual !== 'activa') {
      setMessage('No se puede editar: la reserva ya no está en estado activa')
      return
    }
    const selected = new Date(editFecha)
    const now = new Date()
    const min = new Date(now)
    min.setDate(min.getDate() + 2)
    if (selected.getTime() < min.getTime()) {
      setMessage('La nueva fecha debe ser al menos 2 días en el futuro')
      return
    }
    try {
      setActionLoading(true)
      setMessage(null)
      const payload = { fecha: editFecha }
      const res = await reservaService.actualizarReserva(id, payload)
      if (!res.ok) {
        setMessage(res.error || 'Error al actualizar fecha')
        return
      }
      setMessage('Fecha actualizada correctamente')
      setEditingId(null)
      setEditFecha('')
      fetchReservas()
    } finally {
      setActionLoading(false)
    }
  }

  // Mark past active reservations as 'sin asistencia' automatically
  const markPastAsNoAsist = async (list) => {
    if (!Array.isArray(list) || list.length === 0) return
    const now = new Date()
    const toUpdate = list.filter(r => {
      const fecha = r.fecha ? new Date(r.fecha) : null
      return r.estado === 'activa' && fecha && !isNaN(fecha.getTime()) && fecha.getTime() < now.getTime()
    })
    if (toUpdate.length === 0) return
    try {
      setActionLoading(true)
      for (const r of toUpdate) {
        const id = r.id_reserva || r.id
        // update to sin asistencia; ignore individual errors and continue
        // eslint-disable-next-line no-await-in-loop
        await reservaService.actualizarReserva(id, { estado: 'sin asistencia' })
      }
      if (toUpdate.length > 0) setMessage(`Se marcaron ${toUpdate.length} reservas como sin asistencia (automático)`)
    } catch (e) {
      // ignore
    } finally {
      setActionLoading(false)
      fetchReservas()
    }
  }

  return (
    <div className="seccion">
      <h1>Mis Reservas</h1>
      <p>Todas tus reservas en el sistema</p>

      <div className="controles">
        <input
          type="text"
          placeholder="Buscar reserva..."
          className="search-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

  {loading && <p>Cargando reservas...</p>}
  {error && <div className="alert-banner alert-rojo">{error}</div>}
  {message && <div className={`alert-banner ${message.includes('error') || message.includes('Error') || message.includes('No') ? 'alert-rojo' : 'alert-verde'}`}>{message}</div>}

      <table className="tabla-participante" style={{ color: '#000' }}>
        <thead>
          <tr>
            <th>Sala</th>
            <th>Fecha</th>
            <th>Turno</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reservas && reservas.length > 0 ? (
            filteredReservas.length === 0 ? (
              <tr>
                <td colSpan="5" className="sin-datos">No se encontraron reservas</td>
              </tr>
            ) : (
              filteredReservas.map((r) => (
                <tr key={r.id_reserva || r.id}>
                  <td>{r.nombre_sala} {r.edificio ? `- ${r.edificio}` : ''}</td>
                  <td>
                    {editingId === (r.id_reserva || r.id) ? (
                      <input type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)} />
                    ) : (
                      r.fecha
                    )}
                  </td>
                  <td>{r.id_turno}</td>
                  <td>{r.estado || '—'}</td>
                  <td>
                    {editingId === (r.id_reserva || r.id) ? (
                      <>
                        <button className="btn-sec" onClick={() => saveEdit(r.id_reserva || r.id)} disabled={actionLoading}>Guardar</button>
                        <button className="btn-link" onClick={cancelEdit} disabled={actionLoading}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-sec"
                          onClick={() => startEdit(r)}
                          disabled={actionLoading || ((r.estado || '').toString().toLowerCase() !== 'activa')}
                          title={((r.estado || '').toString().toLowerCase() !== 'activa') ? 'Solo se puede editar reservas activas' : ''}
                        >Editar</button>
                        <button
                          className="btn-danger"
                          onClick={() => onCancel(r)}
                          disabled={actionLoading || ((r.estado || '').toString().toLowerCase() !== 'activa')}
                          title={((r.estado || '').toString().toLowerCase() !== 'activa') ? 'Solo se pueden cancelar reservas activas' : ''}
                        >Cancelar</button>
                        <button className="btn-link" onClick={() => onDelete(r.id_reserva || r.id)} disabled={actionLoading}>Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )
          ) : (
            <tr>
              <td colSpan="5" className="sin-datos">No tienes reservas</td>
            </tr>
          )}
        </tbody>
      </table>

      
    </div>
  )
}