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
  crearOrden: (datos) => ipcRenderer.invoke('crear-orden', datos)
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
