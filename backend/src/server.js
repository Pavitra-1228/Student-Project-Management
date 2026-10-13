import 'dotenv/config';
import pool from './config/db.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and set a value.');
  process.exit(1);
}

const { default: app } = await import('./app.js');
const port = Number(process.env.PORT) || 5000;

try {
  await pool.query('SELECT 1');
} catch (error) {
  console.error(`Cannot reach PostgreSQL: ${error.message}`);
  process.exit(1);
}

const server = app.listen(port, () => {
  console.log(`ProjectFlow API listening on http://localhost:${port}`);
});

const shutdown = () => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
