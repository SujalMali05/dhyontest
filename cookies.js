const crypto = require('crypto');
const fs = require('fs').promises;

/**
 * Signs the policy using RSA-SHA1
 */
async function rsaSigner(message, privateKeyContent) {
  try {
    const sign = crypto.createSign('RSA-SHA1');
    sign.update(message);
    return sign.sign(privateKeyContent).toString('base64'); // standard base64
  } catch (error) {
    throw new Error(`Signature generation failed: ${error.message}`);
  }
}

/**
 * Creates signed CloudFront cookies
 */
async function createSignedCookies(config) {
  if (!config.urlPrefix || !config.keyPairId || !config.privateKeyPath) {
    throw new Error('Missing required CloudFront cookie config');
  }

  const privateKeyContent = await fs.readFile(config.privateKeyPath);

  const expireEpoch = Math.floor(Date.now() / 1000) + config.expiryHours * 3600;

  const policyObj = {
    Statement: [
      {
        Resource: config.urlPrefix,
        Condition: {
          DateLessThan: { "AWS:EpochTime": expireEpoch }
        }
      }
    ]
  };

  const policyJson = JSON.stringify(policyObj).replace(/\s/g, ''); // Remove all whitespace
  const encodedPolicy = Buffer.from(policyJson).toString('base64');
  const encodedSignature = await rsaSigner(policyJson, privateKeyContent);

  return {
    'CloudFront-Policy': encodedPolicy,
    'CloudFront-Signature': encodedSignature,
    'CloudFront-Key-Pair-Id': config.keyPairId
  };
}

module.exports = {
  createSignedCookies
};

