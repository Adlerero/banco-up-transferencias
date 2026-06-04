// Controlador de transferencias - SBBU-19
const pool = require('../db')

// POST /api/transferencias
const realizarTransferencia = async (req, res) => {
  const { cuenta_destino, monto, concepto } = req.body
  const cuenta_origen_id = req.usuario.cuenta_id

  try {
    // Validar campos obligatorios
    if (!cuenta_destino || !monto || !concepto) {
      return res.status(400).json({ error: 'Cuenta destino, monto y concepto son obligatorios.' })
    }

    // Validar formato cuenta destino (16 dígitos)
    if (!/^\d{16}$/.test(cuenta_destino)) {
      return res.status(400).json({ error: 'El número de cuenta destino debe tener exactamente 16 dígitos.' })
    }

    // Validar monto mínimo
    if (monto < 500) {
      return res.status(400).json({ error: 'El monto mínimo de transferencia es $500.00 MXN.' })
    }

    // Validar máximo 2 decimales
    if (!/^\d+(\.\d{1,2})?$/.test(monto.toString())) {
      return res.status(400).json({ error: 'El monto no puede tener más de 2 decimales.' })
    }

    // Obtener cuenta origen
    const origenResult = await pool.query(
      'SELECT * FROM cuenta WHERE id = $1',
      [cuenta_origen_id]
    )
    const cuentaOrigen = origenResult.rows[0]

    // Verificar saldo suficiente
    if (parseFloat(cuentaOrigen.saldo) < monto) {
      return res.status(400).json({ error: 'Saldo insuficiente para realizar la transferencia.' })
    }

    // Obtener cuenta destino
    const destinoResult = await pool.query(
      'SELECT * FROM cuenta WHERE numero_cuenta = $1',
      [cuenta_destino]
    )

    if (destinoResult.rows.length === 0) {
      return res.status(404).json({ error: 'La cuenta destino no existe.' })
    }
    const cuentaDestino = destinoResult.rows[0]

    // Verificar que no sea la misma cuenta
    if (cuentaOrigen.id === cuentaDestino.id) {
      return res.status(400).json({ error: 'No puedes transferir a tu propia cuenta.' })
    }

    // Verificar límite diario ($7,000)
    const hoy = new Date().toISOString().split('T')[0]
    const limiteResult = await pool.query(
      'SELECT monto_acumulado FROM limite_diario WHERE cuenta_id = $1 AND fecha = $2',
      [cuenta_origen_id, hoy]
    )
    const acumulado = limiteResult.rows.length > 0 ? parseFloat(limiteResult.rows[0].monto_acumulado) : 0

    if (acumulado + parseFloat(monto) > 7000) {
      return res.status(400).json({ 
        error: `Límite diario excedido. Llevas $${acumulado} transferidos hoy. Límite: $7,000 MXN.` 
      })
    }

    // Verificar tope de cuenta destino ($50,000)
    if (parseFloat(cuentaDestino.saldo) + parseFloat(monto) > 50000) {
      return res.status(400).json({ error: 'La cuenta destino superaría el límite máximo de $50,000 MXN.' })
    }

    // Ejecutar transferencia (transacción atómica)
    await pool.query('BEGIN')

    // Debitar origen
    await pool.query(
      'UPDATE cuenta SET saldo = saldo - $1 WHERE id = $2',
      [monto, cuenta_origen_id]
    )

    // Acreditar destino
    await pool.query(
      'UPDATE cuenta SET saldo = saldo + $1 WHERE id = $2',
      [monto, cuentaDestino.id]
    )

    // Registrar transacción
    const transaccionResult = await pool.query(
      `INSERT INTO transaccion (cuenta_origen_id, cuenta_destino_id, monto, concepto, tipo)
       VALUES ($1, $2, $3, $4, 'transferencia') RETURNING *`,
      [cuenta_origen_id, cuentaDestino.id, monto, concepto]
    )

    // Actualizar límite diario
    await pool.query(
      `INSERT INTO limite_diario (cuenta_id, fecha, monto_acumulado)
       VALUES ($1, $2, $3)
       ON CONFLICT (cuenta_id, fecha) 
       DO UPDATE SET monto_acumulado = limite_diario.monto_acumulado + $3`,
      [cuenta_origen_id, hoy, monto]
    )

    await pool.query('COMMIT')

    res.json({
      mensaje: 'Transferencia realizada exitosamente.',
      transaccion: transaccionResult.rows[0]
    })

  } catch (err) {
    await pool.query('ROLLBACK')
    console.error('Error en transferencia:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
}

// GET /api/transferencias
const obtenerTransferencias = async (req, res) => {
  const cuenta_id = req.usuario.cuenta_id
  const page = parseInt(req.query.page) || 1
  const limit = 5
  const offset = (page - 1) * limit

  try {
    const result = await pool.query(
      `SELECT t.id, t.concepto, t.monto, t.tipo, t.fecha_hora,
              co.numero_cuenta as cuenta_origen,
              cd.numero_cuenta as cuenta_destino
       FROM transaccion t
       JOIN cuenta co ON t.cuenta_origen_id = co.id
       JOIN cuenta cd ON t.cuenta_destino_id = cd.id
       WHERE t.cuenta_origen_id = $1 OR t.cuenta_destino_id = $1
       ORDER BY t.fecha_hora DESC
       LIMIT $2 OFFSET $3`,
      [cuenta_id, limit, offset]
    )

    res.json({
      page,
      transferencias: result.rows
    })

  } catch (err) {
    console.error('Error obteniendo transferencias:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
}

module.exports = { realizarTransferencia, obtenerTransferencias }