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
  const [selectedTurnoId, setSelectedTurnoId] = useState('')
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
      setSelectedTurnoId('')
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

    // Build payload using nombre_sala and edificio (backend expects these)
    let payload = {
      fecha: fecha,
      participantes,
    }

    if (selectedTurnoId !== '') {
      payload.id_turno = Number(selectedTurnoId)
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
    setSelectedTurnoId('')
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
  setSelectedTurnoId('')
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
          <label htmlFor="turno">Turno</label>
          {turnos.length === 0 ? (
            <div className="form-input">Seleccione fecha y sala para ver los turnos disponibles.</div>
          ) : (
            <select id="turno" className="form-input" value={selectedTurnoId} onChange={e => setSelectedTurnoId(e.target.value)}>
              <option value="">-- Seleccione un turno --</option>
              {turnos.map((t, i) => (
                <option key={t.id_turno ?? t.id ?? i} value={String(t.id_turno ?? t.id ?? i)} disabled={t.disponible === false}>
                  {`${(t.hora_inicio?.slice(0,5) ?? '')} - ${(t.hora_fin?.slice(0,5) ?? '')}${t.disponible === false ? ' (ocupado)' : ''}`}
                </option>
              ))}
            </select>
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
