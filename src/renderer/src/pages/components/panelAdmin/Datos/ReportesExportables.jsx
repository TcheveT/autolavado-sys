import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <--- CAMBIA ESTA LÍNEA
import '../../../styles/ReportesExportables.css';

export default function ReportesExportables() {
  const [datosReporte, setDatosReporte] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  
  // Obtenemos la fecha de hoy localmente
  const hoy = new Date();
  hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
  const hoyString = hoy.toISOString().split('T')[0];

  const [filtros, setFiltros] = useState({
    fechaInicio: hoyString,
    fechaFin: hoyString,
    empleadoId: 'TODOS'
  });

  // 1. CARGAR EMPLEADOS PARA EL SELECTOR
  useEffect(() => {
    const cargarEmpleados = async () => {
      const data = await window.api.getEmpleados();
      setEmpleados(data);
    };
    cargarEmpleados();
  }, []);

  // 2. CARGAR DATOS AL CAMBIAR FILTROS
  useEffect(() => {
    const cargarReporte = async () => {
      try {
        const data = await window.api.getReporteDatos(filtros);
        setDatosReporte(data);
      } catch (error) {
        console.error(error);
      }
    };
    cargarReporte();
  }, [filtros]);

  // --- FUNCIONES DE BOTONES RÁPIDOS ---
  const setRango = (diasAtras) => {
    const fechaIn = new Date();
    fechaIn.setDate(fechaIn.getDate() - diasAtras);
    fechaIn.setMinutes(fechaIn.getMinutes() - fechaIn.getTimezoneOffset());
    
    setFiltros({
      ...filtros,
      fechaInicio: fechaIn.toISOString().split('T')[0],
      fechaFin: hoyString
    });
  };

  const setMesActual = () => {
    const fechaIn = new Date();
    fechaIn.setDate(1); // Día 1 de este mes
    fechaIn.setMinutes(fechaIn.getMinutes() - fechaIn.getTimezoneOffset());
    
    setFiltros({
      ...filtros,
      fechaInicio: fechaIn.toISOString().split('T')[0],
      fechaFin: hoyString
    });
  };

  // --- EXPORTAR A EXCEL ---
  const exportarExcel = () => {
    if (datosReporte.length === 0) return Swal.fire('Aviso', 'No hay datos para exportar', 'warning');
    
    // Formatear datos para Excel
    const datosExcel = datosReporte.map(row => ({
      'Ticket ID': row.ticket,
      'Fecha': row.fecha,
      'Hora': row.hora,
      'Cliente': row.cliente,
      'Servicios': row.servicios,
      'Empleado': row.empleado,
      'Total ($)': row.total
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    
    XLSX.writeFile(workbook, `Reporte_Autolavado_${filtros.fechaInicio}_al_${filtros.fechaFin}.xlsx`);
  };

  // --- EXPORTAR A PDF ---
  const exportarPDF = () => {
    if (datosReporte.length === 0) return Swal.fire('Aviso', 'No hay datos para exportar', 'warning');

    const doc = new jsPDF();
    const totalGenerado = datosReporte.reduce((sum, item) => sum + item.total, 0);

    // Título
    doc.setFontSize(18);
    doc.text('Reporte Financiero y Operativo', 14, 22);
    
    // Subtítulos
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Periodo: ${filtros.fechaInicio} al ${filtros.fechaFin}`, 14, 30);
    doc.text(`Total Generado: $${totalGenerado.toLocaleString('es-MX', {minimumFractionDigits: 2})}`, 14, 36);
    doc.text(`Total Servicios: ${datosReporte.length}`, 14, 42);

    // Tabla
    const tableColumn = ["Ticket", "Fecha", "Cliente", "Servicios", "Empleado", "Total"];
    const tableRows = datosReporte.map(row => [
      `#${row.ticket}`,
      `${row.fecha} ${row.hora}`,
      row.cliente,
      row.servicios,
      row.empleado,
      `$${row.total.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [13, 148, 136] } // Color Verde Esmeralda
    });

    doc.save(`Reporte_Autolavado_${filtros.fechaInicio}_al_${filtros.fechaFin}.pdf`);
  };

  const totalSuma = datosReporte.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="reportes-container">
      
      <div className="reportes-filtros-card">
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#1e293b' }}>⚙️ Configuración del Reporte</h3>
        
        <div className="quick-dates">
          <button className="btn-quick-date" onClick={() => setRango(0)}>Hoy (Diario)</button>
          <button className="btn-quick-date" onClick={() => setRango(7)}>Últimos 7 días (Semanal)</button>
          <button className="btn-quick-date" onClick={setMesActual}>Mes Actual</button>
          <button className="btn-quick-date" onClick={() => setRango(365)}>Último Año (Anual)</button>
        </div>

        <div className="filtros-grid">
          <div className="filtro-group">
            <label>Fecha de Inicio</label>
            <input type="date" value={filtros.fechaInicio} onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})} />
          </div>
          <div className="filtro-group">
            <label>Fecha de Fin</label>
            <input type="date" value={filtros.fechaFin} onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})} />
          </div>
          <div className="filtro-group">
            <label>Filtrar Empleado (Opcional)</label>
            <select value={filtros.empleadoId} onChange={(e) => setFiltros({...filtros, empleadoId: e.target.value})}>
              <option value="TODOS">Todos los empleados</option>
              {empleados.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="export-actions">
          <button className="btn-export btn-pdf" onClick={exportarPDF}>
            📄 Descargar PDF
          </button>
          <button className="btn-export btn-excel" onClick={exportarExcel}>
            📊 Descargar Excel
          </button>
        </div>
      </div>

      <h3 style={{ color: '#475569', marginBottom: '15px' }}>
        👀 Previsualización del Reporte ({datosReporte.length} resultados)
        <span style={{float: 'right', color: '#16a34a'}}>Total: ${totalSuma.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
      </h3>
      
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', maxHeight: '350px', overflowY: 'auto' }}>
        <table className="preview-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Fecha/Hora</th>
              <th>Cliente</th>
              <th>Servicios</th>
              <th>Empleado</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {datosReporte.map((row) => (
              <tr key={row.ticket}>
                <td><strong>#{row.ticket}</strong></td>
                <td>{row.fecha}<br/><small style={{color: '#94a3b8'}}>{row.hora}</small></td>
                <td>{row.cliente}</td>
                <td style={{maxWidth: '200px'}}>{row.servicios}</td>
                <td>{row.empleado}</td>
                <td style={{color: '#16a34a', fontWeight: 'bold'}}>${row.total.toFixed(2)}</td>
              </tr>
            ))}
            {datosReporte.length === 0 && (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '30px', color: '#94a3b8'}}>No hay datos en este rango de fechas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}