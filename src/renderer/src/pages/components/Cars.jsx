import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../styles/Cars.css';

// Importación de imágenes
import listaPNG from '../../assets/img/list.png';
import sucioPNG from '../../assets/img/sucio.png';
import lavandoPNG from '../../assets/img/lavando.png';
import limpioPNG from '../../assets/img/limpio.png';
import whatsPNG from '../../assets/img/whatsapp.png';
import cobroPNG from '../../assets/img/pay.png';


function Cars( {nuevoCarro, setNuevoCarro } ) {
  const [autos, setAutos] = useState([]);
  
  // Estados para el Modal de Cobro
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ordenACobrar, setOrdenACobrar] = useState(null);
  const [montoRecibido, setMontoRecibido] = useState('');

  // --- 1. CARGA DE DATOS (Polling) ---
  const cargarDatos = async () => {
    try {
      const data = await window.api.getBoardData();
      setAutos(data);
    } catch (error) {
      console.error("Error cargando tablero:", error);
    }
  };

  useEffect(() => {
    cargarDatos();
    // // Actualizar cada 3 segundos para mantener el tablero vivo
    // const intervalo = setInterval(cargarDatos, 3000);
    // return () => clearInterval(intervalo);
  }, [nuevoCarro]);


  // --- 2. HELPERS VISUALES ---
  
  // Asigna la clase CSS del color de fondo según el estado
  const getClaseEstado = (estado) => {
    switch(estado) {
      case 'EN_ESPERA': return 'bg-espera';
      case 'EN_PROCESO': return 'bg-proceso';
      case 'FINALIZADO': return 'bg-finalizado';
      case 'RESERVACION': return 'bg-reservacion';
      default: return ''; // Gris por defecto
    }
  };

  // Asigna el icono central según el estado
  const getIconoEstado = (estado) => {
    if (estado === 'EN_PROCESO') return lavandoPNG;
    if (estado === 'FINALIZADO') return limpioPNG;
    return sucioPNG; // Aplica para Espera y Reservación
  };


  // --- 3. MANEJADORES DE ACCIÓN ---

  const handleCancelar = (id) => {
    Swal.fire({
      title: '¿Cancelar Servicio?',
      text: "El vehículo será eliminado del tablero.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await window.api.cancelarOrden(id);
        cargarDatos();
        setNuevoCarro(!nuevoCarro)
        Swal.fire('Cancelado', '', 'success');
      }
    });
  };

  const handleCambioFase = (id, estadoActual) => {
    let nuevoEstado = '';
    let titulo = '';

    if (estadoActual === 'EN_ESPERA') {
      nuevoEstado = 'EN_PROCESO';
      titulo = '¿Iniciar el Lavado?';
    } else if (estadoActual === 'EN_PROCESO') {
      nuevoEstado = 'FINALIZADO';
      titulo = '¿Finalizar el Lavado?';
    }

    Swal.fire({
      title: titulo,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3b82f6'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await window.api.updateEstadoOrden({ id, nuevoEstado });
        cargarDatos();
        setNuevoCarro(!nuevoCarro)
      }
    });
  };

  const handleWhatsApp = (telefono, cliente) => {
    // 1. Limpieza agresiva: Quitar todo lo que NO sea un número
    let telLimpio = telefono.replace(/\D/g, ''); 
    
    // 2. Validación para México (Importante)
    // Si el número tiene 10 dígitos (ej: 311 123 4567), le agregamos el 52
    if (telLimpio.length === 10) {
      telLimpio = `52${telLimpio}`;
    } 
    // Si por alguna razón ya traía el 52 (12 dígitos), lo dejamos así.
    
    const mensaje = `Hola ${cliente}, tu auto ya está listo. ¡Te esperamos!`;
    
    // 3. Usamos la API universal de WhatsApp
    // Esta URL funciona mejor porque el navegador se encarga de "despertar" a la App correctamente
    const url = `https://api.whatsapp.com/send?phone=${telLimpio}&text=${encodeURIComponent(mensaje)}`;
    
    // 4. Abrimos fuera de Electron
    window.api.abrirLinkExterno(url);
  };


  // --- 4. LÓGICA DE COBRO ---

  const abrirCobro = (auto) => {
    setOrdenACobrar(auto);
    setMontoRecibido(''); 
    setModalAbierto(true);
  };

  const confirmarCobro = async () => {
    const recibido = parseFloat(montoRecibido);
    const total = ordenACobrar.total_final;

    if (!recibido || recibido < total) {
      return Swal.fire('Error', 'El monto recibido es menor al total', 'error');
    }

    // Procesar pago en BD
    await window.api.pagarOrden({ id: ordenACobrar.id, metodoPago: 'EFECTIVO' });
    
    setModalAbierto(false);
    setOrdenACobrar(null);
    setNuevoCarro(!nuevoCarro)
    cargarDatos(); // Recargar para que el auto desaparezca
    
    Swal.fire({
      icon: 'success',
      title: '¡Cobrado!',
      text: `Cambio a entregar: $${(recibido - total).toFixed(2)}`,
      timer: 3000
    });
  };


  // --- RENDERIZADO ---
  return (
    <>
      {/* Mapeamos los autos. No usamos wrapper porque dijiste que el padre lo tiene. */}
      {autos.map((auto, index) => (
        <div key={auto.id} className={`container-car ${getClaseEstado(auto.estado)}`}>
            
            {/* CABECERA */}
            <div className='head-car'>
                <h2>Auto: {index + 1}</h2>
                
                {/* IMPORTANTE: El popup va DENTRO de la etiqueta <p> 
                   para que funcione tu CSS: .head-car p:hover .detail-popup 
                */}
                <p>
                    Detalle <img src={ listaPNG } alt="lista" />
                    
                    <div className="detail-popup">
                        <div><strong>Servicios:</strong> {auto.servicios_detalle}</div>
                        <div style={{marginTop: 5}}><strong>Tel:</strong> {auto.telefono}</div>
                        <div style={{marginTop: 5}}><strong>Emp:</strong> {auto.empleado}</div>
                    </div>
                </p>

                <div className="close-btn-car" onClick={() => handleCancelar(auto.id)}>
                    <span></span>
                    <span></span>
                </div>
            </div>

            {/* CUERPO */}
            <div className='body-car'>
                <div className='info-car'>
                    <p><b>Cliente:</b> {auto.cliente}</p>
                    <p><b>Vehículo:</b> {auto.vehiculo}</p>
                    <p><b>Placa:</b> {auto.placa || '---'}</p>
                    <p><b>Hora:</b> {new Date(auto.fecha_entrada).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                    <p><b>Total:</b> ${auto.total_final}</p>
                </div>
                <img src={ getIconoEstado(auto.estado) } alt="estado" />
            </div>

            {/* PIE (BOTONES DINÁMICOS) */}
            <div className='foot-car'>
                
                {/* Botón para Iniciar */}
                {auto.estado === 'EN_ESPERA' && (
                  <button className='btn-action btn-start' onClick={() => handleCambioFase(auto.id, 'EN_ESPERA')}>
                     Iniciar
                  </button>
                )}

                {/* Botón para Finalizar */}
                {auto.estado === 'EN_PROCESO' && (
                  <button className='btn-action btn-finish' onClick={() => handleCambioFase(auto.id, 'EN_PROCESO')}>
                     Finalizar
                  </button>
                )}

                {/* Botones Finales */}
                {auto.estado === 'FINALIZADO' && (
                  <>
                    <button className='btn-action btn-whats' onClick={() => handleWhatsApp(auto.telefono, auto.cliente)}>
                        <img src={ whatsPNG } alt="ws" /> Mensaje
                    </button>
                    <button className='btn-action btn-pay' onClick={() => abrirCobro(auto)}>
                        <img src={ cobroPNG } alt="pay" /> Cobrar
                    </button>
                  </>
                )}
            </div>
        </div>
      ))}


      {/* --- MODAL DE COBRO PERSONALIZADO (Overlay) --- */}
      {modalAbierto && ordenACobrar && (
        <div className="cobro-overlay">
            <div className="cobro-modal">
                <h2>💸 Cobrar Servicio</h2>
                
                {/* 1. Datos del Cliente */}
                <div className="cobro-datos-cliente">
                    <span>👤 {ordenACobrar.cliente}</span>
                    <span>🚗 {ordenACobrar.vehiculo}</span>
                </div>

                {/* 2. Lista de Servicios (Desglose) */}
                <div className="cobro-lista-servicios">
                    <p style={{color: '#999', fontSize: '0.9rem', marginBottom: '5px', textAlign:'left'}}>Desglose:</p>
                    {ordenACobrar.servicios_detalle.split(',').map((item, idx) => {
                        // El backend nos manda "Nombre||Precio", lo separamos aquí
                        const [nombre, precio] = item.split('||'); 
                        return (
                            <div key={idx} className="servicio-item">
                                <span>{nombre}</span>
                                <strong>${precio}</strong>
                            </div>
                        );
                    })}
                </div>

                {/* 3. Total Final */}
                <div className="cobro-total-display">
                    Total: ${ordenACobrar.total_final}
                </div>

                {/* 4. Input de Dinero */}
                <input 
                    type="number" 
                    className="cobro-input"
                    placeholder="Monto Recibido ($)"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') confirmarCobro(); }} // Cobrar con Enter
                    autoFocus
                />

                {/* 5. Cambio */}
                <div className="cambio-text">
                    {montoRecibido && parseFloat(montoRecibido) >= ordenACobrar.total_final 
                        ? `Cambio: $${(parseFloat(montoRecibido) - ordenACobrar.total_final).toFixed(2)}`
                        : ''
                    }
                </div>

                {/* 6. Botones (Misma línea, igual tamaño) */}
                <div className="cobro-actions">
                    <button 
                        className="btn-modal btn-cancelar" 
                        onClick={() => setModalAbierto(false)}
                    >
                        CANCELAR
                    </button>
                    
                    <button 
                        className="btn-modal btn-confirmar" 
                        onClick={confirmarCobro}
                    >
                        CONFIRMAR PAGO
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}

export default Cars;