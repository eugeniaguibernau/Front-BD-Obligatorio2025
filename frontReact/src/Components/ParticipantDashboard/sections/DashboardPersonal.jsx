/**
 * Dashboard Personal 
 */

import { useEffect, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import reservaService from '../../../services/reservaService'
import sancionService from '../../../services/sancionService'

export default function DashboardPersonal({ tienesSanciones, setTienesSanciones }) {

  const { user } = useAuth()
  const [reservas, setReservas] = useState([])
  const [sanciones, setSanciones] = useState([])
  const [resumenSanciones, setResumenSanciones] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {

    const load = async () => {
      console.log('🔄 Función load() iniciada')
      setLoading(true)
      try {
        const ci = user && (user.ci || user.CI || user.identificacion || user.dni || user.documento || user.id)

        const rRes = await reservaService.listarReservas(ci ? { ci } : {})

        if (rRes && rRes.ok) setReservas(rRes.data || [])
        else setReservas([])

        const emailRaw = look(user, ['email', 'correo'])

        if (ci) {

          const sRes = await sancionService.listarSanciones(ci)
          console.log('🔍 Respuesta completa de sanciones:', JSON.stringify(sRes, null, 2))

          console.log('🔍 Condición (sRes && sRes.ok):', (sRes && sRes.ok))
          if (sRes && sRes.ok) {

            setSanciones(sRes.data || [])
            const resumenParaGuardar = sRes.resumen

            setResumenSanciones(resumenParaGuardar)
          } else {

            setSanciones([])
          }
        } else {

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
            // GUARDAR EL RESUMEN TAMBIÉN AQUÍ
            console.log('📦 Guardando resumen (sin CI):', sRes.resumen)
            setResumenSanciones(sRes.resumen)
          } else setSanciones([])
        }
      } catch (e) {
        setReservas([])
        setSanciones([])
      } finally {

        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const look = (obj, keys) => keys.reduce((acc, k) => acc || (obj && (obj[k])), null)

  const rawName = look(user, ['nombre', 'name', 'nombre_completo', 'nombreCompleto'])
  const emailRaw = look(user, ['email', 'correo'])
  const nombre = rawName || (emailRaw && typeof emailRaw === 'string' ? emailRaw.split('@')[0] : '-')
  const email = emailRaw || '-'
  const ciVal = look(user, ['ci', 'CI', 'identificacion', 'dni', 'documento']) || '-'
  const facultad = look(user, ['facultad', 'facultad_nombre', 'unidad']) || '-'
  const programa = look(user, ['programa', 'carrera', 'curso']) || '-'

  const reservasActivas = (reservas || []).filter(r => ((r.estado || '').toString().toLowerCase() === 'activa')).length
  const reservasCompletadas = (reservas || []).filter(r => {
    const st = (r.estado || '').toString().toLowerCase()
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
    if (!ff) return true 
    const d = new Date(ff)
    return !isNaN(d.getTime()) && d.getTime() > now.getTime()
  }).length

  // Determinar si tiene sanciones vigentes: usar backend si está disponible, sino calcular localmente
  const diasRestantes = resumenSanciones?.dias_restantes_total || resumenSanciones?.datos_restantes_total || 0
  const tieneSancionesVigentes = resumenSanciones 
    ? diasRestantes > 0 
    : sancionesVigentes > 0

  console.log('  - sancionesVigentes (local):', sancionesVigentes)

  // Notificar al padre cuando cambie el estado de sanciones
  useEffect(() => {
    if (setTienesSanciones && !loading) {
      setTienesSanciones(tieneSancionesVigentes)
    }
  }, [tieneSancionesVigentes, loading, setTienesSanciones])

  return (
    <div className="seccion">
      <h1>Mi perfil</h1>

      {!loading && tieneSancionesVigentes && (
        <div className="alert-banner alert-rojo">
          No estás habilitado para generar nuevas reservas debido a sanciones vigentes.
        </div>
      )}

      {!loading && !tieneSancionesVigentes && (
        <div className="alert-banner alert-verde">
          Estás habilitado para realizar reservas.
        </div>
      )}

      <div className="perfil-card">
        <h2>Información personal</h2>
        <div className="info-grid">
          <div className="info-item">
            <label>Nombre</label>
            <p>{nombre}</p>
          </div>
          <div className="info-item">
            <label>Correo electrónico</label>
            <p>{email}</p>
          </div>
        </div>
      </div>

      <div className="resumen-grid">
        <div className="resumen-card">
          <div className="resumen-icon">📅</div>
          <h3>Reservas activas</h3>
          <p className="resumen-numero">{loading ? '...' : reservasActivas}</p>
        </div>

        <div className="resumen-card">
          <div className="resumen-icon">✓</div>
          <h3>Reservas completadas</h3>
          <p className="resumen-numero">{loading ? '...' : reservasCompletadas}</p>
        </div>

        <div className="resumen-card">
          <div className="resumen-icon">⚠️</div>
          <h3>Sanciones vigentes</h3>
          {(() => {
            if (loading) {
              return <p className="resumen-numero">...</p>
            } else if (resumenSanciones) {
              const diasRestantesCard =
                resumenSanciones.dias_restantes_total ||
                resumenSanciones.datos_restantes_total ||
                0
              return (
                <>
                  <p className="resumen-numero">
                    {resumenSanciones.total_sanciones || 0}
                  </p>
                  {diasRestantesCard > 0 && (
                    <p
                      style={{
                        fontSize: '0.85rem',
                        marginTop: '0.5rem',
                        opacity: 0.9,
                      }}
                    >
                      {diasRestantesCard} día(s) restantes de sanción.
                    </p>
                  )}
                </>
              )
            } else {
              return <p className="resumen-numero">{sancionesVigentes}</p>
            }
          })()}
        </div>
      </div>
    </div>
  )

}
