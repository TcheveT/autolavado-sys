import logo from '../assets/img/logoNito.png'
import carPNG from '../assets/img/car.png'
import dashboardPNG from '../assets/img/dashboard.png'
import gearPNG from '../assets/img/gear.png'
import calendarPNG from '../assets/img/calendar.png'
import masPNG from '../assets/img/plus.png'
import './styles/Inicio.css';
import { useState } from 'react'

function Inicio( { setNuevoServicioActivo, setEsReservacion, setDashboardActivo } ) {

    const [activeOption, setActiveOption] = useState("servicios");

    function nuevaReservacion() {
        setEsReservacion(true)
        setNuevoServicioActivo(true)
        setActiveOption("reservacion")
    }

    function cerrarDashboard() {
        setActiveOption("servicios")
        setDashboardActivo(false)
    }

    function activarDashboard() {
        setActiveOption("dashboard")
        setDashboardActivo(true)
    }


  return (
    <>
        <div className="aside-nav">
            <div className='container-logo'>
                <img src= { logo } alt="imagen logo" />
                {/* <h2>Auto Detallado <b>Nitto</b></h2> */}
            </div>

            <div className='divider'></div>

            <div className='container-services'>
                <div className='option-services'> 
                    <div className={`selected-service ${activeOption === "servicios" ? "option-focus selected-service-focus" : ""}`} onClick={ cerrarDashboard }>
                        <p className='opt-services'> <img src= { carPNG } alt="" />Servicios</p>
                        {
                            
                            activeOption === "servicios" ? <> <p className='opt-services opt-nuevo' onClick={() => { setNuevoServicioActivo(true) }  }><img src={ masPNG } alt="icono mas"  /> Nuevo Servicio </p> 
                            <p className='opt-services opt-nuevo' onClick={ nuevaReservacion }><img src= { calendarPNG } alt="" />Reservación</p></>: ''
                            
                        } 
                        
                        
                    </div>
                    

                    
                </div>
                
                <div className='option-services'>
                    <p className={`selected-service ${activeOption === "dashboard" ? "option-focus selected-service-hover" : ""}`} onClick={ activarDashboard }><img src={ dashboardPNG } alt="image dashboard" />Dashboard</p> 
                </div>
                
            </div>

            <div className='divider'></div>
            
            <p className='gear-config'> <img src={ gearPNG } alt="image gear" />Configuración</p>

        </div>
    </>
    
  );
}

export default Inicio;