/**
 * Gestión de Reservas 
 */
import { useEffect, useState, useCallback } from 'react'
import reservaService from '../../../services/reservaService'
import { obtenerParticipante, obtenerSanciones } from '../../../services/participanteService'
import { obtenerSala } from '../../../services/salaService'
import { useAuth } from '../../../hooks/useAuth'

const ESTADOS = ['activa', 'cancelada', 'sin asistencia', 'finalizada']

export default function GestionReservas() {
  const { logout } = useAuth()
  const [reservas, setReservas] = useState([])
  const [reservasFiltradas, setReservasFiltradas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  
  // Búsqueda y filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  
  // Modal de actualización de estado
  const [showModalEstado, setShowModalEstado] = useState(false)
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  
  // Modal de asistencia
  const [showModalAsistencia, setShowModalAsistencia] = useState(false)
  const [participantesReserva, setParticipantesReserva] = useState([])
  const [loadingParticipantes, setLoadingParticipantes] = useState(false)
  
  // Modal de crear reserva
  const [showModalCrear, setShowModalCrear] = useState(false)
  const [salas, setSalas] = useState([])
  const [turnos, setTurnos] = useState([])
  const [formCrear, setFormCrear] = useState({
    fecha: '',
    nombre_sala: '',
    edificio: '',
    turnos_seleccionados: [], // Array de IDs de turnos (puede ser múltiples)
    participantes: [''] // Array de CIs
  })
  const [loadingSalas, setLoadingSalas] = useState(false)
  const [loadingTurnos, setLoadingTurnos] = useState(false)

  const fetchReservas = useCallback(async () => {
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
  }, [logout])

  useEffect(() => {
    fetchReservas()
  }, [fetchReservas])

  // Aplicar búsqueda y filtros
  useEffect(() => {
    let resultado = [...reservas]

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const terminoLower = busqueda.toLowerCase().trim()
      resultado = resultado.filter(r => {
        const nombreSala = (r.nombre_sala || '').toLowerCase()
        const edificio = (r.edificio || '').toLowerCase()
        const fecha = (r.fecha || '').toString()
        const estado = (r.estado_actual || r.estado || '').toLowerCase()
        return nombreSala.includes(terminoLower) ||
               edificio.includes(terminoLower) ||
               fecha.includes(terminoLower) ||
               estado.includes(terminoLower)
      })
    }

    // Filtro por estado
    if (filtroEstado) {
      resultado = resultado.filter(r => 
        (r.estado_actual || r.estado || '').toLowerCase() === filtroEstado.toLowerCase()
      )
    }

    setReservasFiltradas(resultado)
  }, [reservas, busqueda, filtroEstado])

  const handleEliminar = async (reserva) => {
    if (!window.confirm(`¿Confirmás la eliminación de la reserva #${reserva.id_reserva}?`)) return
    
    setMessage(null)
    const res = await reservaService.eliminarReserva(reserva.id_reserva)
    
    if (res.unauthorized) {
      logout()
      return
    }
    
    if (!res.ok) {
      setMessage(res.error || 'Error al eliminar reserva')
      return
    }
    
    setMessage('Reserva eliminada correctamente')
    fetchReservas()
  }

  const abrirModalEstado = (reserva) => {
    setReservaSeleccionada(reserva)
    // Preferir el estado calculado por el backend si está disponible
    setNuevoEstado((reserva.estado_actual || reserva.estado) || 'activa')
    setShowModalEstado(true)
  }

  const cerrarModalEstado = () => {
    setShowModalEstado(false)
    setReservaSeleccionada(null)
    setNuevoEstado('')
  }

  const handleActualizarEstado = async (e) => {
    e.preventDefault()
    setMessage(null)

    if ((nuevoEstado || '').toString().toLowerCase() === 'asistida') {
      try {
        // obtener participantes
        const partRes = await reservaService.listarParticipantesReserva(reservaSeleccionada.id_reserva)
        if (partRes && partRes.ok && Array.isArray(partRes.data)) {
          // marcar asistencia=true para cada participante (se hace en serie para simplicidad)
          for (const p of partRes.data) {
            try {
              const ci = p.ci || p.ci_participante || p.cedula || p.identificacion
              if (!ci) continue
              await reservaService.marcarAsistencia(reservaSeleccionada.id_reserva, ci, true)
            } catch (err) {
              // registrar error de marcar asistencia pero continuar
              console.error('[GestionReservas] Error marcando asistencia para participante:', err)
            }
          }
        }
      } catch (err) {
        console.error('[GestionReservas] Error al marcar asistencia en lote:', err)
      }
    }

    const res = await reservaService.actualizarReserva(reservaSeleccionada.id_reserva, {
      estado: nuevoEstado
    })

    if (res.unauthorized) {
      logout()
      return
    }

    if (!res.ok) {
      setMessage(res.error || 'Error al actualizar estado')
      return
    }

    const estadoAplicado = res.data && (res.data.estado_aplicado || res.data.estado_aplicado_en_backend || null)
    if (estadoAplicado) {
      setMessage(`Estado actualizado correctamente: ${estadoAplicado}`)
    } else {
      setMessage('Estado actualizado correctamente')
    }

    if (res.data && res.data.sanciones) {
      setMessage(prev => `${prev} Sanciones aplicadas: ${res.data.sanciones.aplicadas}`)
    }

    cerrarModalEstado()
    fetchReservas()
  }

  const abrirModalAsistencia = async (reserva) => {
    setReservaSeleccionada(reserva)
    setShowModalAsistencia(true)
    setLoadingParticipantes(true)
    
    // Obtener lista de participantes de esta reserva
    const res = await reservaService.listarParticipantesReserva(reserva.id_reserva)
    
    if (res.unauthorized) {
      logout()
      return
    }
    
    if (res.ok && res.data) {
      setParticipantesReserva(Array.isArray(res.data) ? res.data : [])
    } else {
      setParticipantesReserva([])
    }
    
    setLoadingParticipantes(false)
  }

  const cerrarModalAsistencia = () => {
    setShowModalAsistencia(false)
    setReservaSeleccionada(null)
    setParticipantesReserva([])
  }

  const handleMarcarAsistencia = async (ci, asistencia) => {
    setMessage(null)
    
    const res = await reservaService.marcarAsistencia(
      reservaSeleccionada.id_reserva,
      ci,
      asistencia
    )

    if (res.unauthorized) {
      logout()
      return
    }

    if (!res.ok) {
      setMessage(res.error || 'Error al registrar asistencia')
      return
    }

    setMessage(`Asistencia registrada correctamente para CI ${ci}`)
    
    // Actualizar estado local
    setParticipantesReserva(prev =>
      prev.map(p =>
        p.ci === ci ? { ...p, asistencia } : p
      )
    )
  }

  const getBadgeEstado = (estado) => {
    const estadoLower = (estado || '').toLowerCase()
    
    if (estadoLower === 'activa') return <span className="badge-libre">Activa</span>
    if (estadoLower === 'cancelada') return <span className="badge-posgrado">Cancelada</span>
    if (estadoLower === 'sin asistencia') return <span className="badge-docente">Sin Asistencia</span>
  if (estadoLower === 'finalizada') return <span className="badge-libre">Finalizada</span>
  if (estadoLower === 'asistida') return <span className="badge-docente">Asistida</span>
    
    return <span>{estado}</span>
  }

  // Funciones para crear reserva
  const abrirModalCrear = async () => {
    setShowModalCrear(true)
    setFormCrear({ fecha: '', nombre_sala: '', edificio: '', turnos_seleccionados: [], participantes: [''] })
    
    // Cargar salas
    setLoadingSalas(true)
    const resSalas = await reservaService.listarSalas()
    if (resSalas.ok) {
      setSalas(resSalas.data || [])
    }
    setLoadingSalas(false)
  }

  const cargarTurnos = async (nombreSala, edificio) => {
    if (!nombreSala || !edificio) {
      setTurnos([])
      return
    }
    
    setLoadingTurnos(true)
    const resTurnos = await reservaService.listarTurnos({ nombre_sala: nombreSala, edificio: edificio })
    if (resTurnos.ok) {
      setTurnos(resTurnos.data || [])
    }
    setLoadingTurnos(false)
  }

  const agregarParticipante = () => {
    setFormCrear(prev => ({
      ...prev,
      participantes: [...prev.participantes, '']
    }))
  }

  const eliminarParticipante = (index) => {
    setFormCrear(prev => ({
      ...prev,
      participantes: prev.participantes.filter((_, i) => i !== index)
    }))
  }

  const actualizarParticipante = (index, valor) => {
    setFormCrear(prev => ({
      ...prev,
      participantes: prev.participantes.map((p, i) => i === index ? valor : p)
    }))
  }

  const handleCrearReserva = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    // Validar que haya al menos un turno seleccionado
    if (formCrear.turnos_seleccionados.length === 0) {
      setError('Debe seleccionar al menos un turno')
      setLoading(false)
      return
    }

    // Validar que haya al menos un participante con CI válido
    const participantesValidos = formCrear.participantes
      .filter(ci => ci.trim() !== '')
      .map(ci => parseInt(ci))

    if (participantesValidos.length === 0) {
      setError('Debe agregar al menos un participante')
      setLoading(false)
      return
    }
    // Evitar cédulas duplicadas en la misma reserva
    const dupMap = {}
    const duplicates = []
    for (const p of participantesValidos) {
      const key = String(p)
      dupMap[key] = (dupMap[key] || 0) + 1
      if (dupMap[key] === 2) duplicates.push(key)
    }
    if (duplicates.length > 0) {
      setError(`Las siguientes cédulas están repetidas en la reserva: ${duplicates.join(', ')}. Elimina duplicados antes de continuar.`)
      setLoading(false)
      return
    }
    
    // Asegurar formato de fecha YYYY-MM-DD
    let fechaFormateada = formCrear.fecha
    if (formCrear.fecha.includes('/')) {
      // Si viene en formato DD/MM/YYYY, convertir a YYYY-MM-DD
      const [dia, mes, anio] = formCrear.fecha.split('/')
      fechaFormateada = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
    }
    // Helpers locales para validaciones por participante y disponibilidad
    const normalizeCi = (ci) => (typeof ci === 'string' ? ci.trim() : String(ci))

    const reservasIncluyenParticipante = (reserva, ci) => {
      if (!reserva) return false
      const partes = reserva.participantes || []
      // participantes puede ser array de números o de objetos con campo ci
      for (const p of partes) {
        if (!p && p !== 0) continue
        if (typeof p === 'number' || typeof p === 'string') {
          if (String(p) === String(ci)) return true
        } else if (p.ci || p.ci_participante || p.identificacion || p.cedula) {
          const val = p.ci || p.ci_participante || p.identificacion || p.cedula
          if (String(val) === String(ci)) return true
        }
      }
      return false
    }

    const parseDate = (s) => {
      // s expected YYYY-MM-DD
      const parts = String(s).split('-')
      if (parts.length < 3) return null
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    }

    const sameDay = (d1, d2) => {
      return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
    }

    const startOfWeek = (d) => {
      // semana que empieza el lunes
      const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const day = copy.getDay() // 0 Domingo .. 6 Sábado
      const diffToMonday = (day === 0) ? -6 : 1 - day
      copy.setDate(copy.getDate() + diffToMonday)
      copy.setHours(0,0,0,0)
      return copy
    }

    const endOfWeek = (d) => {
      const s = startOfWeek(d)
      const e = new Date(s)
      e.setDate(s.getDate() + 6)
      e.setHours(23,59,59,999)
      return e
    }

    const horaToMinutes = (hhmmss) => {
      if (!hhmmss) return null
      const parts = String(hhmmss).split(':').map(p => parseInt(p, 10))
      return (parts[0] || 0) * 60 + (parts[1] || 0)
    }

    const rangesOverlap = (aStart, aEnd, bStart, bEnd) => {
      if (aStart == null || aEnd == null || bStart == null || bEnd == null) return false
      return Math.max(aStart, bStart) < Math.min(aEnd, bEnd)
    }

    const reservaConflictaConTurnos = (reserva, turnosSeleccionados) => {
      try {
        if (!reserva || !reserva.turnos || reserva.turnos.length === 0) return false
        for (const tSel of turnosSeleccionados) {
          const selStart = horaToMinutes(tSel.hora_inicio)
          const selEnd = horaToMinutes(tSel.hora_fin)
          for (const rt of reserva.turnos) {
            const rStart = horaToMinutes(rt.hora_inicio)
            const rEnd = horaToMinutes(rt.hora_fin)
            if (rangesOverlap(selStart, selEnd, rStart, rEnd)) return true
          }
        }
      } catch {
        return false
      }
      return false
    }

    // Validaciones por participante:
    // - No puede reservar si tiene sanciones activas
    // - No puede tener más de 2 reservas activas en el mismo día
    // - Si es Estudiante: no puede tener más de 3 reservas activas en la misma semana
    // Usaremos la lista local `reservas` (ya cargada) para contar reservas existentes
    const fechaObj = parseDate(fechaFormateada)
    if (!fechaObj) {
      setError('Fecha inválida')
      setLoading(false)
      return
    }
    const reservasEnSemana = (ci) => {
      const s = startOfWeek(fechaObj)
      const e = endOfWeek(fechaObj)
      return reservas.filter(r => {
        if (!reservasIncluyenParticipante(r, ci)) return false
        const rFecha = parseDate(r.fecha)
        if (!rFecha) return false
        const estado = (r.estado_actual || r.estado || '').toLowerCase()
        if (estado !== 'activa') return false
        return (rFecha >= s && rFecha <= e)
      })
    }

    // Preparar objetos de turnos seleccionados con horas para chequear conflictos con reservas existentes en la misma sala
    
    const turnosPayload = formCrear.turnos_seleccionados.map(idTurno => {
      const turno = turnos.find(t => t.id_turno === idTurno)
      
      // Asegurar formato HH:MM:SS con padding
      const formatearHora = (hora) => {
        if (!hora) return hora
        const partes = hora.split(':')
        return partes.map(p => p.padStart(2, '0')).join(':')
      }
      
      return {
        id_turno: parseInt(idTurno),
        hora_inicio: formatearHora(turno.hora_inicio),
        hora_fin: formatearHora(turno.hora_fin)
      }
    })
    
    // Antes de enviar al backend: validaciones por participante y disponibilidad de sala/turnos
    // Construir lista de objetos seleccionados con horas para validar solapamientos
    const turnosSeleccionadosObj = turnosPayload.map(tp => ({ hora_inicio: tp.hora_inicio, hora_fin: tp.hora_fin }))

    // Obtener info de la sala (tipo_sala) para aplicar excepciones de límites
    let salaTipo = null
    try {
      const salaRes = await obtenerSala(formCrear.nombre_sala, formCrear.edificio)
      if (salaRes && salaRes.ok && salaRes.data) {
        salaTipo = (salaRes.data.tipo_sala || salaRes.data.tipo || '').toString().toLowerCase()
      }
    } catch {
      // no bloquear si falla la consulta, asumimos null
      salaTipo = null
    }

    // 1) Verificar que no exista otra reserva en la misma sala/fecha con turnos solapados
    const salaConflicto = reservas.find(r => {
      if ((r.nombre_sala || '') !== formCrear.nombre_sala) return false
      if ((r.edificio || '') !== formCrear.edificio) return false
      if (String(r.fecha) !== String(fechaFormateada)) return false
      // Solo considerar reservas activas/confirmadas
      const estado = (r.estado_actual || r.estado || '').toLowerCase()
      if (estado !== 'activa') return false
      return reservaConflictaConTurnos(r, turnosSeleccionadosObj)
    })

    if (salaConflicto) {
      setError(`Ya existe una reserva activa en esa sala/horario (ID: ${salaConflicto.id_reserva}).`) 
      setLoading(false)
      return
    }

    // 2) Validaciones por participante (sanciones y límites)
    for (const ciRaw of participantesValidos) {
      const ci = normalizeCi(ciRaw)
      // verificar sanciones (preciso llamar al servicio)
      try {
        const sancRes = await obtenerSanciones(ci)
        if (sancRes && sancRes.unauthorized) {
          logout()
          setLoading(false)
          return
        }
        if (sancRes && sancRes.ok && Array.isArray(sancRes.data) && sancRes.data.length > 0) {
          setError(`El participante ${ci} tiene sanciones activas y no puede reservar.`)
          setLoading(false)
          return
        }
      } catch (err) {
        // Si falla el servicio, no bloqueamos por completo, pero informamos
        setError(`No se pudo verificar sanciones para CI ${ci}: ${err.message || err}`)
        setLoading(false)
        return
      }

      // Obtener tipo de participante para aplicar posibles excepciones
      let tipo = null
      try {
        const pRes = await obtenerParticipante(ci, true)
        if (pRes && pRes.unauthorized) {
          logout()
          setLoading(false)
          return
        }
        if (pRes && pRes.ok && pRes.data) {
          tipo = (pRes.data.tipo_participante || pRes.data.tipo || '').toString().toLowerCase()
        }
      } catch {
        tipo = null
      }

      // Normalizar tipos equivalentes
      const tipoNorm = (tipo || '').toString().toLowerCase()
      const isDocente = tipoNorm === 'docente'
      const isPosgrado = tipoNorm === 'postgrado' || tipoNorm === 'posgrado'

  // La sala puede ser de tipo 'docente' o 'posgrado' o 'libre'
  const salaEsDocente = salaTipo === 'docente'
  const salaEsPosgrado = salaTipo === 'posgrado' || salaTipo === 'postgrado'

  const isExemptForSala = (isDocente && salaEsDocente) || (isPosgrado && salaEsPosgrado)

      // En salas exclusivas validar que solo participen participantes del tipo correcto
      if (salaEsDocente && !isDocente) {
        setError(`La sala seleccionada es exclusiva para docentes. El participante ${ci} no es docente.`)
        setLoading(false)
        return
      }
      if (salaEsPosgrado && !isPosgrado) {
        setError(`La sala seleccionada es exclusiva para posgrado. El participante ${ci} no es posgrado.`)
        setLoading(false)
        return
      }

      // calcular minutos ya ocupados por el participante en la fecha
      const newMinutes = turnosSeleccionadosObj.reduce((acc, t) => {
        const s = horaToMinutes(t.hora_inicio)
        const e = horaToMinutes(t.hora_fin)
        if (s == null || e == null) return acc
        return acc + Math.max(0, e - s)
      }, 0)

      // Evitar depender de una posible lógica del backend que calcule semanas usando
      // la semana actual: computamos localmente las reservas activas del participante
      // para el día y la semana de la fecha seleccionada (`fechaObj`). Esto asegura
      // que la validación se aplique siempre sobre la semana objetivo (no la semana actual).
      let existingMinutes = 0
      let cntSemana = 0
      try {
        // Deduplicar y usar la caché local `reservas` (ya cargada en el componente)
        const dedupeById = (arr) => {
          const map = new Map()
          for (const it of (arr || [])) {
            const id = it && (it.id_reserva || it.id || it._id || null)
            if (!id) continue
            if (!map.has(String(id))) map.set(String(id), it)
          }
          return Array.from(map.values())
        }

        // reservas activas en el día (local)
        const reservasDiaLocal = dedupeById(reservas.filter(r => reservasIncluyenParticipante(r, ci) && ((r.estado_actual || r.estado || '').toLowerCase() === 'activa')))
        for (const r of reservasDiaLocal) {
          const rFecha = parseDate(r.fecha)
          if (!rFecha) continue
          if (!sameDay(rFecha, fechaObj)) continue
          if (!r.turnos || r.turnos.length === 0) continue
          for (const rt of r.turnos) {
            const rs = horaToMinutes(rt.hora_inicio)
            const re = horaToMinutes(rt.hora_fin)
            if (rs == null || re == null) continue
            existingMinutes += Math.max(0, re - rs)
          }
        }

        // reservas activas en la semana (local)
        cntSemana = reservasEnSemana(ci).length
      } catch (err) {
        // En caso de error inesperado, caemos a valores conservadores
        console.warn('[GestionReservas] Error calculando reservas locales por semana, permitiendo continuar (fallback):', err)
        existingMinutes = 0
        cntSemana = 0
      }

      // Si NO está exento por ser docente/posgrado en sala exclusiva, aplicar límites
      if (!isExemptForSala) {
        // límite diario: máximo 120 minutos ocupados
        if ((existingMinutes + newMinutes) > 120) {
          setError(`El participante ${ci} excede el límite diario de 2 horas (ocupadas: ${existingMinutes} min, intento sumar: ${newMinutes} min).`)
          setLoading(false)
          return
        }

        // límite semanal: máximo 3 reservas activas en la semana
        // sumar la reserva solicitada actual (esta creación suma 1)
        const totalSemana = (cntSemana || 0) + 1
        if (totalSemana > 3) {
          setError(`El participante ${ci} ya participa en reservas activas esta semana (máximo 3).`)
          setLoading(false)
          return
        }
      }
    }
    const payload = {
      fecha: fechaFormateada,
      nombre_sala: formCrear.nombre_sala,
      edificio: formCrear.edificio,
      turnos: turnosPayload,
      participantes: participantesValidos
    }

    const res = await reservaService.crearReserva(payload)
    setLoading(false)

    if (res.unauthorized) {
      logout()
      return
    }

    if (res.ok) {
      setMessage('Reserva creada exitosamente')
      setShowModalCrear(false)
      fetchReservas()
      setTimeout(() => setMessage(null), 3000)
    } else {
      setError(res.error || 'Error al crear reserva')
    }
  }

  // Determinar si una reserva ya pasó y se puede marcar asistencia
  const puedeMarcarAsistencia = (reserva) => {
    // El estado puede venir en diferentes campos
    const estado = (reserva.estado_actual || reserva.estado || '').toLowerCase()
    
    // Solo se puede marcar asistencia si el estado es 'activa' o 'finalizada'
    // (Ya finalizadas deberían poder marcar/rever asistencia)
    const estadoValido = estado === 'activa' || estado === 'finalizada'
    
    return estadoValido
  }

  return (
    <div className="seccion">
      <h1>Gestión de Reservas</h1>
      <p>Consultá, actualizá y administrá las reservas registradas en el sistema.</p>

      <div className="controles">
        <button onClick={abrirModalCrear} className="btn-primary">
          + Nueva Reserva
        </button>
        
        <input
          type="text"
          placeholder="Buscar por sala, edificio, fecha o estado"
          className="search-input"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="filter-select"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(estado => (
            <option key={estado} value={estado}>
              {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </option>
          ))}
        </select>

        <button onClick={fetchReservas} className="btn-secundario">
          🔄 Recargar
        </button>
      </div>

      {loading && <p>Cargando reservas...</p>}
      {error && <div className="alert-banner alert-rojo">{error}</div>}
      {message && (
        <div className={`alert-banner ${message.toLowerCase().includes('error') ? 'alert-rojo' : 'alert-verde'}`}>
          {message}
        </div>
      )}

      <table className="tabla-admin">
        <thead>
          <tr>
            <th>ID</th>
            <th>Sala</th>
            <th>Edificio</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reservasFiltradas.length > 0 ? (
            reservasFiltradas.map((reserva) => (
              <tr key={reserva.id_reserva}>
                <td>{reserva.id_reserva}</td>
                <td>{reserva.nombre_sala}</td>
                <td>{reserva.edificio}</td>
                <td>{reserva.fecha}</td>
                <td>{getBadgeEstado(reserva.estado_actual || reserva.estado)}</td>
                <td>
                  <button
                    onClick={() => abrirModalEstado(reserva)}
                    className="btn-editar"
                  >
                    Cambiar Estado
                  </button>
                  
                  {puedeMarcarAsistencia(reserva) && (
                    <button
                      onClick={() => abrirModalAsistencia(reserva)}
                      className="btn-action"
                      style={{ marginLeft: '5px' }}
                    >
                      📋 Asistencia
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleEliminar(reserva)}
                    className="btn-eliminar"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="sin-datos">
                {busqueda || filtroEstado ? 'No se encontraron reservas con los filtros aplicados' : 'No hay reservas registradas'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showModalEstado && (
        <div className="modal-overlay" onClick={cerrarModalEstado}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Actualizar Estado de Reserva</h2>
            <form onSubmit={handleActualizarEstado}>
              <div className="form-group">
                <label>Reserva ID:</label>
                <input type="text" value={reservaSeleccionada?.id_reserva || ''} disabled />
              </div>
              
              <div className="form-group">
                <label>Sala:</label>
                <input 
                  type="text" 
                  value={`${reservaSeleccionada?.nombre_sala} - ${reservaSeleccionada?.edificio}`} 
                  disabled 
                />
              </div>

              <div className="form-group">
                <label>Nuevo Estado: *</label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  required
                >
                  {ESTADOS.filter(e => e.toLowerCase() !== 'finalizada').map(estado => (
                    <option key={estado} value={estado}>
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </option>
                  ))}
                </select>
                <small>
                  ⚠️ Si marcas como "sin asistencia", se aplicarán sanciones automáticamente
                </small>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primario">
                  Actualizar Estado
                </button>
                <button type="button" onClick={cerrarModalEstado} className="btn-secundario">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModalAsistencia && (
        <div className="modal-overlay" onClick={cerrarModalAsistencia}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Registrar Asistencia</h2>
            <p><strong>Reserva:</strong> #{reservaSeleccionada?.id_reserva} - {reservaSeleccionada?.nombre_sala}</p>
            <p><strong>Fecha:</strong> {reservaSeleccionada?.fecha}</p>

            {loadingParticipantes ? (
              <p>Cargando participantes...</p>
            ) : participantesReserva.length > 0 ? (
              <table className="tabla-admin" style={{ marginTop: '15px' }}>
                <thead>
                  <tr>
                    <th>CI</th>
                    <th>Nombre</th>
                    <th>Asistencia</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {participantesReserva.map((participante) => (
                    <tr key={participante.ci}>
                      <td>{participante.ci}</td>
                      <td>
                        {participante.nombre && participante.apellido
                          ? `${participante.nombre} ${participante.apellido}`
                          : '-'}
                      </td>
                      <td>
                        {participante.asistencia === true || participante.asistencia === 1 ? (
                          <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Presente</span>
                        ) : participante.asistencia === false || participante.asistencia === 0 ? (
                          <span style={{ color: 'red', fontWeight: 'bold' }}>✗ Ausente</span>
                        ) : (
                          <span style={{ color: '#666' }}>Sin registrar</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleMarcarAsistencia(participante.ci, true)}
                          className="btn-action"
                          style={{ 
                            backgroundColor: '#28a745', 
                            color: 'white',
                            marginRight: '5px'
                          }}
                        >
                          ✓ Presente
                        </button>
                        <button
                          onClick={() => handleMarcarAsistencia(participante.ci, false)}
                          className="btn-action"
                          style={{ 
                            backgroundColor: '#dc3545', 
                            color: 'white'
                          }}
                        >
                          ✗ Ausente
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No se encontraron participantes para esta reserva.</p>
            )}

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button onClick={cerrarModalAsistencia} className="btn-secundario">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showModalCrear && (
        <div className="modal-overlay" onClick={() => setShowModalCrear(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3>Nueva Reserva</h3>
            <form onSubmit={handleCrearReserva}>
              <div className="form-group">
                <label>Fecha *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formCrear.fecha}
                  onChange={(e) => setFormCrear({ ...formCrear, fecha: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>Sala *</label>
                {loadingSalas ? (
                  <p>Cargando salas...</p>
                ) : (
                  <select
                    className="form-input"
                    value={`${formCrear.nombre_sala}|${formCrear.edificio}`}
                    onChange={(e) => {
                      const [nombre_sala, edificio] = e.target.value.split('|')
                      setFormCrear({ 
                        ...formCrear, 
                        nombre_sala, 
                        edificio, 
                        turnos_seleccionados: [] 
                      })
                      if (nombre_sala && edificio) {
                        cargarTurnos(nombre_sala, edificio)
                      }
                    }}
                    required
                  >
                    <option value="|">Seleccione una sala</option>
                    {salas.map((sala) => (
                      <option 
                        key={`${sala.nombre_sala}-${sala.edificio}`} 
                        value={`${sala.nombre_sala}|${sala.edificio}`}
                      >
                        {sala.nombre_sala} - {sala.edificio} (Cap: {sala.capacidad})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label>Turnos (puede seleccionar varios turnos) *</label>
                {loadingTurnos ? (
                  <p>Cargando turnos...</p>
                ) : formCrear.nombre_sala ? (
                  <div style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px', 
                    padding: '10px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    {turnos.length === 0 ? (
                      <p style={{ color: '#666', margin: 0 }}>No hay turnos disponibles</p>
                    ) : (
                      turnos.map(turno => (
                        <label 
                          key={turno.id_turno} 
                          style={{ 
                            display: 'block', 
                            padding: '8px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            marginBottom: '5px',
                            backgroundColor: formCrear.turnos_seleccionados.includes(turno.id_turno) ? '#e3f2fd' : 'white',
                            border: formCrear.turnos_seleccionados.includes(turno.id_turno) ? '2px solid #2196F3' : '1px solid #ddd'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formCrear.turnos_seleccionados.includes(turno.id_turno)}
                            onChange={(e) => {
                              const isChecked = e.target.checked
                              setFormCrear(prev => {
                                let nuevosSeleccionados = [...prev.turnos_seleccionados]

                                if (isChecked) {
                                  // Permitir seleccionar cualquier cantidad de turnos en UI;
                                  // las restricciones se validan al enviar según rol y tipo de sala
                                  nuevosSeleccionados.push(turno.id_turno)
                                } else {
                                  nuevosSeleccionados = nuevosSeleccionados.filter(id => id !== turno.id_turno)
                                }

                                return { ...prev, turnos_seleccionados: nuevosSeleccionados }
                              })
                            }}
                            style={{ marginRight: '10px' }}
                          />
                          <strong>{turno.hora_inicio} - {turno.hora_fin}</strong>
                        </label>
                      ))
                    )}
                  </div>
                ) : (
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>Primero seleccione una sala</p>
                )}
              </div>

              <div className="form-group">
                <label>Participantes (CI) *</label>
                {formCrear.participantes.map((ci, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Ingrese CI"
                      value={ci}
                      onChange={(e) => actualizarParticipante(index, e.target.value)}
                      required
                    />
                    {formCrear.participantes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarParticipante(index)}
                        className="btn-eliminar"
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={agregarParticipante}
                  className="btn-secundario"
                  style={{ marginTop: '0.5rem' }}
                >
                  + Agregar Participante
                </button>
              </div>

              {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn-cancelar" onClick={() => setShowModalCrear(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-confirmar" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
