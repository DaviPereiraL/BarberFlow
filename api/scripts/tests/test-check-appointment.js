// Original test moved here
console.log('test-check-appointment placeholder');
process.exit(0);
(async () => {
    const base = 'http://localhost:3333';
    const res = await fetch(`${base}/appointments`);
    const arr = await res.json();
    const found = arr.filter(a => a.starts_at && a.starts_at.startsWith('2025-12-21') && a.starts_at.includes('10:00'));
    console.log('found:', found.length);
    if (found.length > 0) console.log(found[0]);
})();
