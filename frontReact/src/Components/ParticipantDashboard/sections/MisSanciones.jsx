/**
 * Mis Sanciones 
 */

import { useEffect, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import sancionService from '../../../services/sancionService'
import reservaService from '../../../services/reservaService'

const isCancelledOrNoAsist = (st) => {
  if (!st) return false
  return /^cancel/i.test(st) || /sin\s*asist/i.test(st) || /no\s*asist/i.test(st) || /no\s*asistencia/i.test(st)
}

export default function MisSanciones({ setTienesSanciones }) {
  const { user, logout } = useAuth()
  const [sanciones, setSanciones] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchSanciones = async () => {
    setLoading(true)
    setError(null)
    try {
      const ci = user?.ci || user?.dni || user?.identificacion || user?.id || null

      const res = await sancionService.listarSanciones(ci)

      if (res && res.unauthorized) {
        logout()
        setError('No autorizado')
        setSanciones([])
      } else if (!res.ok) {
        setError(res.error || 'Error al cargar sanciones')
        setSanciones([])
      } else {
        const data = res.data || []
        let sancs = Array.isArray(data) ? data : (data.sanciones || [])

        if ((sancs.length === 0) && !ci) {
          const allRes = await sancionService.listarSanciones()

          console.debug('MisSanciones: fallback listarSanciones(all) response', allRes)
          if (allRes && allRes.ok) {
            const all = Array.isArray(allRes.data) ? allRes.data : (allRes.data && allRes.data.sanciones) || []
            sancs = all
          }
        } else if ((sancs.length === 0) && ci) {
          const allRes = await sancionService.listarSanciones()

          console.debug('MisSanciones: fallback listarSanciones(all) response', allRes)
          if (allRes && allRes.ok) {
            const all = Array.isArray(allRes.data) ? allRes.data : (allRes.data && allRes.data.sanciones) || []
            const match = (s) => {
              const candidates = []
              if (s.participante) {
                if (typeof s.participante === 'string') candidates.push(s.participante)
                else {
                  candidates.push(s.participante.ci || s.participante.dni || s.participante.id || '')
                }
              }
              candidates.push(s.ci || s.participante_ci || s.dni || s.identificacion || '')
              candidates.push(s.email || s.participante_email || '')
              return candidates.map(c => String(c).toLowerCase()).some(c => c && ci && c === String(ci).toLowerCase())
            }
            sancs = all.filter(match)
          }
        }

        if ((!sancs || sancs.length === 0) && ci) {
          try {
            const rres = await reservaService.listarReservas()

            if (rres && rres.ok) {
              const allRes = rres.data || []
              const ciStr = String(ci).toLowerCase()
              const matched = (allRes || []).filter(r => {
                const partList = r.participantes || r.participantes_ci || r.participantes_list || []
                let found = false
                if (Array.isArray(partList) && partList.length > 0) {
                  const normalized = partList.map(p => {
                    if (!p && p !== 0) return ''
                    if (typeof p === 'string' || typeof p === 'number') return String(p).toLowerCase()
                    if (typeof p === 'object') {
                      return String(p.ci || p.dni || p.identificacion || p.id || p.email || '').toLowerCase()
                    }
                    return ''
                  })
                  found = normalized.includes(ciStr)
                }
                if (!found) {
                  const cand = r.participante || r.participante_ci || r.ci || r.dni || r.identificacion || ''
                  if (cand) found = String(cand).toLowerCase() === ciStr
                }
                const estado = (r.estado || '').toString().toLowerCase()
                return found && isCancelledOrNoAsist(estado)
              })
              if (matched.length > 0) {

                const provisional = matched.map(r => ({
                  id: `prov_${r.id_reserva || r.id}`,
                  tipo: 'Sanción (No asistencia)',
                  motivo: `No asistencia a reserva ${r.nombre_sala || ''}`,
                  fecha_inicio: r.fecha,
                  fecha_fin: null,
                  estado: r.estado || 'sin asistencia',
                  __provisional: true,
                }))
                sancs = provisional
              }
            }
          } catch (e) {
          }
        }

                setSanciones(sancs)
        if (setTienesSanciones) setTienesSanciones((sancs || []).length > 0)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSanciones()
  }, [user])

  return (
    <div
      className="seccion"
      style={{
        fontFamily:
          '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <h1>Mis sanciones</h1>
      <p>Historial de sanciones asociadas a tu usuario.</p>

      {loading && <p>Cargando sanciones…</p>}
      {error && <div className="alert-banner alert-rojo">{error}</div>}

      <table className="tabla-participante" style={{ color: '#000' }}>
        <thead>
          <tr>
            <th>Fecha de inicio</th>
            <th>Fecha de fin de sanción</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {!sanciones || sanciones.length === 0 ? (
            <tr>
              <td colSpan={3} className="sin-datos">
                No se registran sanciones asociadas a tu usuario.
              </td>
            </tr>
          ) : (
            sanciones.map(s => (
              <tr
                key={s.id || s.id_sancion || `${s.tipo}_${s.fecha_inicio}`}
              >
                <td>
                  {s.fecha_inicio ||
                    s.fechaInicio ||
                    s.fecha ||
                    '—'}
                </td>
                <td>{s.fecha_fin || s.fechaFin || '—'}</td>
                <td>{'sin asistencia'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )

}
