/**
 * Mis Reservas - Tabla con todas mis reservas
 */

export default function MisReservas() {
  return (
    <div className="seccion">
      <h1>Mis Reservas</h1>
      <p>Todas tus reservas en el sistema</p>

      <div className="controles">
        <input type="text" placeholder="Buscar reserva..." className="search-input" />
        <select className="filter-select">
          <option>Todos los estados</option>
          <option>Activa</option>
          <option>Cancelada</option>
          <option>Finalizada</option>
        </select>
      </div>

      <table className="tabla-participante">
        <thead>
          <tr>
            <th>Sala</th>
            <th>Fecha</th>
            <th>Turno</th>
            <th>Cantidad</th>
            <th>Estado</th>
            <th>Asistencia</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="7" className="sin-datos">No tienes reservas</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
