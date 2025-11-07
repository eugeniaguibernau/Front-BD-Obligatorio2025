/**
 * Gestión de Reservas
 */
import { useEffect, useState } from 'react'
import reservaService from '../../../services/reservaService'
import { useAuth } from '../../../hooks/useAuth'

export default function GestionReservas() {
  const { logout } = useAuth()
  const [reservas, setReservas] = useState([])
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
      logout()
      setError('No autorizado')
      setReservas([])
    } else if (!res.ok) {
      setError(res.error || 'Error al listar reservas')
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
      <h1>Gestión de Reservas</h1>
      <p>Administra todas las reservas del sistema</p>

      <div className="controles">
        <input type="text" placeholder="Buscar reserva..." className="search-input" />
      </div>

  {loading && <p>Cargando reservas...</p>}
  {error && <div className="alert-banner alert-rojo">{error}</div>}
  {message && <div className={`alert-banner ${message.includes('error') || message.includes('Error') || message.includes('No') ? 'alert-rojo' : 'alert-verde'}`}>{message}</div>}

      <table className="tabla-admin">
        <thead>
          <tr>
            <th>ID</th>
            <th>Sala</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reservas && reservas.length > 0 ? (
            reservas.map((r) => (
              <tr key={r.id_reserva || r.id}>
                <td>{r.id_reserva || r.id}</td>
                <td>{r.nombre_sala} {r.edificio ? `- ${r.edificio}` : ''}</td>
                <td>
                  {editingId === (r.id_reserva || r.id) ? (
                    <input type="date" value={editData.fecha || ''} onChange={e => setEditData({...editData, fecha: e.target.value})} />
                  ) : (
                    r.fecha
                  )}
                </td>
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
          ) : (
            <tr>
              <td colSpan="5" className="sin-datos">No hay reservas</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
