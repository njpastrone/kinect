import { resetDatabase, seedDatabase } from './seed';

async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'reset':
        await resetDatabase();
        break;
      case 'seed':
        await seedDatabase();
        break;
      case 'reset-and-seed':
        await resetDatabase();
        await seedDatabase();
        break;
      default:
        console.warn('Usage: npm run reset [reset|seed|reset-and-seed]');
        console.warn('  reset: Clear all data');
        console.warn('  seed: Add demo data (after reset)');
        console.warn('  reset-and-seed: Clear all data and add demo data');
        break;
    }
  } catch (error) {
    console.error('Operation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}