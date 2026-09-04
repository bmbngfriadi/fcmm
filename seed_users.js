const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const usersData = [
  { name: 'HRD TEAM', username: '0001' },
  { name: 'FINANCE TEAM', username: '0002' },
  { name: 'WAREHOUSE TEAM', username: '0003' },
  { name: 'PURCHASING TEAM', username: '0004' },
  { name: 'DISTRIBUTION TEAM', username: '0005' },
  { name: 'SALES TEAM', username: '0006' },
  { name: 'MAINTENANCE TEAM', username: '0007' },
  { name: 'SHE TEAM', username: '0008' },
  { name: 'MS TEAM', username: '0009' },
  { name: 'PRODUCTION TEAM', username: '0010' },
  { name: 'QUALITY TEAM', username: '0012' },
  { name: 'YANTI NATASARI', username: '03800080' },
  { name: 'DHANDY PARINDO', username: '03301548' },
  { name: 'IT', username: '1' },
  { name: 'UJB', username: '0015' },
  { name: 'HRGA-WARNA', username: 'HRGA-WARNA' },
  { name: 'SHE-WARNA', username: 'SHE-WARNA' },
  { name: 'TARIKAN REPORT', username: 'TARIKAN_REPORT' },
  { name: 'ADMINISTRATOR', username: 'KO', role: 'ADMIN' },
];

async function main() {
  const defaultPassword = await bcrypt.hash('123456', 10);
  
  for (const u of usersData) {
    const role = u.role || 'USER';
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        name: u.name,
        username: u.username,
        password: defaultPassword,
        role: role,
      },
    });
    console.log(`Upserted user: ${u.name}`);
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
