const { chromium } = require('playwright');

async function testManualVideoPlay() {
  console.log('🎬 Manual Video Play Test - Solutions Page');
  console.log('='.repeat(50));
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--autoplay-policy=no-user-gesture-required'] // Allow autoplay
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🌐 Navigating to Solutions page...');
    await page.goto('http://localhost:3000/solutions');
    
    // Wait for videos to be present
    await page.waitForSelector('video', { timeout: 10000 });
    const videoCount = await page.locator('video').count();
    console.log(`📹 Found ${videoCount} video elements`);
    
    // Test each video
    for (let i = 0; i < videoCount; i++) {
      console.log(`\n🎥 Testing Video ${i + 1}:`);
      const video = page.locator('video').nth(i);
      
      // Wait for video to load
      await page.waitForTimeout(2000);
      
      // Check initial state
      const initialState = await video.evaluate(v => ({
        src: v.currentSrc,
        paused: v.paused,
        currentTime: v.currentTime,
        duration: v.duration,
        readyState: v.readyState,
        networkState: v.networkState
      }));
      
      console.log(`  Initial state: paused=${initialState.paused}, readyState=${initialState.readyState}`);
      
      // Try to manually play the video
      try {
        await video.evaluate(async (v) => {
          console.log('Attempting to play video...');
          const playPromise = v.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
          // Set playback rate to 0.8 for cinematic effect
          v.playbackRate = 0.8;
        });
        
        console.log('  ✅ Manual play() called successfully');
        
        // Wait a bit and check if it's playing
        await page.waitForTimeout(2000);
        
        const playingState = await video.evaluate(v => ({
          paused: v.paused,
          currentTime: v.currentTime,
          duration: v.duration,
          playbackRate: v.playbackRate,
          readyState: v.readyState,
          videoWidth: v.videoWidth,
          videoHeight: v.videoHeight
        }));
        
        console.log(`  Playing state: paused=${playingState.paused}, time=${playingState.currentTime.toFixed(2)}s`);
        console.log(`  Duration: ${(playingState.duration || 0).toFixed(2)}s`);
        console.log(`  Playback rate: ${playingState.playbackRate}x`);
        console.log(`  Video dimensions: ${playingState.videoWidth}x${playingState.videoHeight}`);
        console.log(`  Ready state: ${playingState.readyState}/4`);
        
        // Check if video is progressing
        await page.waitForTimeout(3000);
        const laterTime = await video.evaluate(v => v.currentTime);
        const progressing = laterTime > playingState.currentTime;
        console.log(`  Video progressing: ${progressing ? '✅' : '❌'} (${laterTime.toFixed(2)}s)`);
        
        if (progressing) {
          console.log(`  🎉 Video ${i + 1} is playing successfully!`);
        }
        
      } catch (error) {
        console.log(`  ❌ Failed to play video: ${error.message}`);
      }
    }
    
    // Check visual elements
    console.log('\n🎨 Visual Elements Check:');
    
    const heroTitle = await page.locator('.hero-main-title').textContent();
    const ctaTitle = await page.locator('.hero-cta-title').textContent();
    const overlayCount = await page.locator('.hero-gradient-overlay').count();
    
    console.log(`  Hero title: "${heroTitle}"`);
    console.log(`  CTA title: "${ctaTitle}"`);
    console.log(`  Gradient overlays: ${overlayCount}`);
    
    // Test text visibility over video
    const titleVisible = await page.locator('.hero-main-title').isVisible();
    const ctaVisible = await page.locator('.hero-cta-title').isVisible();
    console.log(`  Hero title visible: ${titleVisible ? '✅' : '❌'}`);
    console.log(`  CTA title visible: ${ctaVisible ? '✅' : '❌'}`);
    
    // Capture final screenshot
    await page.screenshot({ 
      path: 'solutions-manual-play-test.png', 
      fullPage: true 
    });
    console.log(`\n📸 Screenshot saved: solutions-manual-play-test.png`);
    
    // Keep browser open for visual inspection
    console.log('\n👀 Browser will stay open for 10 seconds for visual inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await browser.close();
  console.log('\n🎯 Test completed!');
}

testManualVideoPlay().catch(console.error);