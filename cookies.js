const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Convert standard base64 to URL-safe base64
 */
function toUrlSafeBase64(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Signs a message using RSA-SHA1 with the provided private key
 */
async function rsaSigner(message, privateKeyContent) {
  try {
    const sign = crypto.createSign('RSA-SHA1');
    sign.update(message);
    const signature = sign.sign(privateKeyContent);
    return signature.toString('base64');
  } catch (error) {
    throw new Error(`Failed to create signature: ${error.message}`);
  }
}

/**
 * Validates CloudFront config
 */
function validateConfig(config) {
  if (!config.urlPrefix || !config.urlPrefix.startsWith('https://')) {
    throw new Error('Invalid URL prefix. Must start with https://');
  }
  if (!config.keyPairId || config.keyPairId.length < 1) {
    throw new Error('Invalid key pair ID');
  }
  if (!config.privateKeyPath) {
    throw new Error('Private key path is required');
  }
  if (!config.expiryHours || config.expiryHours < 1) {
    throw new Error('Expiry hours must be greater than 0');
  }
}

/**
 * Creates signed cookies for CloudFront private content
 */
async function createSignedCookies(config) {
  try {
    validateConfig(config);

    const privateKeyContent = await fs.readFile(config.privateKeyPath);

    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + config.expiryHours);

    const policy = {
      Statement: [
        {
          Resource: config.urlPrefix,
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': Math.floor(expireDate.getTime() / 1000)
            }
          }
        }
      ]
    };

    const policyString = JSON.stringify(policy).replace(/\s/g, '');
    const encodedPolicy = toUrlSafeBase64(policyString);
    const rawSignature = await rsaSigner(policyString, privateKeyContent);
    const encodedSignature = toUrlSafeBase64(rawSignature);

    return {
      'CloudFront-Policy': encodedPolicy,
      'CloudFront-Signature': encodedSignature,
      'CloudFront-Key-Pair-Id': config.keyPairId
    };
  } catch (error) {
    throw new Error(`Failed to create signed cookies: ${error.message}`);
  }
}

module.exports = {
  createSignedCookies,
  validateConfig
};

