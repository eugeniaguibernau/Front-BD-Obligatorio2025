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
  LogOut,
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
      <nav className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h1>Sistema de Gestión</h1>
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <span className="user-role">Administrador</span>
          </div>
        </div>

        <div className="admin-menu">
          <button
            className={`menu-item ${seccionActiva === 'dashboard' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('dashboard')}
          >
            <span className="menu-icon">
              <LayoutDashboard size={18} />
            </span>
            <span className="menu-text">Panel principal</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'participantes' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('participantes')}
          >
            <span className="menu-icon">
              <Users size={18} />
            </span>
            <span className="menu-text">Participantes</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'salas' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('salas')}
          >
            <span className="menu-icon">
              <Building2 size={18} />
            </span>
            <span className="menu-text">Salas</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'reservas' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('reservas')}
          >
            <span className="menu-icon">
              <CalendarDays size={18} />
            </span>
            <span className="menu-text">Reservas</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'sanciones' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('sanciones')}
          >
            <span className="menu-icon">
              <AlertTriangle size={18} />
            </span>
            <span className="menu-text">Sanciones</span>
          </button>

          <button
            className={`menu-item ${seccionActiva === 'reportes' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('reportes')}
          >
            <span className="menu-icon">
              <BarChart3 size={18} />
            </span>
            <span className="menu-text">Reportes</span>
          </button>
        </div>

        <button onClick={logout} className="logout-button">
          <LogOut size={18} />
          <span className="menu-text">Cerrar sesión</span>
        </button>
      </nav>

      <main className="admin-content">{renderizarSeccion()}</main>
    </div>
  )
}
