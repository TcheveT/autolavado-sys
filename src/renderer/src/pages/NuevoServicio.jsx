import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './styles/NuevoServicio.css';

export default function NuevoServicio({ 
  setNuevoServicioActivo, 
  setNuevoCarro, 
  nuevoCarro, 
  esReservacion,
  setEsReservacion
}) {
  const [serviciosCatalogo, setServiciosCatalogo] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  
  // ESTADOS FORMULARIO
  const [telefono, setTelefono] = useState('');
  const [cliente, setCliente] = useState({ id: null, nombre: '' });
  const [vehiculosCliente, setVehiculosCliente] = useState([]);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState('nuevo');
  const [datosNuevoAuto, setDatosNuevoAuto] = useState({ modelo: '', placa: '' });
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  
  // ESTADOS DE LOS DROPDOWNS (Separados)
  const [dropdownAbierto, setDropdownAbierto] = useState(false); // Servicios
  const [dropdownEmpleadoAbierto, setDropdownEmpleadoAbierto] = useState(false); // Empleados
  
  // ESTADOS PARA FECHA
  const [fechaReserva, setFechaReserva] = useState('');
  const [minFecha, setMinFecha] = useState(''); 

  useEffect(() => {
    window.api.getServicios().then(setServiciosCatalogo);
    window.api.getEmpleados().then(setEmpleados);

    // CALCULAR FECHA MÍNIMA (AHORA MISMO)
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setMinFecha(now.toISOString().slice(0, 16));
  }, []);

  const toggleServicio = (id) => {
    if (serviciosSeleccionados.includes(id)) {
      setServiciosSeleccionados(serviciosSeleccionados.filter(s => s !== id));
    } else {
      setServiciosSeleccionados([...serviciosSeleccionados, id]);
    }
  };

  const getTextoSeleccionado = () => {
    if (serviciosSeleccionados.length === 0) return <span className="placeholder-text">-- Seleccionar Servicios --</span>;
    const nombres = serviciosCatalogo.filter(s => serviciosSeleccionados.includes(s.id)).map(s => s.nombre);
    if (nombres.length <= 2) return <span className="selected-tags">{nombres.join(', ')}</span>;
    return <span className="selected-tags">{nombres.slice(0, 2).join(', ')} (+{nombres.length - 2} más)</span>;
  };

  const totalEstimado = serviciosSeleccionados.reduce((sum, id) => {
    const serv = serviciosCatalogo.find(s => s.id === id);
    return sum + (serv ? serv.precio : 0);
  }, 0);

  const handleBuscarTelefono = async () => {
    if(telefono.length < 7) return; 
    const resultado = await window.api.buscarCliente(telefono);
    if(resultado) {
      setCliente({ id: resultado.id, nombre: resultado.nombre });
      setVehiculosCliente(resultado.vehiculos);
      if(resultado.vehiculos.length > 0) setVehiculoSeleccionado(resultado.vehiculos[0].id);
      else setVehiculoSeleccionado('nuevo');
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
      Toast.fire({ icon: 'success', title: 'Cliente Encontrado' });
    } else {
      setCliente({ id: null, nombre: '' });
      setVehiculosCliente([]);
      setVehiculoSeleccionado('nuevo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!cliente.nombre) return Swal.fire('Error', 'Falta el nombre del cliente', 'warning');
    if(serviciosSeleccionados.length === 0) return Swal.fire('Error', 'Selecciona al menos un servicio', 'warning');
    if(!empleadoSeleccionado) return Swal.fire('Error', 'Debes asignar un empleado', 'warning');
    
    // VALIDACIÓN PARA RESERVACIÓN
    if(esReservacion) {
        if(!fechaReserva) {
            return Swal.fire('Error', 'Debes seleccionar fecha y hora', 'warning');
        }
        
        const fechaSeleccionada = new Date(fechaReserva);
        const fechaActual = new Date();
        if (fechaSeleccionada < fechaActual) {
            return Swal.fire('Fecha inválida', 'No puedes agendar una cita en el pasado.', 'error');
        }
    }

    const fechaSQL = fechaReserva ? fechaReserva.replace('T', ' ') + ':00' : null;

    const orden = {
      telefono,
      nombreCliente: cliente.nombre,
      esNuevoCliente: !cliente.id,
      vehiculoId: vehiculoSeleccionado,
      nuevoVehiculo: datosNuevoAuto,
      serviciosIds: serviciosSeleccionados,
      empleadoId: empleadoSeleccionado,
      totalCalculado: totalEstimado,
      esReservacion: esReservacion,
      fechaProgramada: fechaSQL
    };

    try {
      await window.api.crearOrden(orden);
      
      const mensajeExito = esReservacion ? 'Reservación agendada' : 'Servicio registrado';
      Swal.fire('Éxito', mensajeExito, 'success');
      
      // Reset
      setTelefono('');
      setCliente({ id: null, nombre: '' });
      setVehiculosCliente([]);
      setVehiculoSeleccionado('nuevo');
      setDatosNuevoAuto({ modelo: '', placa: '' });
      setServiciosSeleccionados([]);
      setEmpleadoSeleccionado('');
      setFechaReserva('');
      
      setNuevoServicioActivo(false);
      setEsReservacion(false);
      setNuevoCarro(!nuevoCarro);
      setDropdownAbierto(false); 
      setDropdownEmpleadoAbierto(false); // Reset del nuevo estado

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al guardar', 'error');
    }
  };

  function cerrarVentanaServicio(){
    setNuevoServicioActivo(false)
    setEsReservacion(false);
  }

  return (
    <div className="page-container">
      
      {(dropdownAbierto || dropdownEmpleadoAbierto) && (
        <div 
          className="click-outside" 
          onClick={() => { setDropdownAbierto(false); setDropdownEmpleadoAbierto(false); }}
        ></div>
      )}

      <div className="service-card dynamic-card">
        <div className="close-btn" onClick={ cerrarVentanaServicio }>
          <span></span>
          <span></span>
        </div>
        
        <div className={`card-header ${esReservacion ? 'header-reserva' : ''}`}>
            <h2>{esReservacion ? '📅 Nueva Reservación' : '🚘 Nuevo Ingreso'}</h2>
        </div>
        
        {/* LE QUITAMOS EL MAX-HEIGHT Y EL SCROLL FORZADO AQUÍ */}
        <form onSubmit={handleSubmit} className="card-body">
          
          {esReservacion && (
             <div className="form-group slide-in">
                <label>📆 Fecha y Hora de Cita</label>
                <input 
                    type="datetime-local" 
                    className="input-control" 
                    value={fechaReserva}
                    min={minFecha}
                    onChange={(e) => setFechaReserva(e.target.value)}
                    style={{border: '2px solid #90caf9'}} 
                />
             </div>
          )}

          <div className="dynamic-grid">
            <div className="form-group">
              <label>📱 Teléfono</label>
              <input className="input-control" value={telefono} onChange={e => setTelefono(e.target.value)} onBlur={handleBuscarTelefono} placeholder="Buscar..." autoFocus />
            </div>
            
            <div className="form-group">
              <label>👤 Nombre</label>
              <input className={`input-control ${cliente.id ? 'is-locked' : ''}`} value={cliente.nombre} onChange={e => setCliente({...cliente, nombre: e.target.value})} disabled={!!cliente.id} />
            </div>
          </div>

          <div className="divider"></div>

          <div className="form-group">
            <label>🚙 Vehículo</label>
            {vehiculosCliente.length > 0 && (
              <select className="select-control" value={vehiculoSeleccionado} onChange={e => setVehiculoSeleccionado(e.target.value)} style={{marginBottom: 10}}>
                {vehiculosCliente.map(v => <option key={v.id} value={v.id}>{v.modelo} ({v.placa})</option>)}
                <option value="nuevo">➕ Otro...</option>
              </select>
            )}
            
            {vehiculoSeleccionado === 'nuevo' && (
              <div className="new-vehicle-section new-vehicle-grid">
                <input className="input-control" placeholder="Modelo (Ej. Honda Civic)" value={datosNuevoAuto.modelo} onChange={e => setDatosNuevoAuto({...datosNuevoAuto, modelo: e.target.value})} style={{marginBottom: 5}}/>
                <input className="input-control" placeholder="Placa (Ej. ABC-123)" value={datosNuevoAuto.placa} onChange={e => setDatosNuevoAuto({...datosNuevoAuto, placa: e.target.value})} />
              </div>
            )}
          </div>

          <div className="divider"></div>

          <div className="dynamic-grid">
            
            <div className="form-group">
              <label>🧼 Servicios (Selección Múltiple)</label>
              <div className="multiselect-container">
                <div 
                  className="multiselect-trigger" 
                  onClick={() => { setDropdownAbierto(!dropdownAbierto); setDropdownEmpleadoAbierto(false); }}
                >
                  {getTextoSeleccionado()}
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>▼</span>
                </div>
                {dropdownAbierto && (
                  <div className="multiselect-dropdown">
                    {serviciosCatalogo.map(servicio => (
                      <div key={servicio.id} className="multiselect-option" onClick={() => toggleServicio(servicio.id)}>
                        <input type="checkbox" checked={serviciosSeleccionados.includes(servicio.id)} readOnly />
                        <span>{servicio.nombre}</span>
                        <span className="price">${servicio.precio}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label>👷 Asignar a Empleado</label>
              
              <div 
                className="select-control" 
                onClick={() => { setDropdownEmpleadoAbierto(!dropdownEmpleadoAbierto); setDropdownAbierto(false); }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
                style={{ 
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', 
                  alignItems: 'center', backgroundColor: 'white', transition: 'border-color 0.2s' 
                }}
              >
                <span>
                  {empleadoSeleccionado 
                    ? empleados.find(emp => emp.id === empleadoSeleccionado)?.nombre 
                    : <span className="placeholder-text">-- Seleccionar Responsable --</span>}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>▼</span>
              </div>

              {dropdownEmpleadoAbierto && (
                <ul style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '135px',
                  overflowY: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e1',
                  borderRadius: '8px', margin: '5px 0 0 0', padding: 0, listStyle: 'none',
                  zIndex: 50, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  <li 
                    style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                    onClick={() => { setEmpleadoSeleccionado(''); setDropdownEmpleadoAbierto(false); }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span className="placeholder-text">-- Seleccionar Responsable --</span>
                  </li>
                  
                  {empleados.map(emp => (
                    <li 
                      key={emp.id}
                      style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                      onClick={() => { setEmpleadoSeleccionado(emp.id); setDropdownEmpleadoAbierto(false); }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {emp.nombre}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
          </div>

          <div style={{ textAlign: 'right', marginTop: '20px', fontSize: '1.2rem', fontWeight: 'bold', color: '#3b82f6' }}>
            Total: ${totalEstimado.toFixed(2)}
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            style={esReservacion ? {backgroundColor: '#90caf9'} : {backgroundColor: 'rgb(24, 201, 14)'}}
          >
            {esReservacion ? 'AGENDAR CITA' : 'REGISTRAR ORDEN'}
          </button>
        </form>
      </div>
    </div>
  );
}