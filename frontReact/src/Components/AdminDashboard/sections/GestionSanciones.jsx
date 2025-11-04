/**
 * Gestión de Sanciones
 */

export default function GestionSanciones() {
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
      </div>

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
            <td colspan="7" className="sin-datos">No hay sanciones</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
