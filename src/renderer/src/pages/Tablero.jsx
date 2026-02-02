import { useState, useEffect } from "react"; // <--- 1. Importar useEffect
import './styles/Tablero.css';
import botonPNG from '../assets/img/toggle.png'
import Cars from "./components/Cars";

function Tablero( { nuevoCarro, setNuevoCarro }) {
  // 2. Estado para almacenar los contadores
  const [conteos, setConteos] = useState({
    espera: 0,
    proceso: 0,
    finalizado: 0,
    reservacion: 0
  });

  // 3. Función para pedir los datos a la BD
  const actualizarTablero = async () => {
    try {
      const datos = await window.api.getDashboardCounts();
      // Mapeamos los nombres de la BD a tu estado local
      setConteos({
        espera: datos.EN_ESPERA || 0,
        proceso: datos.EN_PROCESO || 0,
        finalizado: datos.FINALIZADO || 0,
        reservacion: datos.RESERVACION || 0
      });
    } catch (error) {
      console.error("Error actualizando tablero:", error);
    }
  };

  // 4. Efecto de carga y auto-refresco
  useEffect(() => {
    actualizarTablero(); // Carga inicial

    // Configurar intervalo para refrescar cada 5 segundos
    // Esto asegura que si llega un nuevo servicio, el contador suba solo
    //const intervalo = setInterval(actualizarTablero, 5000);

    // Limpieza al desmontar (importante para evitar fugas de memoria)
    //return () => clearInterval(intervalo);
  }, [nuevoCarro]);

  return (
    <div className="board-services">
      <div className="head-board">
        <h2>Servicios</h2>
        {/* Botón opcional para forzar actualización manual */}
        <img 
          src={ botonPNG } 
          alt="Refrescar" 
          onClick={actualizarTablero} 
          style={{cursor: 'pointer'}} 
        />
      </div>

      <div className="board-panel">
        {/* --- ITEM 1: EN ESPERA --- */}
        <div className="board-panel-item">
          <p className="num-signal">
            {/* Aquí inyectamos el dato real */}
            <b>{conteos.espera}</b>
          </p>
          <div className="signal">
            <p>En espera </p>
            <div className="circulo rojo"></div>
          </div>
        </div>

        {/* --- ITEM 2: EN PROCESO --- */}
        <div className="board-panel-item">
          <p className="num-signal">
            <b>{conteos.proceso}</b>
          </p>
          <div className="signal">
            <p>En proceso </p>
            <div className="circulo amarillo"></div>
          </div>
        </div>

        {/* --- ITEM 3: FINALIZADO --- */}
        <div className="board-panel-item">
          <p className="num-signal">
            <b>{conteos.finalizado}</b>
          </p>
          <div className="signal">
            <p>Finalizado </p>
            <div className="circulo verde"></div>
          </div>
        </div>

        {/* --- ITEM 4: RESERVACIÓN --- */}
        <div className="board-panel-item">
          <p className="num-signal">
            <b>{conteos.reservacion}</b>
          </p>
          <div className="signal">
            <p>Reservación </p>
            <div className="circulo azul"></div>
          </div>
        </div>
      </div>
      
      <div className="space-cars">
        <Cars setNuevoCarro={ setNuevoCarro } nuevoCarro={ nuevoCarro }/>
      </div>

    </div>
  );
}

export default Tablero;