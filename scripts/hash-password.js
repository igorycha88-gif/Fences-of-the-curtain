const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);

const sql = `UPDATE "User" SET password = '${hash}' WHERE email = 'admin@fences.ru';`;
console.log('\nSQL to update password:');
console.log(sql);
