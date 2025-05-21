const fs = require('fs');
const express = require('express');
const path = require('path');
const { createSignedCookies } = require('./cookies');
const https = require('https');

const app = express();

// SSL/TLS configuration
const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/awstest.testyourproject.tech/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/awstest.testyourproject.tech/fullchain.pem')
};

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://d22si132od0d26.cloudfront.net');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Serve login page
app.get('/', (req, res) => {
  console.log('Serving login page');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve video page
app.get('/video/', (req, res) => {
  console.log('Serving video page');
  res.sendFile(path.join(__dirname, 'index1.html'));
});

// Example route for testing CloudFront EC2 behavior
app.get('/ec2', (req, res) => {
  res.send('Hello from EC2 via CloudFront!');
});

// API endpoint to generate signed cookies
app.post('/api/generate-cookies', async (req, res) => {
  console.log('Received cookie generation request');
  try {
    const config = {
      urlPrefix: 'https://d22si132od0d26.cloudfront.net/video/*',
      keyPairId: 'KG3VA0PMQKICO',
      privateKeyPath: path.join(__dirname, 'cookies.pem'),
      expiryHours: 5
    };

    console.log('Cookie config:', config);
    console.log('Checking if private key exists:', fs.existsSync(config.privateKeyPath));

    const cookies = await createSignedCookies(config);
    console.log('Generated cookies:', cookies);

    // Set CORS headers for the response
    res.header('Access-Control-Allow-Origin', 'https://d22si132od0d26.cloudfront.net');
    res.header('Access-Control-Allow-Credentials', 'true');

    res.json(cookies);
  } catch (error) {
    console.error('Detailed error generating cookies:', error);
    res.status(500).json({
      error: 'Failed to generate signed cookies',
      details: error.message
    });
  }
});

https.createServer(sslOptions, app).listen(443, () => {
  console.log('HTTPS server running on https://awstest.testyourproject.tech');
});
