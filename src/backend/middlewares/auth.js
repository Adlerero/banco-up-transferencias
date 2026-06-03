// Middleware de autenticación JWT
const jwt = require('jsonwebtoken')

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token requerido.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.usuario = decoded
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' })
  }
}

const verificarAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso exclusivo para administradores.' })
  }
  next()
}

module.exports = { verificarToken, verificarAdmin }