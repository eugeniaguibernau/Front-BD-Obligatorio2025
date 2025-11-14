/**
 * Crear Reserva - Formulario para crear nueva reserva
 */
import { useState, useEffect } from 'react'
import reservaService from '../../../services/reservaService'
import sancionService from '../../../services/sancionService'
import { useAuth } from '../../../hooks/useAuth'

export default function CrearReserva({ tienesSanciones }) {
  const { user } = useAuth()
  const [salas, setSalas] = useState([])
  // keep selected sala as index to access both nombre and edificio
  const [selectedSalaIndex, setSelectedSalaIndex] = useState('')
  const [fecha, setFecha] = useState('')
  const [turnos, setTurnos] = useState([])
  const [selectedTurnosIds, setSelectedTurnosIds] = useState([]) // Array para múltiples turnos
  const [participantesText, setParticipantesText] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(null)
  const [invalidParticipants, setInvalidParticipants] = useState([])
  const [bloqueadoPorSancion, setBloqueadoPorSancion] = useState(false)
  const [detalleSancion, setDetalleSancion] = useState(null)

  useEffect(() => {
    const loadSalas = async () => {
      const res = await reservaService.listarSalas()
      if (!res.ok) {
        // if unauthorized the service already handles logout; show error
        setError(res.error || 'No se pudieron cargar las salas')
        return
      }
      setSalas(res.data || [])
    }
    loadSalas()
  }, [])

  // check sanciones for this user and block if within 2 months
  useEffect(() => {
    const checkSanciones = async () => {
      try {
        const ci = user?.ci || user?.dni || user?.identificacion || user?.id || null
        if (!ci) return
        const res = await sancionService.listarSanciones(ci)
        if (!res.ok) return
        const data = Array.isArray(res.data) ? res.data : (res.data && res.data.sanciones) || []
        if (!data || data.length === 0) return
        const now = new Date()
        // find any sanction that still blocks: either fecha_fin in future OR fecha_inicio within last 2 months
        const blocked = data.some(s => {
          const inicio = s.fecha_inicio || s.fechaInicio || s.fecha || null
          const fin = s.fecha_fin || s.fechaFin || null
          let inicioDate = inicio ? new Date(inicio) : null
          let finDate = fin ? new Date(fin) : null
          if (finDate && !isNaN(finDate.getTime()) && finDate.getTime() > now.getTime()) return true
          if (inicioDate && !isNaN(inicioDate.getTime())) {
            const limit = new Date(inicioDate)
            limit.setMonth(limit.getMonth() + 2)
            if (now.getTime() < limit.getTime()) return true
          }
          return false
        })
        if (blocked) {
          setBloqueadoPorSancion(true)
          // compute nearest release date for messaging
          const releaseDates = data.map(s => {
            const inicio = s.fecha_inicio || s.fechaInicio || s.fecha || null
            const fin = s.fecha_fin || s.fechaFin || null
            let inicioDate = inicio ? new Date(inicio) : null
            let finDate = fin ? new Date(fin) : null
            const candidates = []
            if (finDate && !isNaN(finDate.getTime())) candidates.push(finDate)
            if (inicioDate && !isNaN(inicioDate.getTime())) {
              const d = new Date(inicioDate)
              d.setMonth(d.getMonth() + 2)
              candidates.push(d)
            }
            return candidates.length ? new Date(Math.max(...candidates.map(d => d.getTime()))) : null
          }).filter(Boolean)
          const finalRelease = releaseDates.length ? new Date(Math.max(...releaseDates.map(d => d.getTime()))) : null
          setDetalleSancion(finalRelease ? `No puedes reservar hasta el ${finalRelease.toLocaleDateString()}` : 'Tienes sanciones vigentes')
        }
      } catch (e) {
        // ignore check errors
      }
    }
    checkSanciones()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    // load turnos when both fecha and sala are selected
    const loadTurnos = async () => {
      setTurnos([])
      setSelectedTurnosIds([])
      setError(null)
      if (selectedSalaIndex === '' || !fecha) return
      const s = salas[Number(selectedSalaIndex)]
      if (!s) return
      const params = {
        fecha,
        nombre_sala: s.nombre_sala ?? s.nombre,
        edificio: s.edificio ?? s.nombre_edificio ?? s.edificio,
      }
      const res = await reservaService.listarTurnos(params)
      if (!res.ok) {
        setError(res.error || 'No se pudieron cargar los turnos')
        return
      }
      setTurnos(res.data || [])
    }
    loadTurnos()
  }, [fecha, selectedSalaIndex, salas])

  if (tienesSanciones) {
    return (
      <div className="seccion">
        <h1>Crear Reserva</h1>
        <div className="alert-banner alert-rojo">
          ⚠️ No puedes crear reservas - Tienes sanciones vigentes
        </div>
        <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.95rem' }}>
          Para poder crear reservas, debes esperar a que finalicen tus sanciones activas. 
          Puedes ver el detalle en la sección "Mis Sanciones".
        </p>
      </div>
    )
  }

  if (bloqueadoPorSancion) {
    return (
      <div className="seccion">
        <h1>Crear Reserva</h1>
        <div className="alert-banner alert-rojo">
          ⚠️ {detalleSancion || 'No puedes crear reservas: tienes sanciones vigentes.'}
        </div>
      </div>
    )
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMensaje(null)

    const participantes = participantesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => (isNaN(Number(s)) ? s : Number(s)))

    // Validar que haya al menos un turno seleccionado
    if (selectedTurnosIds.length === 0) {
      setError('Debe seleccionar al menos un turno')
      setLoading(false)
      return
    }

    // Build payload usando nombre_sala, edificio y múltiples turnos
    let payload = {
      fecha: fecha,
      participantes,
    }

    // Función para formatear horas con padding (HH:MM:SS)
    const formatearHora = (hora) => {
      if (!hora) return hora
      const partes = hora.split(':')
      return partes.map(p => p.padStart(2, '0')).join(':')
    }

    // Agregar turnos con formato completo (como en el admin)
    if (selectedTurnosIds.length > 0) {
      payload.turnos = selectedTurnosIds.map(idTurno => {
        const turno = turnos.find(t => t.id_turno === Number(idTurno))
        if (!turno) return null
        return {
          id_turno: Number(idTurno),
          hora_inicio: formatearHora(turno.hora_inicio),
          hora_fin: formatearHora(turno.hora_fin)
        }
      }).filter(Boolean)
    }

    if (selectedSalaIndex !== '') {
      const s = salas[Number(selectedSalaIndex)]
      payload.nombre_sala = s.nombre_sala ?? s.nombre
      payload.edificio = s.edificio ?? s.nombre_edificio ?? s.edificio
    }

    const res = await reservaService.crearReserva(payload)
    setLoading(false)
    if (!res.ok) {
      // show backend message when available
      const backendMsg = res.error || (res.data && (res.data.error || res.data.mensaje)) || 'Error creando reserva'
      setError(backendMsg)
      console.error('Crear reserva error response:', res)

      // if backend message mentions sancion(es) o bloqueo, prioritize that message and DO NOT show the "invalid participants" box
      const isSancionMsg = /sanci[oó]n|sanciones|no puede reservar|no puede crear reservas|tiene sanciones vigentes|bloquead/i.test(backendMsg)

      // try to extract invalid participant CI from the backend message when it's NOT a sancion message
      if (!isSancionMsg) {
        const m = /participante\s+(\d{6,})/i.exec(backendMsg)
        if (m && m[1]) {
          setInvalidParticipants([m[1]])
        }
      } else {
        // clear invalid participants to avoid showing the extra alert in sancion cases
        setInvalidParticipants([])
      }
      return
    }
    setMensaje('Reserva creada correctamente')
    setSelectedSalaIndex('')
    setFecha('')
    setSelectedTurnosIds([])
    setParticipantesText('')
  }

  const handleRemoveInvalidsAndRetry = async () => {
    if (!invalidParticipants.length) return
    setLoading(true)
    setError(null)
    setMensaje(null)

    // Build participantes array removing invalid ones
    const participantes = participantesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => (isNaN(Number(s)) ? s : Number(s)))
      .filter(p => !invalidParticipants.includes(String(p)))

    let payload = {
        fecha: fecha,
        participantes,
    }

    // Función para formatear horas con padding (HH:MM:SS)
    const formatearHora = (hora) => {
      if (!hora) return hora
      const partes = hora.split(':')
      return partes.map(p => p.padStart(2, '0')).join(':')
    }

    // Agregar turnos
    if (selectedTurnosIds.length > 0) {
      payload.turnos = selectedTurnosIds.map(idTurno => {
        const turno = turnos.find(t => t.id_turno === Number(idTurno))
        if (!turno) return null
        return {
          id_turno: Number(idTurno),
          hora_inicio: formatearHora(turno.hora_inicio),
          hora_fin: formatearHora(turno.hora_fin)
        }
      }).filter(Boolean)
    }

    if (selectedSalaIndex !== '') {
      const s = salas[Number(selectedSalaIndex)]
      payload.nombre_sala = s.nombre_sala ?? s.nombre
      payload.edificio = s.edificio ?? s.nombre_edificio ?? s.edificio
    }

    const res = await reservaService.crearReserva(payload)
    setLoading(false)
    if (!res.ok) {
      const backendMsg = res.error || (res.data && (res.data.error || res.data.mensaje)) || 'Error creando reserva'
      setError(backendMsg)
      console.error('Retry Crear reserva error response:', res)
      const isSancionMsg = /sanci[oó]n|sanciones|no puede reservar|no puede crear reservas|tiene sanciones vigentes|bloquead/i.test(backendMsg)
      if (!isSancionMsg) {
        const m = /participante\s+(\d{6,})/i.exec(backendMsg)
        if (m && m[1]) setInvalidParticipants([m[1]])
      } else {
        setInvalidParticipants([])
      }
      return
    }

  setMensaje('Reserva creada correctamente')
  setSelectedSalaIndex('')
  setFecha('')
  setSelectedTurnosIds([])
  setParticipantesText('')
  setInvalidParticipants([])
}

  return (
    <div className="seccion">
      <h1>Crear Nueva Reserva</h1>
      <p>Completa los datos para hacer una nueva reserva</p>

      {mensaje && <div className="alert-banner alert-verde">{mensaje}</div>}
      {error && <div className="alert-banner alert-rojo">{error}</div>}
      {invalidParticipants.length > 0 && (
        <div className="form-group">
          <div className="alert-banner alert-rojo">Participante(s) inválido(s): {invalidParticipants.join(', ')}</div>
          <button type="button" className="btn-secondary" onClick={handleRemoveInvalidsAndRetry} disabled={loading}>
            Eliminar participante(s) inválido(s) y reintentar
          </button>
        </div>
      )}

      <form className="formulario-reserva" onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="sala">Sala</label>
          {salas.length === 0 ? (
            <div className="form-input">No hay salas disponibles o no se pudieron cargar.</div>
          ) : (
            <select id="sala" className="form-input" value={selectedSalaIndex} onChange={e => setSelectedSalaIndex(e.target.value)}>
              <option value="">-- Seleccione una sala --</option>
              {salas.map((s, i) => (
                <option
                  key={s.nombre_sala ?? s.id ?? s._id ?? `${s.nombre ?? 'sala'}_${s.edificio ?? ''}_${i}`}
                  value={String(i)}
                >
                  {((s.nombre_sala || s.nombre) ? `${(s.nombre_sala || s.nombre)} (${s.edificio || s.nombre_edificio || s.edificio || ''})` : (s.id || s._id || `Sala ${i + 1}`))}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="fecha">Seleccionar Fecha</label>
          <input type="date" id="fecha" className="form-input" value={fecha} onChange={e => setFecha(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="turno">Turno (máximo 2 consecutivos)</label>
          {turnos.length === 0 ? (
            <div className="form-input">Seleccione fecha y sala para ver los turnos disponibles.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {turnos.map((t, i) => (
                <label 
                  key={t.id_turno ?? t.id ?? i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px',
                    border: selectedTurnosIds.includes(t.id_turno) ? '2px solid #2196F3' : '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: selectedTurnosIds.includes(t.id_turno) ? '#e3f2fd' : 'white',
                    cursor: t.disponible === false ? 'not-allowed' : 'pointer',
                    opacity: t.disponible === false ? 0.5 : 1
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTurnosIds.includes(t.id_turno)}
                    disabled={t.disponible === false}
                    onChange={(e) => {
                      const isChecked = e.target.checked
                      setSelectedTurnosIds(prev => {
                        let nuevosSeleccionados = [...prev]
                        
                        if (isChecked) {
                          // Solo permitir máximo 2 turnos
                          if (nuevosSeleccionados.length >= 2) {
                            alert('Solo puede seleccionar máximo 2 turnos consecutivos (máximo 2 horas)')
                            return prev
                          }
                          nuevosSeleccionados.push(t.id_turno)
                        } else {
                          nuevosSeleccionados = nuevosSeleccionados.filter(id => id !== t.id_turno)
                        }
                        
                        return nuevosSeleccionados
                      })
                    }}
                    style={{ marginRight: '10px' }}
                  />
                  <strong>{t.hora_inicio?.slice(0,5) ?? ''} - {t.hora_fin?.slice(0,5) ?? ''}</strong>
                  {t.disponible === false && <span style={{ marginLeft: '10px', color: '#999' }}>(ocupado)</span>}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="participantes">Participantes (CI separados por coma)</label>
          <textarea id="participantes" className="form-input" rows={3} value={participantesText} onChange={e => setParticipantesText(e.target.value)} placeholder="12345678, 87654321" />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Reserva'}
        </button>
      </form>
    </div>
  )
}
