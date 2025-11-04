/**
 * Gestión de Reservas
 */

export default function GestionReservas() {
  return (
    <div className="seccion">
      <h1>Gestión de Reservas</h1>
      <p>Administra todas las reservas del sistema</p>

      <div className="controles">
        <input type="text" placeholder="Buscar reserva..." className="search-input" />
        <select className="filter-select">
          <option>Todos los estados</option>
          <option>Activa</option>
          <option>Cancelada</option>
          <option>Finalizada</option>
        </select>
      </div>

      <table className="tabla-admin">
        <thead>
          <tr>
            <th>ID</th>
            <th>Sala</th>
            <th>Participante</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Asistencia</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="7" className="sin-datos">No hay reservas</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
