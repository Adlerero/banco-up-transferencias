const express = require('express')
const router = express.Router()
const { listarUsuarios, bloquearUsuario, desbloquearUsuario } = require('../controllers/adminController')
const { verificarToken, verificarAdmin } = require('../middlewares/auth')

// SBBU-10 - Panel administrador
router.get('/usuarios', verificarToken, verificarAdmin, listarUsuarios)
router.put('/usuarios/:id/bloquear', verificarToken, verificarAdmin, bloquearUsuario)
router.put('/usuarios/:id/desbloquear', verificarToken, verificarAdmin, desbloquearUsuario)

module.exports = router