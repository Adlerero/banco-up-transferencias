// Conexión a PostgreSQL (Supabase) usando pg directo
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // requerido por Supabase
})

// Verificar conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error conectando a la BD:', err.message)
  } else {
    console.log('Conectado a Supabase PostgreSQL')
    release()
  }
})

module.exports = pool