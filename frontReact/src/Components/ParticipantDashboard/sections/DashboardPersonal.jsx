/**
 * Dashboard Personal - Mi perfil y resumen
 */

export default function DashboardPersonal({ tienesSanciones }) {
  return (
    <div className="seccion">
      <h1>Mi Perfil</h1>

      {/* Banner de sanciones */}
      {tienesSanciones && (
        <div className="alert-banner alert-rojo">
          ⚠️ No autorizado para reservar - Tienes sanciones vigentes
        </div>
      )}

      {!tienesSanciones && (
        <div className="alert-banner alert-verde">
          ✓ Autorizado para reservar
        </div>
      )}

      {/* Información personal */}
      <div className="perfil-card">
        <h2>Información Personal</h2>
        <div className="info-grid">
          <div className="info-item">
            <label>Nombre</label>
            <p>-</p>
          </div>
          <div className="info-item">
            <label>Email</label>
            <p>-</p>
          </div>
          <div className="info-item">
            <label>CI</label>
            <p>-</p>
          </div>
          <div className="info-item">
            <label>Facultad</label>
            <p>-</p>
          </div>
          <div className="info-item">
            <label>Programa</label>
            <p>-</p>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="resumen-grid">
        <div className="resumen-card">
          <div className="resumen-icon">📅</div>
          <h3>Reservas Activas</h3>
          <p className="resumen-numero">0</p>
        </div>

        <div className="resumen-card">
          <div className="resumen-icon">✓</div>
          <h3>Reservas Completadas</h3>
          <p className="resumen-numero">0</p>
        </div>

        <div className="resumen-card">
          <div className="resumen-icon">⚠️</div>
          <h3>Sanciones Vigentes</h3>
          <p className="resumen-numero">0</p>
        </div>
      </div>
    </div>
  )
}
