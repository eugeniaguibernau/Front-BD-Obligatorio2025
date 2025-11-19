// src/components/participant/ParticipantDashboard.jsx

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import './ParticipantDashboard.css'
import DashboardPersonal from './sections/DashboardPersonal'
import MisReservas from './sections/MisReservas'
import CrearReserva from './sections/CrearReserva'
import MisSanciones from './sections/MisSanciones'
import { Home, Calendar, PlusCircle, AlertTriangle, LogOut } from 'lucide-react'

export const ParticipantDashboard = () => {
  const { user, logout } = useAuth()
  const [seccionActiva, setSeccionActiva] = useState('dashboard')
  const [sidebarAbierto, setSidebarAbierto] = useState(true)
  const [tienesSanciones, setTienesSanciones] = useState(false)

  const renderizarSeccion = () => {
    switch (seccionActiva) {
      case 'dashboard':
        return (
          <DashboardPersonal
            tienesSanciones={tienesSanciones}
            setTienesSanciones={setTienesSanciones}
          />
        )
      case 'reservas':
        return <MisReservas />
      case 'crear':
        return <CrearReserva tienesSanciones={tienesSanciones} />
      case 'sanciones':
        return <MisSanciones setTienesSanciones={setTienesSanciones} />
      default:
        return (
          <DashboardPersonal
            tienesSanciones={tienesSanciones}
            setTienesSanciones={setTienesSanciones}
          />
        )
    }
  }

  return (
    <div className="participant-dashboard">
      {/* Barra lateral */}
      <nav className={`participant-sidebar ${sidebarAbierto ? 'abierto' : 'cerrado'}`}>
        <div className="sidebar-header">
          <h2>Sistema de reservas</h2>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            aria-label="Alternar menú lateral"
          >
            ☰
          </button>
        </div>

        <div className="sidebar-menu">
          <button
            className={`menu-item ${seccionActiva === 'dashboard' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('dashboard')}
          >
            <Home className="menu-icon" size={20} />
            <span className="menu-text">Inicio</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'reservas' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('reservas')}
          >
            <Calendar className="menu-icon" size={20} />
            <span className="menu-text">Mis reservas</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'crear' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('crear')}
          >
            <PlusCircle className="menu-icon" size={20} />
            <span className="menu-text">Nueva reserva</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'sanciones' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('sanciones')}
          >
            <AlertTriangle className="menu-icon" size={20} />
            <span className="menu-text">Historial de sanciones</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="user-card">
            <p className="user-email">{user?.correo}</p>
            <p className="user-role">Perfil: Participante</p>
          </div>
          <button onClick={logout} className="logout-button">
            <LogOut size={18} />
            <span className="menu-text">Cerrar sesión</span>
          </button>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="participant-content">
        {renderizarSeccion()}
      </main>
    </div>
  )
}
