const { chromium } = require('playwright');

async function compareHomePageVsSolutions() {
  console.log('🔄 Comparing Homepage vs Solutions Video Animation');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--autoplay-policy=no-user-gesture-required']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const results = {};
  
  const pages = [
    { name: 'Homepage', url: 'http://localhost:3000/' },
    { name: 'Solutions', url: 'http://localhost:3000/solutions' }
  ];
  
  for (const pageInfo of pages) {
    console.log(`\n🌐 Testing ${pageInfo.name} (${pageInfo.url})`);
    console.log('-'.repeat(40));
    
    try {
      const page = await context.newPage();
      
      // Monitor console messages
      const consoleMessages = [];
      page.on('console', msg => {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text()
        });
      });
      
      // Navigate to page
      const startTime = Date.now();
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`⏱️  Load time: ${loadTime}ms`);
      
      // Count video elements
      await page.waitForSelector('video', { timeout: 5000 }).catch(() => {});
      const videoCount = await page.locator('video').count();
      console.log(`🎥 Video elements: ${videoCount}`);
      
      const videoResults = [];
      
      if (videoCount > 0) {
        // Test first video element
        const video = page.locator('video').first();
        
        // Give video time to load
        await page.waitForTimeout(3000);
        
        const videoState = await video.evaluate(v => {
          // Try to play manually if not playing
          if (v.paused) {
            v.play().catch(e => console.log('Play failed:', e));
          }
          
          return {
            src: v.currentSrc,
            paused: v.paused,
            currentTime: v.currentTime,
            duration: v.duration || 0,
            readyState: v.readyState,
            playbackRate: v.playbackRate,
            autoplay: v.autoplay,
            muted: v.muted,
            loop: v.loop,
            videoWidth: v.videoWidth,
            videoHeight: v.videoHeight,
            canPlayType_mp4: v.canPlayType('video/mp4')
          };
        });
        
        console.log(`📹 Video source: ${videoState.src}`);
        console.log(`▶️  Playing: ${!videoState.paused ? '✅' : '❌'}`);
        console.log(`⏰ Current time: ${videoState.currentTime.toFixed(2)}s`);
        console.log(`⌛ Duration: ${videoState.duration.toFixed(2)}s`);
        console.log(`🎬 Playback rate: ${videoState.playbackRate}x`);
        console.log(`📊 Ready state: ${videoState.readyState}/4`);
        console.log(`📐 Dimensions: ${videoState.videoWidth}x${videoState.videoHeight}`);
        console.log(`🎛️  Settings: autoplay=${videoState.autoplay}, muted=${videoState.muted}, loop=${videoState.loop}`);
        console.log(`🎵 MP4 support: ${videoState.canPlayType_mp4}`);
        
        // Test video progression
        await page.waitForTimeout(2000);
        const newTime = await video.evaluate(v => v.currentTime);
        const progressing = newTime > videoState.currentTime;
        console.log(`📈 Progressing: ${progressing ? '✅' : '❌'} (${newTime.toFixed(2)}s)`);
        
        videoResults.push({
          playing: !videoState.paused,
          progressing: progressing,
          readyState: videoState.readyState,
          playbackRate: videoState.playbackRate
        });
      }
      
      // Check console errors
      const errors = consoleMessages.filter(msg => msg.type === 'error');
      const warnings = consoleMessages.filter(msg => msg.type === 'warning');
      
      console.log(`🐛 Console errors: ${errors.length}`);
      if (errors.length > 0) {
        errors.slice(0, 2).forEach(error => {
          console.log(`   - ${error.text}`);
        });
      }
      
      console.log(`⚠️  Console warnings: ${warnings.length}`);
      if (warnings.length > 0) {
        warnings.slice(0, 2).forEach(warning => {
          console.log(`   - ${warning.text}`);
        });
      }
      
      // Take screenshot
      const screenshotPath = `${pageInfo.name.toLowerCase()}-comparison.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Screenshot: ${screenshotPath}`);
      
      results[pageInfo.name] = {
        loadTime,
        videoCount,
        videoResults,
        errorCount: errors.length,
        warningCount: warnings.length,
        screenshotPath
      };
      
      await page.close();
      
    } catch (error) {
      console.log(`❌ Error testing ${pageInfo.name}: ${error.message}`);
      results[pageInfo.name] = { error: error.message };
    }
  }
  
  // Comparison Summary
  console.log('\n📊 COMPARISON SUMMARY');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([pageName, result]) => {
    if (result.error) {
      console.log(`${pageName}: ❌ ${result.error}`);
    } else {
      console.log(`${pageName}:`);
      console.log(`  Load time: ${result.loadTime}ms`);
      console.log(`  Videos: ${result.videoCount}`);
      console.log(`  Errors: ${result.errorCount}`);
      console.log(`  Video working: ${result.videoResults?.[0]?.playing ? '✅' : '❌'}`);
      console.log(`  Video progressing: ${result.videoResults?.[0]?.progressing ? '✅' : '❌'}`);
      console.log(`  Playback rate: ${result.videoResults?.[0]?.playbackRate || 'N/A'}`);
    }
    console.log('');
  });
  
  await browser.close();
  console.log('🏁 Comparison completed!');
}

compareHomePageVsSolutions().catch(console.error);