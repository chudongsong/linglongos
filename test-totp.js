const speakeasy = require('speakeasy');

// 从文件存储中读取密钥
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'apps/api/data');
const dataFile = path.join(dataDir, 'storage.json');

try {
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const secret = data.twoFASecret;

  if (!secret) {
    console.log('No 2FA secret found');
    process.exit(1);
  }

  console.log('Secret:', secret);

  // 生成当前时间的 TOTP 令牌
  const token = speakeasy.totp({
    secret: secret,
    encoding: 'base32'
  });

  console.log('Current TOTP token:', token);

} catch (error) {
  console.error('Error:', error.message);
}
