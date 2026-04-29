const { PrismaClient } = require('@prisma/client');

// Create single instance
// Never create multiple PrismaClient instances
const prisma = new PrismaClient({
  log: ['error', 'warn'], // logs errors in console
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully via Prisma');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB };