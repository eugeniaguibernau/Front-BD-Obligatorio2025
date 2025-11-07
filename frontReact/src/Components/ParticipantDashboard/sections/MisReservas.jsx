/**
 * Mis Reservas - Tabla con todas mis reservas
 */
import { useEffect, useState } from 'react'
import reservaService from '../../../services/reservaService'
import { useAuth } from '../../../hooks/useAuth'

export default function MisReservas() {
  const { user } = useAuth()
  const { logout } = useAuth()
  const [reservas, setReservas] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState(null)

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
    if (!window.confirm('¿Eliminar esta reserva?')) return
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

  const startEdit = (r) => {
    setEditingId(r.id_reserva || r.id)
    setEditData({ fecha: r.fecha, estado: r.estado || '' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditData({})
  }

  const saveEdit = async (id) => {
    const payload = {}
    if (editData.fecha) payload.fecha = editData.fecha
    if (editData.estado) payload.estado = editData.estado
    try {
      setActionLoading(true)
      setMessage(null)
      const res = await reservaService.actualizarReserva(id, payload)
      if (!res.ok) {
        setMessage(res.error || 'Error al actualizar')
        return
      }
      setMessage('Reserva actualizada correctamente')
      setEditingId(null)
      setEditData({})
      fetchReservas()
    } finally {
      setActionLoading(false)
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
                      <input type="date" value={editData.fecha || ''} onChange={e => setEditData({...editData, fecha: e.target.value})} />
                    ) : (
                      r.fecha
                    )}
                  </td>
                  <td>{r.id_turno}</td>
                  <td>
                    {editingId === (r.id_reserva || r.id) ? (
                      <select value={editData.estado || ''} onChange={e => setEditData({...editData, estado: e.target.value})}>
                        <option value="">-- estado --</option>
                        <option value="activa">Activa</option>
                        <option value="cancelada">Cancelada</option>
                        <option value="sin asistencia">Sin asistencia</option>
                        <option value="finalizada">Finalizada</option>
                        <option value="cerrada">Cerrada</option>
                      </select>
                    ) : (
                      r.estado || '—'
                    )}
                  </td>
                  <td>
                    {editingId === (r.id_reserva || r.id) ? (
                      <>
                        <button className="btn-sec" onClick={() => saveEdit(r.id_reserva || r.id)} disabled={actionLoading}>Guardar</button>
                        <button className="btn-link" onClick={cancelEdit} disabled={actionLoading}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-sec" onClick={() => startEdit(r)} disabled={actionLoading}>Editar</button>
                        <button className="btn-danger" onClick={() => onDelete(r.id_reserva || r.id)} disabled={actionLoading}>Eliminar</button>
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