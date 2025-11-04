/**
 * Gestión de Salas
 */

export default function GestionSalas() {
  return (
    <div className="seccion">
      <h1>Gestión de Salas</h1>
      <p>Administra todas las salas del sistema</p>

      <div className="controles">
        <button className="btn-primary">+ Crear Sala</button>
        <select className="filter-select">
          <option>Todos los edificios</option>
        </select>
      </div>

      <table className="tabla-admin">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Edificio</th>
            <th>Capacidad</th>
            <th>Disponibilidad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="5" className="sin-datos">No hay salas</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
