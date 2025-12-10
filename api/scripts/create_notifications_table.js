(async () => {
  const pool = require('../src/config/db');
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('uuid-ossp ext created/exists');
    await pool.query(`CREATE TABLE IF NOT EXISTS notifications (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid,
      barber_id uuid,
      appointment_id uuid,
      type text,
      message text,
      seen boolean DEFAULT false,
      created_at timestamp DEFAULT now()
    )`);
    console.log('notifications table created/exists');
  } catch (err) {
    console.error('create err', err);
  } finally {
    await pool.end();
  }
})();
