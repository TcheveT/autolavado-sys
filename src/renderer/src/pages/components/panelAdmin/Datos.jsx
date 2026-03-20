import React, { useState } from 'react';
import '../../styles/Datos.css';
import Swal from 'sweetalert2'
// Importaremos los submódulos aquí conforme los vayamos creando
import GraficasGenerales   from './Datos/GraficasGenerales';
import BalanceFinanciero   from './Datos/BalanceFinanciero';
import AnalisisClientes    from './Datos/AnalisisClientes';
import ReportesExportables from './Datos/ReportesExportables';

export default function DatosAdmin() {
  // Estado para controlar qué pestaña está activa. Por defecto: 'balance'
  const [tabActiva, setTabActiva] = useState('balance');


  return (
    <div className="datos-admin-container">


      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="datos-header" style={{ marginBottom: 0 }}>📊 Inteligencia de Negocio</h1>
      </div>

      {/* --- MENÚ DE PESTAÑAS --- */}
      <div className="datos-tabs-nav">
        <button 
          className={`datos-tab-btn ${tabActiva === 'graficas' ? 'active' : ''}`}
          onClick={() => setTabActiva('graficas')}
        >
          📈 Gráficas y Operación
        </button>
        
        <button 
          className={`datos-tab-btn ${tabActiva === 'balance' ? 'active' : ''}`}
          onClick={() => setTabActiva('balance')}
        >
          💰 Balance Financiero
        </button>

        <button 
          className={`datos-tab-btn ${tabActiva === 'clientes' ? 'active' : ''}`}
          onClick={() => setTabActiva('clientes')}
        >
          👥 Clientes y Personal
        </button>

        <button 
          className={`datos-tab-btn ${tabActiva === 'reportes' ? 'active' : ''}`}
          onClick={() => setTabActiva('reportes')}
        >
          📄 Exportar Reportes
        </button>
      </div>

      {/* --- ÁREA DE CONTENIDO (Renderizado Condicional) --- */}
      <div className="datos-content-area">
        
        {tabActiva === 'graficas' && (
          <div>
            {/* <h2>Módulo de Gráficas en construcción...</h2> */}
            {<GraficasGenerales />}
          </div>
        )}

        {tabActiva === 'balance' && (
          <div>
            { <BalanceFinanciero /> }
          </div>
        )}

        {tabActiva === 'clientes' && (
          <div>
            { <AnalisisClientes /> }
          </div>
        )}

        {tabActiva === 'reportes' && (
          <div>
            { <ReportesExportables /> }
          </div>
        )}

      </div>
    </div>
  );
}