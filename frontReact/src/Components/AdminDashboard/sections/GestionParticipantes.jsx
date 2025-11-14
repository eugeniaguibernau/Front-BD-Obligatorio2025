/**
 * Gestión de Participantes - ABM completo
 */

import { useState, useEffect } from 'react'
import {
  listarParticipantes,
  crearParticipante,
  actualizarParticipante,
  eliminarParticipante,
  buscarParticipantes,
} from '../../../services/participanteService'

export default function GestionParticipantes() {
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear') // 'crear' o 'editar'
  const [participanteSeleccionado, setParticipanteSeleccionado] = useState(null)
  const [formData, setFormData] = useState({
    ci: '',
    nombre: '',
    apellido: '',
    email: '',
    tipo: 'Estudiante', // Opciones: Estudiante, Docente, Postgrado, Otro
  })

  // Cargar participantes al montar el componente
  useEffect(() => {
    cargarParticipantes()
  }, [])

  const cargarParticipantes = async () => {
    setLoading(true)
    setError('')
    const resultado = await listarParticipantes()
    
    if (resultado.ok) {
      setParticipantes(resultado.data)
    } else {
      setError(resultado.error)
    }
    setLoading(false)
  }

  const handleBuscar = async (termino) => {
    setBusqueda(termino)
    
    if (!termino.trim()) {
      cargarParticipantes()
      return
    }

    setLoading(true)
    const resultado = await buscarParticipantes(termino)
    
    if (resultado.ok) {
      setParticipantes(resultado.data)
    } else {
      setError(resultado.error)
    }
    setLoading(false)
  }

  const abrirModalCrear = () => {
    setModoModal('crear')
    setFormData({ ci: '', nombre: '', apellido: '', email: '', tipo: 'Estudiante' })
    setParticipanteSeleccionado(null)
    setMostrarModal(true)
  }

  const abrirModalEditar = (participante) => {
    setModoModal('editar')
    setFormData({
      ci: participante.ci,
      nombre: participante.nombre,
      apellido: participante.apellido,
      email: participante.email,
      // soportar diferentes nombres de campo provenientes del backend
      tipo: participante.tipo || participante.tipo_participante || 'Estudiante',
    })
    setParticipanteSeleccionado(participante)
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    setMostrarModal(false)
    setFormData({ ci: '', nombre: '', apellido: '', email: '', tipo: 'Estudiante' })
    setParticipanteSeleccionado(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (modoModal === 'crear') {
      const resultado = await crearParticipante(formData)
      
      if (resultado.ok) {
        alert('Participante creado exitosamente')
        cerrarModal()
        cargarParticipantes()
      } else {
        setError(resultado.error)
      }
    } else {
      // Editar: solo enviar campos modificados
      const cambios = {}
      if (formData.nombre !== participanteSeleccionado.nombre) cambios.nombre = formData.nombre
      if (formData.apellido !== participanteSeleccionado.apellido) cambios.apellido = formData.apellido
      if (formData.email !== participanteSeleccionado.email) cambios.email = formData.email
  // Comparar tipo (soportar distintas claves desde el backend)
  const originalTipo = participanteSeleccionado.tipo || participanteSeleccionado.tipo_participante || 'Estudiante'
  if (formData.tipo !== originalTipo) cambios.tipo = formData.tipo

      if (Object.keys(cambios).length === 0) {
        alert('No hay cambios para guardar')
        return
      }

      const resultado = await actualizarParticipante(formData.ci, cambios)
      
      if (resultado.ok) {
        alert('Participante actualizado exitosamente')
        cerrarModal()
        cargarParticipantes()
      } else {
        setError(resultado.error)
      }
    }
  }

  const handleEliminar = async (ci, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) {
      return
    }

    const resultado = await eliminarParticipante(ci)
    
    if (resultado.ok) {
      alert('Participante eliminado exitosamente')
      cargarParticipantes()
    } else {
      alert(`Error: ${resultado.error}`)
    }
  }

  return (
    <div className="seccion">
      <h1>Gestión de Participantes</h1>
      <p>Administra todos los participantes del sistema</p>

      {error && !mostrarModal && (
        <div className="alert-banner alert-rojo">{error}</div>
      )}

      <div className="controles">
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o email..."
          className="search-input"
          value={busqueda}
          onChange={(e) => handleBuscar(e.target.value)}
        />
        <button className="btn-primary" onClick={abrirModalCrear}>
          + Crear Participante
        </button>
      </div>

      {loading ? (
        <p>Cargando participantes...</p>
      ) : (
        <table className="tabla-admin">
          <thead>
            <tr>
              <th>CI</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Email</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {participantes.length === 0 ? (
              <tr>
                <td colSpan="6" className="sin-datos">
                  {busqueda ? 'No se encontraron participantes' : 'No hay participantes'}
                </td>
              </tr>
            ) : (
              participantes.map((p) => (
                <tr key={p.ci}>
                  <td>{p.ci}</td>
                  <td>{p.nombre}</td>
                  <td>{p.apellido}</td>
                  <td>{p.email}</td>
                  <td>{p.tipo_participante || p.tipo || 'No especificado'}</td>
                  <td>
                    <button
                      className="btn-action btn-editar"
                      onClick={() => abrirModalEditar(p)}
                      title="Editar"
                    >
                      Editar
                    </button>
                    <button
                      className="btn-action btn-eliminar"
                      onClick={() => handleEliminar(p.ci, `${p.nombre} ${p.apellido}`)}
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
            <h2>{modoModal === 'crear' ? 'Crear Participante' : 'Editar Participante'}</h2>
            
            {error && (
              <div className="alert-banner alert-rojo">{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="ci">CI *</label>
                <input
                  type="number"
                  id="ci"
                  value={formData.ci}
                  onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                  disabled={modoModal === 'editar'}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="nombre">Nombre * (máx. 20 caracteres)</label>
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  maxLength={20}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="apellido">Apellido * (máx. 20 caracteres)</label>
                <input
                  type="text"
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  maxLength={20}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email * (máx. 30 caracteres)</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  maxLength={30}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tipo">Tipo de participante *</label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="form-input"
                  required
                >
                  <option value="Estudiante">Estudiante</option>
                  <option value="Docente">Docente</option>
                  <option value="Postgrado">Postgrado</option>
                  <option value="Otro">Otro</option>
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
