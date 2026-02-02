import { ipcMain, shell } from 'electron';
import db from './database/db';

export const setupHandlers = () => {

  // --- NUEVO HANDLER PARA ABRIR ENLACES EXTERNOS ---
  // Esto le dice a Windows/Mac: "Abre este link con la app que tengas predeterminada"
  ipcMain.handle('abrir-link-externo', (_, url) => {
    shell.openExternal(url);
  });
  
  // -- GETTERS BÁSICOS --
  ipcMain.handle('get-servicios', () => db.prepare('SELECT * FROM servicios').all());
  ipcMain.handle('get-empleados', () => db.prepare('SELECT * FROM empleados WHERE activo = 1').all());

  // -- BUSCAR CLIENTE --
  ipcMain.handle('buscar-cliente', (_, telefono) => {
    const cliente = db.prepare('SELECT * FROM clientes WHERE telefono = ?').get(telefono);
    if (cliente) {
      const vehiculos = db.prepare('SELECT * FROM vehiculos WHERE cliente_id = ?').all(cliente.id);
      return { ...cliente, vehiculos };
    }
    return null;
  });

  // -- CREAR ORDEN (MODIFICADO PARA RESERVACIONES) --
  ipcMain.handle('crear-orden', (_, data) => {
    const { 
      telefono, nombreCliente, esNuevoCliente, 
      vehiculoId, nuevoVehiculo, serviciosIds, 
      empleadoId, totalCalculado,
      // NUEVOS CAMPOS QUE RECIBIREMOS:
      esReservacion, fechaProgramada 
    } = data;

    const transaction = db.transaction(() => {
      let finalClienteId;
      let finalVehiculoId;

      // 1. Cliente (IGUAL QUE ANTES)
      if (esNuevoCliente) {
        const info = db.prepare('INSERT INTO clientes (nombre, telefono) VALUES (?, ?)').run(nombreCliente, telefono);
        finalClienteId = info.lastInsertRowid;
      } else {
        const c = db.prepare('SELECT id FROM clientes WHERE telefono = ?').get(telefono);
        finalClienteId = c.id;
      }

      // 2. Vehículo (IGUAL QUE ANTES)
      if (vehiculoId === 'nuevo') {
        const infoV = db.prepare('INSERT INTO vehiculos (modelo, placa, cliente_id) VALUES (?, ?, ?)')
          .run(nuevoVehiculo.modelo, nuevoVehiculo.placa || null, finalClienteId);
        finalVehiculoId = infoV.lastInsertRowid;
      } else {
        finalVehiculoId = vehiculoId;
      }

      // 3. Crear CABECERA de la Orden (CAMBIO CLAVE)
      // Definimos estado y fecha según si es reservación o no
      const estadoFinal = esReservacion ? 'RESERVACION' : 'EN_ESPERA';
      
      // Si hay fechaProgramada la usamos, si no, dejamos que SQLite ponga la actual
      // SQLite usa formato 'YYYY-MM-DD HH:MM:SS'
      const fechaFinal = esReservacion ? fechaProgramada : require('date-fns').format(new Date(), 'yyyy-MM-dd HH:mm:ss');

      const infoOrden = db.prepare(`
        INSERT INTO ordenes (cliente_id, vehiculo_id, empleado_id, total_final, estado, fecha_entrada)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(finalClienteId, finalVehiculoId, empleadoId, totalCalculado, estadoFinal, fechaFinal);
      
      const ordenId = infoOrden.lastInsertRowid;

      // 4. Detalles (IGUAL QUE ANTES)
      const insertDetalle = db.prepare('INSERT INTO orden_detalles (orden_id, servicio_id, precio_al_momento) VALUES (?, ?, ?)');
      const getPrecio = db.prepare('SELECT precio FROM servicios WHERE id = ?');

      for (const servId of serviciosIds) {
        const serv = getPrecio.get(servId);
        insertDetalle.run(ordenId, servId, serv.precio);
      }
      
      return { success: true };
    });

    return transaction();
  });

  // -- GESTIÓN DEL TABLERO (DASHBOARD) --

  // 1. OBTENER CONTEOS (Bolitas de colores)
  ipcMain.handle('get-dashboard-counts', () => {
    // UNIFICACIÓN: Usamos 'FINALIZADO' en lugar de 'TERMINADO'
    const conteos = db.prepare(`
      SELECT estado, COUNT(*) as total 
      FROM ordenes 
      WHERE estado IN ('EN_ESPERA', 'EN_PROCESO', 'RESERVACION', 'FINALIZADO')
      GROUP BY estado
    `).all();

    const resultado = {
      EN_ESPERA: 0,
      EN_PROCESO: 0,
      RESERVACION: 0,
      FINALIZADO: 0 // Usamos FINALIZADO
    };

    conteos.forEach(item => {
      if (resultado.hasOwnProperty(item.estado)) {
        resultado[item.estado] = item.total;
      }
    });

    return resultado;
  });

  // 2. OBTENER TARJETAS DE CARROS (Grid Visual)
  ipcMain.handle('get-board-data', () => {
    const sql = `
      SELECT 
        o.id, 
        o.fecha_entrada, 
        o.estado,
        o.total_final,
        c.nombre as cliente, 
        c.telefono,
        v.modelo as vehiculo, 
        v.placa,
        e.nombre as empleado,
        GROUP_CONCAT(s.nombre || '||' || s.precio, ',') as servicios_detalle
      FROM ordenes o
      JOIN clientes c ON o.cliente_id = c.id
      JOIN vehiculos v ON o.vehiculo_id = v.id
      JOIN empleados e ON o.empleado_id = e.id
      JOIN orden_detalles od ON o.id = od.orden_id
      JOIN servicios s ON od.servicio_id = s.id
      -- UNIFICACIÓN: Filtramos por FINALIZADO
      WHERE o.estado IN ('EN_ESPERA', 'EN_PROCESO', 'FINALIZADO', 'RESERVACION')
      GROUP BY o.id
      ORDER BY o.fecha_entrada ASC
    `;
    return db.prepare(sql).all();
  });

  // 3. CAMBIAR ESTADO (Iniciar / Finalizar)
  ipcMain.handle('update-estado-orden', (_, { id, nuevoEstado }) => {
    // React enviará 'FINALIZADO', así que aquí solo actualizamos lo que llegue
    const info = db.prepare('UPDATE ordenes SET estado = ? WHERE id = ?').run(nuevoEstado, id);
    return info.changes > 0;
  });

  // 4. CANCELAR ORDEN
  ipcMain.handle('cancelar-orden', (_, id) => {
    const info = db.prepare("UPDATE ordenes SET estado = 'CANCELADO' WHERE id = ?").run(id);
    return info.changes > 0;
  });

  // 5. PAGAR Y ARCHIVAR
  ipcMain.handle('pagar-orden', (_, { id, metodoPago }) => {
    // Al pagar, sale del tablero (estado PAGADO no está en los filtros de arriba)
    const info = db.prepare(`
      UPDATE ordenes 
      SET estado = 'PAGADO', fecha_salida = DATETIME('now', 'localtime') 
      WHERE id = ?
    `).run(id);
    return info.changes > 0;
  });
};