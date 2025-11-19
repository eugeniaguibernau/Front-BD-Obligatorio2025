import { useState, useEffect } from 'react';
import sancionService from '../../../services/sancionService';

export default function GestionSanciones() {
  const [sanciones, setSanciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editError, setEditError] = useState(null);
  
  // Filtros
  const [filtroCi, setFiltroCi] = useState('');
  const [soloActivas, setSoloActivas] = useState(false);
  
  // Modales
  const [showCrear, setShowCrear] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);
  const [showProcesar, setShowProcesar] = useState(false);
  const [sancionAEliminar, setSancionAEliminar] = useState(null);
  // Edición inline
  const [editingIndex, setEditingIndex] = useState(null);
  const [editInicio, setEditInicio] = useState('');
  const [editFin, setEditFin] = useState('');
  
  // Form crear
  const [formCrear, setFormCrear] = useState({
    ci_participante: '',
    fecha_inicio: '',
    fecha_fin: ''
  });
  
  // Días de sanción para procesar
  const [diasSancion, setDiasSancion] = useState(60);

  useEffect(() => {
    cargarSanciones();
  }, []);

  const cargarSanciones = async () => {
    setLoading(true);
    setError(null);
    const resultado = await sancionService.listarSanciones(
      filtroCi ? parseInt(filtroCi) : null,
      soloActivas
    );
    setLoading(false);

    if (resultado.unauthorized) {
      setError('No autorizado. Por favor, inicie sesión nuevamente.');
      return;
    }

    if (resultado.ok) {

      setSanciones(resultado.data);
    } else {
      setError(resultado.error || 'Error al cargar sanciones');
    }
  };

  const handleFiltrar = () => {
    cargarSanciones();
  };

  const handleLimpiarFiltros = () => {
    setFiltroCi('');
    setSoloActivas(false);
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Helper: formatea una fecha de entrada a YYYY-MM-DD usando UTC
    const formatearFechaParaEnviar = (fecha) => {
      if (!fecha) return null;
      const d = new Date(fecha + 'T00:00:00');
      if (isNaN(d.getTime())) return null;
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Validaciones básicas
    const ci = formCrear.ci_participante && String(formCrear.ci_participante).trim();
    if (!ci) {
      setError('CI de participante es requerido');
      setLoading(false);
      return;
    }

    const inicio = formatearFechaParaEnviar(formCrear.fecha_inicio);
    const fin = formatearFechaParaEnviar(formCrear.fecha_fin);
    if (!inicio || !fin) {
      setError('Fechas inválidas. Use el selector de fecha.');
      setLoading(false);
      return;
    }

    if (new Date(inicio + 'T00:00:00') > new Date(fin + 'T00:00:00')) {
      setError('La fecha de inicio no puede ser posterior a la fecha fin');
      setLoading(false);
      return;
    }

    const payloadToSend = {
      ci_participante: parseInt(ci),
      fecha_inicio: inicio,
      fecha_fin: fin
    };

    const resultado = await sancionService.crearSancion(payloadToSend);
    setLoading(false);

    if (resultado.unauthorized) {
      setError('No autorizado. Por favor, inicie sesión nuevamente.');
      return;
    }

    if (resultado.ok) {
      setSuccess('Sanción creada exitosamente');
      setShowCrear(false);
      setFormCrear({ ci_participante: '', fecha_inicio: '', fecha_fin: '' });
      cargarSanciones();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(resultado.error || 'Error al crear sanción');
    }
  };

  const handleEliminar = async () => {
    if (!sancionAEliminar) return;

    // Convertir fechas al formato YYYY-MM-DD que espera el backend
    const formatearFecha = (fecha) => {
      if (!fecha) return null;
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return null;
      // Usar UTC para evitar problemas de zona horaria
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const fechaInicioFormateada = formatearFecha(sancionAEliminar.fecha_inicio);
    const fechaFinFormateada = formatearFecha(sancionAEliminar.fecha_fin);

    setLoading(true);
    setError(null);
    setSuccess(null);

    const resultado = await sancionService.eliminarSancion(
      sancionAEliminar.ci_participante,
      fechaInicioFormateada,
      fechaFinFormateada
    );

    setLoading(false);

    if (resultado.unauthorized) {
      setError('No autorizado. Por favor, inicie sesión nuevamente.');
      return;
    }

    if (resultado.ok) {
      setSuccess('Sanción eliminada exitosamente');
      setShowEliminar(false);
      setSancionAEliminar(null);
      cargarSanciones();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(resultado.error || 'Error al eliminar sanción');
    }
  };

  const handleProcesarVencidas = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const resultado = await sancionService.procesarReservasVencidas(diasSancion);
    setLoading(false);

    if (resultado.unauthorized) {
      setError('No autorizado. Por favor, inicie sesión nuevamente.');
      return;
    }

    if (resultado.ok) {
      const resumen = resultado.data;
      const mensaje = `✅ Proceso completado:\n• ${resumen.reservas_procesadas || 0} reservas procesadas\n• ${resumen.sanciones_aplicadas || 0} sanciones aplicadas\n• ${resumen.sanciones_retiradas || 0} sanciones retiradas`;
      setSuccess(mensaje);
      setShowProcesar(false);
      cargarSanciones();
      setTimeout(() => setSuccess(null), 5000);
    } else {
      setError(resultado.error || 'Error al procesar reservas vencidas');
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return '-';
      // Formato DD/MM/YYYY usando UTC
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {

      return '-';
    }
  };

  // Parse a variety of date string formats into YYYY-MM-DD (returns null on failure)
  const parseToYMD = (input) => {
    if (!input && input !== 0) return null
    let s = String(input).trim()
    // already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    // common DD/MM/YYYY (UI shows this format)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const [d, m, y] = s.split('/')
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    // common DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
      const [d, m, y] = s.split('-')
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    // try Date parse as fallback
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      const y = d.getUTCFullYear()
      const m = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    return null
  }

  // ---------- Edición de sanción (inline) ----------
  const startEdit = (index, sancion) => {
    setEditingIndex(index);
    try {
      // normalize to YYYY-MM-DD for input[type=date]
      const toYMD = (f) => {
        if (!f) return '';
        const d = new Date(f);
        if (isNaN(d.getTime())) return '';
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };
      setEditInicio(toYMD(sancion.fecha_inicio));
      setEditFin(toYMD(sancion.fecha_fin));
      setEditError(null);
    } catch (e) {
      setEditInicio('');
      setEditFin('');
    }
  }

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditInicio('');
    setEditFin('');
    setEditError(null);
  }

  const handleSaveEdit = async (sancion, index) => {
    setError(null);
    setSuccess(null);
    // validations: inicio >= today, fin > today, fin > inicio
    const parseYMD = (s) => s ? new Date(s + 'T00:00:00') : null;
    const inicioD = parseYMD(editInicio);
    const finD = parseYMD(editFin);
    const today = new Date();
    const todayMid = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    if (!inicioD || !finD || isNaN(inicioD.getTime()) || isNaN(finD.getTime())) {
      setEditError('Fechas inválidas. Use el selector de fecha.');
      setTimeout(() => setEditError(null), 5000);
      return;
    }

    if (inicioD.getTime() < todayMid.getTime()) {
      setEditError('La fecha de inicio debe ser hoy o posterior');
      setTimeout(() => setEditError(null), 5000);
      return;
    }

    if (finD.getTime() <= todayMid.getTime()) {
      setEditError('La fecha fin debe ser posterior a hoy');
      setTimeout(() => setEditError(null), 5000);
      return;
    }

    if (finD.getTime() <= inicioD.getTime()) {
      setEditError('La fecha fin debe ser posterior a la fecha de inicio');
      setTimeout(() => setEditError(null), 5000);
      return;
    }

    // format dates for backend (YYYY-MM-DD UTC)
    const formatForSend = (fecha) => {
      const d = new Date(fecha + 'T00:00:00');
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const inicioStr = formatForSend(editInicio);
    const finStr = formatForSend(editFin);

    try {
      setLoading(true);
      // Normalize original sancion dates (they may come in DD/MM/YYYY or similar)
      const origenInicio = parseToYMD(sancion.fecha_inicio) || parseToYMD(sancion.fechaInicio) || parseToYMD(sancion.fecha) || null;
      const origenFin = parseToYMD(sancion.fecha_fin) || parseToYMD(sancion.fechaFin) || parseToYMD(sancion.fecha) || null;

      if (!origenInicio || !origenFin) {
        setLoading(false);
        setEditError('No se pudieron interpretar las fechas originales de la sanción. Actualice la página e intente de nuevo.');
        setTimeout(() => setEditError(null), 5000);
        return;
      }

      // Preferir actualizar por identificador si la sanción lo expone
      const posibleId = sancion.id || sancion.id_sancion || sancion._id || sancion.idSancion || null;
      let resultado;

      if (posibleId) {

        resultado = await sancionService.actualizarSancionPorId(posibleId, inicioStr, finStr);
      } else {
        console.log('🔁 Actualizando sanción por claves (fallback delete+create):', sancion.ci_participante, origenInicio, origenFin, '->', inicioStr, finStr);
        resultado = await sancionService.actualizarSancion(
          sancion.ci_participante,
          origenInicio,
          origenFin,
          inicioStr,
          finStr
        );
      }

      setLoading(false);
      if (resultado.unauthorized) {
        setError('No autorizado. Por favor, inicie sesión nuevamente.');
        return;
      }
      if (!resultado.ok) {
        // Mostrar error inline cuando la edición falla
        setEditError(resultado.error || 'Error actualizando sanción');
        setTimeout(() => setEditError(null), 5000);
        return;
      }
      setSuccess('Sanción actualizada correctamente');
      cancelEdit();
      setEditError(null);
      cargarSanciones();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setLoading(false);
      setError(e.message || 'Error al actualizar sanción');
    }
  }

  

  return (
    <div className="gestion-sanciones">
      <div className="header-seccion">
        <div>
          <h2>🚫 Gestión de Sanciones</h2>
          <p>Administración de sanciones aplicadas a participantes</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-nuevo" onClick={() => setShowCrear(true)}>
            + Nueva Sanción
          </button>
          <button className="btn-procesar" onClick={() => setShowProcesar(true)}>
            ⚡ Procesar Sanciones Automáticas
          </button>
        </div>
      </div>

      {error && (
        <div
          className="mensaje-error"
          style={{ color: editingIndex !== null ? '#000' : undefined }}
        >
          {error}
        </div>
      )}
      {success && <div className="mensaje-exito" style={{ whiteSpace: 'pre-line' }}>{success}</div>}

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtro-group">
          <label>CI Participante:</label>
          <input
            type="number"
            value={filtroCi}
            onChange={(e) => setFiltroCi(e.target.value)}
            placeholder="Filtrar por CI"
          />
        </div>
        <div className="filtro-group" style={{ alignItems: 'center' }}>
          <label>
            <input
              type="checkbox"
              checked={soloActivas}
              onChange={(e) => setSoloActivas(e.target.checked)}
            />
            {' '}Solo activas
          </label>
        </div>
        <button className="btn-filtrar" onClick={handleFiltrar}>
          Filtrar
        </button>
        <button className="btn-limpiar" onClick={handleLimpiarFiltros}>
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <div className="tabla-container">
          <table className="tabla-admin">
            <thead>
              <tr>
                  <th>CI Participante</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
              {sanciones.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                    No hay sanciones registradas
                  </td>
                </tr>
              ) : (
                sanciones.map((sancion, index) => (
                  // Ensure the key is unique even if multiple sanciones share the same CI and date strings.
                  // Prefer a stable id when backend provides one; otherwise combine ci + normalized fechas + index.
                  <tr key={`${sancion.ci_participante}_${parseToYMD(sancion.fecha_inicio) || index}_${parseToYMD(sancion.fecha_fin) || ''}_${index}`}>
                    <td>{sancion.ci_participante}</td>
                    {editingIndex === index ? (
                      <>
                        <td>
                          <input type="date" value={editInicio} onChange={(e) => setEditInicio(e.target.value)} />
                        </td>
                        <td>
                          <input type="date" value={editFin} onChange={(e) => setEditFin(e.target.value)} />
                        </td>
                        <td>
                          <button className="btn-confirmar" onClick={() => handleSaveEdit(sancion, index)} disabled={loading}>Guardar</button>
                          <button className="btn-secundario" onClick={cancelEdit} disabled={loading} style={{ marginLeft: '8px' }}>Cancelar</button>
                          {editError && (
                            <div className="mensaje-error" style={{ marginTop: '8px' }}>{editError}</div>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{formatearFecha(sancion.fecha_inicio)}</td>
                        <td>{formatearFecha(sancion.fecha_fin)}</td>
                        <td>
                          <button className="btn-editar" onClick={() => startEdit(index, sancion)} style={{ marginRight: '8px' }}>Editar</button>
                          <button
                            className="btn-eliminar"
                            onClick={() => {
                              setSancionAEliminar(sancion);
                              setShowEliminar(true);
                            }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear */}
      {showCrear && (
        <div className="modal-overlay" onClick={() => setShowCrear(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Nueva Sanción</h3>
            <form onSubmit={handleCrear}>
              <div className="form-group">
                <label>CI Participante *</label>
                <input
                  type="number"
                  required
                  value={formCrear.ci_participante}
                  onChange={(e) => setFormCrear({ ...formCrear, ci_participante: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Fecha Inicio *</label>
                <input
                  type="date"
                  required
                  value={formCrear.fecha_inicio}
                  onChange={(e) => setFormCrear({ ...formCrear, fecha_inicio: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Fecha Fin *</label>
                <input
                  type="date"
                  required
                  value={formCrear.fecha_fin}
                  onChange={(e) => setFormCrear({ ...formCrear, fecha_fin: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancelar" onClick={() => setShowCrear(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-confirmar" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showEliminar && sancionAEliminar && (
        <div className="modal-overlay" onClick={() => setShowEliminar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmar Eliminación</h3>
            <p>¿Está seguro que desea eliminar esta sanción?</p>
            <div className="info-sancion">
              <p><strong>CI:</strong> {sancionAEliminar.ci_participante}</p>
              <p><strong>Periodo:</strong> {formatearFecha(sancionAEliminar.fecha_inicio)} - {formatearFecha(sancionAEliminar.fecha_fin)}</p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setShowEliminar(false)}>
                Cancelar
              </button>
              <button className="btn-eliminar" onClick={handleEliminar} disabled={loading}>
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Procesar Vencidas */}
      {showProcesar && (
        <div className="modal-overlay" onClick={() => setShowProcesar(false)}>
          <div className="modal-content modal-procesar" onClick={(e) => e.stopPropagation()}>
            <h3>⚡ Procesar Sanciones Automáticas</h3>
            <div className="info-procesar">
              <p><strong>Esta acción procesará automáticamente:</strong></p>
              <ul>
                <li>✅ <strong>Retirará</strong> sanciones que ya hayan vencido</li>
                <li>🚫 <strong>Aplicará</strong> nuevas sanciones a reservas donde nadie asistió</li>
                <li>📋 Las reservas procesadas son aquellas cuya fecha de turno ya pasó</li>
              </ul>
            </div>
            <div className="form-group">
              <label>Días de sanción a aplicar:</label>
              <input
                type="number"
                min="1"
                value={diasSancion}
                onChange={(e) => setDiasSancion(parseInt(e.target.value) || 60)}
              />
              <small>Las nuevas sanciones durarán esta cantidad de días</small>
            </div>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setShowProcesar(false)}>
                Cancelar
              </button>
              <button className="btn-confirmar btn-procesar" onClick={handleProcesarVencidas} disabled={loading}>
                {loading ? 'Procesando...' : '⚡ Procesar Ahora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
