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

  // --- DASHBOARD ADMINISTRATIVO (KPIs) - CORREGIDO CON LOCALTIME ---
  ipcMain.handle('get-kpis-mensuales', () => {
    
    // 1. VENTAS DEL MES ACTUAL
    const ventasMes = db.prepare(`
      SELECT SUM(total_final) as total, COUNT(*) as cantidad
      FROM ordenes 
      WHERE strftime('%Y-%m', fecha_entrada) = strftime('%Y-%m', 'now', 'localtime')
      AND estado IN ('FINALIZADO', 'PAGADO')
    `).get();

    // 2. VENTAS DEL MES ANTERIOR (Para comparación)
    const ventasMesAnterior = db.prepare(`
      SELECT SUM(total_final) as total, COUNT(*) as cantidad
      FROM ordenes 
      WHERE strftime('%Y-%m', fecha_entrada) = strftime('%Y-%m', 'now', 'localtime', '-1 month')
      AND estado IN ('FINALIZADO', 'PAGADO')
    `).get();

    // 3. VENTAS DE LA SEMANA ACTUAL (Lunes a Domingo)
    const ventasSemana = db.prepare(`
      SELECT SUM(total_final) as total, COUNT(*) as cantidad
      FROM ordenes 
      WHERE strftime('%Y-%W', fecha_entrada) = strftime('%Y-%W', 'now', 'localtime')
      AND estado IN ('FINALIZADO', 'PAGADO')
    `).get();

    // 4. GRÁFICA: INGRESOS POR DÍA (Últimos 7 días)
    const graficaVentas = db.prepare(`
      SELECT strftime('%d/%m', fecha_entrada) as dia, SUM(total_final) as venta
      FROM ordenes
      WHERE estado IN ('FINALIZADO', 'PAGADO') 
      AND date(fecha_entrada) >= date('now', 'localtime', '-7 days')
      GROUP BY dia
      ORDER BY fecha_entrada ASC
    `).all();

    // 5. GRÁFICA: SERVICIOS MÁS VENDIDOS (Pie Chart)
    const topServicios = db.prepare(`
      SELECT s.nombre, COUNT(od.servicio_id) as cantidad
      FROM orden_detalles od
      JOIN servicios s ON od.servicio_id = s.id
      JOIN ordenes o ON od.orden_id = o.id
      WHERE strftime('%Y-%m', o.fecha_entrada) = strftime('%Y-%m', 'now', 'localtime')
      AND o.estado IN ('FINALIZADO', 'PAGADO')
      GROUP BY s.nombre
      ORDER BY cantidad DESC
      LIMIT 5
    `).all();

    // 6. TOP 5 CLIENTES DEL MES
    const topClientes = db.prepare(`
      SELECT c.nombre, COUNT(o.id) as visitas, SUM(o.total_final) as gastado
      FROM ordenes o
      JOIN clientes c ON o.cliente_id = c.id
      WHERE strftime('%Y-%m', o.fecha_entrada) = strftime('%Y-%m', 'now', 'localtime')
      AND o.estado IN ('FINALIZADO', 'PAGADO')
      GROUP BY c.id
      ORDER BY visitas DESC
      LIMIT 5
    `).all();

    // 7. PRODUCTIVIDAD DE EMPLEADOS
    const productividadEmpleados = db.prepare(`
      SELECT e.nombre, COUNT(o.id) as total_servicios
      FROM empleados e
      LEFT JOIN ordenes o ON e.id = o.empleado_id 
         AND strftime('%Y-%m', o.fecha_entrada) = strftime('%Y-%m', 'now', 'localtime') 
         AND o.estado IN ('FINALIZADO', 'PAGADO')
      WHERE e.activo = 1
      GROUP BY e.id
      ORDER BY total_servicios DESC
    `).all();

    return {
      mesActual: ventasMes,
      mesAnterior: ventasMesAnterior,
      semanaActual: ventasSemana,
      graficaVentas,
      topServicios,
      topClientes,
      productividadEmpleados
    };
  });

  // --- LOGIN ADMINISTRATIVO ---
  ipcMain.handle('login-admin', (_, credenciales) => {
    const { usuario, password } = credenciales;
    
    // Buscamos si existe un registro que coincida exactamente con ambos datos
    const admin = db.prepare('SELECT * FROM admin WHERE usuario = ? AND password = ?').get(usuario, password);
    
    if (admin) {
      return { success: true, nombre: admin.usuario };
    } else {
      return { success: false };
    }
  });

  // --- GESTIÓN DE SERVICIOS (CRUD) ---
  
  // 1. Agregar Servicio
  ipcMain.handle('add-servicio', (_, { nombre, precio }) => {
    const info = db.prepare('INSERT INTO servicios (nombre, precio) VALUES (?, ?)').run(nombre, precio);
    return info.changes > 0;
  });

  // 2. Actualizar Servicio
  ipcMain.handle('update-servicio', (_, { id, nombre, precio }) => {
    const info = db.prepare('UPDATE servicios SET nombre = ?, precio = ? WHERE id = ?').run(nombre, precio, id);
    return info.changes > 0;
  });

  // 3. Eliminar Servicio
  ipcMain.handle('delete-servicio', (_, id) => {
    try {
      const info = db.prepare('DELETE FROM servicios WHERE id = ?').run(id);
      return { success: info.changes > 0 };
    } catch (error) {
      // Si el servicio ya está ligado a un historial de ventas, SQLite protegerá los datos y no dejará borrarlo.
      return { success: false, error: 'en_uso' };
    }
  });

  // --- GESTIÓN DE EMPLEADOS ---
  
  // 1. Agregar Empleado (Actualizado con fecha)
  ipcMain.handle('add-empleado', (_, { nombre, telefono, contacto_emergencia, fecha_contratacion }) => {
    
    // CORRECCIÓN: Usamos date-fns para obtener la fecha local exacta y evitamos toISOString()
    const fecha = fecha_contratacion || require('date-fns').format(new Date(), 'yyyy-MM-dd');
    
    const info = db.prepare(`
      INSERT INTO empleados (nombre, telefono, contacto_emergencia, fecha_contratacion, activo) 
      VALUES (?, ?, ?, ?, 1)
    `).run(nombre, telefono, contacto_emergencia, fecha);
    return info.changes > 0;
  });

  // 2. Actualizar Empleado (Corregido y con fecha)
  ipcMain.handle('update-empleado', (_, { id, nombre, telefono, contacto_emergencia, fecha_contratacion }) => {
    const info = db.prepare(`
      UPDATE empleados 
      SET nombre = ?, telefono = ?, contacto_emergencia = ?, fecha_contratacion = ?
      WHERE id = ?
    `).run(nombre, telefono, contacto_emergencia, fecha_contratacion, id);
    return info.changes > 0;
  });

  // 3. Eliminar Empleado (Inteligente: Físico o Lógico)
  ipcMain.handle('delete-empleado', (_, id) => {
    try {
      // 1. Revisamos si el empleado tiene órdenes/servicios en el historial
      const historial = db.prepare('SELECT COUNT(*) as total FROM ordenes WHERE empleado_id = ?').get(id);

      let info;
      
      if (historial.total === 0) {
        // CASO A: No tiene historial de servicios. Lo borramos definitivamente de la base de datos.
        info = db.prepare('DELETE FROM empleados WHERE id = ?').run(id);
      } else {
        // CASO B: Sí tiene historial. Hacemos borrado lógico para no arruinar las cuentas del Dashboard.
        info = db.prepare('UPDATE empleados SET activo = 0 WHERE id = ?').run(id);
      }

      return { success: info.changes > 0 };
    } catch (error) {
      console.error("Error al eliminar empleado:", error);
      return { success: false };
    }
  });

  // --- HISTORIAL DE VENTAS ---
  ipcMain.handle('get-historial', (_, { mes, dia }) => {
    let sql = `
      SELECT 
        o.id, 
        o.fecha_entrada, 
        o.total_final, 
        o.estado,
        c.nombre as cliente, 
        e.nombre as empleado,
        v.modelo, 
        v.placa,
        GROUP_CONCAT(s.nombre, ', ') as servicios_detalle
      FROM ordenes o
      JOIN clientes c ON o.cliente_id = c.id
      JOIN empleados e ON o.empleado_id = e.id
      JOIN vehiculos v ON o.vehiculo_id = v.id
      JOIN orden_detalles od ON o.id = od.orden_id
      JOIN servicios s ON od.servicio_id = s.id
      WHERE o.estado IN ('FINALIZADO', 'PAGADO')
    `;
    
    const params = [];

    // Si el usuario eligió un día exacto, filtramos por día.
    if (dia) {
      sql += ` AND date(o.fecha_entrada) = ?`;
      params.push(dia);
    } 
    // Si no hay día exacto pero hay mes, filtramos por el mes entero.
    else if (mes) {
      sql += ` AND strftime('%Y-%m', o.fecha_entrada) = ?`;
      params.push(mes);
    }

    sql += ` GROUP BY o.id ORDER BY o.fecha_entrada DESC`;

    return db.prepare(sql).all(...params);
  });


  // --- MÓDULO DE DATOS: GRÁFICAS GENERALES ---
  ipcMain.handle('get-graficas-datos', (_, rango) => {
    // 1. Definir el filtro de fecha según lo que pida React
    let filtroFecha = "";
    if (rango === '7_dias') {
      filtroFecha = `AND date(fecha_entrada, 'localtime') >= date('now', 'localtime', '-7 days')`;
    } else if (rango === 'este_mes') {
      filtroFecha = `AND strftime('%Y-%m', fecha_entrada, 'localtime') = strftime('%Y-%m', 'now', 'localtime')`;
    } else if (rango === 'mes_pasado') {
      filtroFecha = `AND strftime('%Y-%m', fecha_entrada, 'localtime') = strftime('%Y-%m', 'now', 'localtime', '-1 month')`;
    } else if (rango === 'este_ano') {
      filtroFecha = `AND strftime('%Y', fecha_entrada, 'localtime') = strftime('%Y', 'now', 'localtime')`;
    }

    // 2. TENDENCIA DE VENTAS (Por día o mes, dependiendo del rango)
    // Si es "este_ano", agrupamos por mes. Si no, agrupamos por día.
    const formatoAgrupacion = rango === 'este_ano' ? '%Y-%m' : '%Y-%m-%d';
    const tendenciaVentas = db.prepare(`
      SELECT strftime('${formatoAgrupacion}', fecha_entrada, 'localtime') as fecha, SUM(total_final) as total, COUNT(id) as cantidad
      FROM ordenes
      WHERE estado IN ('FINALIZADO', 'PAGADO') ${filtroFecha}
      GROUP BY fecha
      ORDER BY fecha ASC
    `).all();

    // 3. VENTAS POR SERVICIO
    const ventasPorServicio = db.prepare(`
      SELECT s.nombre, COUNT(od.servicio_id) as cantidad, SUM(od.precio_al_momento) as dinero
      FROM orden_detalles od
      JOIN servicios s ON od.servicio_id = s.id
      JOIN ordenes o ON od.orden_id = o.id
      WHERE o.estado IN ('FINALIZADO', 'PAGADO') ${filtroFecha.replace(/fecha_entrada/g, 'o.fecha_entrada')}
      GROUP BY s.nombre
      ORDER BY cantidad DESC
    `).all();

    // 4. VENTAS POR EMPLEADO
    const ventasPorEmpleado = db.prepare(`
      SELECT e.nombre, COUNT(o.id) as autos, SUM(o.total_final) as generado
      FROM ordenes o
      JOIN empleados e ON o.empleado_id = e.id
      WHERE o.estado IN ('FINALIZADO', 'PAGADO') ${filtroFecha.replace(/fecha_entrada/g, 'o.fecha_entrada')}
      GROUP BY e.id
      ORDER BY generado DESC
    `).all();

    // 5. HORAS PICO (Para saber a qué hora hay más trabajo)
    const horasPico = db.prepare(`
      SELECT strftime('%H:00', fecha_entrada, 'localtime') as hora, COUNT(id) as flujo
      FROM ordenes
      WHERE estado IN ('FINALIZADO', 'PAGADO') ${filtroFecha}
      GROUP BY hora
      ORDER BY hora ASC
    `).all();

    return { tendenciaVentas, ventasPorServicio, ventasPorEmpleado, horasPico };
  });  

  // --- MÓDULO DE DATOS: BALANCE FINANCIERO Y GASTOS ---
  
  // 1. Agregar un nuevo gasto
  ipcMain.handle('add-gasto', (_, { categoria, descripcion, monto, fecha }) => {
    // Si no eligen fecha, usamos la de hoy sin problemas de zona horaria
    const fechaGasto = fecha || require('date-fns').format(new Date(), 'yyyy-MM-dd');
    const info = db.prepare(`
      INSERT INTO gastos (categoria, descripcion, monto, fecha) 
      VALUES (?, ?, ?, ?)
    `).run(categoria, descripcion, monto, fechaGasto);
    return info.changes > 0;
  });

  // NUEVO: 1.5 Actualizar Gasto
  ipcMain.handle('update-gasto', (_, { id, categoria, descripcion, monto, fecha }) => {
    const info = db.prepare(`
      UPDATE gastos 
      SET categoria = ?, descripcion = ?, monto = ?, fecha = ?
      WHERE id = ?
    `).run(categoria, descripcion, monto, fecha, id);
    return info.changes > 0;
  });

  // NUEVO: 1.6 Eliminar Gasto
  ipcMain.handle('delete-gasto', (_, id) => {
    const info = db.prepare('DELETE FROM gastos WHERE id = ?').run(id);
    return { success: info.changes > 0 };
  });

  // 2. Obtener el Balance General de un mes específico (ej: '2026-03')
  ipcMain.handle('get-balance', (_, mesFiltro) => {
    
    // Total de Ingresos (Ventas cobradas ese mes)
    const ingresos = db.prepare(`
      SELECT SUM(total_final) as total 
      FROM ordenes 
      WHERE strftime('%Y-%m', fecha_entrada) = ? 
      AND estado IN ('FINALIZADO', 'PAGADO')
    `).get(mesFiltro);

    // Total de Egresos (Gastos de ese mes)
    const egresos = db.prepare(`
      SELECT SUM(monto) as total 
      FROM gastos 
      WHERE strftime('%Y-%m', fecha) = ?
    `).get(mesFiltro);

    // Lista detallada de los gastos para mostrarla en la tabla
    const listaGastos = db.prepare(`
      SELECT * FROM gastos 
      WHERE strftime('%Y-%m', fecha) = ?
      ORDER BY fecha DESC, id DESC
    `).all(mesFiltro);

    const totalIngresos = ingresos.total || 0;
    const totalEgresos = egresos.total || 0;
    const utilidadNeta = totalIngresos - totalEgresos;
    
    // Margen porcentual = (Utilidad / Ingresos) * 100
    const margen = totalIngresos > 0 ? ((utilidadNeta / totalIngresos) * 100).toFixed(1) : 0;

    return {
      ingresos: totalIngresos,
      egresos: totalEgresos,
      utilidadNeta,
      margen,
      listaGastos
    };
  });

  // --- MÓDULO DE DATOS: ANÁLISIS DE CLIENTES Y PERSONAL ---
  ipcMain.handle('get-analisis-personas', (_, mesFiltro) => {
    
    // 1. TOP 10 CLIENTES (Del mes seleccionado)
    const topClientes = db.prepare(`
      SELECT c.nombre, c.telefono, COUNT(o.id) as visitas, SUM(o.total_final) as gastado, AVG(o.total_final) as ticket_promedio
      FROM ordenes o
      JOIN clientes c ON o.cliente_id = c.id
      WHERE strftime('%Y-%m', o.fecha_entrada) = ? 
      AND o.estado IN ('FINALIZADO', 'PAGADO')
      GROUP BY c.id
      ORDER BY gastado DESC
      LIMIT 10
    `).all(mesFiltro);

    // 2. CLIENTES INACTIVOS (Global: Más de 30 días sin venir)
    // Usamos julianday para calcular la diferencia exacta en días
    const clientesInactivos = db.prepare(`
      SELECT c.nombre, c.telefono, MAX(o.fecha_entrada) as ultima_visita, 
             CAST(julianday('now', 'localtime') - julianday(MAX(o.fecha_entrada)) AS INTEGER) as dias_ausente
      FROM clientes c
      JOIN ordenes o ON c.id = o.cliente_id
      WHERE o.estado IN ('FINALIZADO', 'PAGADO')
      GROUP BY c.id
      HAVING dias_ausente > 30
      ORDER BY dias_ausente DESC
      LIMIT 15
    `).all();

    // 3. RENDIMIENTO DE EMPLEADOS (Del mes seleccionado)
    const rendimientoEmpleados = db.prepare(`
      SELECT e.nombre, COUNT(o.id) as servicios, COALESCE(SUM(o.total_final), 0) as generado
      FROM empleados e
      LEFT JOIN ordenes o ON e.id = o.empleado_id 
           AND strftime('%Y-%m', o.fecha_entrada) = ? 
           AND o.estado IN ('FINALIZADO', 'PAGADO')
      WHERE e.activo = 1
      GROUP BY e.id
      ORDER BY generado DESC
    `).all(mesFiltro);

    return { topClientes, clientesInactivos, rendimientoEmpleados };
  });

  // --- MÓDULO DE DATOS: REPORTES EXPORTABLES ---
  ipcMain.handle('get-reporte-datos', (_, filtros) => {
    const { fechaInicio, fechaFin, empleadoId } = filtros;
    const params = [];

    let sql = `
      SELECT 
        o.id as ticket, 
        date(o.fecha_entrada, 'localtime') as fecha,
        time(o.fecha_entrada, 'localtime') as hora,
        c.nombre as cliente, 
        e.nombre as empleado,
        GROUP_CONCAT(s.nombre, ' + ') as servicios,
        o.total_final as total
      FROM ordenes o
      JOIN clientes c ON o.cliente_id = c.id
      JOIN empleados e ON o.empleado_id = e.id
      JOIN orden_detalles od ON o.id = od.orden_id
      JOIN servicios s ON od.servicio_id = s.id
      WHERE o.estado IN ('FINALIZADO', 'PAGADO')
    `;

    // Filtro Rango de Fechas
    if (fechaInicio && fechaFin) {
      sql += ` AND date(o.fecha_entrada, 'localtime') BETWEEN ? AND ?`;
      params.push(fechaInicio, fechaFin);
    }

    // Filtro Empleado
    if (empleadoId && empleadoId !== 'TODOS') {
      sql += ` AND o.empleado_id = ?`;
      params.push(empleadoId);
    }

    sql += ` GROUP BY o.id ORDER BY o.fecha_entrada DESC`;

    return db.prepare(sql).all(...params);
  });


};