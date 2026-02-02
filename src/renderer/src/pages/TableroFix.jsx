import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import './styles/Tablero.css';

export default function Tablero() {
  const [ordenes, setOrdenes] = useState([]);
  
  // Estado para el Modal (Objeto del auto a cobrar o null)
  const [ordenParaCobrar, setOrdenParaCobrar] = useState(null);

  const cargarOrdenes = async () => {
    const data = await window.api.getOrdenesActivas();
    setOrdenes(data);
  };

  useEffect(() => {
    cargarOrdenes();
    const intervalo = setInterval(cargarOrdenes, 30000);
    return () => clearInterval(intervalo);
  }, []);

  // Abrir Modal
  const abrirCobro = (orden) => {
    setOrdenParaCobrar(orden);
  };

  // Cerrar Modal
  const cerrarCobro = () => {
    setOrdenParaCobrar(null);
  };

  // Procesar Pago (Solo Efectivo)
  const procesarCobro = async () => {
    if (!ordenParaCobrar) return;

    try {
      const datosFinales = {
        id: ordenParaCobrar.id,
        total: ordenParaCobrar.precio // Enviamos el total para confirmar
      };

      const success = await window.api.terminarOrden(datosFinales);
      
      if (success) {
        cerrarCobro();
        cargarOrdenes();
        
        // Alerta simplificada
        Swal.fire({
          icon: 'success',
          title: '¡Cobrado!',
          text: 'Servicio finalizado correctamente.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo finalizar', 'error');
    }
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <h2>🚧 Vehículos en Proceso ({ordenes.length})</h2>
        <button onClick={cargarOrdenes} style={{padding: '8px 15px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #ccc'}}>
          🔄 Actualizar
        </button>
      </div>

      {/* GRID */}
      {ordenes.length === 0 ? (
        <div className="empty-state">
          <p>No hay vehículos en servicio actualmente 😴</p>
        </div>
      ) : (
        <div className="cards-grid">
          {ordenes.map((orden) => (
            <div key={orden.id} className="order-card">
              <div className="card-top">
                <h3>{orden.modelo}</h3>
                <span className="placa-badge">{orden.placa || 'SIN PLACA'}</span>
              </div>
              <div className="card-details">
                <div className="detail-row">
                  <span>👤 Cliente:</span>
                  <strong>{orden.cliente}</strong>
                </div>
                <div className="detail-row">
                  <span>🚿 Servicio:</span>
                  <strong>{orden.servicio}</strong>
                </div>
                <span className="time-elapsed">
                  ⏱ {formatDistanceToNow(new Date(orden.fecha_entrada), { addSuffix: true, locale: es })}
                </span>
              </div>
              <button 
                className="btn-finish"
                onClick={() => abrirCobro(orden)}
              >
                💲 COBRAR
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL SIMPLIFICADO (SOLO MUESTRA TOTAL) */}
      {ordenParaCobrar && (
        <div className="modal-overlay">
          <div className="ticket-modal">
            
            <div className="ticket-header">
              <h2>Cobrar Servicio</h2>
              <p>Confirma el pago en efectivo</p>
            </div>

            <div className="ticket-body">
              <div className="ticket-row">
                <span>Vehículo:</span>
                <strong>{ordenParaCobrar.modelo}</strong>
              </div>
              <div className="ticket-row">
                <span>Servicio:</span>
                <span>{ordenParaCobrar.servicio}</span>
              </div>

              {/* SOLO MOSTRAMOS EL TOTAL, SIN SELECTOR */}
              <div className="ticket-row total">
                <span>TOTAL A RECIBIR:</span>
                <span>${ordenParaCobrar.precio.toFixed(2)}</span>
              </div>
              
              <div style={{textAlign: 'center', color: '#64748b', fontSize: '0.9rem', marginTop: '10px'}}>
                <em>(Único método aceptado: Efectivo)</em>
              </div>
            </div>

            <div className="ticket-footer">
              <button className="btn-cancel" onClick={cerrarCobro}>
                Cancelar
              </button>
              <button className="btn-confirm" onClick={procesarCobro}>
                ✅ Confirmar Pago
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}