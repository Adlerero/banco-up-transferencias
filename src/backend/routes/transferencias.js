const express = require('express')
const router = express.Router()
const { realizarTransferencia, obtenerTransferencias } = require('../controllers/transferenciaController')
const { verificarToken } = require('../middlewares/auth')

// SBBU-19 - Realizar transferencia
router.post('/', verificarToken, realizarTransferencia)

// SBBU-16 - Historial de transferencias
router.get('/', verificarToken, obtenerTransferencias)

module.exports = router