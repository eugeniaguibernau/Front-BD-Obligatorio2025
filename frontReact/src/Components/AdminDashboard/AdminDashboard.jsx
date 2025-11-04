/**
 * Componente Dashboard para Administradores
 * Panel de control con navbar lateral y múltiples secciones
 */

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import './AdminDashboard.css'
import DashboardPrincipal from './sections/DashboardPrincipal'
import GestionParticipantes from './sections/GestionParticipantes'
import GestionSalas from './sections/GestionSalas'
import GestionReservas from './sections/GestionReservas'
import GestionSanciones from './sections/GestionSanciones'
import Reportes from './sections/Reportes'

export const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [seccionActiva, setSeccionActiva] = useState('dashboard')
  const [sidebarAbierto, setSidebarAbierto] = useState(true)

  const renderizarSeccion = () => {
    switch (seccionActiva) {
      case 'dashboard':
        return <DashboardPrincipal />
      case 'participantes':
        return <GestionParticipantes />
      case 'salas':
        return <GestionSalas />
      case 'reservas':
        return <GestionReservas />
      case 'sanciones':
        return <GestionSanciones />
      case 'reportes':
        return <Reportes />
      default:
        return <DashboardPrincipal />
    }
  }

  return (
    <div className="admin-dashboard">
      {/* Navbar Lateral */}
      <nav className={`admin-sidebar ${sidebarAbierto ? 'abierto' : 'cerrado'}`}>
        <div className="sidebar-header">
          <h2>Gestor Salas</h2>
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
            <span className="menu-icon">📊</span>
            <span className="menu-text">Dashboard Principal</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'participantes' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('participantes')}
          >
            <span className="menu-icon">👥</span>
            <span className="menu-text">Gestión Participantes</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'salas' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('salas')}
          >
            <span className="menu-icon">🏛️</span>
            <span className="menu-text">Gestión Salas</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'reservas' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('reservas')}
          >
            <span className="menu-icon">📅</span>
            <span className="menu-text">Gestión Reservas</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'sanciones' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('sanciones')}
          >
            <span className="menu-icon">⚠️</span>
            <span className="menu-text">Gestión Sanciones</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'reportes' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('reportes')}
          >
            <span className="menu-icon">📈</span>
            <span className="menu-text">Reportes & Métricas</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="user-card">
            <p className="user-email">{user?.correo}</p>
            <p className="user-role">👤 Administrador</p>
          </div>
          <button onClick={logout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="admin-content">
        {renderizarSeccion()}
      </main>
    </div>
  )
}
