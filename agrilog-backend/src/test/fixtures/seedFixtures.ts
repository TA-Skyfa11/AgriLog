import { seedTestFixtures, cleanupTestFixtures } from './testData';

async function main() {
  const arg = process.argv[2];
  if (arg === 'clean' || arg === '--clean') {
    console.log('🧹 Cleaning up test fixture data...');
    await cleanupTestFixtures();
    console.log('✅ Cleanup completed.');
  } else {
    console.log('🌱 Seeding test fixture data into Supabase PostgreSQL...');
    await seedTestFixtures();
    console.log('✅ Test fixture data successfully seeded.');
    console.log('\nCredentials for testing:');
    console.log('  👑 Admin:   test.admin@agrilog.test   | Password: TestSecret123!');
    console.log('  👨‍🌾 Farmer:  test.farmer@agrilog.test  | Password: TestSecret123!');
    console.log('  🏢 Company: test.company@agrilog.test | Password: TestSecret123!');
    console.log('  🔒 Locked:  test.locked@agrilog.test  | Password: TestSecret123!');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error managing test fixtures:', err);
  process.exit(1);
});
