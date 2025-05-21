from datetime import datetime, timedelta, timezone
from Crypto.PublicKey import RSA
from Crypto.Signature import pkcs1_15
from Crypto.Hash import SHA1
import base64
import json

def rsa_signer(message, private_key_path):
    with open(private_key_path, 'rb') as f:
        private_key = RSA.import_key(f.read())
    h = SHA1.new(message.encode('utf-8'))
    signature = pkcs1_15.new(private_key).sign(h)
    return base64.b64encode(signature).decode('utf-8')

def create_signed_cookies(url_prefix, key_pair_id, private_key_path):
    expire_date = datetime.now(timezone.utc) + timedelta(hours=5)  # 1 hour expiration

    policy = {
        "Statement": [{
            "Resource": url_prefix,
            "Condition": {
                "DateLessThan": {"AWS:EpochTime": int(expire_date.timestamp())}
            }
        }]
    }

    policy_json = json.dumps(policy).replace(' ', '')
    signature = rsa_signer(policy_json, private_key_path)

    return {
        'CloudFront-Policy': base64.b64encode(policy_json.encode()).decode('utf-8'),
        'CloudFront-Signature': signature,
        'CloudFront-Key-Pair-Id': key_pair_id
    }

# Example usage
url_prefix = "https://d22si132od0d26.cloudfront.net/*"  # All content under distribution
key_pair_id = "KG3VA0PMQKICO"
private_key_path = "cookies.pem"

cookies = create_signed_cookies(url_prefix, key_pair_id, private_key_path)
for name, value in cookies.items():
    print(f"{name} = {value}")
