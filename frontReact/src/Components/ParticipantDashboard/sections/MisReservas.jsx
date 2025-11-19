/**
 * Mis Reservas
 */
import { useEffect, useState } from 'react'
import reservaService from '../../../services/reservaService'
import { useAuth } from '../../../hooks/useAuth'

export default function MisReservas() {
  const { logout, user } = useAuth()
  const [reservas, setReservas] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editFecha, setEditFecha] = useState('')

  const fetchReservas = async () => {
    setLoading(true)
    setError(null)
    const res = await reservaService.listarReservas()
    if (res && res.unauthorized) {
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

  useEffect(() => {
    markPastAsNoAsist(reservas)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservas])

  const buildTurnoStr = (r) => {
    if (!r) return ''
    let turnoStr = ''
    if (r.id_turno) turnoStr += r.id_turno + ' '
    if (r.turno) {
      if (typeof r.turno === 'string') turnoStr += r.turno + ' '
      else if (typeof r.turno === 'object') {
        if (r.turno.nombre) turnoStr += r.turno.nombre + ' '
        if (r.turno.hora_inicio) turnoStr += r.turno.hora_inicio + ' '
        if (r.turno.hora_fin) turnoStr += r.turno.hora_fin + ' '
      }
    }
    return turnoStr.trim().toLowerCase()
  }

  const q = (query || '').trim().toLowerCase()
  const filteredReservas = q === '' ? reservas : (reservas || []).filter(r => {
    const sala = `${r.nombre_sala || ''} ${r.edificio || ''}`.toLowerCase()
    const fecha = (r.fecha || '').toString().toLowerCase()
    const turno = buildTurnoStr(r)
    const estado = (r.estado || '').toString().toLowerCase()
    return sala.includes(q) || fecha.includes(q) || turno.includes(q) || estado.includes(q)
  })

  const getEstadoString = (r) => ((r && (r.estado_actual || r.estado)) || '').toString().toLowerCase()

  const isCancelledOrNoAsist = (r) => {
    if (!r) return false
    const st = getEstadoString(r)
    return /^cancel/i.test(st) || /sin\s*asist/i.test(st) || /no\s*asist/i.test(st) || /no\s*asistencia/i.test(st)
  }

  const isAsistida = (r) => {
    if (!r) return false
    const st = getEstadoString(r)

    if (/asist/i.test(st) && !isCancelledOrNoAsist(r)) return true

    if (r.asistencia === true || r.asistida === true) return true

    try {
      if (Array.isArray(r.participantes) && r.participantes.length > 0) {
        const anyPresent = r.participantes.some(p => p && (p.asistencia === true || p.asistencia === 1))
        if (anyPresent) return true

        const ci = user && (user.ci || user.CI || user.identificacion || user.dni || user.documento)
        if (ci) {
          const me = r.participantes.find(p => {
            const pci = p && (p.ci || p.ci_participante || p.cedula || p.identificacion)
            return pci && String(pci) === String(ci)
          })
          if (me && (me.asistencia === true || me.asistencia === 1)) return true
        }
      }
    } catch (e) {
    }

    if (/final/i.test(st)) {
      if (Array.isArray(r.participantes) && r.participantes.some(p => p && (p.asistencia === true || p.asistencia === 1))) return true
    }

    return false
  }

  const activeReservas = (filteredReservas || []).filter(r => {
    return !isCancelledOrNoAsist(r) && !isAsistida(r)
  })
  const cancelledOrNoAsistReservas = (filteredReservas || []).filter(r => isCancelledOrNoAsist(r))
  const asistidasReservas = (filteredReservas || []).filter(r => isAsistida(r))

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

  const onCancel = async (r) => {
    const estadoLower = (r.estado || '').toString().toLowerCase()
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
          payload.estado = 'cancelada'
        } else {
          payload.estado = 'sin asistencia'
        }
      } else {
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

  const startEdit = (r) => {
    const estado = (r.estado || '').toString().toLowerCase()
    if (estado !== 'activa') {
      setMessage('Solo se puede editar la fecha de reservas en estado "activa"')
      return
    }
    const id = r.id_reserva || r.id
    setEditingId(id)
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

  const markPastAsNoAsist = async (list) => {
    if (!Array.isArray(list) || list.length === 0) return
    const now = new Date()
    const toUpdate = list.filter(r => {
      const fecha = r.fecha ? new Date(r.fecha) : null
      const st = (r.estado || '').toString().toLowerCase()
      return st === 'activa' && fecha && !isNaN(fecha.getTime()) && fecha.getTime() < now.getTime()
    })
    if (toUpdate.length === 0) return
    try {
      setActionLoading(true)
      for (const r of toUpdate) {
        const id = r.id_reserva || r.id
        // eslint-disable-next-line no-await-in-loop
        await reservaService.actualizarReserva(id, { estado: 'sin asistencia' })
      }
      if (toUpdate.length > 0) setMessage(`Se marcaron ${toUpdate.length} reservas como sin asistencia (automático)`)
    } catch (e) {

    } finally {
      setActionLoading(false)
      fetchReservas()
    }
  }

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
      <h1>Mis reservas</h1>
      <p style={{ marginBottom: '0.25rem' }}>
        Listado de reservas registradas en el sistema.
      </p>

      <div className="controles" style={{ marginBottom: '0.25rem' }}>
        <input
          type="text"
          placeholder="Buscar reserva por sala, fecha o estado"
          className="search-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {loading && <p>Cargando reservas…</p>}
      {error && <div className="alert-banner alert-rojo">{error}</div>}
      {message && (
        <div
          className={`alert-banner ${
            /error|Error|No/i.test(message) ? 'alert-rojo' : 'alert-verde'
          }`}
        >
          {message}
        </div>
      )}

      <div
        className="resumen-row"
        style={{ display: 'flex', gap: '1rem', margin: '0.25rem 0' }}
      >
        <div
          style={{
            flex: 1,
            background: '#f5f5f5',
            padding: '0.5rem 0.75rem',
            borderRadius: 6,
          }}
        >
          <div
            style={{ fontSize: '0.9rem', color: '#333', fontWeight: 600 }}
          >
            Reservas activas
          </div>
          <div style={{ fontSize: '1.1rem', color: '#000' }}>
            {activeReservas.length}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: '#f5f5f5',
            padding: '0.5rem 0.75rem',
            borderRadius: 6,
          }}
        >
          <div
            style={{ fontSize: '0.9rem', color: '#333', fontWeight: 600 }}
          >
            Reservas canceladas / sin asistencia
          </div>
          <div style={{ fontSize: '1.1rem', color: '#000' }}>
            {cancelledOrNoAsistReservas.length}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: '#f5f5f5',
            padding: '0.5rem 0.75rem',
            borderRadius: 6,
          }}
        >
          <div
            style={{ fontSize: '0.9rem', color: '#333', fontWeight: 600 }}
          >
            Reservas con asistencia registrada
          </div>
          <div style={{ fontSize: '1.1rem', color: '#000' }}>
            {asistidasReservas.length}
          </div>
        </div>
      </div>

      {(() => {
        const groups = [
          {
            key: 'active',
            label: 'Reservas activas',
            items: activeReservas,
          },
          {
            key: 'cancelled',
            label: 'Reservas canceladas / sin asistencia',
            items: cancelledOrNoAsistReservas,
          },
          {
            key: 'asistidas',
            label: 'Reservas con asistencia registrada',
            items: asistidasReservas,
          },
        ]
        const ordered =
          query && query !== ''
            ? [...groups].sort((a, b) => b.items.length - a.items.length)
            : groups
        return ordered.map((g, idx) => {
          const isActive = g.key === 'active'
          const colSpan = isActive ? 6 : 5
          return (
            <div key={g.key} style={{ marginTop: idx === 0 ? 0 : '1.5rem' }}>
              <table
                className="tabla-participante"
                style={{ color: '#000', marginTop: 0 }}
              >
                <thead>
                  <tr>
                    <th>Sala</th>
                    <th>Fecha</th>
                    <th>Hora de inicio</th>
                    <th>Hora de fin</th>
                    <th>Estado</th>
                    {isActive && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {g.items.length === 0 ? (
                    <tr>
                      <td colSpan={colSpan} className="sin-datos">
                        {query && query !== ''
                          ? 'No se encontraron resultados en esta sección.'
                          : isActive
                          ? 'No se encontraron reservas activas registradas.'
                          : 'No hay reservas registradas en esta categoría.'}
                      </td>
                    </tr>
                  ) : (
                    g.items.map(r => (
                      <tr key={`${g.key}_${r.id_reserva || r.id}`}>
                        <td>
                          {r.nombre_sala}{' '}
                          {r.edificio ? `- ${r.edificio}` : ''}
                        </td>
                        <td>
                          {editingId === (r.id_reserva || r.id) ? (
                            <input
                              type="date"
                              value={editFecha}
                              onChange={e => setEditFecha(e.target.value)}
                            />
                          ) : (
                            r.fecha || '—'
                          )}
                        </td>
                        <td>
                          {r.turno && r.turno.hora_inicio
                            ? r.turno.hora_inicio
                            : '—'}
                        </td>
                        <td>
                          {r.turno && r.turno.hora_fin
                            ? r.turno.hora_fin
                            : '—'}
                        </td>
                        {(() => {
                          const displayEstado = isAsistida(r)
                            ? 'asistida'
                            : r.estado || r.estado_actual || '—'
                          return <td>{displayEstado}</td>
                        })()}
                        {isActive && (
                          <td>
                            {editingId === (r.id_reserva || r.id) ? (
                              <>
                                <button
                                  className="btn-sec"
                                  onClick={() =>
                                    saveEdit(r.id_reserva || r.id)
                                  }
                                  disabled={actionLoading}
                                >
                                  Guardar cambios
                                </button>
                                <button
                                  className="btn-link"
                                  onClick={cancelEdit}
                                  disabled={actionLoading}
                                >
                                  Cancelar edición
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn-danger"
                                  onClick={() =>
                                    handleCancel(r.id_reserva || r.id)
                                  }
                                  disabled={
                                    actionLoading ||
                                    (r.estado || '')
                                      .toString()
                                      .toLowerCase() === 'cancelada'
                                  }
                                >
                                  Cancelar reserva
                                </button>
                                <button
                                  className="btn-sec"
                                  onClick={() => startEdit(r)}
                                  disabled={
                                    actionLoading ||
                                    (r.estado || '')
                                      .toString()
                                      .toLowerCase() !== 'activa'
                                  }
                                  title={
                                    (r.estado || '')
                                      .toString()
                                      .toLowerCase() !== 'activa'
                                      ? 'Solo se pueden modificar reservas activas.'
                                      : ''
                                  }
                                >
                                  Modificar fecha
                                </button>
                              </>
                            )}
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