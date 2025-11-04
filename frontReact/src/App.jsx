/**
 * Componente principal de la aplicación
 * Ejemplo de integración con el sistema de autenticación
 * Redirecciona a dashboards diferentes según el rol del usuario
 */

import { useAuth } from './hooks/useAuth'
import { Login } from './Components/Login/Login'
import { AdminDashboard } from './Components/AdminDashboard/AdminDashboard'
import { ParticipantDashboard } from './Components/ParticipantDashboard/ParticipantDashboard'
import './App.css'

function App() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Cargando...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  // Redireccionar según el rol del usuario
  if (user?.user_type === 'admin') {
    return <AdminDashboard />
  }

  if (user?.user_type === 'participante') {
    return <ParticipantDashboard />
  }

  // Por si acaso, fallback a login
  return <Login />
}

export default App
