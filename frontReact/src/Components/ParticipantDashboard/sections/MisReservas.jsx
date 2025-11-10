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
      const estado = (r.estado || '').toString().toLowerCase()
      // build a turno string from possible shapes: id_turno, turno.nombre, turno.hora_inicio/hora_fin
      let turnoStr = ''
      if (r.id_turno) turnoStr += r.id_turno + ' '
      if (r.turno) {
        if (typeof r.turno === 'string') turnoStr += r.turno + ' '
        if (r.turno.nombre) turnoStr += r.turno.nombre + ' '
        if (r.turno.hora_inicio) turnoStr += r.turno.hora_inicio + ' '
        if (r.turno.hora_fin) turnoStr += r.turno.hora_fin + ' '
      }
      turnoStr = turnoStr.toString().toLowerCase()
      return sala.includes(q) || fecha.includes(q) || turnoStr.includes(q) || estado.includes(q)
    })

  // classify reservas into active / cancelled-or-no-asist / asistidas
  const isCancelledOrNoAsist = (st) => {
    if (!st) return false
    // cancelada, sin asistencia, no asist, no asistencia
    return /^cancel/i.test(st) || /sin\s*asist/i.test(st) || /no\s*asist/i.test(st) || /no\s*asistencia/i.test(st)
  }
  const isAsistida = (st) => {
    if (!st) return false
    // contains 'asist' but not the negative forms
    return /asist/i.test(st) && !isCancelledOrNoAsist(st)
  }

  const activeReservas = (filteredReservas || []).filter(r => {
    const st = (r.estado || '').toString().toLowerCase()
    return !isCancelledOrNoAsist(st) && !isAsistida(st)
  })
  const cancelledOrNoAsistReservas = (filteredReservas || []).filter(r => isCancelledOrNoAsist((r.estado || '').toString().toLowerCase()))
  const asistidasReservas = (filteredReservas || []).filter(r => isAsistida((r.estado || '').toString().toLowerCase()))

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
    // Deprecated: editing via UI is disabled. Keep function for compatibility.
    setEditingId(null)
    setEditData({})
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

  // New: cancel reservation (automatic state change to 'cancelada')
  const handleCancel = async (id) => {
    if (!window.confirm('¿Confirmar cancelación de esta reserva?')) return
    try {
      setActionLoading(true)
      setMessage(null)
      const res = await reservaService.actualizarReserva(id, { estado: 'cancelada' })
      if (!res.ok) {
        setMessage(res.error || 'Error al cancelar')
        return
      }
      setMessage('Reserva cancelada correctamente')
      fetchReservas()
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="seccion">
  <h1>Mis Reservas</h1>
  <p style={{ marginBottom: '0.25rem' }}>Todas tus reservas en el sistema</p>

  <div className="controles" style={{ marginBottom: '0.25rem' }}>
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

      {/* Resumen encima de las tres tablas: muestra nombre de sección y conteo (badges) */}
      <div className="resumen-row" style={{ display: 'flex', gap: '1rem', margin: '0.25rem 0' }}>
        <div style={{ flex: 1, background: '#f5f5f5', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
          <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: 600 }}>Reservas activas</div>
          <div style={{ fontSize: '1.1rem', color: '#000' }}>{activeReservas.length}</div>
        </div>
        <div style={{ flex: 1, background: '#f5f5f5', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
          <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: 600 }}>Reservas canceladas / no asistidas</div>
          <div style={{ fontSize: '1.1rem', color: '#000' }}>{cancelledOrNoAsistReservas.length}</div>
        </div>
        <div style={{ flex: 1, background: '#f5f5f5', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
          <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: 600 }}>Reservas asistidas</div>
          <div style={{ fontSize: '1.1rem', color: '#000' }}>{asistidasReservas.length}</div>
        </div>
      </div>

        {/* Render groups in order; when a query exists, show groups with matches first */}
        {(() => {
          const groups = [
            { key: 'active', label: 'Reservas activas', items: activeReservas },
            { key: 'cancelled', label: 'Reservas canceladas / no asistidas', items: cancelledOrNoAsistReservas },
            { key: 'asistidas', label: 'Reservas asistidas', items: asistidasReservas }
          ]
          const ordered = (query && query !== '') ? [...groups].sort((a, b) => b.items.length - a.items.length) : groups
          return ordered.map((g, idx) => {
            const isActive = g.key === 'active'
            const colSpan = isActive ? 5 : 4
            return (
              <div key={g.key} style={{ marginTop: idx === 0 ? 0 : '1.5rem' }}>
                {/* (label removed to avoid duplicate small numbers above tables) */}
                <table className="tabla-participante" style={{ color: '#000', marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th>Sala</th>
                      <th>Fecha</th>
                      <th>Turno</th>
                      <th>Estado</th>
                      {isActive && <th>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.length === 0 ? (
                      <tr>
                        <td colSpan={colSpan} className="sin-datos">{query && query !== '' ? 'No se encontraron resultados en esta sección' : (isActive ? 'No se encontraron reservas activas' : 'No hay reservas')}</td>
                      </tr>
                    ) : (
                      g.items.map((r) => (
                        <tr key={`${g.key}_${r.id_reserva || r.id}`}>
                          <td>{r.nombre_sala} {r.edificio ? `- ${r.edificio}` : ''}</td>
                          <td>{r.fecha}</td>
                          <td>{r.turno && r.turno.hora_inicio ? `${r.turno.hora_inicio} - ${r.turno.hora_fin}` : (r.id_turno || r.turno || '—')}</td>
                          <td>{r.estado || '—'}</td>
                          {isActive && (
                            <td>
                              <button
                                className="btn-danger"
                                onClick={() => handleCancel(r.id_reserva || r.id)}
                                disabled={actionLoading || (r.estado && r.estado.toString().toLowerCase() === 'cancelada')}
                              >
                                Cancelar
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )
          })
        })()}
    </div>
  )
}