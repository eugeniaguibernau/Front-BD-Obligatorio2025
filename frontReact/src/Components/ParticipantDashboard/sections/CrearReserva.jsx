/**
 * Crear Reserva - Formulario para crear nueva reserva
 */

export default function CrearReserva({ tienesSanciones }) {
  if (tienesSanciones) {
    return (
      <div className="seccion">
        <h1>Crear Reserva</h1>
        <div className="alert-banner alert-rojo">
          ⚠️ No puedes crear reservas - Tienes sanciones vigentes
        </div>
      </div>
    )
  }

  return (
    <div className="seccion">
      <h1>Crear Nueva Reserva</h1>
      <p>Completa los datos para hacer una nueva reserva</p>

      <form className="formulario-reserva">
        <div className="form-group">
          <label htmlFor="sala">Seleccionar Sala</label>
          <select id="sala" className="form-input">
            <option>-- Selecciona una sala --</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="fecha">Seleccionar Fecha</label>
          <input type="date" id="fecha" className="form-input" />
        </div>

        <div className="form-group">
          <label htmlFor="turno">Seleccionar Turno</label>
          <select id="turno" className="form-input">
            <option>-- Selecciona un turno --</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="cantidad">Cantidad de Participantes</label>
          <input type="number" id="cantidad" className="form-input" min="1" />
        </div>

        <button type="submit" className="btn-primary">
          Crear Reserva
        </button>
      </form>
    </div>
  )
}
