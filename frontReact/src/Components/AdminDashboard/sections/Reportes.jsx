/**
 * Reportes & Métricas
 * los 11 endpoints de reportes que hay en el back
 */

export default function Reportes() {
  const reportes = [
    { id: 1, nombre: 'Salas más reservadas', icono: '🏛️' },
    { id: 2, nombre: 'Turnos más demandados', icono: '⏰' },
    { id: 3, nombre: 'Promedio participantes por sala', icono: '📊' },
    { id: 4, nombre: 'Reservas por carrera', icono: '🎓' },
    { id: 5, nombre: 'Ocupación por edificio', icono: '📍' },
    { id: 6, nombre: 'Reservas/asistencia por rol', icono: '👤' },
    { id: 7, nombre: 'Sanciones por rol', icono: '⚠️' },
    { id: 8, nombre: 'Utilizadas vs canceladas', icono: '📈' },
    { id: 9, nombre: 'Horas pico por sala', icono: '📅' },
    { id: 10, nombre: 'Ocupación por tipo', icono: '🔍' },
    { id: 11, nombre: 'Reincidentes en sanciones', icono: '🚨' },
  ]

  return (
    <div className="seccion">
      <h1>Reportes & Métricas</h1>
      <p>Accede a 11 reportes completos del sistema</p>

      <div className="reportes-grid">
        {reportes.map((reporte) => (
          <div key={reporte.id} className="reporte-card">
            <div className="reporte-icon">{reporte.icono}</div>
            <h3>{reporte.nombre}</h3>
            <button className="btn-secondary">Ver Reporte</button>
          </div>
        ))}
      </div>
    </div>
  )
}
