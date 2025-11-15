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
  listarProgramas,
} from '../../../services/participanteService'

export default function GestionParticipantes() {
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [programas, setProgramas] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear') // 'crear' o 'editar'
  const [participanteSeleccionado, setParticipanteSeleccionado] = useState(null)
  const [formData, setFormData] = useState({
    ci: '',
    nombre: '',
    apellido: '',
    email: '',
    // Use backend-expected field names
    tipo_participante: 'estudiante', // opciones: estudiante, docente, postgrado, otro (lowercase)
    programa_academico: '',
  })

  // Cargar participantes al montar el componente
  useEffect(() => {
    cargarParticipantes()
    cargarProgramas()
  }, [])

  // Helpers to map between UI values and backend-expected values
  const uiTipoFromBackend = (backendTipo) => {
    if (!backendTipo) return ''
    const b = backendTipo.toString().toLowerCase()
    if (b === 'alumno') return 'estudiante'
    if (b === 'docente') return 'docente'
    // fallback: keep as-is
    return b
  }

  const backendTipoFromUi = (uiTipo) => {
    if (!uiTipo) return ''
    const u = uiTipo.toString().toLowerCase()
    // Map postgrado and estudiante to backend 'alumno'
    if (u === 'estudiante' || u === 'postgrado' || u === 'alumno') return 'alumno'
    if (u === 'docente') return 'docente'
    // fallback: return original
    return u
  }

  const cargarProgramas = async () => {
    try {
      const resultado = await listarProgramas()
      if (resultado.ok) {
        setProgramas(resultado.data || [])
      } else {
        console.warn('No se pudieron cargar programas:', resultado.error)
      }
    } catch (err) {
      console.warn('Error al cargar programas:', err)
    }
  }

  const resolveProgramaDisplay = (p) => {
    // Si el participante trae un objeto programa con nombre
    if (!p) return '-'
    if (p.programa && (p.programa.nombre || p.programa.name)) return p.programa.nombre || p.programa.name
    // Buscar en la lista cargada de programas por id/codigo
    const clave = p.programa || p.programa_academico || p.programa_id || null
    if (clave && programas && programas.length > 0) {
      const found = programas.find(pr => String(pr.id) === String(clave) || String(pr._id) === String(clave) || String(pr.codigo) === String(clave) || String(pr.nombre) === String(clave) || String(pr.name) === String(clave))
      if (found) return found.nombre || found.name || String(clave)
    }
    // Fallback a mostrar la clave o 'No especificado'
    return p.programa || p.programa_academico || p.programa_id || 'No especificado'
  }

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
    setFormData({ ci: '', nombre: '', apellido: '', email: '', tipo_participante: 'estudiante', programa_academico: '' })
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
      // normalize incoming backend tipo into the UI-friendly value
      tipo_participante: uiTipoFromBackend(participante.tipo_participante || participante.tipo || 'estudiante'),
      programa_academico: participante.programa_academico || participante.programa || participante.programa_academico || participante.programa_id || '',
    })
    setParticipanteSeleccionado(participante)
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    setMostrarModal(false)
    setFormData({ ci: '', nombre: '', apellido: '', email: '', tipo_participante: 'estudiante', programa_academico: '' })
    setParticipanteSeleccionado(null)
    setError('')
  }

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (modoModal === 'crear') {

    // ⭐⭐⭐ AQUI — JUSTO ANTES DE LLAMAR AL BACKEND ⭐⭐⭐
    console.log("ENVIANDO PARTICIPANTE (crear)", formData);

    // Normalize tipo_participante to backend expected value (e.g. 'alumno'|'docente')
    const payload = {
      ...formData,
      tipo_participante: backendTipoFromUi(formData.tipo_participante),
      programa_academico: formData.programa_academico,
    }

    const resultado = await crearParticipante(payload);
    
    if (resultado.ok) {
      alert('Participante creado exitosamente');
      cerrarModal();
      cargarParticipantes();
    } else {
      setError(resultado.error);
    }

  } else {
    // Editar: solo enviar campos modificados
    const cambios = {};

    if (formData.nombre !== participanteSeleccionado.nombre) cambios.nombre = formData.nombre;
    if (formData.apellido !== participanteSeleccionado.apellido) cambios.apellido = formData.apellido;
    if (formData.email !== participanteSeleccionado.email) cambios.email = formData.email;

    // Compare backend-normalized tipos: get original backend value, and the new backend value
    const originalBackendTipo = (participanteSeleccionado.tipo_participante || participanteSeleccionado.tipo || '').toString().toLowerCase()
    const newBackendTipo = backendTipoFromUi(formData.tipo_participante)
    if (newBackendTipo && newBackendTipo !== originalBackendTipo) cambios.tipo_participante = newBackendTipo

    const originalPrograma = participanteSeleccionado.programa_academico || participanteSeleccionado.programa || participanteSeleccionado.programa_id || '';
    if (formData.programa_academico !== originalPrograma)
      cambios.programa_academico = formData.programa_academico;

    if (Object.keys(cambios).length === 0) {
      alert('No hay cambios para guardar');
      return;
    }

    console.log("ENVIANDO PARTICIPANTE (editar)", cambios);

    const resultado = await actualizarParticipante(formData.ci, cambios);
    
    if (resultado.ok) {
      alert('Participante actualizado exitosamente');
      cerrarModal();
      cargarParticipantes();
    } else {
      setError(resultado.error);
    }
  }
};


  const handleEliminar = async (ci, nombre) => {
    // kept for compatibility if called programmatically
    const ok = window.confirm ? window.confirm(`¿Estás seguro de eliminar a ${nombre}?`) : true
    if (!ok) return

    const resultado = await eliminarParticipante(ci)

    if (resultado.ok) {
      alert('Participante eliminado exitosamente')
      cargarParticipantes()
    } else {
      alert(`Error: ${resultado.error}`)
    }
  }

  // --- Custom confirm dialog state and helpers (used for nicer UI confirmations) ---
  const [confirmState, setConfirmState] = useState({ visible: false, title: '', message: '', onConfirm: null })

  const showConfirm = ({ title, message, onConfirm }) => {
    setConfirmState({ visible: true, title: title || 'Confirmar', message: message || '', onConfirm })
  }

  const hideConfirm = () => setConfirmState({ visible: false, title: '', message: '', onConfirm: null })

  const deleteConfirmed = async (ci, nombre) => {
    hideConfirm()
    const resultado = await eliminarParticipante(ci)
    if (resultado.ok) {
      // usar banner en UI sería mejor, por ahora alert va bien
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
          placeholder="Buscar por CI, nombre, apellido, email o tipo..."
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
              <th>Programa</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {participantes.length === 0 ? (
              <tr>
                <td colSpan="7" className="sin-datos">
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
                  <td>{resolveProgramaDisplay(p)}</td>
                  <td>
                    <button
                      className="btn-action btn-editar"
                        onClick={() => showConfirm({
                          title: 'Editar participante',
                          message: `¿Deseás editar a ${p.nombre} ${p.apellido}?`,
                          onConfirm: () => abrirModalEditar(p)
                        })}
                      title="Editar"
                    >
                      Editar
                    </button>
                    <button
                      className="btn-action btn-eliminar"
                        onClick={() => showConfirm({
                          title: 'Eliminar participante',
                          message: `¿Estás seguro de eliminar a ${p.nombre} ${p.apellido}?`,
                          onConfirm: () => deleteConfirmed(p.ci, `${p.nombre} ${p.apellido}`)
                        })}
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
                <label htmlFor="tipo_participante">Tipo de participante *</label>
                <select
                  id="tipo_participante"
                  value={formData.tipo_participante}
                  onChange={(e) => setFormData({ ...formData, tipo_participante: e.target.value })}
                  className="form-input"
                  required
                >
                  <option value="">No especificado</option>
                  <option value="estudiante">Estudiante</option>
                  <option value="docente">Docente</option>
                  <option value="postgrado">Postgrado</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="programa">Programa académico</label>
                {programas && programas.length > 0 ? (
                  <select
                    id="programa"
                    value={formData.programa_academico}
                    onChange={(e) => setFormData({ ...formData, programa_academico: e.target.value })}
                    className="form-input"
                  >
                    <option value="">No especificado</option>
                        {programas.map((pr, idx) => {
                          // Compose a stable unique key to avoid duplicates even when
                          // backend returns multiple entries with the same id_facultad
                          // but different encodings of the name.
                          const idFac = pr.id_facultad ?? pr.id ?? pr._id ?? idx
                          const nombre = pr.nombre_programa ?? pr.label ?? pr.value ?? String(idFac)
                          const key = `${idFac}-${nombre}-${idx}`
                          return (
                            <option key={key} value={nombre}>
                              {nombre}
                            </option>
                          )
                        })}
                  </select>
                ) : (
                  // Fallback: si no hay lista de programas disponible por el backend,
                  // permitir ingresar libremente el nombre/clase de programa.
                  <input
                    type="text"
                    id="programa"
                    value={formData.programa_academico}
                    onChange={(e) => setFormData({ ...formData, programa_academico: e.target.value })}
                    className="form-input"
                    placeholder="Ingresar programa (backend no expone lista)"
                  />
                )}
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

      {/* Custom confirm dialog (styled like modal) */}
      {confirmState.visible && (
        <div className="modal-overlay" onClick={hideConfirm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmState.title}</h3>
            <p>{confirmState.message}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={hideConfirm}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={() => {
                  // execute the provided onConfirm callback and close
                  try {
                    confirmState.onConfirm && confirmState.onConfirm()
                  } finally {
                    hideConfirm()
                  }
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
