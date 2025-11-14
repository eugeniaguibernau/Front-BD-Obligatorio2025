/**
 * Dashboard Personal - Mi perfil y resumen
 */

import { useEffect, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import reservaService from '../../../services/reservaService'
import sancionService from '../../../services/sancionService'

export default function DashboardPersonal({ tienesSanciones, setTienesSanciones }) {
  console.log('🚀 DashboardPersonal renderizado - VERSIÓN NUEVA')
  const { user } = useAuth()
  const [reservas, setReservas] = useState([])
  const [sanciones, setSanciones] = useState([])
  const [resumenSanciones, setResumenSanciones] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log('⚡ useEffect EJECUTÁNDOSE')
    const load = async () => {
      console.log('🔄 Función load() iniciada')
      setLoading(true)
      try {
        // fetch user's reservas and sanciones (defensive: user may be null)
        const ci = user && (user.ci || user.CI || user.identificacion || user.dni || user.documento || user.id)
        console.log('👤 Usuario CI:', ci)
        const rRes = await reservaService.listarReservas(ci ? { ci } : {})
        console.log('📋 Respuesta reservas:', rRes)
        if (rRes && rRes.ok) setReservas(rRes.data || [])
        else setReservas([])

        const emailRaw = look(user, ['email', 'correo'])
        console.log('📧 Email:', emailRaw)
        console.log('👤 User completo:', user)
        if (ci) {
          console.log('🔑 Tengo CI, llamando a sancionService con:', ci)
          const sRes = await sancionService.listarSanciones(ci)
          console.log('🔍 Respuesta completa de sanciones:', JSON.stringify(sRes, null, 2))
          console.log('🔍 sRes:', sRes)
          console.log('🔍 sRes.ok:', sRes.ok)
          console.log('🔍 Condición (sRes && sRes.ok):', (sRes && sRes.ok))
          if (sRes && sRes.ok) {
            console.log('✅ ENTRÉ AL IF')
            setSanciones(sRes.data || [])
            // Guardar el resumen SIEMPRE si existe
            const resumenParaGuardar = sRes.resumen
            console.log('📦 Resumen a guardar:', resumenParaGuardar)
            setResumenSanciones(resumenParaGuardar)
          } else {
            console.log('❌ NO ENTRÉ AL IF')
            setSanciones([])
          }
        } else {
          console.log('⚠️ NO TENGO CI - usando email')
          // Try to fetch all sanciones and filter by user email/id when CI is not available
          const sRes = await sancionService.listarSanciones()
          console.log('📋 Respuesta sanciones sin CI:', sRes)
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

  // Determinar si tiene sanciones vigentes: usar backend si está disponible, sino calcular localmente
  const diasRestantes = resumenSanciones?.dias_restantes_total || resumenSanciones?.datos_restantes_total || 0
  const tieneSancionesVigentes = resumenSanciones 
    ? diasRestantes > 0 
    : sancionesVigentes > 0

  console.log('🔍 DEBUG BANNER:')
  console.log('  - resumenSanciones:', resumenSanciones)
  console.log('  - dias_restantes_total:', resumenSanciones?.dias_restantes_total)
  console.log('  - datos_restantes_total:', resumenSanciones?.datos_restantes_total)
  console.log('  - diasRestantes calculado:', diasRestantes)
  console.log('  - sancionesVigentes (local):', sancionesVigentes)
  console.log('  - tieneSancionesVigentes:', tieneSancionesVigentes)
  console.log('  - loading:', loading)

  // Notificar al padre cuando cambie el estado de sanciones
  useEffect(() => {
    if (setTienesSanciones && !loading) {
      setTienesSanciones(tieneSancionesVigentes)
    }
  }, [tieneSancionesVigentes, loading, setTienesSanciones])

  return (
    <div className="seccion">
      <h1>Mi Perfil</h1>

      {/* Banner de sanciones */}
      {!loading && tieneSancionesVigentes && (
        <div className="alert-banner alert-rojo">
          ⚠️ No autorizado para reservar - Tienes sanciones vigentes
        </div>
      )}

      {!loading && !tieneSancionesVigentes && (
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
          {(() => {
            console.log('🎨 Renderizando card. resumenSanciones:', resumenSanciones, 'loading:', loading)
            if (loading) {
              return <p className="resumen-numero">...</p>
            } else if (resumenSanciones) {
              const diasRestantesCard = resumenSanciones.dias_restantes_total || resumenSanciones.datos_restantes_total || 0
              return (
                <>
                  <p className="resumen-numero">{resumenSanciones.total_sanciones || 0}</p>
                  {diasRestantesCard > 0 && (
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.9 }}>
                      {diasRestantesCard} días restantes
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
