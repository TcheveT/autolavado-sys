import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
//import icon from '../../resources/icon.png?asset' // Importante para el icono de la app

// Importamos nuestras funciones de base de datos y backend
import { initDB } from './database/init'
import { setupHandlers } from './ipcHandlers'

// 1. Inicializamos la Base de Datos (crear tablas si no existen)
// Se hace aquí para asegurar que la DB esté lista antes de abrir cualquier ventana
initDB();

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 900,
    minWidth: 900,
    minHeight: 650, 
    icon: join(__dirname, '../../build/icon.ico'),
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? {  } : {}), // Restaurado el icono para Linux
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.autolavado.app') // Puedes cambiar el ID si quieres

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 2. Inicializar los Handlers (backend logic)
  // Es mejor hacerlo aquí, justo cuando la app está lista
  setupHandlers();


  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})