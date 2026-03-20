import React, { useState, useEffect } from 'react';
import '../../styles/Historial.css';

export default function Historial() {
  const [historial, setHistorial] = useState([]);
  const [resultadosFiltrados, setResultadosFiltrados] = useState([]);
  
  // ESTADOS DE FILTROS
  // Calculamos el mes actual compensando la zona horaria para evitar que brinque al día siguiente
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const mesActual = now.toISOString().slice(0, 7);
  
  const [filtroMes, setFiltroMes] = useState(mesActual);
  const [filtroDia, setFiltroDia] = useState('');
  const [busquedaTexto, setBusquedaTexto] = useState('');

  // 1. OBTENER DATOS DE LA BASE DE DATOS (Se ejecuta al cambiar mes o día)
  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const data = await window.api.getHistorial({ 
          mes: filtroMes, 
          dia: filtroDia 
        });
        setHistorial(data);
      } catch (error) {
        console.error("Error cargando historial:", error);
      }
    };
    cargarHistorial();
  }, [filtroMes, filtroDia]);

  // 2. FILTRADO EN TIEMPO REAL (Se ejecuta al teclear o al recibir nuevos datos)
  useEffect(() => {
    // Si no hay texto, mostramos todo
    if (!busquedaTexto.trim()) {
      setResultadosFiltrados(historial);
      return;
    }

    // Buscamos ignorando mayúsculas y minúsculas
    const texto = busquedaTexto.toLowerCase();
    const filtrados = historial.filter(orden => 
      orden.cliente.toLowerCase().includes(texto) || 
      orden.empleado.toLowerCase().includes(texto)
    );
    
    setResultadosFiltrados(filtrados);
  }, [busquedaTexto, historial]);

  // Calcular el total de dinero visible actualmente en la lista
  const totalGenerado = resultadosFiltrados.reduce((sum, item) => sum + item.total_final, 0);

  // Funciones para manejar qué fecha priorizar
  const handleCambioMes = (e) => {
    setFiltroMes(e.target.value);
    setFiltroDia(''); // Si eliges mes, borramos el día exacto
  };

  const handleCambioDia = (e) => {
    setFiltroDia(e.target.value);
    // Si eliges un día, el backend ignorará el mes, así que es seguro mantener el mes visualmente
  };

  return (
    <div className="historial-admin-container">
      <h1 className="historial-header">📜 Historial de Ventas</h1>

      {/* --- TARJETA DE RESUMEN --- */}
      <div className="historial-summary-row">
        <div className="summary-text">Total del periodo filtrado:</div>
        <div className="summary-total">${totalGenerado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
      </div>

      {/* --- BARRA DE FILTROS --- */}
      <div className="filtros-row">
        {/* Buscador de texto (Cliente/Empleado) */}
        <input 
          type="text" 
          className="filtro-input" 
          placeholder="🔍 Buscar por Cliente o Empleado..." 
          value={busquedaTexto}
          onChange={(e) => setBusquedaTexto(e.target.value)}
        />
        
        {/* Selector de Mes */}
        <input 
          type="month" 
          className="filtro-input filtro-date" 
          value={filtroMes}
          onChange={handleCambioMes}
          title="Filtrar por Mes"
        />

        {/* Selector de Día Exacto */}
        <input 
          type="date" 
          className="filtro-input filtro-date" 
          value={filtroDia}
          onChange={handleCambioDia}
          title="Filtrar por Día Exacto"
        />
      </div>

      {/* --- LISTA DE RESULTADOS --- */}
      <div className="historial-list-container">
        {resultadosFiltrados.map((orden) => (
          <div key={orden.id} className="historial-list-item">
            
            {/* Columna 1: Fecha y Hora */}
            <div className="historial-col-fecha">
              <div>{new Date(orden.fecha_entrada).toLocaleDateString()}</div>
              <div style={{fontWeight: 'normal'}}>{new Date(orden.fecha_entrada).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            </div>

            {/* Columna 2: Detalles */}
            <div className="historial-col-main">
              <span className="historial-cliente">👤 {orden.cliente}</span>
              <div className="historial-detalles">
                🚙 {orden.modelo} ({orden.placa || 'S/P'}) <br/>
                🧼 {orden.servicios_detalle} <br/>
                👷 Atendido por: <span className="historial-empleado">{orden.empleado}</span>
              </div>
            </div>

            {/* Columna 3: Precio y Estado */}
            <div className="historial-col-precio">
              <div>${orden.total_final.toFixed(2)}</div>
              <div style={{fontSize: '0.8rem', color: orden.estado === 'PAGADO' ? '#16a34a' : '#8b5cf6', marginTop: '5px'}}>
                {orden.estado}
              </div>
            </div>

          </div>
        ))}

        {resultadosFiltrados.length === 0 && (
          <div style={{textAlign: 'center', padding: '30px', color: '#94a3b8'}}>
            No se encontraron ventas con los filtros seleccionados.
          </div>
        )}
      </div>
    </div>
  );
}