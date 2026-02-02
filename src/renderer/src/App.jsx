import NuevoServicio from './pages/NuevoServicio.jsx';
import Inicio from './pages/Inicio.jsx';
//import Tablero from './pages/Tablero.jsx';
import { useState } from "react";
import './pages/styles/App.css';
import Tablero from './pages/Tablero.jsx';

//--- IMPOTANTE---
// 1.- Corregir que se muestre el boton inicio en caja Reservacion
// 2.- Cambiar los colores de la ventana nuevo servicio y reservacion
// 3.- Mover btn reservacion dentro de servicios


// 2.- Crear componente Dashboard
// 3.- Crear tabla Admin
// 4.- Logica Admin, servicios, empleados, datos, 


function App() {

  const [nuevoServicioActivo, setNuevoServicioActivo] = useState(false);
  const [esReservacion, setEsReservacion] = useState(false);
  const [nuevoCarro, setNuevoCarro] = useState(false);

  return (
    <div className="app">
      <Inicio setNuevoServicioActivo={ setNuevoServicioActivo } setEsReservacion={ setEsReservacion }/>
      <Tablero nuevoCarro={ nuevoCarro } setNuevoCarro={ setNuevoCarro }/>
      {
        nuevoServicioActivo === true ? <NuevoServicio setNuevoServicioActivo={ setNuevoServicioActivo } setNuevoCarro={ setNuevoCarro } nuevoCarro={ nuevoCarro } setEsReservacion={ setEsReservacion } esReservacion={ esReservacion } /> : ""
      }
      
    </div>
  );
}

export default App;