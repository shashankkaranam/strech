const crypto = require('crypto');
require('dotenv').config();

const algorithm = 'aes-256-ctr';
const secretKey = crypto.randomBytes(32); // Generates a strong 32-byte key
const iv = crypto.randomBytes(16); // Generates a random IV

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted; // Store IV along with encrypted text
}

// Replace 'your_app_password' with your Gmail App Password
const encryptedPass = encrypt('xdup oqgj cfxr uysm');

console.log('Encrypted Password:', encryptedPass);

// Store `secretKey` securely; do NOT regenerate it every time!
console.log('Encryption Key (Store this safely!):', secretKey.toString('hex'));
