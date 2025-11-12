/**
 * Dashboard Personal - Mi perfil y resumen
 */

import { useEffect, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import reservaService from '../../../services/reservaService'
import sancionService from '../../../services/sancionService'

export default function DashboardPersonal({ tienesSanciones }) {
  const { user } = useAuth()
  const [reservas, setReservas] = useState([])
  const [sanciones, setSanciones] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // fetch user's reservas and sanciones (defensive: user may be null)
        const ci = user && (user.ci || user.CI || user.identificacion || user.dni || user.documento || user.id)
        const rRes = await reservaService.listarReservas(ci ? { ci } : {})
        if (rRes && rRes.ok) setReservas(rRes.data || [])
        else setReservas([])

        const emailRaw = look(user, ['email', 'correo'])
        if (ci) {
          const sRes = await sancionService.listarSanciones(ci)
          if (sRes && sRes.ok) setSanciones(sRes.data || [])
          else setSanciones([])
        } else {
          // Try to fetch all sanciones and filter by user email/id when CI is not available
          const sRes = await sancionService.listarSanciones()
          if (sRes && sRes.ok) {
            const all = sRes.data || []
            const userEmail = emailRaw && String(emailRaw).toLowerCase()
            const userId = look(user, ['id', 'user_id', 'usuario_id'])
            const filtered = all.filter(s => {
              const sev = (s && (s.email || s.correo || s.participante_email || s.participante_correo || (s.participante && (s.participante.email || s.participante.correo))))
              const sCi = s && (s.ci || s.participante_ci || (s.participante && s.participante.ci))
              const sUserId = s && (s.participante && (s.participante.id || s.participante.user_id))
              if (userEmail && sev && String(sev).toLowerCase().includes(userEmail)) return true
              if (userId && sUserId && String(sUserId) === String(userId)) return true
              if (ci && sCi && String(sCi) === String(ci)) return true
              return false
            })
            setSanciones(filtered)
          } else setSanciones([])
        }
      } catch (e) {
        setReservas([])
        setSanciones([])
      } finally {
        // debug: expose what we fetched so it's easy to inspect in browser console
        // (remove these logs in production)
        // eslint-disable-next-line no-console
        console.debug('DashboardPersonal loaded — user, reservas, sanciones:', user, ' / ', reservas, ' / ', sanciones)
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const look = (obj, keys) => keys.reduce((acc, k) => acc || (obj && (obj[k])), null)

  const rawName = look(user, ['nombre', 'name', 'nombre_completo', 'nombreCompleto'])
  const emailRaw = look(user, ['email', 'correo'])
  // prefer explicit name, otherwise use email local-part before the @
  const nombre = rawName || (emailRaw && typeof emailRaw === 'string' ? emailRaw.split('@')[0] : '-')
  const email = emailRaw || '-'
  const ciVal = look(user, ['ci', 'CI', 'identificacion', 'dni', 'documento']) || '-'
  const facultad = look(user, ['facultad', 'facultad_nombre', 'unidad']) || '-'
  const programa = look(user, ['programa', 'carrera', 'curso']) || '-'

  const reservasActivas = (reservas || []).filter(r => ((r.estado || '').toString().toLowerCase() === 'activa')).length
  const reservasCompletadas = (reservas || []).filter(r => {
    const st = (r.estado || '').toString().toLowerCase()
    // accept multiple possible backend strings for a "completed" reservation
    if (!st) return false
    if (st === 'completada' || st === 'completado') return true
    if (st.includes('asist')) return true // asistida, asistio, asistencia
    if (st.includes('final')) return true // finalizada, finalizado
    if (st.startsWith('comp')) return true // comp..., covers 'completada' etc
    return false
  }).length

  const now = new Date()
  const sancionesVigentes = (sanciones || []).filter(s => {
    const ff = s.fecha_fin || s.fechaFin || s.fecha_fin_sancion || null
    if (!ff) return true // treat missing end as active
    const d = new Date(ff)
    return !isNaN(d.getTime()) && d.getTime() > now.getTime()
  }).length

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
            <p>{nombre}</p>
          </div>
          <div className="info-item">
            <label>Email</label>
            <p>{email}</p>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="resumen-grid">
        <div className="resumen-card">
          <div className="resumen-icon">📅</div>
          <h3>Reservas Activas</h3>
          <p className="resumen-numero">{loading ? '...' : reservasActivas}</p>
        </div>

        <div className="resumen-card">
          <div className="resumen-icon">✓</div>
          <h3>Reservas Completadas</h3>
          <p className="resumen-numero">{loading ? '...' : reservasCompletadas}</p>
        </div>

        <div className="resumen-card">
          <div className="resumen-icon">⚠️</div>
          <h3>Sanciones Vigentes</h3>
          <p className="resumen-numero">{loading ? '...' : sancionesVigentes}</p>
        </div>
      </div>
    </div>
  )
}
