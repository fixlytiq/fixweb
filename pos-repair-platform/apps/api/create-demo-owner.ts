/**
 * Script to create a demo owner account
 * Run with: npm run create-demo (from apps/api directory)
 * Or: npx ts-node -r dotenv/config create-demo-owner.ts
 */

import { PrismaClient, StoreRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function createDemoOwner() {
  const storeEmail = 'owner@demo.com';
  const pin = '1234';
  const ownerName = 'Demo Owner';
  const storeName = 'Demo Store';

  try {
    // Check if store already exists
    const existingStore = await prisma.store.findUnique({
      where: { storeEmail },
    });

    if (existingStore) {
      console.log('✅ Demo account already exists!');
      console.log(`   Store Email: ${storeEmail}`);
      console.log(`   PIN: ${pin}`);
      return;
    }

    // Hash the PIN
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(pin, salt);

    // Create owner
    const owner = await prisma.owner.create({
      data: {
        id: randomUUID(),
        email: storeEmail,
        password: hashedPassword,
      },
    });

    // Create store
    const store = await prisma.store.create({
      data: {
        id: randomUUID(),
        name: storeName,
        storeEmail: storeEmail,
        storePhone: null,
        notificationEmail: storeEmail,
        ownerId: owner.id,
        updatedAt: new Date(),
      },
    });

    // Create employee with OWNER role
    const employee = await prisma.employee.create({
      data: {
        id: randomUUID(),
        name: ownerName,
        pin: hashedPassword,
        role: StoreRole.OWNER,
        storeId: store.id,
      },
    });

    console.log('✅ Demo owner account created successfully!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log(`   Store Email: ${storeEmail}`);
    console.log(`   PIN: ${pin}`);
    console.log('');
    console.log('🔗 Owner Portal: http://localhost:3002/owner/login');
  } catch (error: any) {
    console.error('❌ Error creating demo account:', error.message);
    if (error.code === 'P2002') {
      console.error('   Account with this email already exists');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createDemoOwner();

