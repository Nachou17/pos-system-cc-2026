const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const getAll = async (req, res) => {
  try {
    // Traemos los usuarios y hacemos un JOIN para obtener el nombre del rol
    const result = await pool.query(`
      SELECT u.id, u.nombre, u.email, u.activo, r.nombre as rol 
      FROM usuarios u 
      JOIN roles r ON u.rol_id = r.id 
      WHERE u.activo = true 
      ORDER BY u.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.nombre, u.email, u.activo, r.nombre as rol 
      FROM usuarios u 
      JOIN roles r ON u.rol_id = r.id 
      WHERE u.id = $1
    `, [req.params.id]);
    
    if (!result.rows.length) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, email, password, rol_id } = req.body;
    
    if (!nombre || !email || !password || !rol_id) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Seguridad: Encriptar la contraseña antes de guardarla en la BD
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol_id)
       VALUES ($1, $2, $3, $4) RETURNING id, nombre, email`,
      [nombre, email, password_hash, rol_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'El email ya está registrado.' });
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { nombre, email, rol_id } = req.body;
    
    // Nota: La actualización de contraseña suele hacerse en un endpoint aparte por seguridad, 
    // aquí actualizamos solo los datos básicos.
    const result = await pool.query(
      `UPDATE usuarios
       SET nombre = COALESCE($1, nombre),
           email  = COALESCE($2, email),
           rol_id = COALESCE($3, rol_id),
           updated_at = NOW()
       WHERE id = $4 RETURNING id, nombre, email`,
      [nombre, email, rol_id, req.params.id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    // Soft delete: no borramos el registro, solo lo desactivamos para mantener historial de ventas
    await pool.query('UPDATE usuarios SET activo = false, updated_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ message: 'Usuario desactivado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
