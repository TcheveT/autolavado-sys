import React, { useState } from 'react';
import Swal from 'sweetalert2';
import '../styles/Admin.css';

export default function Admin({ setAdminActivo, setPanelActivo }) {
  // Inicializamos el usuario con 'admin' por defecto como solicitaste
  const [usuario, setUsuario] = useState('admin');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!usuario || !password) {
      return Swal.fire('Atención', 'Por favor llena todos los campos', 'warning');
    }

    try {
      const respuesta = await window.api.loginAdmin({ usuario, password });

      if (respuesta.success) {
        // Credenciales correctas
        Swal.fire({
          icon: 'success',
          title: `¡Bienvenido, ${respuesta.nombre}!`,
          showConfirmButton: false,
          timer: 1500
        });
        
        // Aquí le decimos a la app que cambie a la vista de panel de administración
        // Asegúrate de pasar las props correctas dependiendo de cómo manejes tu navegación en App.jsx
        
        setAdminActivo(false);
        setPanelActivo(true);

      } else {
        // Credenciales incorrectas
        Swal.fire('Acceso Denegado', 'Usuario o contraseña incorrectos', 'error');
        setPassword(''); // Limpiamos la contraseña para que lo intente de nuevo
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Hubo un problema al conectar con la base de datos', 'error');
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-card">
        
        {/* Botón opcional para cerrar el modal de login si decides mostrarlo como ventana flotante */}
        <div className="close-btn" onClick={ () => { setAdminActivo(false) } }>
          <span></span>
          <span></span>
        </div>

        <h2>🔒 Acceso Administrativo</h2>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Usuario</label>
            <input 
              type="text" 
              value={usuario} 
              onChange={(e) => setUsuario(e.target.value)} 
            />
          </div>
          
          <div className="form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              autoFocus // El cursor aparecerá directo aquí porque el usuario ya está escrito
            />
          </div>
          
          <button type="submit" className="btn-login">
            INICIAR SESIÓN
          </button>
        </form>
      </div>
    </div>
  );
}