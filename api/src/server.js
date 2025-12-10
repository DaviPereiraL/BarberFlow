const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

app.use(routes);

const angularDistPath = path.join(__dirname, '../../web/dist/web/browser');

app.use(express.static(angularDistPath));

app.get('*', (req, res) => {
    if (req.url.startsWith('/users') || 
        req.url.startsWith('/services') || 
        req.url.startsWith('/appointments') || 
        req.url.startsWith('/payments') ||
        req.url.startsWith('/login')) {
        return res.status(404).json({ error: 'API route not found' });
    }

    res.sendFile(path.join(angularDistPath, 'index.html'));
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
    console.log(`🔥 Servidor BarberFlow rodando na porta ${PORT}`);
});

module.exports = app;