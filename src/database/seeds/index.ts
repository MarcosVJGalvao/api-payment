import { DataSource } from 'typeorm';
import { seedPermissions } from './permissions.seed';
import { seedInternalUsers } from './internal-user.seed';

export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('🌱 Starting database seeds...\n');

  try {
    // Seed permissions (scopes)
    console.log('📋 Seeding permissions (scopes)...');
    const createdPermissions = await seedPermissions(dataSource);
    console.log(`✓ Created ${createdPermissions.length} permissions\n`);

    // Seed internal users
    console.log('👤 Seeding internal users...');
    const createdUsers = await seedInternalUsers(dataSource);
    console.log(`✓ Created ${createdUsers.length} internal users\n`);

    console.log('✅ All seeds completed successfully!');
    console.log('\n💡 Note: Permissions are global scopes. Link them to clients via API or manually.');
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    throw error;
  }
}
