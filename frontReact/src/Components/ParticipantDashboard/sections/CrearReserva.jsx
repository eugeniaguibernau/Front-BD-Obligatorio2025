/**
 * Crear Reserva - Formulario para crear nueva reserva
 */
import { useState, useEffect } from 'react'
import reservaService from '../../../services/reservaService'
import sancionService from '../../../services/sancionService'
import { listarParticipantes, obtenerParticipante } from '../../../services/participanteService'
import { useAuth } from '../../../hooks/useAuth'

export default function CrearReserva({ tienesSanciones }) {
  const { user } = useAuth()
  const [userCI, setUserCI] = useState(null)
  const [salas, setSalas] = useState([])

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

  // Cargar la CI del participante usando su email
  useEffect(() => {
    const loadUserCI = async () => {
      try {
        const email = user?.correo || user?.email
        if (!email) {

          return
        }

        const res = await listarParticipantes()
        
        if (res.ok && res.data) {
          const participante = res.data.find(p => {
            const pEmail = p.email || p.correo
            return pEmail && pEmail.toLowerCase() === email.toLowerCase()
          })
          
          if (participante && participante.ci) {

            setUserCI(participante.ci)
          } else {

          }
        }
      } catch (error) {

      }
    }
    
    loadUserCI()
  }, [user])

  useEffect(() => {
    const loadSalas = async () => {
      const res = await reservaService.listarSalas()
      if (!res.ok) {
        setError(res.error || 'No se pudieron cargar las salas')
        return
      }
      setSalas(res.data || [])
    }
    loadSalas()
  }, [])

  
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
        //return
      }
    }
    checkSanciones()
  }, [user])

  useEffect(() => {
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
        <h1>Nueva reserva</h1>
        <div className="alert-banner alert-rojo">
          No estás habilitado para generar nuevas reservas debido a sanciones vigentes.
        </div>
        <p
          style={{
            marginTop: '1rem',
            color: '#666',
            fontSize: '0.95rem',
          }}
        >
          Para volver a reservar, deberás esperar a la finalización de las sanciones activas.
          Podés consultar el detalle en la sección «Historial de sanciones».
        </p>
      </div>
    )
  }

  if (bloqueadoPorSancion) {
    return (
      <div className="seccion">
        <h1>Nueva reserva</h1>
        <div className="alert-banner alert-rojo">
          {detalleSancion ||
            'En este momento no estás habilitado para generar nuevas reservas debido a sanciones vigentes.'}
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

    // Evitar cédulas duplicadas en la misma reserva
    const dupMap = {}
    const duplicates = []
    for (const p of participantes) {
      const key = String(p)
      dupMap[key] = (dupMap[key] || 0) + 1
      if (dupMap[key] === 2) duplicates.push(key)
    }
    if (duplicates.length > 0) {
      setError(`Las siguientes cédulas están repetidas en la reserva: ${duplicates.join(', ')}. Elimina duplicados antes de continuar.`)
      setLoading(false)
      return
    }

    // VALIDACIÓN 1: Debe haber al menos un participante
    if (participantes.length === 0) {
      setError('Debes agregar al menos un participante (tu cédula)')
      setLoading(false)
      return
    }

    // VALIDACIÓN 2: El usuario DEBE incluirse a sí mismo en la lista de participantes
    console.log('[CrearReserva] CI del usuario logueado (userCI):', userCI)

    if (!userCI) {
      setError('Debes incluir tu cédula de identidad en la lista de participantes')
      setLoading(false)
      return
    }

    const userCINumber = Number(userCI)
    const incluidoEnLista = participantes.some(p => {
      const pNum = Number(p)
      console.log('[CrearReserva] Comparando:', pNum, '===', userCINumber, '?', !isNaN(pNum) && pNum === userCINumber)
      return !isNaN(pNum) && pNum === userCINumber
    })

    if (!incluidoEnLista) {
      setError(`❌ Debes incluir tu propia cédula (${userCI}) en la lista de participantes. No puedes crear reservas únicamente para otros.`)
      setLoading(false)
      return
    }

    // Validar que haya al menos un turno seleccionado
    if (selectedTurnosIds.length === 0) {
      setError('Debe seleccionar al menos un turno')
      setLoading(false)
      return
    }

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

    // --- Validaciones antes de enviar (roles y límites) ---
    try {
      // obtener tipo de sala
      const sala = selectedSalaIndex !== '' ? salas[Number(selectedSalaIndex)] : null
      const salaTipo = (sala && (sala.tipo_sala || sala.tipo)) ? (sala.tipo_sala || sala.tipo).toString().toLowerCase() : 'libre'

      // obtener todas las reservas actuales para conteos (cliente)
      const allRes = await reservaService.listarReservas()
      const todasReservas = (allRes && allRes.ok && Array.isArray(allRes.data)) ? allRes.data : []

      const parseDate = (s) => {
        const parts = String(s).split('-')
        if (parts.length < 3) return null
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      }
      const sameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
      const startOfWeek = (d) => { const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const day = copy.getDay(); const diffToMonday = (day === 0) ? -6 : 1 - day; copy.setDate(copy.getDate() + diffToMonday); copy.setHours(0,0,0,0); return copy }
      const endOfWeek = (d) => { const s = startOfWeek(d); const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59,999); return e }
      const horaToMinutes = (hhmmss) => { if (!hhmmss) return null; const parts = String(hhmmss).split(':').map(p => parseInt(p,10)); return (parts[0]||0)*60 + (parts[1]||0) }

      // calcular minutos de la nueva reserva
      const newMinutes = (payload.turnos || []).reduce((acc, t) => { const s = horaToMinutes(t.hora_inicio); const e = horaToMinutes(t.hora_fin); if (s==null||e==null) return acc; return acc + Math.max(0, e - s) }, 0)

      const fechaObj = parseDate(payload.fecha)
      if (!fechaObj) {
        setError('Fecha inválida')
        setLoading(false)
        return
      }

      // Validar por participante
      for (const ciRaw of participantes) {
        const ci = String(ciRaw)

        // 1) sanciones
        try {
          const sancRes = await sancionService.listarSanciones(ci)
          if (sancRes && sancRes.unauthorized) { setError('No autorizado'); setLoading(false); return }
          const sancData = (sancRes && sancRes.ok) ? (Array.isArray(sancRes.data) ? sancRes.data : (sancRes.data && sancRes.data.sanciones) || []) : []
          if (sancData && sancData.length > 0) {
            setError(`El participante ${ci} tiene sanciones activas y no puede reservar.`)
            setLoading(false)
            return
          }
        } catch (err) {
          setError(`Error verificando sanciones para ${ci}: ${err.message || err}`)
          setLoading(false)
          return
        }

        // 2) rol del participante
        let tipo = null
        try {
          const pRes = await obtenerParticipante(ci, true)
          if (pRes && pRes.unauthorized) { setError('No autorizado'); setLoading(false); return }
          if (pRes && pRes.ok && pRes.data) {
            tipo = (pRes.data.tipo_participante || pRes.data.tipo || '').toString().toLowerCase()
          }
        } catch {
          tipo = null
        }

        const tipoNorm = (tipo||'').toString().toLowerCase()
        const isDocente = tipoNorm === 'docente'
        const isPosgrado = tipoNorm === 'posgrado' || tipoNorm === 'postgrado'

        // 3) exclusividad de sala: si la sala es docente o posgrado, sólo su tipo puede participar
        if (salaTipo === 'docente' && !isDocente) { setError(`La sala es exclusiva para docentes. El participante ${ci} no es docente.`); setLoading(false); return }
        if ((salaTipo === 'posgrado' || salaTipo === 'postgrado') && !isPosgrado) { setError(`La sala es exclusiva para posgrado. El participante ${ci} no es posgrado.`); setLoading(false); return }

        // 4) aplicar límites: si participante está exento (docente en sala docente OR posgrado en sala posgrado) -> no aplicar
        const exempt = (isDocente && salaTipo === 'docente') || (isPosgrado && (salaTipo === 'posgrado' || salaTipo === 'postgrado'))

        if (!exempt) {
          let existingMinutes = 0
          for (const r of todasReservas) {
            // comprobar si participa
            const parts = r.participantes || []
            const includes = parts.some(p => { if (p==null) return false; if (typeof p === 'number' || typeof p === 'string') return String(p) === ci; return (p.ci||p.ci_participante||p.identificacion||p.cedula) && String(p.ci||p.ci_participante||p.identificacion||p.cedula) === ci })
            if (!includes) continue
            const rFecha = parseDate(r.fecha)
            if (!rFecha) continue
            const estado = (r.estado_actual || r.estado || '').toString().toLowerCase()
            if (estado !== 'activa') continue
            if (!sameDay(rFecha, fechaObj)) continue
            if (!r.turnos || r.turnos.length === 0) continue
            for (const rt of r.turnos) {
              const rs = horaToMinutes(rt.hora_inicio); const re = horaToMinutes(rt.hora_fin); if (rs==null||re==null) continue; existingMinutes += Math.max(0, re - rs)
            }
          }
          if ((existingMinutes + newMinutes) > 120) { setError(`El participante ${ci} excede el límite diario de 2 horas.`); setLoading(false); return }

          const s = startOfWeek(fechaObj); const e = endOfWeek(fechaObj)
          const cntSemana = todasReservas.filter(r => {
            const parts = r.participantes || []
            const includes = parts.some(p => { if (p==null) return false; if (typeof p === 'number' || typeof p === 'string') return String(p) === ci; return (p.ci||p.ci_participante||p.identificacion||p.cedula) && String(p.ci||p.ci_participante||p.identificacion||p.cedula) === ci })
            if (!includes) return false
            const rFecha = parseDate(r.fecha); if (!rFecha) return false
            const estado = (r.estado_actual || r.estado || '').toString().toLowerCase(); if (estado !== 'activa') return false
            return (rFecha >= s && rFecha <= e)
          }).length
          // incluir la reserva solicitada en este request
          const totalSemana = (cntSemana || 0) + 1
          if (totalSemana > 3) { setError(`El participante ${ci} ya tiene ${cntSemana} reservas activas en la semana (máx 3).`); setLoading(false); return }
        }
      }
    } catch (err) {
      setError(err.message || 'Error validando reglas de reservas')
      setLoading(false)
      return
    }

    const res = await reservaService.crearReserva(payload)
    setLoading(false)
    if (!res.ok) {
      const backendMsg = res.error || (res.data && (res.data.error || res.data.mensaje)) || 'Error creando reserva'
      setError(backendMsg)

      const isSancionMsg = /sanci[oó]n|sanciones|no puede reservar|no puede crear reservas|tiene sanciones vigentes|bloquead/i.test(backendMsg)

      if (!isSancionMsg) {
        const m = /participante\s+(\d{6,})/i.exec(backendMsg)
        if (m && m[1]) {
          setInvalidParticipants([m[1]])
        }
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
  }

  const handleRemoveInvalidsAndRetry = async () => {
    if (!invalidParticipants.length) return
    setLoading(true)
    setError(null)
    setMensaje(null)

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
      <h1>Nueva reserva</h1>
      <p>Complete los siguientes datos para generar una nueva reserva.</p>

      {mensaje && <div className="alert-banner alert-verde">{mensaje}</div>}
      {error && <div className="alert-banner alert-rojo">{error}</div>}
      {invalidParticipants.length > 0 && (
        <div className="form-group">
          <div className="alert-banner alert-rojo">
            Se detectaron participantes inválidos: {invalidParticipants.join(', ')}
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRemoveInvalidsAndRetry}
            disabled={loading}
          >
            Quitar participantes inválidos y volver a intentar
          </button>
        </div>
      )}

      <form className="formulario-reserva" onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="sala">Sala</label>
          {salas.length === 0 ? (
            <div className="form-input">
              No se encontraron salas disponibles o no fue posible cargar la
              información.
            </div>
          ) : (
            <select
              id="sala"
              className="form-input"
              value={selectedSalaIndex}
              onChange={e => setSelectedSalaIndex(e.target.value)}
            >
              <option value="">Seleccione una sala</option>
              {salas.map((s, i) => {
                const keyParts = [
                  s.id_sala || s.id || s._id,
                  s.nombre_sala || s.nombre,
                  s.edificio || s.nombre_edificio,
                  i,
                ].filter(Boolean)
                const uniqueKey = keyParts.join('_')

                return (
                  <option key={uniqueKey} value={String(i)}>
                    {(s.nombre_sala || s.nombre) &&
                    (s.edificio || s.nombre_edificio || s.edificio)
                      ? `${s.nombre_sala || s.nombre} (${
                          s.edificio ||
                          s.nombre_edificio ||
                          s.edificio ||
                          ''
                        })`
                      : s.id || s._id || `Sala ${i + 1}`}
                  </option>
                )
              })}
            </select>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="fecha">Fecha de la reserva</label>
          <input
            type="date"
            id="fecha"
            className="form-input"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="turno">Turno (puede seleccionar varios turnos)</label>
          {turnos.length === 0 ? (
            <div className="form-input">
              Seleccione una sala y una fecha para visualizar los turnos
              disponibles.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {turnos.map((t, i) => (
                <label
                  key={t.id_turno ?? t.id ?? i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px',
                    border: selectedTurnosIds.includes(t.id_turno)
                      ? '2px solid #123a7a'
                      : '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: selectedTurnosIds.includes(t.id_turno)
                      ? '#e6ecfa'
                      : 'white',
                    cursor:
                      t.disponible === false ? 'not-allowed' : 'pointer',
                    opacity: t.disponible === false ? 0.6 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTurnosIds.includes(t.id_turno)}
                    disabled={t.disponible === false}
                    onChange={e => {
                      const isChecked = e.target.checked
                      setSelectedTurnosIds(prev => {
                        let nuevosSeleccionados = [...prev]

                                    if (isChecked) {
                                    // permitir seleccionar cualquier cantidad de turnos en UI;
                                    // las restricciones se validan al enviar según rol y tipo de sala
                                    nuevosSeleccionados.push(t.id_turno)
                        } else {
                          nuevosSeleccionados = nuevosSeleccionados.filter(
                            id => id !== t.id_turno
                          )
                        }

                        return nuevosSeleccionados
                      })
                    }}
                    style={{ marginRight: '10px' }}
                  />
                  <strong>
                    {t.hora_inicio?.slice(0, 5) ?? ''} -{' '}
                    {t.hora_fin?.slice(0, 5) ?? ''}
                  </strong>
                  {t.disponible === false && (
                    <span
                      style={{ marginLeft: '10px', color: '#999' }}
                    >
                      (turno ocupado)
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="participantes">
            Participantes (cédulas de identidad separadas por coma)
          </label>
          <textarea
            id="participantes"
            className="form-input"
            rows={3}
            value={participantesText}
            onChange={e => setParticipantesText(e.target.value)}
            placeholder={
              userCI
                ? `${userCI}, 12345678, 87654321`
                : 'Tu cédula, 12345678, 87654321'
            }
            required
          />
          <small
            style={{
              color: '#444',
              fontSize: '0.9em',
              marginTop: '6px',
              display: 'block',
            }}
          >
            Es obligatorio incluir tu propia cédula de identidad en la lista de
            participantes. No se admiten reservas realizadas únicamente para
            terceros.
          </small>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Procesando reserva…' : 'Confirmar reserva'}
        </button>
      </form>
    </div>
  )

}
