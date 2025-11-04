/**
 * Gestión de Participantes
 */

export default function GestionParticipantes() {
  return (
    <div className="seccion">
      <h1>Gestión de Participantes</h1>
      <p>Administra todos los participantes del sistema</p>

      <div className="controles">
        <input type="text" placeholder="Buscar participante..." className="search-input" />
        <select className="filter-select">
          <option>Todas las facultades</option>
        </select>
      </div>

      <table className="tabla-admin">
        <thead>
          <tr>
            <th>CI</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Facultad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="5" className="sin-datos">No hay participantes</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
