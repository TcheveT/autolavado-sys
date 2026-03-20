import { app } from 'electron';
import { join } from 'path';
import Database from 'better-sqlite3';

// // 1. Obtenemos la ruta oficial de Windows para guardar datos de esta app
// const dbPath = join(app.getPath('userData'), 'autolavado_produccion.sqlite');

// // 2. Conectamos la base de datos apuntando a esa nueva ruta segura
// const db = new Database(dbPath);

// db.pragma('journal_mode = WAL');




//BD Pruebas

// 1. Apuntamos directamente a la carpeta Roaming general, y luego a tu carpeta y archivo viejos
const dbPath = join(app.getPath('appData'), 'autolavado-sys', 'autolavado_v1.db');

// 2. Conectamos la base de datos
const db = new Database(dbPath);

// Optimizamos la velocidad de lectura/escritura
db.pragma('journal_mode = WAL');



export default db;