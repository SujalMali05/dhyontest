# CloudFront Signed Cookies Generator

This Node.js module generates signed cookies for AWS CloudFront private content distribution.

## Features

- Generate CloudFront signed cookies with RSA-SHA1 signatures
- Input validation and error handling
- Configurable expiration time
- TypeScript-style documentation
- Async/await implementation

## Prerequisites

- Node.js 14.0.0 or higher
- A CloudFront key pair (public and private key)
- A CloudFront distribution configured for signed cookies

## Installation

```bash
npm install
```

## Usage

1. Place your private key file (e.g., `cookies.pem`) in the project directory

2. Update the configuration in `cookies.js`:

```javascript
const config = {
    urlPrefix: 'https://your-distribution.cloudfront.net/*',
    keyPairId: 'YOUR_KEY_PAIR_ID',
    privateKeyPath: path.join(__dirname, 'cookies.pem'),
    expiryHours: 5
};
```

3. Use in your code:

```javascript
const { createSignedCookies } = require('./cookies');

async function example() {
    try {
        const cookies = await createSignedCookies(config);
        console.log('Generated Signed Cookies:', cookies);
    } catch (error) {
        console.error('Error:', error.message);
    }
}
```

## API Reference

### createSignedCookies(config)

Creates signed cookies for CloudFront private content.

Parameters:
- `config` (Object):
  - `urlPrefix` (string): The CloudFront distribution URL prefix
  - `keyPairId` (string): The CloudFront key pair ID
  - `privateKeyPath` (string): Path to the private key file
  - `expiryHours` (number): Number of hours until the cookie expires

Returns:
- Promise<Object> containing:
  - `CloudFront-Policy`: Base64 encoded policy
  - `CloudFront-Signature`: Base64 encoded signature
  - `CloudFront-Key-Pair-Id`: CloudFront key pair ID

## Error Handling

The module includes comprehensive error handling for:
- Invalid configuration parameters
- File system operations
- Signing operations
- Policy creation

## Security Notes

- Keep your private key secure and never commit it to version control
- Use HTTPS URLs for your CloudFront distribution
- Consider environment variables for sensitive configuration

## License

MIT 