/**
 * Crear Reserva - Formulario para crear nueva reserva
 */
import { useState, useEffect } from 'react'
import reservaService from '../../../services/reservaService'

export default function CrearReserva({ tienesSanciones }) {
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

      // try to extract invalid participant CI from the backend message
      // backend message example: "El participante 55281693 no tiene programa académico asignado."
      const m = /participante\s+(\d{6,})/i.exec(backendMsg)
      if (m && m[1]) {
        setInvalidParticipants([m[1]])
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
      // update invalid participants if new info provided
      const m = /participante\s+(\d{6,})/i.exec(backendMsg)
      if (m && m[1]) setInvalidParticipants([m[1]])
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
