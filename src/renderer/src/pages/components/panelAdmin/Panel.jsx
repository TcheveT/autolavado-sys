import { useState } from "react";
import Servicios from './Servicios';
import PanelNav from "./PanelNav";
import Empleados from "./Empleados"
import Historial from "./Historial"
import Datos from "./Datos"
import '../../styles/Panel.css';

function Panel({ setPanelActivo }) {

  const [vistaActual, setVista] = useState('servicios');

  const getVistaConfig = () => {
    switch (vistaActual) {
      case "servicios":
        return {
          titulo: "Pantalla de Servicios",
          componente: <Servicios />
        };

      case "empleados":
        return {
          titulo: "Pantalla de Empleados",
          componente: <Empleados />
        };

      case "historial":
        return {
          titulo: "Pantalla de Historial",
          componente: <Historial />
        };

      case "datos":
        return {
          titulo: "Pantalla de Datos",
          componente: <Datos />
        };

      default:
        return {
          titulo: "Pantalla de Servicios",
          componente: <Servicios />
        };
    }
  };

  const { titulo, componente } = getVistaConfig();

  return (

    <div className="panel">
      <div className="close-btn" onClick={ () => { setPanelActivo(false) } }>
          <span></span>
          <span></span>
      </div>
      {/* El menú siempre estará flotando a la izquierda */}
      <PanelNav 
        vistaActual={vistaActual}
        setVista={setVista}
      />


      {/* El contenido principal debe tener un margen izquierdo para no quedar detrás del menú */}
      <div style={{ paddingLeft: '110px', paddingTop: '20px', paddingRight: '20px' }}>
        <h2>{titulo}</h2>
        {componente}
        

      </div>
    </div>
  );
}

export default Panel;