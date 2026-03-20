import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../../styles/Servicios.css';

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', precio: '' });

  const cargarServicios = async () => {
    try {
      const data = await window.api.getServicios();
      setServicios(data);
    } catch (error) {
      console.error("Error cargando servicios:", error);
    }
  };

  useEffect(() => {
    cargarServicios();
  }, []);

  const abrirModal = (servicio = null) => {
    if (servicio) {
      setEditandoId(servicio.id);
      setFormData({ nombre: servicio.nombre, precio: servicio.precio });
    } else {
      setEditandoId(null);
      setFormData({ nombre: '', precio: '' });
    }
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.precio) {
      return Swal.fire('Aviso', 'Completa todos los campos', 'warning');
    }

    try {
      if (editandoId) {
        await window.api.updateServicio({ id: editandoId, ...formData });
        Swal.fire({ icon: 'success', title: 'Actualizado', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
      } else {
        await window.api.addServicio(formData);
        Swal.fire({ icon: 'success', title: 'Creado', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
      }
      setModalAbierto(false);
      cargarServicios(); 
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo guardar el servicio', 'error');
    }
  };

  const handleEliminar = (id, nombre) => {
    Swal.fire({
      title: '¿Eliminar Servicio?',
      text: `Se eliminará "${nombre}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, eliminar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await window.api.deleteServicio(id);
        if (res.success) {
          Swal.fire('Eliminado', 'El servicio ha sido borrado.', 'success');
          cargarServicios();
        } else if (res.error === 'en_uso') {
          Swal.fire('No se puede eliminar', 'Este servicio ya está en uso en el historial. Edita su nombre o precio.', 'error');
        }
      }
    });
  };

  return (
    <div className="servicios-admin-container">
      <h1 className="servicios-header">🧼 Gestión de Servicios</h1>

      {/* --- BOTÓN LLAMATIVO (Ancho completo arriba) --- */}
      <div className="servicio-add-row" onClick={() => abrirModal()}>
        <svg className="add-icon-row" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span className="add-text-row">AGREGAR NUEVO SERVICIO</span>
      </div>

      {/* --- LISTA CON OVERFLOW AUTO --- */}
      <div className="servicios-list-container">
        {servicios.map((srv) => (
          <div key={srv.id} className="servicio-list-item">
            
            <div className="servicio-info-row">
              <span className="servicio-nombre-row">{srv.nombre}</span>
              <span className="servicio-precio-row">${srv.precio.toFixed(2)}</span>
            </div>

            <div className="servicio-actions-row">
              <button className="btn-icon-row btn-edit-row" onClick={() => abrirModal(srv)} title="Editar">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              
              <button className="btn-icon-row btn-delete-row" onClick={() => handleEliminar(srv.id, srv.nombre)} title="Eliminar">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
          </div>
        ))}
        {servicios.length === 0 && (
          <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>No hay servicios registrados.</div>
        )}
      </div>

      {/* --- MODAL PARA CREAR / EDITAR (Mismo funcionamiento) --- */}
      {modalAbierto && (
        <div className="modal-overlay">
          <div className="form-modal">
            <h2>{editandoId ? '✏️ Editar Servicio' : '✨ Nuevo Servicio'}</h2>
            <form onSubmit={handleGuardar}>
              <div className="form-group-modal">
                <label>Nombre del Servicio</label>
                <input 
                  type="text" 
                  className="input-modal"
                  placeholder="Ej: Lavado de Motor"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  autoFocus
                />
              </div>
              <div className="form-group-modal">
                <label>Precio ($)</label>
                <input 
                  type="number" 
                  className="input-modal"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={formData.precio}
                  onChange={(e) => setFormData({...formData, precio: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-modal btn-cancel" onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button type="submit" className="btn-modal btn-save">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}