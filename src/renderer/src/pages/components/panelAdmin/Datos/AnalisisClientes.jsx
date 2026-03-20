import React, { useState, useEffect } from 'react';
import '../../../styles/AnalisisClientes.css';

export default function AnalisisClientes() {
  const [datos, setDatos] = useState({ topClientes: [], clientesInactivos: [], rendimientoEmpleados: [] });
  const [cargando, setCargando] = useState(true);
  
  // Porcentaje de comisión dinámico (Por defecto 20%)
  const [porcentajeComision, setPorcentajeComision] = useState(20);

  // Fecha por defecto (Mes actual)
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const [filtroMes, setFiltroMes] = useState(now.toISOString().slice(0, 7));

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        const respuesta = await window.api.getAnalisisPersonas(filtroMes);
        setDatos(respuesta);
      } catch (error) {
        console.error("Error cargando análisis:", error);
      }
      setCargando(false);
    };
    cargarDatos();
  }, [filtroMes]);

  if (cargando && datos.topClientes.length === 0) return <div>Analizando datos de clientes...</div>;

  return (
    <div className="analisis-container">
      
      {/* CONTROL DE MES */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Mes de Análisis:</h2>
        <input 
          type="month" 
          value={filtroMes} 
          onChange={(e) => setFiltroMes(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1.1rem', outline: 'none' }}
        />
      </div>

      <div className="analisis-grid">
        
        {/* === COLUMNA IZQUIERDA: CLIENTES === */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* 1. TOP CLIENTES */}
          <div className="analisis-card">
            <h3>👑 Top 10 Clientes VIP <span style={{fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal'}}>Este Mes</span></h3>
            {datos.topClientes.map((cliente, index) => (
              <div key={index} className="analisis-list-item">
                <div>
                  <div className="item-main-text">{index + 1}. {cliente.nombre}</div>
                  <div className="item-sub-text">Visitas: {cliente.visitas} | Ticket Promedio: ${cliente.ticket_promedio.toFixed(2)}</div>
                </div>
                <div className="item-value-text text-gold">
                  ${cliente.gastado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
            {datos.topClientes.length === 0 && <div className="item-sub-text">No hay clientes este mes.</div>}
          </div>

          {/* 2. CLIENTES INACTIVOS */}
          <div className="analisis-card">
            <h3>⚠️ Clientes Inactivos <span style={{fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal'}}>+30 días ausentes</span></h3>
            {datos.clientesInactivos.map((cliente, index) => (
              <div key={index} className="analisis-list-item">
                <div>
                  <div className="item-main-text">{cliente.nombre}</div>
                  <div className="item-sub-text">📱 {cliente.telefono || 'Sin número'}</div>
                  <div className="item-sub-text">Última vez: {new Date(cliente.ultima_visita).toLocaleDateString()}</div>
                </div>
                <div className="item-value-text text-danger">
                  Hace {cliente.dias_ausente} días
                </div>
              </div>
            ))}
            {datos.clientesInactivos.length === 0 && <div className="item-sub-text">¡Excelente! Todos tus clientes son recientes.</div>}
          </div>

        </div>


        {/* === COLUMNA DERECHA: PERSONAL === */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* 3. RENDIMIENTO Y COMISIONES */}
          <div className="analisis-card">
            <h3>
              👷 Productividad y Comisiones
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', fontWeight: 'normal' }}>
                Pago: 
                <input 
                  type="number" 
                  className="comision-input" 
                  value={porcentajeComision} 
                  onChange={(e) => setPorcentajeComision(e.target.value)}
                  min="0" max="100"
                /> %
              </div>
            </h3>
            
            {datos.rendimientoEmpleados.map((emp, index) => {
              // Calculamos la comisión en tiempo real
              const pagoComision = (emp.generado * (porcentajeComision / 100));
              
              return (
                <div key={index} className="analisis-list-item" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="item-main-text">{emp.nombre}</div>
                    <div className="item-sub-text">Autos Atendidos: <strong>{emp.servicios}</strong></div>
                    <div className="item-sub-text">Ingresos Generados: <span className="text-success">${emp.generado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                  </div>
                  
                  <div style={{ textAlign: 'right', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '2px' }}>A Pagar ({porcentajeComision}%)</div>
                    <div className="item-value-text" style={{ color: '#3b82f6', fontSize: '1.2rem' }}>
                      ${pagoComision.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              );
            })}
            {datos.rendimientoEmpleados.length === 0 && <div className="item-sub-text">No hay empleados registrados.</div>}
          </div>

        </div>

      </div>
    </div>
  );
}