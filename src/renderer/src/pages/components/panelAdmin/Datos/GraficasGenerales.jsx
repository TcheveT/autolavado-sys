import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const COLORES = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

export default function GraficasGenerales() {
  const [datos, setDatos] = useState(null);
  const [rangoSeleccionado, setRangoSeleccionado] = useState('este_mes');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        const respuesta = await window.api.getGraficasDatos(rangoSeleccionado);
        setDatos(respuesta);
      } catch (error) {
        console.error("Error cargando gráficas:", error);
      }
      setCargando(false);
    };
    cargarDatos();
  }, [rangoSeleccionado]);

  if (cargando || !datos) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando inteligencia de negocio...</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* --- BARRA DE CONTROLES --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ color: '#333', margin: 0 }}>Rendimiento Operativo</h2>
        <select 
          value={rangoSeleccionado} 
          onChange={(e) => setRangoSeleccionado(e.target.value)}
          style={{ padding: '10px 15px', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}
        >
          <option value="7_dias">Últimos 7 días</option>
          <option value="este_mes">Este Mes</option>
          <option value="mes_pasado">Mes Pasado</option>
          <option value="este_ano">Este Año</option>
        </select>
      </div>

      {/* --- GRID DE GRÁFICAS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px' }}>

        {/* 1. TENDENCIA DE VENTAS (Línea) */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', height: '350px' }}>
          <h3 style={{ color: '#475569', marginBottom: '15px', fontSize: '1.1rem', textAlign: 'center' }}>📈 Tendencia de Ingresos</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={datos.tendenciaVentas}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="fecha" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip formatter={(value) => [`$${value}`, 'Ingresos']} />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 2. HORAS PICO (Área) */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', height: '350px' }}>
          <h3 style={{ color: '#475569', marginBottom: '15px', fontSize: '1.1rem', textAlign: 'center' }}>⏰ Horas Pico (Flujo de Autos)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={datos.horasPico}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hora" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} allowDecimals={false} />
              <Tooltip formatter={(value) => [value, 'Autos Lavados']} />
              <Area type="monotone" dataKey="flujo" stroke="#10b981" fill="#d1fae5" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 3. VENTAS POR SERVICIO (Pastel) */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', height: '350px' }}>
          <h3 style={{ color: '#475569', marginBottom: '15px', fontSize: '1.1rem', textAlign: 'center' }}>🧼 Distribución de Servicios</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={datos.ventasPorServicio} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="cantidad" nameKey="nombre" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                {datos.ventasPorServicio.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Solicitudes']} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 4. PRODUCTIVIDAD POR EMPLEADO (Barras Horizontales) */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', height: '350px' }}>
          <h3 style={{ color: '#475569', marginBottom: '15px', fontSize: '1.1rem', textAlign: 'center' }}>👷 Ingresos Generados por Empleado</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={datos.ventasPorEmpleado} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="nombre" type="category" tick={{fontSize: 12}} width={80} />
              <Tooltip formatter={(value) => [`$${value}`, 'Generado']} />
              <Bar dataKey="generado" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
                {datos.ventasPorEmpleado.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}