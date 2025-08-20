import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    const apiURL = process.env.API_URL || 'http://localhost:3001/api';
    
    // Clean up test data (optional)
    console.log('🗑️  Cleaning up test data...');
    try {
      const resetResponse = await page.request.post(`${apiURL}/dev/reset`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000 // 30 seconds
      });
      
      if (resetResponse.ok()) {
        console.log('✅ Test data cleaned up successfully');
      } else {
        console.warn('⚠️  Could not clean up test data');
      }
    } catch (error) {
      console.warn('⚠️  Test data cleanup failed:', error);
    }
    
    console.log('✨ Global teardown completed');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

export default globalTeardown;