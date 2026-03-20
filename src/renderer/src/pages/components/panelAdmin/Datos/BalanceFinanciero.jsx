import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../../../styles/BalanceFinanciero.css';

export default function BalanceFinanciero() {
  const [balance, setBalance] = useState({ ingresos: 0, egresos: 0, utilidadNeta: 0, margen: 0, listaGastos: [] });
  const [cargando, setCargando] = useState(true);
  
  // Estados del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null); // null = Crear Nuevo
  const [formData, setFormData] = useState({ categoria: 'Insumos', descripcion: '', monto: '', fecha: '' });
  
  // Por defecto, calculamos el mes actual
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const hoyFormato = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const mesActualReal = hoyFormato.slice(0, 7); // YYYY-MM
  
  const [filtroMes, setFiltroMes] = useState(mesActualReal);

  const cargarBalance = async () => {
    setCargando(true);
    try {
      const data = await window.api.getBalance(filtroMes);
      setBalance(data);
    } catch (error) {
      console.error("Error cargando balance:", error);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarBalance();
  }, [filtroMes]);

  // FUNCIÓN INTELIGENTE PARA ABRIR MODAL
  const abrirModal = (gasto = null) => {
    if (gasto) {
      // MODO EDITAR: Cargamos los datos del gasto seleccionado
      setEditandoId(gasto.id);
      setFormData({ 
        categoria: gasto.categoria, 
        descripcion: gasto.descripcion || '', 
        monto: gasto.monto, 
        fecha: gasto.fecha 
      });
    } else {
      // MODO NUEVO: Lógica de fecha automática
      setEditandoId(null);
      
      let fechaDefecto = hoyFormato;
      // Si el usuario está viendo un mes diferente al actual, ponemos por defecto el día 1 de ese mes
      if (filtroMes !== mesActualReal) {
        fechaDefecto = `${filtroMes}-01`;
      }

      setFormData({ categoria: 'Insumos', descripcion: '', monto: '', fecha: fechaDefecto });
    }
    setModalAbierto(true);
  };

  const handleGuardarGasto = async (e) => {
    e.preventDefault();
    if (!formData.monto || !formData.categoria || !formData.fecha) {
      return Swal.fire('Aviso', 'Completa la categoría, monto y fecha', 'warning');
    }

    try {
      if (editandoId) {
        await window.api.updateGasto({ id: editandoId, ...formData });
        Swal.fire({ icon: 'success', title: 'Gasto Actualizado', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
      } else {
        await window.api.addGasto(formData);
        Swal.fire({ icon: 'success', title: 'Gasto Registrado', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
      }
      setModalAbierto(false);
      cargarBalance(); 
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo guardar el gasto', 'error');
    }
  };

  const handleEliminarGasto = (id, categoria) => {
    Swal.fire({
      title: '¿Eliminar este gasto?',
      text: `Se borrará el registro de "${categoria}". Esta acción recalculará tu Utilidad Neta.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, eliminar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await window.api.deleteGasto(id);
        Swal.fire('Eliminado', 'El gasto ha sido borrado.', 'success');
        cargarBalance();
      }
    });
  };

  if (cargando && balance.ingresos === 0) return <div>Calculando finanzas...</div>;

  const colorUtilidad = balance.utilidadNeta >= 0 ? 'text-ingreso' : 'text-warning';

  return (
    <div className="balance-container">
      
      <div className="balance-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Mes Financiero:</h2>
          <input 
            type="month" 
            value={filtroMes} 
            onChange={(e) => setFiltroMes(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1.1rem', outline: 'none' }}
          />
        </div>

        <button className="btn-add-gasto" onClick={() => abrirModal()}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Gasto
        </button>
      </div>

      <div className="kpi-financiero-grid">
        <div className="kpi-card-fin">
          <h3>Total Ingresos (Ventas)</h3>
          <div className="kpi-monto text-neutral">
            ${balance.ingresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="kpi-card-fin">
          <h3>Total Egresos (Punto Eq.)</h3>
          <div className="kpi-monto text-egreso">
            -${balance.egresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="kpi-card-fin" style={{ border: `2px solid ${balance.utilidadNeta >= 0 ? '#16a34a' : '#f59e0b'}` }}>
          <h3>Utilidad Neta (Ganancia)</h3>
          <div className={`kpi-monto ${colorUtilidad}`}>
            ${balance.utilidadNeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="kpi-card-fin">
          <h3>Margen de Ganancia</h3>
          <div className={`kpi-monto ${colorUtilidad}`}>
            {balance.margen}%
          </div>
        </div>
      </div>

      <h3 style={{ color: '#475569', marginBottom: '10px' }}>📉 Detalle de Egresos Registrados</h3>
      <div className="gastos-list">
        {balance.listaGastos.map(gasto => (
          <div key={gasto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
            
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 'bold', display: 'block' }}>{gasto.categoria}</span>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{gasto.descripcion || 'Sin descripción'} | 📅 {gasto.fecha}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '1.2rem' }}>
                -${gasto.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              
              {/* BOTONES DE ACCIÓN (Reusamos estilos en línea para no tocar CSS extra) */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => abrirModal(gasto)}
                  title="Editar Gasto"
                  style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  onClick={() => handleEliminarGasto(gasto.id, gasto.categoria)}
                  title="Eliminar Gasto"
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

          </div>
        ))}
        {balance.listaGastos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No hay gastos registrados en este periodo.</div>
        )}
      </div>

      {/* MODAL PARA CREAR / EDITAR */}
      {modalAbierto && (
        <div className="modal-overlay" style={{ zIndex: 999 }}>
          <div className="form-modal">
            <h2>{editandoId ? '✏️ Editar Egreso' : '💸 Registrar Nuevo Egreso'}</h2>
            <form onSubmit={handleGuardarGasto}>
              
              <div className="form-group-modal">
                <label>Categoría</label>
                <select 
                  className="input-modal"
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                >
                  <option value="Sueldos">Sueldos / Nómina</option>
                  <option value="Insumos">Insumos (Jabón, Cera, etc.)</option>
                  <option value="Renta">Renta del Local</option>
                  <option value="Servicios">Servicios (Luz, Agua, Internet)</option>
                  <option value="Mantenimiento">Mantenimiento de Equipo</option>
                  <option value="Otros">Otros Gastos</option>
                </select>
              </div>

              <div className="form-group-modal">
                <label>Monto ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  className="input-modal" 
                  placeholder="0.00" 
                  value={formData.monto}
                  onChange={(e) => setFormData({...formData, monto: e.target.value})}
                  autoFocus={!editandoId}
                />
              </div>

              <div className="form-group-modal">
                <label>Descripción (Opcional)</label>
                <input 
                  type="text" 
                  className="input-modal" 
                  placeholder="Ej: Compra de 20L de Shampoo" 
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                />
              </div>

              <div className="form-group-modal">
                <label>Fecha del Gasto</label>
                <input 
                  type="date" 
                  className="input-modal" 
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-modal btn-cancel" onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button type="submit" className="btn-modal btn-save" style={{backgroundColor: editandoId ? '#f59e0b' : '#ef4444'}}>
                  {editandoId ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}