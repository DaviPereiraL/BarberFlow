(async () => {
    const base = 'http://localhost:3333';
    const resU = await fetch(`${base}/users`);
    const users = await resU.json();
    const barber = users.find(u => u.role === 'BARBER');
    console.log('barberId', barber.id, 'name', barber.name);
    const resA = await fetch(`${base}/users/${barber.id}/availability`);
    const av = await resA.json();
    console.log('availability:', av);
})();
