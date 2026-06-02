const pool = require('../config/database');

// Función auxiliar para validar el RUT Chileno matemáticamente
const isValidRut = (rut) => {
  if (!/^[0-9]+-[0-9kK]{1}$/.test(rut)) return false;
  
  const [numero, dv] = rut.split('-');
  let m = 0, s = 1;
  let n = parseInt(numero, 10);
  
  for (; n; n = Math.floor(n / 10)) {
    s = (s + (n % 10) * (9 - m++ % 6)) % 11;
  }
  
  const dvCalculado = s ? String(s - 1) : 'k';
  return dvCalculado.toLowerCase() === dv.toLowerCase();
};

const getAll = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM clientes WHERE activo = true';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (nombre ILIKE $1 OR rut ILIKE $1 OR email ILIKE $1)`;
    }
    query += ' ORDER BY nombre';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { rut, nombre, email, telefono, direccion } = req.body;
    
    if (!rut || !nombre) {
      return res.status(400).json({ error: 'RUT y nombre son requeridos.' });
    }

    // Aplicamos la validación del RUT
    if (!isValidRut(rut)) {
      return res.status(400).json({ error: 'El formato o dígito verificador del RUT es inválido. Use formato 12345678-9' });
    }

    const result = await pool.query(
      `INSERT INTO clientes (rut, nombre, email, telefono, direccion)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [rut, nombre, email || null, telefono || null, direccion || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'El RUT ya está registrado.' });
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { nombre, email, telefono, direccion } = req.body;
    const result = await pool.query(
      `UPDATE clientes
       SET nombre    = COALESCE($1, nombre),
           email     = COALESCE($2, email),
           telefono  = COALESCE($3, telefono),
           direccion = COALESCE($4, direccion)
       WHERE id = $5 RETURNING *`,
      [nombre, email, telefono, direccion, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await pool.query('UPDATE clientes SET activo = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Cliente desactivado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
