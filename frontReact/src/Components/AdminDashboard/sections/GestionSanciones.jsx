/**
 * Gestión de Sanciones
 */

import { useState } from 'react'
import sancionService from '../../../services/sancionService'

export default function GestionSanciones() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleProcesarVencidas = async () => {
    if (!window.confirm('Procesar reservas vencidas y generar sanciones? (esto puede crear registros en la BD)')) return
    try {
      setLoading(true)
      setMessage(null)
      const res = await sancionService.procesarVencidas({ sancion_dias: 7 })
      if (!res.ok) {
        setMessage({ type: 'error', text: res.error || 'Error al procesar' })
        return
      }
      setMessage({ type: 'success', text: 'Procesado correctamente', data: res.data })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="seccion">
      <h1>Gestión de Sanciones</h1>
      <p>Administra todas las sanciones del sistema</p>

      <div className="controles">
        <button className="btn-primary">+ Crear Sanción</button>
        <select className="filter-select">
          <option>Todas las sanciones</option>
          <option>Activas</option>
          <option>Vencidas</option>
        </select>
        <button className="btn-primary" onClick={handleProcesarVencidas} disabled={loading} style={{ marginLeft: 'auto' }}>
          {loading ? 'Procesando...' : 'Procesar reservas vencidas'}
        </button>
      </div>

      {message && (
        <div className={`alert-banner ${message.type === 'error' ? 'alert-rojo' : 'alert-verde'}`}>
          <div>{message.text}</div>
          {message.data && <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{JSON.stringify(message.data, null, 2)}</pre>}
        </div>
      )}

      <table className="tabla-admin">
        <thead>
          <tr>
            <th>ID</th>
            <th>Participante</th>
            <th>Motivo</th>
            <th>Fecha Inicio</th>
            <th>Fecha Fin</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="7" className="sin-datos">No hay sanciones</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
