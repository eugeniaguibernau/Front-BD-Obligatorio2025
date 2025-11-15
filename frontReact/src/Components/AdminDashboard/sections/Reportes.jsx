/**
 * Reportes & Métricas - 11 reportes completos
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import reporteService from '../../../services/reporteService'
import { listarSalas } from '../../../services/salaService'
import { listarSalas as listarSalasReserva } from '../../../services/reservaService'
import { getToken } from '../../../services/authService'

export default function Reportes() {
  const { logout } = useAuth()
  const [reporteActivo, setReporteActivo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [datos, setDatos] = useState(null)
  
  // Filtros generales
  const [fechaInicio, setFechaInicio] = useState('2025-01-01')
  const [fechaFin, setFechaFin] = useState('2025-12-31')
  
  // Filtros específicos
  const [limit, setLimit] = useState(10)
  const [edificio, setEdificio] = useState('')
  const [edificios, setEdificios] = useState([])
  const [facultades, setFacultades] = useState([])
  const [facultad, setFacultad] = useState('')
  const [rol, setRol] = useState('')
  const [minSanciones, setMinSanciones] = useState(2)
  const [soloActivas, setSoloActivas] = useState(true)

  const reportes = [
    { 
      id: 1, 
      nombre: 'Salas más reservadas', 
      icono: '🏛️',
      descripcion: 'Top de salas con más reservas',
      filtros: ['fechas', 'limit']
    },
    { 
      id: 2, 
      nombre: 'Turnos más demandados', 
      icono: '⏰',
      descripcion: 'Horarios más solicitados',
      filtros: ['fechas', 'limit']
    },
    { 
      id: 3, 
      nombre: 'Promedio participantes por sala', 
      icono: '📊',
      descripcion: 'Cantidad promedio de asistentes',
      filtros: ['fechas', 'edificio']
    },
    { 
      id: 4, 
      nombre: 'Reservas por programa', 
      icono: '🎓',
      descripcion: 'Distribución por programa académico',
      filtros: ['fechas', 'facultad']
    },
    { 
      id: 5, 
      nombre: 'Ocupación por edificio', 
      icono: '📍',
      descripcion: 'Uso de salas por edificio',
      filtros: ['fechas']
    },
    { 
      id: 6, 
      nombre: 'Reservas/asistencia por rol', 
      icono: '👤',
      descripcion: 'Métricas por tipo de usuario',
      filtros: ['fechas', 'rol']
    },
    { 
      id: 7, 
      nombre: 'Sanciones por rol', 
      icono: '⚠️',
      descripcion: 'Distribución de sanciones',
      filtros: ['fechas', 'rol']
    },
    { 
      id: 8, 
      nombre: 'Utilizadas vs canceladas', 
      icono: '📈',
      descripcion: 'Comparativa de estados',
      filtros: ['fechas']
    },
    { 
      id: 9, 
      nombre: 'Horas pico por sala', 
      icono: '📅',
      descripcion: 'Horarios de mayor demanda',
      filtros: ['fechas', 'edificio', 'limit']
    },
    { 
      id: 10, 
      nombre: 'Ocupación por tipo', 
      icono: '🔍',
      descripcion: 'Uso por tipo de sala',
      filtros: ['fechas']
    },
    { 
      id: 11, 
      nombre: 'Reincidentes en sanciones', 
      icono: '🚨',
      descripcion: 'Usuarios con múltiples sanciones',
      filtros: ['sanciones']
    },
  ]

  const resetearFiltros = () => {
    setFechaInicio('2025-01-01')
    setFechaFin('2025-12-31')
    setLimit(10)
    setEdificio('')
    setFacultad('')
    setRol('')
    setMinSanciones(2)
    setSoloActivas(true)
  }

  const generarReporte = async (reporteId) => {
    setLoading(true)
    setError(null)
    setDatos(null)
    setReporteActivo(reporteId)

    let resultado

    try {
      switch (reporteId) {
        case 1:
          resultado = await reporteService.getSalasMasReservadas(fechaInicio, fechaFin, limit)
          break
        case 2:
          resultado = await reporteService.getTurnosMasDemandados(fechaInicio, fechaFin, limit)
          break
        case 3:
          resultado = await reporteService.getPromedioParticipantesPorSala(fechaInicio, fechaFin, edificio)
          break
        case 4:
          resultado = await reporteService.getReservasPorPrograma(fechaInicio, fechaFin, facultad)
          break
        case 5:
          resultado = await reporteService.getOcupacionPorEdificio(fechaInicio, fechaFin)
          break
          case 6:
            // Map UI rol to backend-expected rol when necessary (postgrado -> alumno)
            {
              const rolBackend = rol === 'postgrado' ? 'alumno' : rol || null
              resultado = await reporteService.getReservasYAsistenciaPorRol(fechaInicio, fechaFin, rolBackend)
            }
            break
          case 7:
            {
              const rolBackend = rol === 'postgrado' ? 'alumno' : rol || null
              resultado = await reporteService.getSancionesPorRol(fechaInicio, fechaFin, rolBackend)
            }
          break
        case 8:
          resultado = await reporteService.getReservasUtilizadasVsCanceladas(fechaInicio, fechaFin)
          break
        case 9:
          resultado = await reporteService.getHorasPicoPorSala(fechaInicio, fechaFin, edificio, limit)
          break
        case 10:
          resultado = await reporteService.getOcupacionPorTipoSala(fechaInicio, fechaFin)
          break
        case 11:
          resultado = await reporteService.getReincidentesEnSanciones(minSanciones, soloActivas)
          break
        default:
          setError('Reporte no implementado')
          setLoading(false)
          return
      }

      if (resultado.unauthorized) {
        logout()
        return
      }

      if (!resultado.ok) {
        setError(resultado.error || 'Error al generar reporte')
        setLoading(false)
        return
      }

      // Extraer el array de datos correctamente
      let datosExtraidos = resultado.data
      
      // Si es un objeto que contiene un array, extraer el array
      if (datosExtraidos && typeof datosExtraidos === 'object' && !Array.isArray(datosExtraidos)) {
        // Buscar la primera propiedad que sea un array
        const keys = Object.keys(datosExtraidos)
        for (const key of keys) {
          if (Array.isArray(datosExtraidos[key])) {
            datosExtraidos = datosExtraidos[key]
            break
          }
        }
      }

      setDatos(datosExtraidos)
    } catch (err) {
      setError('Error inesperado al generar reporte')
      console.error(err)
    }

    setLoading(false)
  }

  // Cargar lista de edificios (extraída de las salas) para los selects de filtro
  useEffect(() => {
    const cargarFacultadesDesdeAPI = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        const posibles = [
  ,
          '/api/facultad',
          '/programas/facultades',
        ]
        const token = getToken()
        const headers = token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' }

        for (const p of posibles) {
          try {
            const res = await fetch(`${API_BASE}${p}`, { headers })
            if (!res.ok) continue
            let data = null
            try { data = await res.json() } catch (e) { data = null }
            if (!data) continue

            // intentos comunes para extraer array
            const arr = data.facultades || data.data || data || null
            if (!arr || !Array.isArray(arr) || arr.length === 0) continue

            const names = arr.map((item) => {
              if (!item) return null
              if (typeof item === 'string') return item
              return item.nombre || item.name || item.nombre_facultad || item.facultad_nombre || null
            }).filter(Boolean).map(s => s.trim()).filter(Boolean)

            if (names.length > 0) {
              // eliminar duplicados y ordenar
              const unique = Array.from(new Set(names)).sort()
              setFacultades(unique)
              console.info('Reportes: facultades cargadas desde', p, unique)
              return
            }
          } catch (e) {
            // intentar siguiente endpoint
            continue
          }
        }
        // si llegamos acá, no se encontraron facultades en endpoints
      } catch (e) {
        console.warn('Error cargando facultades desde API:', e)
      }
    }

    cargarFacultadesDesdeAPI()

    const cargarEdificios = async () => {
      try {
        let res = await listarSalas()
        // fallback to reservaService if salaService returns empty or non-ok
        if (!res || !res.ok || !Array.isArray(res.data) || res.data.length === 0) {
          try {
            res = await listarSalasReserva()
          } catch (e) {
            // ignore
          }
        }

        if (res && res.ok && Array.isArray(res.data)) {
          const keys = ['edificio', 'campus', 'sede', 'facultad', 'departamento']
          const set = new Set()
          res.data.forEach((s) => {
            if (!s || typeof s !== 'object') return
            for (const k of keys) {
              const v = s[k]
              if (v && typeof v === 'string') set.add(v.trim())
            }
          })
          const unique = Array.from(set).filter(Boolean).sort()
          setEdificios(unique)

          // Extraer específicamente las facultades si existen en los datos.
          // Buscamos en múltiples claves posibles y soportamos valores string o
          // objetos con un campo nombre/name.
          const facKeys = ['facultad', 'facultad_nombre', 'unidad', 'departamento', 'faculty', 'fac']
          const facSet = new Set()
          res.data.forEach((s) => {
            if (!s || typeof s !== 'object') return

            for (const key of facKeys) {
              const val = s[key]
              if (!val) continue

              if (typeof val === 'string') {
                facSet.add(val.trim())
                break
              }

              // Si viene como objeto, intentar extraer nombre o name
              if (typeof val === 'object') {
                const name = val.nombre || val.name || val.facultad_nombre || val.nombre_facultad
                if (name && typeof name === 'string') {
                  facSet.add(name.trim())
                  break
                }
              }
            }
          })

          const facs = Array.from(facSet).filter(Boolean).sort()
          setFacultades(facs)
          if (facs.length === 0) {
            // helpful dev log if no faculties found (can remove later)
            console.info('Reportes: no se encontraron propiedades de facultad en salas. Keys inspeccionadas:', facKeys)
          }
        } else {
          setEdificios([])
          setFacultades([])
        }
      } catch (err) {
        console.warn('No se pudieron cargar edificios:', err)
        setEdificios([])
      }
    }

    cargarEdificios()
  }, [])

  const cerrarReporte = () => {
    setReporteActivo(null)
    setDatos(null)
    setError(null)
    resetearFiltros()
  }

  const renderFiltros = (reporte) => {
    if (!reporte.filtros) return null

    return (
      <div className="filtros-reporte">
        <h3>Filtros</h3>
        
        {reporte.filtros.includes('fechas') && (
          <div className="filtro-group">
            <div className="form-group">
              <label>Fecha Inicio:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Fecha Fin:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>
        )}

        {reporte.filtros.includes('limit') && (
          <div className="form-group">
            <label>Límite de resultados:</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min="1"
              max="100"
            />
          </div>
        )}

        {reporte.filtros.includes('edificio') && (
          <div className="form-group">
            <label>Edificio (opcional):</label>
            <select value={edificio} onChange={(e) => setEdificio(e.target.value)}>
              <option value="">Todos</option>
              {edificios.map((ed) => (
                <option key={ed} value={ed}>{ed}</option>
              ))}
            </select>
          </div>
        )}

        {reporte.filtros.includes('facultad') && (
          <div className="form-group">
            <label>Facultad (opcional):</label>
            {/* Si hay facultades cargadas, mostrar un select con las opciones; si no, fallback a input libre */}
            {facultades && facultades.length > 0 ? (
              <select value={facultad} onChange={(e) => setFacultad(e.target.value)}>
                <option value="">Todos</option>
                {facultades.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={facultad}
                onChange={(e) => setFacultad(e.target.value)}
                placeholder="Ej: Ingeniería"
              />
            )}
          </div>
        )}

        {reporte.filtros.includes('rol') && (
          <div className="form-group">
            <label>Rol (opcional):</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="">Todos</option>
              <option value="alumno">Alumno</option>
              <option value="postgrado">Postgrado</option>
              <option value="docente">Docente</option>
            </select>
          </div>
        )}

        {reporte.filtros.includes('sanciones') && (
          <>
            <div className="form-group">
              <label>Mínimo de sanciones:</label>
              <input
                type="number"
                value={minSanciones}
                onChange={(e) => setMinSanciones(Number(e.target.value))}
                min="1"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={soloActivas}
                  onChange={(e) => setSoloActivas(e.target.checked)}
                />
                {' '}Solo sanciones activas
              </label>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderDatos = () => {
    if (!datos) return null

    // Si datos es un array vacío
    if (Array.isArray(datos) && datos.length === 0) {
      return <p>No se encontraron resultados.</p>
    }

    // Renderizar tabla genérica para cualquier estructura de datos
    const keys = Array.isArray(datos) && datos.length > 0 
      ? Object.keys(datos[0]) 
      : Object.keys(datos)

    // Helper para renderizar valores de forma segura y elegante
    const renderValue = (value) => {
      if (value === null || value === undefined) return '-'
      if (typeof value === 'boolean') return value ? 'Sí' : 'No'
      if (typeof value === 'number') return value.toLocaleString('es-ES', { maximumFractionDigits: 2 })
      if (typeof value === 'object') {
        // Si es un objeto, renderizar de forma bonita
        return (
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            {Object.entries(value).map(([k, v]) => (
              <div key={k} style={{ marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: '500', color: '#003366' }}>{k}:</span> {String(v)}
              </div>
            ))}
          </div>
        )
      }
      return String(value)
    }

    if (Array.isArray(datos)) {
      return (
        <div className="tabla-responsive">
          <table className="tabla-admin">
            <thead>
              <tr>
                {keys.map(key => (
                  <th key={key}>{key.replace(/_/g, ' ').toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.map((fila, idx) => (
                <tr key={idx}>
                  {keys.map(key => (
                    <td key={key}>
                      {renderValue(fila[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    } else {
      // Para respuestas tipo objeto
      return (
        <div className="datos-reporte">
          {keys.map(key => (
            <div key={key} className="dato-item">
              <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong>
              <span>{renderValue(datos[key])}</span>
            </div>
          ))}
        </div>
      )
    }
  }

  if (reporteActivo) {
    const reporte = reportes.find(r => r.id === reporteActivo)
    
    return (
      <div className="seccion">
        <button onClick={cerrarReporte} className="btn-secundario" style={{ marginBottom: '20px' }}>
          ← Volver a Reportes
        </button>

        <h1>{reporte.icono} {reporte.nombre}</h1>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>{reporte.descripcion}</p>

        {renderFiltros(reporte)}

        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => generarReporte(reporteActivo)} 
            className="btn-primario"
            disabled={loading}
            style={{ 
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            {loading ? '⏳ Generando...' : '📊 Generar Reporte'}
          </button>
        </div>

        {error && (
          <div className="alert-banner alert-rojo" style={{ marginTop: '20px' }}>
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando datos del reporte...</p>
          </div>
        )}

        {datos && !loading && (
          <div className="resultados-container">
            <div className="resultados-header">
              <h2>📈 Resultados</h2>
              {Array.isArray(datos) && datos.length > 0 && (
                <span className="resultados-count">
                  {datos.length} {datos.length === 1 ? 'registro' : 'registros'} encontrados
                </span>
              )}
            </div>
            
            {Array.isArray(datos) && datos.length === 0 ? (
              <div className="sin-resultados">
                <div className="sin-resultados-icon">📭</div>
                <p>No se encontraron resultados para los filtros seleccionados.</p>
                <small>Intenta ajustar los filtros y generar el reporte nuevamente.</small>
              </div>
            ) : (
              renderDatos()
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="seccion">
      <h1>Reportes & Métricas</h1>
      <p>Accede a 11 reportes completos del sistema</p>

      <div className="reportes-grid">
        {reportes.map((reporte) => (
          <div key={reporte.id} className="reporte-card" onClick={() => setReporteActivo(reporte.id)}>
            <div className="reporte-icon">{reporte.icono}</div>
            <h3>{reporte.nombre}</h3>
            <p className="reporte-desc">{reporte.descripcion}</p>
            <button className="btn-secundario">Ver Reporte</button>
          </div>
        ))}
      </div>
    </div>
  )
}
