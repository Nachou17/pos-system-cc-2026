require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const clientRoutes   = require('./routes/clients');
const saleRoutes     = require('./routes/sales');
const reportRoutes   = require('./routes/reports');
const userRoutes     = require('./routes/users');
const evalRoutes     = require('./routes/eval');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
// ⚠️ TODO: En producción restringir a dominios específicos:
//   app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://20.2.83.12:3000', 'http://localhost:3000'], // Tu IP de Azure y local
  credentials: true // <-- Esto permite que viajen los tokens/cookies de autenticación
}));
// ─── PARSERS ─────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── ARCHIVOS ESTÁTICOS (imágenes) ───────────────────────────────────────────
// TODO: Eliminar cuando se migre a almacenamiento en la nube (S3, GCS, etc.)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
// TODO: Implementar endpoint de health check para:
//   - Load Balancers (ALB, NGINX, etc.)
//   - Orquestadores de contenedores (ECS, Kubernetes)
//   - Servicios de monitoreo
//
// app.get('/health', async (req, res) => {
//   try {
//     await pool.query('SELECT 1');
//     res.json({ status: 'ok', db: 'ok', timestamp: new Date() });
//   } catch {
//     res.status(503).json({ status: 'error', db: 'unreachable' });
//   }
// });

// ─── RUTAS ───────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/clients',    clientRoutes);
app.use('/api/sales',      saleRoutes);
app.use('/api/reports',    reportRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/eval',       evalRoutes);  // Ruta de evaluación docente (requiere EVAL_SECRET)

// ─── MANEJO DE ERRORES GLOBAL ────────────────────────────────────────────────
// TODO: Reemplazar console.error con logging estructurado (Winston, Pino, etc.)
//       e integrar con servicio de monitoreo (CloudWatch, Datadog, Sentry, etc.)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

module.exports = app;
