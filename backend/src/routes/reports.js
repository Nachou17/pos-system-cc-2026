const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/auth');

router.get('/summary',          authMiddleware, ctrl.summary);
router.get('/sales-by-day',     authMiddleware, ctrl.salesByDay);
router.get('/top-products',     authMiddleware, ctrl.topProducts);
router.get('/sales-by-payment', authMiddleware, ctrl.salesByPayment);

router.get('/daily-sales',      authMiddleware, ctrl.dailySales);
module.exports = router;
