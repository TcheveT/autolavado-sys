import { useState } from "react";
import NuevoServicio from './pages/NuevoServicio.jsx';
import Inicio from './pages/Inicio.jsx';
import Tablero from './pages/Tablero.jsx';
import Dashboard from './pages/components/Dashboard.jsx';
import Admin from './pages/components/Admin.jsx';
import Panel from './pages/components/panelAdmin/Panel.jsx';
import './pages/styles/App.css';
//Corregir que los iconos se vean bien en ventana y pestana
function App() {

  const [nuevoServicioActivo, setNuevoServicioActivo] = useState(false);
  const [esReservacion, setEsReservacion] = useState(false);
  const [nuevoCarro, setNuevoCarro] = useState(false);
  const [dashboardActivo, setDashboardActivo] = useState(false);
  const [adminActivo, setAdminActivo] = useState(false);
  const [panelActivo, setPanelActivo] = useState(false);

  return (
    <div className="app">

      <Inicio 
        setNuevoServicioActivo={setNuevoServicioActivo}
        setEsReservacion={setEsReservacion}
        setDashboardActivo={setDashboardActivo}
        setAdminActivo={setAdminActivo}
      />

      <Tablero 
        nuevoCarro={nuevoCarro}
        setNuevoCarro={setNuevoCarro}
      />

      {dashboardActivo && <Dashboard />}

      {nuevoServicioActivo && (
        <NuevoServicio 
          setNuevoServicioActivo={setNuevoServicioActivo}
          setNuevoCarro={setNuevoCarro}
          nuevoCarro={nuevoCarro}
          setEsReservacion={setEsReservacion}
          esReservacion={esReservacion}
        />
      )}

      {adminActivo && (
        <Admin 
          setAdminActivo={setAdminActivo} 
          setPanelActivo={setPanelActivo}
        />
      )}

      {panelActivo && (
        <Panel 
          setPanelActivo={setPanelActivo}
        />
      )}

    </div>
  );
}

export default App;