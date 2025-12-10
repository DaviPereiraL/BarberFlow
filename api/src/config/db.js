const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// No Railway, a URL do banco vem na variável DATABASE_URL
const connectionString = process.env.DATABASE_URL 
    ? process.env.DATABASE_URL 
    : `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString: connectionString,
  // IMPORTANTE: O Railway exige SSL. Localmente não precisa.
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  // console.log('Base de Dados conectada com sucesso!');
});

module.exports = pool;