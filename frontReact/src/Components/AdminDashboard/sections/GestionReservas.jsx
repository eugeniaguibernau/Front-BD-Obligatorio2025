/**
 * Gestión de Reservas - ABM Completo
 */
import { useEffect, useState } from 'react'
import reservaService from '../../../services/reservaService'
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
    turnos_seleccionados: [], // Array de IDs de turnos (máximo 2)
    participantes: [''] // Array de CIs
  })
  const [loadingSalas, setLoadingSalas] = useState(false)
  const [loadingTurnos, setLoadingTurnos] = useState(false)

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
    if (!window.confirm(`¿Eliminar la reserva #${reserva.id_reserva}?`)) return
    
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
    setNuevoEstado(reserva.estado || 'activa')
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

    setMessage('Estado actualizado correctamente')
    if (res.data.sanciones) {
      setMessage(`Estado actualizado. Sanciones aplicadas: ${res.data.sanciones.aplicadas}`)
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
    
    // Asegurar formato de fecha YYYY-MM-DD
    let fechaFormateada = formCrear.fecha
    if (formCrear.fecha.includes('/')) {
      // Si viene en formato DD/MM/YYYY, convertir a YYYY-MM-DD
      const [dia, mes, anio] = formCrear.fecha.split('/')
      fechaFormateada = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
    }
    
    // Construir array de turnos con objetos completos {id_turno, hora_inicio, hora_fin}
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
      <p>Administra todas las reservas del sistema</p>

      {/* Controles de búsqueda y filtros */}
      <div className="controles">
        <button onClick={abrirModalCrear} className="btn-primary">
          + Nueva Reserva
        </button>
        
        <input
          type="text"
          placeholder="🔍 Buscar por sala, edificio, fecha..."
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

      {/* Mensajes */}
      {loading && <p>Cargando reservas...</p>}
      {error && <div className="alert-banner alert-rojo">{error}</div>}
      {message && (
        <div className={`alert-banner ${message.toLowerCase().includes('error') ? 'alert-rojo' : 'alert-verde'}`}>
          {message}
        </div>
      )}

      {/* Tabla de reservas */}
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
                  
                  {/* Botón de asistencia solo si el turno ya pasó y está activa/finalizada */}
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

      {/* Modal: Actualizar Estado */}
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
                  {ESTADOS.map(estado => (
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

      {/* Modal: Registrar Asistencia */}
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

      {/* Modal: Crear Nueva Reserva */}
      {showModalCrear && (
        <div className="modal-overlay" onClick={() => setShowModalCrear(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3>Nueva Reserva</h3>
            <form onSubmit={handleCrearReserva}>
              {/* Fecha */}
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

              {/* Seleccionar Sala */}
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

              {/* Seleccionar Turnos */}
              <div className="form-group">
                <label>Turnos (seleccione 1 o 2 consecutivos) *</label>
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
                                  // Solo permitir máximo 2 turnos
                                  if (nuevosSeleccionados.length >= 2) {
                                    alert('Solo puede seleccionar máximo 2 turnos consecutivos (máximo 2 horas)')
                                    return prev
                                  }
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

              {/* Participantes (CIs) */}
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
