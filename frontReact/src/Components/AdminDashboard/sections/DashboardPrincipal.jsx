/**
 * Dashboard Principal - vista simplificada para administradores
 */
import { useAuth } from '../../../hooks/useAuth'

export default function DashboardPrincipal() {
  const { user } = useAuth()

  return (
  <div className="seccion" style={{ color: '#0b3a70' }}>
      <h1>Dashboard</h1>

      <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
        <h3>Datos del administrador</h3>
        <p>
          <strong>Correo:</strong> {user?.correo || '—'}<br />
          <strong>Rol:</strong> {user?.user_type || '—'}
        </p>
      </div>

      <div style={{ background: '#f7f9fc', padding: '1rem', borderRadius: '6px', color: '#213547' }}>
        <p style={{ margin: 0, color: '#213547' }}>
          <strong>Nota:</strong> Las sanciones se actualizan automáticamente todos los días a las <strong>08:00 AM</strong>.
        </p>
        <p style={{ marginTop: '0.75rem', color: '#213547' }}>
          También podés procesar las sanciones manualmente en cualquier momento desde la sección <em>Gestión Sanciones</em> → <em>Procesar Sanciones Automáticas</em>.
        </p>
      </div>
    </div>
  )
}
