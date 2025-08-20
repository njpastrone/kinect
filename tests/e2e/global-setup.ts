import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for services to be ready
    const baseURL = process.env.BASE_URL || 'http://localhost:5173';
    const apiURL = process.env.API_URL || 'http://localhost:3001/api';
    
    // Check if backend is ready
    console.log('⏳ Waiting for backend to be ready...');
    let backendReady = false;
    for (let i = 0; i < 30; i++) {
      try {
        const response = await page.request.get(`${apiURL.replace('/api', '')}/health`);
        if (response.ok()) {
          backendReady = true;
          console.log('✅ Backend is ready');
          break;
        }
      } catch (error) {
        // Continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (!backendReady) {
      throw new Error('Backend failed to start within timeout');
    }
    
    // Check if frontend is ready
    console.log('⏳ Waiting for frontend to be ready...');
    let frontendReady = false;
    for (let i = 0; i < 30; i++) {
      try {
        await page.goto(baseURL, { timeout: 5000 });
        frontendReady = true;
        console.log('✅ Frontend is ready');
        break;
      } catch (error) {
        // Continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (!frontendReady) {
      throw new Error('Frontend failed to start within timeout');
    }
    
    // Seed the database with test data
    console.log('🌱 Seeding database with test data...');
    try {
      const seedResponse = await page.request.post(`${apiURL}/dev/seed`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // 1 minute for seeding
      });
      
      if (seedResponse.ok()) {
        console.log('✅ Database seeded successfully');
      } else {
        console.warn('⚠️  Database seeding failed, continuing with existing data');
      }
    } catch (error) {
      console.warn('⚠️  Could not seed database:', error);
      console.log('📝 Tests will run with existing data');
    }
    
    console.log('🎉 Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;