import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

export const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'hospital_db',
  },
  pool: { min: 2, max: 10 },
});