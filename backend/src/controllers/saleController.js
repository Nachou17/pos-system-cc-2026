const pool = require('../config/database');

// ============================================================================
// 1. FUNCIÓN PARA EL HISTORIAL (La que usa tu nueva pantalla de Ventas)
// ============================================================================
const getAll = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT id, total, metodo_pago, estado, created_at 
      FROM ventas 
      ORDER BY created_at DESC
    `);
    
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
  // Extraemos el usuario_id del middleware de autenticación (req.user)
  const usuario_id = req.user ? req.user.id : null;
  // Desestructuramos las propiedades que envía el front (sin depender de 'total')
  const { cliente_id, metodo_pago, items } = req.body;

  // Validación de seguridad para evitar arreglos vacíos o inexistentes
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'El carrito no puede estar vacío' });
  }

  try {
    // 1. Calculamos el total de la venta sumando los subtotales en el servidor
    let totalCalculado = 0;
    for (let item of items) {
      totalCalculado += item.cantidad * item.precio_unitario;
    }

    // Iniciamos la transacción directamente en el pool
    await pool.query('BEGIN'); 

    // Guardamos el encabezado de la boleta (con estado 'completada' por defecto y el total seguro)
    const resultadoVenta = await pool.query(
      `INSERT INTO ventas (usuario_id, cliente_id, total, metodo_pago, estado) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        usuario_id, 
        cliente_id ? parseInt(cliente_id) : null, 
        totalCalculado, // <-- Número entero válido y blindado contra modificaciones
        metodo_pago || 'efectivo',
        'completada'
      ]
    );
    
    const numeroBoleta = resultadoVenta.rows[0].id;

    // Recorremos los productos usando la estructura exacta que manda el cliente (items)
    for (let item of items) {
      // El subtotal se calcula multiplicando las propiedades correctas del front
      const subtotal = item.cantidad * item.precio_unitario;

      // Insertamos cada producto en el detalle utilizando el pool
      await pool.query(
        `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
         VALUES ($1, $2, $3, $4, $5)`,
        [numeroBoleta, item.producto_id, item.cantidad, item.precio_unitario, subtotal]
      );

      // Descontamos del stock usando item.producto_id directamente en el pool
      await pool.query(
        `UPDATE productos SET stock = stock - $1 WHERE id = $2`,
        [item.cantidad, item.producto_id]
      );
    }

    // Confirmamos todos los cambios si no hubo errores en el ciclo
    await pool.query('COMMIT');
    res.status(201).json({ mensaje: '¡Venta guardada exitosamente!', boleta: numeroBoleta });

  } catch (error) {
    // Si algo falla, revertimos toda la operación para mantener la consistencia
    await pool.query('ROLLBACK');
    console.error('Problema al guardar la venta en la base de datos:', error);
    res.status(500).json({ error: 'No se pudo completar la venta' });
  }
}

module.exports = { crearVenta, getAll };
