
const { exec } = require('child_process');

const commands = [
  'npx prisma db push',
  'npm run db:seed',
  'npx next dev --port 9002 --hostname 0.0.0.0'
];

commands.forEach(command => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });
});
