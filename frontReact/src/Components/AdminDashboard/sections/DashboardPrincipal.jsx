/**
 * Dashboard Principal - Estadísticas generales
 */

export default function DashboardPrincipal() {
  return (
    <div className="seccion">
      <h1>Dashboard Principal</h1>
      <p>Estadísticas generales del sistema</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <h3>Total Participantes</h3>
          <p className="stat-value">0</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏛️</div>
          <h3>Total Salas</h3>
          <p className="stat-value">0</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <h3>Total Reservas</h3>
          <p className="stat-value">0</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <h3>Sanciones Vigentes</h3>
          <p className="stat-value">0</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <h3>Ocupación Promedio</h3>
          <p className="stat-value">0%</p>
        </div>
      </div>
    </div>
  )
}
