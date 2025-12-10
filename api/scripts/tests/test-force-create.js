console.log('test-force-create placeholder');
process.exit(0);
const URL_BASE = 'http://localhost:3333';

(async () => {
  const s = await fetch(`${URL_BASE}/services`); const services = await s.json();
  const sv = services[0]?.id;
  const u = await fetch(`${URL_BASE}/users`); const users = await u.json();
  const owner = users.find(x => x.role === 'OWNER');
  const barber = users.find(x => x.role === 'BARBER');
  if (!owner || !barber || !sv) { console.log('Missing data'); return; }

  const starts_at = '2030-01-06 10:00:00'; // Sunday which might be closed for many barbers
  const payload = {
    service_id: sv,
    barber_id: barber.id,
    starts_at,
    guest_name: 'Teste Força',
    guest_phone: '83999990000',
    payment_method: 'LOCAL',
    payment_status: 'PAID',
    force_create: true,
    forceCreate: true,
    admin_id: owner.id,
    override_reason: 'Test forced creation by script'
    };
  console.log('Attempting force_create payload:', payload);

  const res = await fetch(`${URL_BASE}/appointments`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  console.log('Status:', res.status);
  console.log(await res.json());
})();
