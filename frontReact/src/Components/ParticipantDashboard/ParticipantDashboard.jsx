/**
 * Componente Dashboard para Participantes
 * Panel de control con navbar lateral y múltiples secciones
 */

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import './ParticipantDashboard.css'
import DashboardPersonal from './sections/DashboardPersonal'
import MisReservas from './sections/MisReservas'
import CrearReserva from './sections/CrearReserva'
import MisSanciones from './sections/MisSanciones'

export const ParticipantDashboard = () => {
  const { user, logout } = useAuth()
  const [seccionActiva, setSeccionActiva] = useState('dashboard')
  const [sidebarAbierto, setSidebarAbierto] = useState(true)
  const [tienesSanciones, setTienesSanciones] = useState(false)

  const renderizarSeccion = () => {
    switch (seccionActiva) {
      case 'dashboard':
        return <DashboardPersonal tienesSanciones={tienesSanciones} setTienesSanciones={setTienesSanciones} />
      case 'reservas':
        return <MisReservas />
      case 'crear':
        return <CrearReserva tienesSanciones={tienesSanciones} />
      case 'sanciones':
        return <MisSanciones setTienesSanciones={setTienesSanciones} />
      default:
        return <DashboardPersonal tienesSanciones={tienesSanciones} setTienesSanciones={setTienesSanciones} />
    }
  }

  return (
    <div className="participant-dashboard">
      {/* Navbar Lateral */}
      <nav className={`participant-sidebar ${sidebarAbierto ? 'abierto' : 'cerrado'}`}>
        <div className="sidebar-header">
          <h2>Mis Reservas</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
          >
            ☰
          </button>
        </div>

        <div className="sidebar-menu">
          <button
            className={`menu-item ${seccionActiva === 'dashboard' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('dashboard')}
          >
            <span className="menu-icon">👤</span>
            <span className="menu-text">Mi Perfil</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'reservas' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('reservas')}
          >
            <span className="menu-icon">📅</span>
            <span className="menu-text">Mis Reservas</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'crear' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('crear')}
          >
            <span className="menu-icon">➕</span>
            <span className="menu-text">Crear Reserva</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'sanciones' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('sanciones')}
          >
            <span className="menu-icon">⚠️</span>
            <span className="menu-text">Mis Sanciones</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="user-card">
            <p className="user-email">{user?.correo}</p>
            <p className="user-role">👤 Participante</p>
          </div>
          <button onClick={logout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="participant-content">
        {renderizarSeccion()}
      </main>
    </div>
  )
}
