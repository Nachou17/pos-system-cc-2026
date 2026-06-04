const pool = require('../config/database');

// ============================================================================
// 1. FUNCIÓN PARA EL HISTORIAL (La que usa tu nueva pantalla de Ventas)
// ============================================================================
const getAll = async (req, res) => {
  try {
    // Hacemos la consulta directamente a la base de datos sin pedir conexión exclusiva
    const resultado = await pool.query(`
      SELECT id, total, metodo_pago, estado, created_at 
      FROM ventas 
      ORDER BY created_at DESC
    `);
    
    // Adaptador de seguridad: por si usan Postgres (resultado.rows) o MySQL (resultado[0])
    const datos = resultado.rows ? resultado.rows : (resultado[0] || resultado);
    
    res.status(200).json(datos);
  } catch (error) {
    console.error('Error al obtener el historial:', error);
    res.status(500).json({ error: 'No se pudo cargar el historial de ventas' });
  }
};

// ============================================================================
// 2. FUNCIÓN PARA COBRAR (La que usa la pantalla de Punto de Venta/Caja)
// ============================================================================
async function crearVenta(req, res) {
  const { usuario_id, cliente_id, total, metodo_pago, carrito } = req.body;
  const conexion = await pool.connect();

  try {
    await conexion.query('BEGIN'); 

    // Guardamos el encabezado de la boleta
    const resultadoVenta = await conexion.query(
      `INSERT INTO ventas (usuario_id, cliente_id, total, metodo_pago) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [usuario_id, cliente_id, total, metodo_pago]
    );
    
    const numeroBoleta = resultadoVenta.rows[0].id;

    // Recorremos los productos del carrito y descontamos stock
    for (let item of carrito) {
      const subtotal = item.cantidad * item.precio;

      await conexion.query(
        `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
         VALUES ($1, $2, $3, $4, $5)`,
        [numeroBoleta, item.id, item.cantidad, item.precio, subtotal]
      );

      await conexion.query(
        `UPDATE productos SET stock = stock - $1 WHERE id = $2`,
        [item.cantidad, item.id]
      );
    }

    await conexion.query('COMMIT');
    res.status(201).json({ mensaje: '¡Venta guardada exitosamente!', boleta: numeroBoleta });

  } catch (error) {
    await conexion.query('ROLLBACK');
    console.error('Problema al guardar la venta:', error);
    res.status(500).json({ error: 'No se pudo completar la venta' });
  } finally {
    if (conexion) conexion.release();
  }
}

// Exportamos ambas funciones para que tus rutas (routes/sales.js) funcionen bien
module.exports = { crearVenta, getAll };
