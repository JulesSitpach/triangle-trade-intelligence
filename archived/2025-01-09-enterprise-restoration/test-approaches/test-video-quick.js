const { chromium } = require('playwright');

async function quickVideoTest() {
  console.log('🎬 Quick Video Test - Solutions Page');
  console.log('='.repeat(40));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    // Navigate to Solutions page
    console.log('🔍 Navigating to Solutions page...');
    await page.goto('http://localhost:3000/solutions');
    
    // Wait for video elements
    await page.waitForSelector('video', { timeout: 10000 });
    const videoCount = await page.locator('video').count();
    console.log(`📹 Video elements found: ${videoCount}`);
    
    if (videoCount > 0) {
      // Test each video element
      for (let i = 0; i < videoCount; i++) {
        const video = page.locator('video').nth(i);
        
        // Wait for video to load
        await page.waitForTimeout(3000);
        
        const videoInfo = await video.evaluate((v, index) => {
          return {
            index: index,
            src: v.currentSrc || v.querySelector('source')?.src,
            paused: v.paused,
            currentTime: v.currentTime,
            duration: v.duration,
            readyState: v.readyState,
            playbackRate: v.playbackRate,
            muted: v.muted,
            autoplay: v.autoplay,
            loop: v.loop,
            playsInline: v.playsInline,
            width: v.videoWidth,
            height: v.videoHeight
          };
        }, i);
        
        console.log(`\n📺 Video ${i + 1}:`);
        console.log(`  Source: ${videoInfo.src || 'Not loaded'}`);
        console.log(`  Playing: ${!videoInfo.paused ? '✅' : '❌'}`);
        console.log(`  Current Time: ${videoInfo.currentTime.toFixed(2)}s`);
        console.log(`  Duration: ${(videoInfo.duration || 0).toFixed(2)}s`);
        console.log(`  Ready State: ${videoInfo.readyState}/4`);
        console.log(`  Playback Rate: ${videoInfo.playbackRate}x (target: 0.8)`);
        console.log(`  Dimensions: ${videoInfo.width}x${videoInfo.height}`);
        console.log(`  Settings: muted=${videoInfo.muted}, autoplay=${videoInfo.autoplay}, loop=${videoInfo.loop}`);
        
        // Check if video is progressing
        await page.waitForTimeout(2000);
        const newTime = await video.evaluate(v => v.currentTime);
        const progressing = newTime > videoInfo.currentTime;
        console.log(`  Progressing: ${progressing ? '✅' : '❌'} (${newTime.toFixed(2)}s)`);
      }
    }
    
    // Check hero titles (make sure we fixed the duplicate issue)
    const mainTitles = await page.locator('.hero-main-title').count();
    const ctaTitles = await page.locator('.hero-cta-title').count();
    console.log(`\n📝 Title Elements:`);
    console.log(`  .hero-main-title: ${mainTitles}`);
    console.log(`  .hero-cta-title: ${ctaTitles}`);
    
    // Check gradient overlays
    const overlays = await page.locator('.hero-gradient-overlay').count();
    console.log(`  Gradient overlays: ${overlays}`);
    
    // Take a quick screenshot
    await page.screenshot({ path: 'solutions-quick-test.png', fullPage: true });
    console.log(`\n📸 Screenshot saved: solutions-quick-test.png`);
    
    console.log('\n✅ Quick test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await browser.close();
}

quickVideoTest().catch(console.error);