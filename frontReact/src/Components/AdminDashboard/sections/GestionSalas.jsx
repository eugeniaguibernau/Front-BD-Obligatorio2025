/**
 * Gestión de Salas - ABM completo
 */

import { useState, useEffect } from 'react'
import {
  listarSalas,
  crearSala,
  actualizarSala,
  eliminarSala,
  buscarSalas,
  TIPOS_SALA,
} from '../../../services/salaService'

export default function GestionSalas() {
  const [salas, setSalas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroEdificio, setFiltroEdificio] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear') // 'crear' o 'editar'
  const [salaSeleccionada, setSalaSeleccionada] = useState(null)
  const [formData, setFormData] = useState({
    nombre_sala: '',
    edificio: '',
    capacidad: '',
    tipo_sala: 'libre',
  })

  // Cargar salas al montar el componente
  useEffect(() => {
    cargarSalas()
  }, [])

  const cargarSalas = async () => {
    setLoading(true)
    setError('')
    const resultado = await listarSalas()
    
    if (resultado.ok) {
      setSalas(resultado.data)
    } else {
      setError(resultado.error)
    }
    setLoading(false)
  }

  const handleBuscar = async (termino) => {
    setBusqueda(termino)
    
    if (!termino.trim()) {
      cargarSalas()
      return
    }

    setLoading(true)
    const resultado = await buscarSalas(termino)
    
    if (resultado.ok) {
      setSalas(resultado.data)
    } else {
      setError(resultado.error)
    }
    setLoading(false)
  }

  const handleFiltrarEdificio = async (edificio) => {
    setFiltroEdificio(edificio)
    setLoading(true)
    
    const resultado = await listarSalas(edificio || null)
    
    if (resultado.ok) {
      setSalas(resultado.data)
    } else {
      setError(resultado.error)
    }
    setLoading(false)
  }

  const abrirModalCrear = () => {
    setModoModal('crear')
    setFormData({ nombre_sala: '', edificio: '', capacidad: '', tipo_sala: 'libre' })
    setSalaSeleccionada(null)
    setMostrarModal(true)
  }

  const abrirModalEditar = (sala) => {
    setModoModal('editar')
    setFormData({
      nombre_sala: sala.nombre_sala,
      edificio: sala.edificio,
      capacidad: sala.capacidad,
      tipo_sala: sala.tipo_sala,
    })
    setSalaSeleccionada(sala)
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    setMostrarModal(false)
    setFormData({ nombre_sala: '', edificio: '', capacidad: '', tipo_sala: 'libre' })
    setSalaSeleccionada(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (modoModal === 'crear') {
      const resultado = await crearSala({
        ...formData,
        capacidad: parseInt(formData.capacidad),
      })
      
      if (resultado.ok) {
        alert('Sala creada exitosamente')
        cerrarModal()
        cargarSalas()
      } else {
        setError(resultado.error)
      }
    } else {
      // Editar: solo enviar campos modificados
      const cambios = {}
      if (formData.capacidad !== salaSeleccionada.capacidad) {
        cambios.capacidad = parseInt(formData.capacidad)
      }
      if (formData.tipo_sala !== salaSeleccionada.tipo_sala) {
        cambios.tipo_sala = formData.tipo_sala
      }

      if (Object.keys(cambios).length === 0) {
        alert('No hay cambios para guardar')
        return
      }

      const resultado = await actualizarSala(
        formData.nombre_sala,
        formData.edificio,
        cambios
      )
      
      if (resultado.ok) {
        alert('Sala actualizada exitosamente')
        cerrarModal()
        cargarSalas()
      } else {
        setError(resultado.error)
      }
    }
  }

  const handleEliminar = async (nombre_sala, edificio) => {
    if (!window.confirm(`¿Confirmás la eliminación de la sala "${nombre_sala}" del edificio "${edificio}"?`)) {
      return
    }

    const resultado = await eliminarSala(nombre_sala, edificio)
    
    if (resultado.ok) {
      alert('Sala eliminada exitosamente')
      cargarSalas()
    } else {
      alert(`Error: ${resultado.error}`)
    }
  }

  // Obtener edificios únicos para el filtro
  const edificiosUnicos = [...new Set(salas.map(s => s.edificio))].sort()

  return (
    <div className="seccion">
      <h1>Gestión de salas</h1>
      <p>Administrá la información de las salas disponibles en el sistema.</p>

      {error && !mostrarModal && (
        <div className="alert-banner alert-rojo">{error}</div>
      )}

      <div className="controles">
        <input
          type="text"
          placeholder="Buscar por nombre de sala o edificio"
          className="search-input"
          value={busqueda}
          onChange={(e) => handleBuscar(e.target.value)}
        />
        <select
          className="filter-select"
          value={filtroEdificio}
          onChange={(e) => handleFiltrarEdificio(e.target.value)}
        >
          <option value="">Todos los edificios</option>
          {edificiosUnicos.map(ed => (
            <option key={ed} value={ed}>{ed}</option>
          ))}
        </select>
        <button className="btn-primary" onClick={abrirModalCrear}>
          Nueva sala
        </button>
      </div>

      {loading ? (
        <p>Cargando salas...</p>
      ) : (
        <table className="tabla-admin">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Edificio</th>
              <th>Capacidad</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {salas.length === 0 ? (
              <tr>
                <td colSpan="5" className="sin-datos">
                    {busqueda || filtroEdificio
                    ? 'No se encontraron salas con los filtros aplicados.'
                    : 'No hay salas registradas en el sistema.'}
                </td>
              </tr>
            ) : (
              salas.map((s) => (
                <tr key={`${s.edificio}-${s.nombre_sala}`}>
                  <td>{s.nombre_sala}</td>
                  <td>{s.edificio}</td>
                  <td>{s.capacidad}</td>
                  <td>
                    <span className={`badge badge-${s.tipo_sala}`}>
                      {s.tipo_sala}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-action btn-editar"
                      onClick={() => abrirModalEditar(s)}
                      title="Editar"
                    >
                      Editar
                    </button>
                    <button
                      className="btn-action btn-eliminar"
                      onClick={() => handleEliminar(s.nombre_sala, s.edificio)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Modal para Crear/Editar */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modoModal === 'crear' ? 'Crear Sala' : 'Editar Sala'}</h2>
            
            {error && (
              <div className="alert-banner alert-rojo">{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nombre_sala">Nombre de la Sala *</label>
                <input
                  type="text"
                  id="nombre_sala"
                  value={formData.nombre_sala}
                  onChange={(e) => setFormData({ ...formData, nombre_sala: e.target.value })}
                  disabled={modoModal === 'editar'}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edificio">Edificio *</label>
                <input
                  type="text"
                  id="edificio"
                  value={formData.edificio}
                  onChange={(e) => setFormData({ ...formData, edificio: e.target.value })}
                  disabled={modoModal === 'editar'}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="capacidad">Capacidad *</label>
                <input
                  type="number"
                  id="capacidad"
                  value={formData.capacidad}
                  onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                  min="1"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tipo_sala">Tipo de Sala *</label>
                <select
                  id="tipo_sala"
                  value={formData.tipo_sala}
                  onChange={(e) => setFormData({ ...formData, tipo_sala: e.target.value })}
                  required
                  className="form-input"
                >
                  {TIPOS_SALA.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {modoModal === 'crear' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
