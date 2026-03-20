import { contextBridge, ipcRenderer } from 'electron'
//import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getServicios: () => ipcRenderer.invoke('get-servicios'),
  getEmpleados: () => ipcRenderer.invoke('get-empleados'),
  getDashboardCounts: () => ipcRenderer.invoke('get-dashboard-counts'),
  getBoardData: () => ipcRenderer.invoke('get-board-data'),
  updateEstadoOrden: (data) => ipcRenderer.invoke('update-estado-orden', data),
  cancelarOrden: (id) => ipcRenderer.invoke('cancelar-orden', id),
  pagarOrden: (data) => ipcRenderer.invoke('pagar-orden', data),
  buscarCliente: (telefono) => ipcRenderer.invoke('buscar-cliente', telefono),
  abrirLinkExterno: (url) => ipcRenderer.invoke('abrir-link-externo', url),
  getKpisMensuales: () => ipcRenderer.invoke('get-kpis-mensuales'),
  loginAdmin: (credenciales) => ipcRenderer.invoke('login-admin', credenciales),
  crearOrden: (datos) => ipcRenderer.invoke('crear-orden', datos),
  // CRUD SERVICIOS
  addServicio: (data) => ipcRenderer.invoke('add-servicio', data),
  updateServicio: (data) => ipcRenderer.invoke('update-servicio', data),
  deleteServicio: (id) => ipcRenderer.invoke('delete-servicio', id),
  // HISTORIAL
  getHistorial: (filtros) => ipcRenderer.invoke('get-historial', filtros),
  // DATOS Y GRÁFICAS
  getGraficasDatos: (rango) => ipcRenderer.invoke('get-graficas-datos', rango),
  // CRUD EMPLEADOS
  addEmpleado: (data) => ipcRenderer.invoke('add-empleado', data),
  updateEmpleado: (data) => ipcRenderer.invoke('update-empleado', data),
  deleteEmpleado: (id) => ipcRenderer.invoke('delete-empleado', id),
  // FINANZAS Y GASTOS
  addGasto: (data) => ipcRenderer.invoke('add-gasto', data),
  getBalance: (mes) => ipcRenderer.invoke('get-balance', mes),
  updateGasto: (data) => ipcRenderer.invoke('update-gasto', data), // <--- NUEVA
  deleteGasto: (id) => ipcRenderer.invoke('delete-gasto', id),
  // DATOS Y GRÁFICAS
  getAnalisisPersonas: (mes) => ipcRenderer.invoke('get-analisis-personas', mes),
  // REPORTES
  getReporteDatos: (filtros) => ipcRenderer.invoke('get-reporte-datos', filtros),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    //contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  //window.electron = electronAPI
  window.api = api
}
