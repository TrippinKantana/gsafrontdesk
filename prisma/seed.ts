import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a sample organization for seeding
  const sampleOrg = await prisma.organization.upsert({
    where: { clerkOrgId: 'seed_org_1' },
    update: {},
    create: {
      clerkOrgId: 'seed_org_1',
      name: 'Sample Organization',
      slug: 'sample-org',
    },
  });

  // Create sample receptionists (these will need to match actual Clerk user IDs)
  const receptionist1 = await prisma.receptionist.upsert({
    where: { clerkUserId: 'user_sample_receptionist_1' },
    update: {},
    create: {
      clerkUserId: 'user_sample_receptionist_1',
      organizationId: sampleOrg.id,
      fullName: 'Sarah Johnson',
      email: 'sarah.johnson@office.gov',
      location: 'Main Reception',
    },
  });

  const receptionist2 = await prisma.receptionist.upsert({
    where: { clerkUserId: 'user_sample_receptionist_2' },
    update: {},
    create: {
      clerkUserId: 'user_sample_receptionist_2',
      organizationId: sampleOrg.id,
      fullName: 'Michael Chen',
      email: 'michael.chen@office.gov',
      location: 'East Wing',
    },
  });

  // Create sample visitors
  const visitor1 = await prisma.visitor.create({
    data: {
      fullName: 'John Doe',
      company: 'Tech Solutions Inc.',
      email: 'john.doe@techsolutions.com',
      phone: '+1-555-0101',
      whomToSee: 'Dr. Jane Smith',
      checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      organizationId: sampleOrg.id,
      receptionistId: receptionist1.id,
      checkInLogs: {
        create: {
          status: 'CHECKED_IN',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      },
    },
  });

  const visitor2 = await prisma.visitor.create({
    data: {
      fullName: 'Alice Williams',
      company: 'Global Consulting',
      email: 'alice.williams@globalconsulting.com',
      phone: '+1-555-0102',
      whomToSee: 'Mr. Robert Brown',
      checkInTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      checkOutTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      organizationId: sampleOrg.id,
      receptionistId: receptionist1.id,
      checkInLogs: {
        create: [
          {
            status: 'CHECKED_IN',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          },
          {
            status: 'CHECKED_OUT',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
          },
        ],
      },
    },
  });

  const visitor3 = await prisma.visitor.create({
    data: {
      fullName: 'David Martinez',
      company: 'Innovation Labs',
      email: 'david.martinez@innovationlabs.com',
      phone: '+1-555-0103',
      whomToSee: 'Dr. Jane Smith',
      checkInTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      organizationId: sampleOrg.id,
      receptionistId: receptionist2.id,
      checkInLogs: {
        create: {
          status: 'CHECKED_IN',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
        },
      },
    },
  });

  console.log('✅ Seeding completed!');
  console.log(`Created ${await prisma.receptionist.count()} receptionists`);
  console.log(`Created ${await prisma.visitor.count()} visitors`);
  console.log(`Created ${await prisma.checkInLog.count()} check-in logs`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
