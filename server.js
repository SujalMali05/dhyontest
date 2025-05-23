const fs = require('fs');
const express = require('express');
const path = require('path');
const { createSignedCookies } = require('./cookies');
const https = require('https');
const cookieParser = require('cookie-parser');

const app = express();

// SSL config
const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/awstest.testyourproject.tech/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/awstest.testyourproject.tech/fullchain.pem')
};

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname));

// Proper CORS setup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://awstest.testyourproject.tech');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve login and video page
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/video/', (req, res) => res.sendFile(path.join(__dirname, 'index1.html')));

// Signed cookie endpoint
app.post('/api/generate-cookies', async (req, res) => {
  try {
    const config = {
      urlPrefix: 'https://cdn.testyourproject.tech/*',
      keyPairId: 'KG3VA0PMQKICO',
      privateKeyPath: path.join(__dirname, 'cookies.pem'),
      expiryHours: 10
    };

    const cookies = await createSignedCookies(config);

    // Set CloudFront signed cookies with correct settings
    Object.entries(cookies).forEach(([name, value]) => {
      res.cookie(name, value, {
        domain: '.testyourproject.tech', // for all subdomains
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 10 * 60 * 60 * 1000 // 5 hours
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Cookie generation failed:', error);
    res.status(500).json({ error: 'Cookie generation failed', details: error.message });
  }
});

// Start HTTPS server
https.createServer(sslOptions, app).listen(443, () => {
  console.log('Server running at https://awstest.testyourproject.tech');
});
