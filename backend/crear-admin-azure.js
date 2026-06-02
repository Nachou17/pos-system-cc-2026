const pool = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function crearAdmin() {
  try {
    console.log('Conectando a Azure PostgreSQL de forma segura...');
    // Encriptamos la contraseña "admin123"
    const hash = await bcrypt.hash('admin123', 10);
    
    // Insertamos el usuario admin
    await pool.query(`
      INSERT INTO usuarios (nombre, email, password_hash, rol_id, activo) 
      VALUES ('Administrador Global', 'admin@pos.cl', $1, 1, true)
      ON CONFLICT (email) DO NOTHING
    `, [hash]);
    
    console.log('✅ ¡Usuario Admin creado exitosamente en la nube!');
    console.log('👉 Email: admin@pos.cl');
    console.log('👉 Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear admin:', error.message);
    process.exit(1);
  }
}

crearAdmin();
