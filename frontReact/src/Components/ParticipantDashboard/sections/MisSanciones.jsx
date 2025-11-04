/**
 * Mis Sanciones - Tabla con todas mis sanciones
 */

import { useEffect } from 'react'

export default function MisSanciones({ setTienesSanciones }) {
  useEffect(() => {
    // Aquí se verificaría si hay sanciones vigentes (cuando se implementen los endpoints de sanciones)
    // setTienesSanciones(true/false)
  }, [setTienesSanciones])

  return (
    <div className="seccion">
      <h1>Mis Sanciones</h1>
      <p>Historial de sanciones aplicadas</p>

      <table className="tabla-participante">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Motivo</th>
            <th>Fecha Inicio</th>
            <th>Fecha Fin</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="5" className="sin-datos">No tienes sanciones</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
