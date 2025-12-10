// Vercel serverless wrapper — exporta a aplicação Express como uma única Serverless Function
const serverless = require('serverless-http');
const app = require('./src/server');

module.exports = serverless(app);
