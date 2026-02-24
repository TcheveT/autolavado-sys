import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Legend, Cell 
} from 'recharts';
import '../styles/Dashboard.css';

const COLORES_PIE = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarKpis();
  }, []);

  const cargarKpis = async () => {
    try {
      const resultado = await window.api.getKpisMensuales();
      setData(resultado);
      setLoading(false);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    }
  };

  if (loading) return <div className="dashboard-wrapper">Cargando métricas...</div>;

  // --- LÓGICA CORREGIDA DE KPI (Punto 1) ---
  const ingresoMes = data.mesActual?.total || 0;
  const ingresoAnterior = data.mesAnterior?.total || 0;
  
  let crecimientoTexto = "Primer mes";
  let esPositivo = true;

  // Solo calculamos porcentaje si hubo ventas el mes anterior
  if (ingresoAnterior > 0) {
    const calculo = ((ingresoMes - ingresoAnterior) / ingresoAnterior) * 100;
    crecimientoTexto = `${Math.abs(calculo).toFixed(1)}%`;
    esPositivo = calculo >= 0;
  } else if (ingresoMes > 0 && ingresoAnterior === 0) {
    // Si vendimos algo hoy y nada ayer, es un aumento absoluto
    crecimientoTexto = "100% (Inicio)";
  } else {
    crecimientoTexto = "---";
  }

  const ticketPromedio = data.mesActual?.cantidad > 0 
    ? (ingresoMes / data.mesActual.cantidad) 
    : 0;

  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">📊 Reporte Mensual</h1>

      {/* 1. TARJETAS SUPERIORES (KPIs) */}
      <div className="kpi-grid">
        
        {/* VENTA MENSUAL */}
        <div className="kpi-card blue">
          <div className="kpi-title">Ingresos (Mes)</div>
          <div className="kpi-value">${ingresoMes.toLocaleString()}</div>
          <div className="kpi-sub">
            {ingresoAnterior > 0 ? (
                <>
                    <span className={esPositivo ? 'trend-up' : 'trend-down'}>
                    {esPositivo ? '▲' : '▼'} {crecimientoTexto}
                    </span>
                    <span style={{marginLeft: 5}}>vs mes anterior</span>
                </>
            ) : (
                <span style={{color: '#94a3b8'}}>🚀 Inicio de operaciones</span>
            )}
          </div>
        </div>

        {/* AUTOS LAVADOS */}
        <div className="kpi-card green">
          <div className="kpi-title">Clientes Satisfechos</div>
          <div className="kpi-value">{data.mesActual?.cantidad || 0}</div>
          <div className="kpi-sub">Este mes</div>
        </div>

        {/* TICKET PROMEDIO */}
        <div className="kpi-card purple">
          <div className="kpi-title">Ticket Promedio</div>
          <div className="kpi-value">${ticketPromedio.toFixed(0)}</div>
          <div className="kpi-sub">Promedio por auto</div>
        </div>

        {/* VENTA SEMANAL */}
        <div className="kpi-card orange">
          <div className="kpi-title">Ingresos (Semana)</div>
          <div className="kpi-value">${(data.semanaActual?.total || 0).toLocaleString()}</div>
          <div className="kpi-sub">Semana actual</div>
        </div>
      </div>

      {/* 2. GRÁFICAS */}
      <div className="charts-grid">
        
        {/* GRÁFICA DE BARRAS */}
        <div className="chart-container">
          <div className="chart-header">Tendencia de Ventas (Últimos 7 días)</div>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data.graficaVentas}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`$${value}`, 'Venta']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="venta" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* GRÁFICA DE PIE CORREGIDA (Punto 2 y 3) */}
        <div className="chart-container">
          <div className="chart-header">Servicios Más Vendidos</div>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={data.topServicios}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="cantidad" 
                nameKey="nombre" /* <--- ESTO ARREGLA LA LEYENDA */
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`} /* Muestra % en el círculo */
              >
                {/* Si el editor sigue marcando 'Cell' deprecated, no te preocupes, 
                   es un falso positivo común en Recharts. Funciona perfectamente.
                   Se mantiene porque es la forma correcta de asignar colores custom.
                */}
                {data.topServicios.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORES_PIE[index % COLORES_PIE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Cantidad']} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. TABLA: CLIENTES FRECUENTES */}
      <div className="table-container">
        <div className="chart-header">🏆 Clientes Top del Mes</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Visitas</th>
              <th>Total Gastado</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.topClientes.length > 0 ? (
              data.topClientes.map((c, i) => (
                <tr key={i}>
                  <td style={{fontWeight: 'bold'}}>{c.nombre}</td>
                  <td>{c.visitas} visitas</td>
                  <td style={{color: '#16a34a', fontWeight: 'bold'}}>${c.gastado}</td>
                  <td>
                    {i === 0 ? '👑 VIP' : 'Frecuente'}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" style={{textAlign:'center', padding: 20}}>Aún no hay datos suficientes este mes</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* TABLA NUEVA: PRODUCTIVIDAD EMPLEADOS */}
      <div className="table-container">
        <div className="chart-header">👷 Productividad del Equipo</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Autos Atendidos (Mes)</th>
              <th>Rendimiento</th>
            </tr>
          </thead>
          <tbody>
            {data.productividadEmpleados?.length > 0 ? (
              data.productividadEmpleados.map((emp, i) => (
                <tr key={i}>
                  <td style={{fontWeight: 'bold'}}>{emp.nombre}</td>
                  <td style={{color: '#3b82f6', fontWeight: 'bold'}}>{emp.total_servicios} autos</td>
                  <td>
                    {/* Lógica visual simple para premiar al que más lava */}
                    {i === 0 && emp.total_servicios > 0 ? '⭐ Empleado del Mes' : 'Activo'}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" style={{textAlign:'center', padding: 20}}>No hay empleados registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>


    </div>
  );
}