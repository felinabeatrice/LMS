const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const main = async () => {

  console.log('🌱 Seeding database...');

  // ── 1. Create Admin ──────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lms.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@lms.com',
      password: adminPassword,
      role: 'admin',
      is_approved: true,
    }
  });

  console.log('✅ Admin created:', admin.email);

  // ── 2. Create Instructor ─────────────────────────────
  const instructorPassword = await bcrypt.hash('instructor123', 10);

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@lms.com' },
    update: {},
    create: {
      name: 'Test Instructor',
      email: 'instructor@lms.com',
      password: instructorPassword,
      role: 'instructor',
      is_approved: true, // pre-approved for testing
    }
  });

  console.log('✅ Instructor created:', instructor.email);

  // ── 3. Create Student ────────────────────────────────
  const studentPassword = await bcrypt.hash('student123', 10);

  const student = await prisma.user.upsert({
    where: { email: 'student@lms.com' },
    update: {},
    create: {
      name: 'Test Student',
      email: 'student@lms.com',
      password: studentPassword,
      role: 'student',
      is_approved: true,
    }
  });

  console.log('✅ Student created:', student.email);

  // ── 4. Create Categories ─────────────────────────────
  const categories = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Cybersecurity',
    'Cloud Computing',
    'UI/UX Design',
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  console.log('✅ Categories created:', categories.length);

  // ── 5. Create Sample Course ──────────────────────────
  const webDevCategory = await prisma.category.findUnique({
    where: { name: 'Web Development' }
  });

  await prisma.course.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Complete Node.js Course',
      description: 'Learn Node.js from scratch to advanced level.',
      price: 49.99,
      is_free: false,
      duration: 480,
      status: 'approved',
      instructor_id: instructor.id,
      category_id: webDevCategory.id,
    }
  });

  console.log('✅ Sample course created');
  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('📋 Test Accounts:');
  console.log('   Admin      → admin@lms.com       / admin123');
  console.log('   Instructor → instructor@lms.com  / instructor123');
  console.log('   Student    → student@lms.com     / student123');
};

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });