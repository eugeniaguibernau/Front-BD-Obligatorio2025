/**
 * Mis Sanciones - Tabla con todas mis sanciones
 */

import { useEffect, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import sancionService from '../../../services/sancionService'
import reservaService from '../../../services/reservaService'

// helper to detect cancelled / no-asist states
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
      // Try to use user identifier if available (ci, dni or id)
      const ci = user?.ci || user?.dni || user?.identificacion || user?.id || null
      // debug info
      // eslint-disable-next-line no-console
      console.debug('MisSanciones: fetching sanciones for user', { user, ci })
      const res = await sancionService.listarSanciones(ci)
      // eslint-disable-next-line no-console
      console.debug('MisSanciones: listarSanciones response', res)
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

        // If backend returned no sanciones for the user's ci, try a fallback: fetch all sanciones
        // and filter client-side for matches (covers APIs that return all sanciones without participante route).
        if ((sancs.length === 0) && !ci) {
          // no ci available, try fetching all
          const allRes = await sancionService.listarSanciones()
          // eslint-disable-next-line no-console
          console.debug('MisSanciones: fallback listarSanciones(all) response', allRes)
          if (allRes && allRes.ok) {
            const all = Array.isArray(allRes.data) ? allRes.data : (allRes.data && allRes.data.sanciones) || []
            sancs = all
          }
        } else if ((sancs.length === 0) && ci) {
          // we had a ci but server returned none for that endpoint: try fetching all and filter by participant id/ci
          const allRes = await sancionService.listarSanciones()
          // eslint-disable-next-line no-console
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
              // also try email
              candidates.push(s.email || s.participante_email || '')
              return candidates.map(c => String(c).toLowerCase()).some(c => c && ci && c === String(ci).toLowerCase())
            }
            sancs = all.filter(match)
          }
        }

        // If still empty, try fallback: check participant's reservas for 'no asistencia' and map them to provisional sanciones
        if ((!sancs || sancs.length === 0) && ci) {
          try {
            const rres = await reservaService.listarReservas()
            // eslint-disable-next-line no-console
            console.debug('MisSanciones: listarReservas response for fallback', rres)
            if (rres && rres.ok) {
              const allRes = rres.data || []
              const ciStr = String(ci).toLowerCase()
              const matched = (allRes || []).filter(r => {
                // check participants array or fields
                const partList = r.participantes || r.participantes_ci || r.participantes_list || []
                let found = false
                if (Array.isArray(partList) && partList.length > 0) {
                  // be robust: elements may be strings (ci) or objects { ci, dni, id, email }
                  const normalized = partList.map(p => {
                    if (!p && p !== 0) return ''
                    if (typeof p === 'string' || typeof p === 'number') return String(p).toLowerCase()
                    // object case
                    if (typeof p === 'object') {
                      return String(p.ci || p.dni || p.identificacion || p.id || p.email || '').toLowerCase()
                    }
                    return ''
                  })
                  found = normalized.includes(ciStr)
                }
                // also check reserva.participante (single) or top-level fields
                if (!found) {
                  const cand = r.participante || r.participante_ci || r.ci || r.dni || r.identificacion || ''
                  if (cand) found = String(cand).toLowerCase() === ciStr
                }
                const estado = (r.estado || '').toString().toLowerCase()
                return found && isCancelledOrNoAsist(estado)
              })
              if (matched.length > 0) {
                // map reservas to provisional sanciones
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
            // ignore fallback errors
          }
        }

                setSanciones(sancs)
        // Notify parent whether the participant has sanctions (consider provisional as well)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // No real-time remaining display — show only dates from backend

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
