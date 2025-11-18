/**
 * Panel principal para administradores
 */

import { useAuth } from '../../../hooks/useAuth'

export default function DashboardPrincipal() {
  const { user } = useAuth()

  return (
    <div className="seccion" style={{ color: '#0b3a70' }}>
      <h1>Panel de administración</h1>

      <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
        <h3>Datos del usuario administrador</h3>
        <p>
          <strong>Correo institucional:</strong> {user?.correo || '—'}
          <br />
          <strong>Rol en el sistema:</strong> {user?.user_type || '—'}
        </p>
      </div>

      <div
        style={{
          background: '#f7f9fc',
          padding: '1rem',
          borderRadius: '6px',
          color: '#213547',
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>Información:</strong> las sanciones asociadas a las reservas se
          actualizan de forma automática todos los días a las <strong>08:00</strong>.
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          En caso de ser necesario, también podés ejecutar manualmente el proceso
          desde la sección <em>Gestión de sanciones</em> &rarr;{' '}
          <em>Procesar sanciones automáticas</em>.
        </p>
      </div>
    </div>
  )
}
