const pool = require('./src/config/db');

(async () => {
  const query = `SELECT id, starts_at, barber_id, status FROM appointments WHERE barber_id = $1 AND date(starts_at) = $2::date`;
  const barberId = process.argv[2] || '963cd8b4-d2bd-4c92-b986-a6096d852377';
  const date = process.argv[3] || '2030-01-06';
  const res = await pool.query(query, [barberId, date]);
  console.log('Rows:', res.rows.length);
  res.rows.forEach(r => console.log(r));
  process.exit(0);
})();
