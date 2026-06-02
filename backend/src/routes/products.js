const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { body, validationResult } = require('express-validator');

const upload = require('../middleware/upload');

const validarCampos = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }
    next();
};

const validacionesProducto = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre del producto es obligatorio.')
        .isLength({ max: 200 }).withMessage('El nombre no puede superar los 200 caracteres.'),

    body('precio')
        .notEmpty().withMessage('El precio de venta es obligatorio.')
        .isNumeric().withMessage('El precio debe ser un número.')
        .custom(value => value >= 0).withMessage('El precio no puede ser negativo.'),

    body('stock')
        .optional()
        .isNumeric().withMessage('El stock debe ser un número.')
        .custom(value => value >= 0).withMessage('El stock no puede ser negativo.'),

    body('precio_compra')
        .optional()
        .isNumeric().withMessage('El precio de compra debe ser un número.')
        .custom(value => value >= 0).withMessage('El precio de compra no puede ser negativo.'),

    body('stock_minimo')
        .optional()
        .isNumeric().withMessage('El stock mínimo debe ser un número.')
        .custom(value => value >= 0).withMessage('El stock mínimo no puede ser negativo.'),

    body('codigo_barra')
        .trim()
        .notEmpty().withMessage('El código de barra o SKU es obligatorio.')
];

router.get('/', productController.getAll);
router.get('/:id', productController.getById);

router.post('/', upload.single('imagen'), validacionesProducto, validarCampos, productController.create);

router.put('/:id', upload.single('imagen'), validacionesProducto, validarCampos, productController.update);

router.delete('/:id', productController.remove);

module.exports = router;