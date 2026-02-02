import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

// Guardamos la DB en la carpeta de datos del usuario para que no se borre al actualizar
const dbPath = path.join(app.getPath('userData'), 'autolavado_v1.db');
const db = new Database(dbPath, { verbose: console.log });
console.log('ruta BD: ' + dbPath)
export default db;