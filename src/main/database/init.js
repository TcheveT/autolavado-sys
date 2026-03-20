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
      fecha_contratacion DATE DEFAULT CURRENT_DATE, -- <--- NUEVO CAMPO
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

  // NUEVA TABLA: ADMIN (Para futuros inicios de sesión)
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
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

  // NUEVA TABLA: GASTOS (Para el módulo de Datos / Balance)
  db.exec(`
    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria TEXT NOT NULL, -- Ej: Sueldos, Insumos, Renta, Servicios, Otros
      descripcion TEXT,
      monto REAL NOT NULL,
      fecha DATE DEFAULT (date('now', 'localtime'))
    );
  `);

  // // Insertar Admin por defecto si no existe
  const countAdmin = db.prepare('SELECT count(*) as c FROM admin').get();
  if (countAdmin.c === 0) {
    db.prepare("INSERT INTO admin (usuario, password) VALUES ('admin', 'ADMIN')").run();
  }
  
};