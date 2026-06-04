const router = require('express').Router();
const ctrl = require('../controllers/saleController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Comentamos temporalmente las rutas que Joni aún no programa
 router.get('/',           authMiddleware, ctrl.getAll);
// router.get('/:id',        authMiddleware, ctrl.getById);

// Conectamos la ruta POST a la función que armamos (crearVenta)
router.post('/',          authMiddleware, ctrl.crearVenta);

// router.put('/:id/cancel', authMiddleware, requireRole(['admin']), ctrl.cancel);

module.exports = router;
