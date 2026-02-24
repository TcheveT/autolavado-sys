import NuevoServicio from './pages/NuevoServicio.jsx';
import Inicio from './pages/Inicio.jsx';
//import Tablero from './pages/Tablero.jsx';
import { useState } from "react";
import './pages/styles/App.css';
import Tablero from './pages/Tablero.jsx';
import Dashboard from './pages/components/Dashboard.jsx';

//--- IMPOTANTE---
// 3.- Crear tabla Admin
// 4.- Logica Admin, servicios, empleados, datos, 


function App() {

  const [nuevoServicioActivo, setNuevoServicioActivo] = useState(false);
  const [esReservacion, setEsReservacion] = useState(false);
  const [nuevoCarro, setNuevoCarro] = useState(false);
  const [dashboardActivo, setDashboardActivo] = useState(false);

  return (
    <div className="app">
      <Inicio setNuevoServicioActivo={ setNuevoServicioActivo } setEsReservacion={ setEsReservacion } setDashboardActivo={ setDashboardActivo } />
      <Tablero nuevoCarro={ nuevoCarro } setNuevoCarro={ setNuevoCarro }/>
      {
        dashboardActivo === true ? <Dashboard /> : ""
      }
      
      {
        nuevoServicioActivo === true ? <NuevoServicio setNuevoServicioActivo={ setNuevoServicioActivo } setNuevoCarro={ setNuevoCarro } nuevoCarro={ nuevoCarro } setEsReservacion={ setEsReservacion } esReservacion={ esReservacion } /> : ""
      }
      
    </div>
  );
}

export default App;