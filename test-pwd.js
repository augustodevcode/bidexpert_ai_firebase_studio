const bcrypt = require('bcryptjs');

async function test() {
  const hash = '$2b$10$H45pfR3hQNS0rmmvBCVl9eHqWa67.VSfpnyhIWEwRilItLJUwfaiO';
  console.log('senha@123:', await bcrypt.compare('senha@123', hash));
  console.log('password123:', await bcrypt.compare('password123', hash));
  console.log('M!nh@S3nha2025:', await bcrypt.compare('M!nh@S3nha2025', hash));
}

test();