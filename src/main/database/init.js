import db from './db';

export const initDB = () => {
  //1. TABLA EMPLEADOS (NUEVA)
  db.exec(`
    CREATE TABLE IF NOT EXISTS empleados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      fecha_nacimiento TEXT,
      telefono TEXT,
      contacto_emergencia TEXT,
      activo INTEGER DEFAULT 1
    );
  `);

  // 2. TABLA CLIENTES (Igual que antes)
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telefono TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. TABLA VEHÍCULOS (Igual que antes)
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      modelo TEXT NOT NULL,
      placa TEXT, 
      cliente_id INTEGER NOT NULL,
      FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    );
  `);

  // 4. CATÁLOGO DE SERVICIOS
  db.exec(`
    CREATE TABLE IF NOT EXISTS servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL
    );
  `);

  // 5. ORDENES (CABECERA - La visita en general)
  // Aquí guardamos QUIÉN lo hizo (empleado_id) y CUÁNDO.
  db.exec(`
    CREATE TABLE IF NOT EXISTS ordenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      vehiculo_id INTEGER,
      empleado_id INTEGER,  -- El empleado responsable
      estado TEXT DEFAULT 'EN_PROCESO', -- 'EN_PROCESO', 'TERMINADO'
      fecha_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_salida DATETIME,
      total_final REAL DEFAULT 0,
      FOREIGN KEY(cliente_id) REFERENCES clientes(id),
      FOREIGN KEY(empleado_id) REFERENCES empleados(id)
    );
  `);

  // 6. DETALLES DE ORDEN (NUEVA - Para múltiples servicios)
  // Aquí se guarda cada servicio individual de una sola visita (ej: Lavado + Encerado)
  db.exec(`
    CREATE TABLE IF NOT EXISTS orden_detalles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orden_id INTEGER,
      servicio_id INTEGER,
      precio_al_momento REAL, -- Guardamos el precio por si cambia en el futuro
      FOREIGN KEY(orden_id) REFERENCES ordenes(id),
      FOREIGN KEY(servicio_id) REFERENCES servicios(id)
    );
  `);

  // --- DATOS DE PRUEBA (SEEDS) ---
  
  // Servicios iniciales
  // const countServ = db.prepare('SELECT count(*) as c FROM servicios').get();
  // if (countServ.c === 0) {
  //   const insert = db.prepare('INSERT INTO servicios (nombre, precio) VALUES (?, ?)');
  //   insert.run('Lavado Básico', 150);
  //   insert.run('Aspirado Profundo', 100);
  //   insert.run('Encerado', 200);
  //   insert.run('Lavado de Motor', 250);
  // }

  // // Empleados iniciales
  // const countEmp = db.prepare('SELECT count(*) as c FROM empleados').get();
  // if (countEmp.c === 0) {
  //   const insert = db.prepare('INSERT INTO empleados (nombre, telefono) VALUES (?, ?)');
  //   insert.run('Juan Pérez (General)', '333-111-1111');
  //   insert.run('María López (Detallado)', '333-222-2222');
  // }
};