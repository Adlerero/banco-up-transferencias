// Controlador de administrador - SBBU-10
const pool = require('../db')

// GET /api/admin/usuarios - Listar todos los usuarios con estado
const listarUsuarios = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.bloqueado, 
              u.intentos_fallidos, c.numero_cuenta, c.saldo
       FROM usuario u
       JOIN cuenta c ON c.usuario_id = u.id
       WHERE u.rol_id = 1
       ORDER BY u.id`
    )
    res.json({ usuarios: result.rows })
  } catch (err) {
    console.error('Error listando usuarios:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
}

// PUT /api/admin/usuarios/:id/bloquear
const bloquearUsuario = async (req, res) => {
  const { id } = req.params
  try {
    await pool.query(
      'UPDATE usuario SET bloqueado = true WHERE id = $1',
      [id]
    )
    res.json({ mensaje: `Usuario ${id} bloqueado correctamente.` })
  } catch (err) {
    console.error('Error bloqueando usuario:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
}

// PUT /api/admin/usuarios/:id/desbloquear
const desbloquearUsuario = async (req, res) => {
  const { id } = req.params
  try {
    await pool.query(
      'UPDATE usuario SET bloqueado = false, intentos_fallidos = 0 WHERE id = $1',
      [id]
    )
    res.json({ mensaje: `Usuario ${id} desbloqueado correctamente.` })
  } catch (err) {
    console.error('Error desbloqueando usuario:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
}

module.exports = { listarUsuarios, bloquearUsuario, desbloquearUsuario }