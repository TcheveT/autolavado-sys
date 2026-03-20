import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../../styles/Empleados.css';

// Función auxiliar para calcular años y meses trabajando
const calcularAntiguedad = (fechaIngreso) => {
  if (!fechaIngreso) return '';
  const inicio = new Date(fechaIngreso);
  const hoy = new Date();
  
  let years = hoy.getFullYear() - inicio.getFullYear();
  let months = hoy.getMonth() - inicio.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  let texto = [];
  if (years > 0) texto.push(`${years} año${years > 1 ? 's' : ''}`);
  if (months > 0) texto.push(`${months} mes${months > 1 ? 'es' : ''}`);
  
  if (years === 0 && months === 0) return '(Recién ingreso)';
  
  return `(${texto.join(' y ')})`;
};

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  
  // Agregamos fecha_contratacion al estado
  const [formData, setFormData] = useState({ 
    nombre: '', 
    telefono: '', 
    contacto_emergencia: '',
    fecha_contratacion: ''
  });

  const cargarEmpleados = async () => {
    try {
      const data = await window.api.getEmpleados();
      setEmpleados(data);
    } catch (error) {
      console.error("Error cargando empleados:", error);
    }
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const abrirModal = (empleado = null) => {
    // Obtenemos la fecha de hoy en formato YYYY-MM-DD para el valor por defecto
    const hoy = new Date().toISOString().split('T')[0];

    if (empleado) {
      setEditandoId(empleado.id);
      setFormData({ 
        nombre: empleado.nombre || '', 
        telefono: empleado.telefono || '', 
        contacto_emergencia: empleado.contacto_emergencia || '',
        fecha_contratacion: empleado.fecha_contratacion || hoy
      });
    } else {
      setEditandoId(null);
      setFormData({ 
        nombre: '', 
        telefono: '', 
        contacto_emergencia: '',
        fecha_contratacion: hoy // Por defecto hoy al crear nuevo
      });
    }
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!formData.nombre) {
      return Swal.fire('Aviso', 'El nombre del empleado es obligatorio', 'warning');
    }

    try {
      if (editandoId) {
        await window.api.updateEmpleado({ id: editandoId, ...formData });
        Swal.fire({ icon: 'success', title: 'Actualizado', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
      } else {
        await window.api.addEmpleado(formData);
        Swal.fire({ icon: 'success', title: 'Creado', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
      }
      setModalAbierto(false);
      cargarEmpleados(); 
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo guardar el empleado', 'error');
    }
  };

  const handleEliminar = (id, nombre) => {
    Swal.fire({
      title: '¿Dar de baja a este empleado?',
      text: `"${nombre}" ya no podrá ser asignado a nuevos servicios, pero su historial se conservará.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, dar de baja'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await window.api.deleteEmpleado(id);
        if (res.success) {
          Swal.fire('Dado de baja', 'El empleado ha sido removido de la lista activa.', 'success');
          cargarEmpleados();
        }
      }
    });
  };

  return (
    <div className="empleados-admin-container">
      <h1 className="empleados-header">👷 Gestión de Empleados</h1>

      <div className="empleado-add-row" onClick={() => abrirModal()}>
        <svg className="add-icon-row" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span className="add-text-row">AGREGAR NUEVO EMPLEADO</span>
      </div>

      <div className="empleados-list-container">
        {empleados.map((emp) => (
          <div key={emp.id} className="empleado-list-item">
            <div className="empleado-info-row">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <span className="empleado-nombre-row" style={{ marginBottom: 0 }}>{emp.nombre}</span>
                
                {/* ETIQUETA DE ESTATUS VISUAL */}
                <span className={`status-badge ${emp.activo !== 0 ? 'status-active' : 'status-inactive'}`}>
                  {emp.activo !== 0 ? '🟢 Activo' : '🔴 Inactivo'}
                </span>
              </div>
              <div className="empleado-detalles-row">
                <span>📱 Tel: {emp.telefono || 'Sin registrar'}</span>
                <span>🏥 Emergencia: {emp.contacto_emergencia || 'Sin registrar'}</span>
                {emp.fecha_contratacion && (
                  <span>
                    📅 Ingreso: {emp.fecha_contratacion} <strong style={{color: '#8b5cf6', marginLeft: '5px'}}>{calcularAntiguedad(emp.fecha_contratacion)}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="servicio-actions-row">
              <button className="btn-icon-row btn-edit-row" onClick={() => abrirModal(emp)} title="Editar">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button className="btn-icon-row btn-delete-row" onClick={() => handleEliminar(emp.id, emp.nombre)} title="Dar de baja">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {empleados.length === 0 && (
          <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>No hay empleados activos.</div>
        )}
      </div>

      {modalAbierto && (
        <div className="modal-overlay">
          <div className="form-modal">
            {/* ICONO DEL TRABAJADOR AÑADIDO AL TÍTULO */}
            <h2>{editandoId ? '✏️ Editar Empleado' : '👷 Nuevo Empleado'}</h2>
            
            <form onSubmit={handleGuardar}>
              <div className="form-group-modal">
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  className="input-modal"
                  placeholder="Ej: Juan Pérez"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  autoFocus
                />
              </div>

              {/* NUEVO INPUT DE FECHA DE INGRESO */}
              <div className="form-group-modal">
                <label>Fecha de Ingreso</label>
                <input 
                  type="date" 
                  className="input-modal"
                  value={formData.fecha_contratacion}
                  onChange={(e) => setFormData({...formData, fecha_contratacion: e.target.value})}
                />
              </div>

              <div className="form-group-modal">
                <label>Teléfono (Opcional)</label>
                <input 
                  type="text" 
                  className="input-modal"
                  placeholder="Ej: 333 123 4567"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                />
              </div>
              
              <div className="form-group-modal">
                <label>Contacto de Emergencia (Opcional)</label>
                <input 
                  type="text" 
                  className="input-modal"
                  placeholder="Nombre y Teléfono"
                  value={formData.contacto_emergencia}
                  onChange={(e) => setFormData({...formData, contacto_emergencia: e.target.value})}
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-modal btn-cancel" onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button type="submit" className="btn-modal btn-save" style={{backgroundColor: '#8b5cf6'}}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}