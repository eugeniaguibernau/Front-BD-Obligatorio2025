/**
 * Panel de Administración
 * Sistema de Gestión de Salas UCU
 */

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import './AdminDashboard.css'

import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'

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
      {/* Barra lateral */}
      <nav className={`admin-sidebar ${sidebarAbierto ? 'abierto' : 'cerrado'}`}>
        <div className="sidebar-header">
          <h2>Sistema de Gestión de Salas</h2>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            aria-label="Alternar menú de navegación"
          >
            ☰
          </button>
        </div>

        <div className="sidebar-menu">
          <button
            className={`menu-item ${seccionActiva === 'dashboard' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('dashboard')}
          >
            <span className="menu-icon">
              <LayoutDashboard size={18} />
            </span>
            <span className="menu-text">Panel principal</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'participantes' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('participantes')}
          >
            <span className="menu-icon">
              <Users size={18} />
            </span>
            <span className="menu-text">Gestión de participantes</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'salas' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('salas')}
          >
            <span className="menu-icon">
              <Building2 size={18} />
            </span>
            <span className="menu-text">Gestión de salas</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'reservas' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('reservas')}
          >
            <span className="menu-icon">
              <CalendarDays size={18} />
            </span>
            <span className="menu-text">Gestión de reservas</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'sanciones' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('sanciones')}
          >
            <span className="menu-icon">
              <AlertTriangle size={18} />
            </span>
            <span className="menu-text">Gestión de sanciones</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'reportes' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('reportes')}
          >
            <span className="menu-icon">
              <BarChart3 size={18} />
            </span>
            <span className="menu-text">Reportes y métricas</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="user-card">
            <p className="user-email">{user?.correo}</p>
            <p className="user-role">Perfil: Administrador</p>
          </div>
          <button onClick={logout} className="logout-button">
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="admin-content">{renderizarSeccion()}</main>
    </div>
  )
}
