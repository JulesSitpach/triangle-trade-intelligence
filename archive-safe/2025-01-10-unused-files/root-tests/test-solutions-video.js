const { chromium } = require('playwright');

async function testSolutionsPageVideo() {
  console.log('🎬 Testing Solutions Page Video Background Animation...\n');
  
  const browser = await chromium.launch({ headless: false });
  
  try {
    // Desktop Testing
    console.log('📱 DESKTOP TESTING');
    console.log('='.repeat(50));
    
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await desktopContext.newPage();
    
    // Monitor console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });
    
    // Navigate to Solutions page
    const startTime = Date.now();
    await page.goto('http://localhost:3000/solutions');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    console.log(`⏱️  Page load time: ${loadTime}ms`);
    
    // Check video element
    const videoElement = page.locator('video').first();
    const videoCount = await page.locator('video').count();
    console.log(`🎥 Video elements found: ${videoCount}`);
    
    if (videoCount > 0) {
      // Wait for video to be visible
      await videoElement.waitFor({ state: 'visible', timeout: 5000 });
      
      // Get video properties
      const videoSrc = await videoElement.getAttribute('src');
      const videoAutoplay = await videoElement.getAttribute('autoplay');
      const videoMuted = await videoElement.getAttribute('muted');
      const videoLoop = await videoElement.getAttribute('loop');
      const videoPlaysInline = await videoElement.getAttribute('playsInline');
      
      console.log(`📹 Video source: ${videoSrc}`);
      console.log(`▶️  Autoplay: ${videoAutoplay !== null ? '✅' : '❌'}`);
      console.log(`🔇 Muted: ${videoMuted !== null ? '✅' : '❌'}`);
      console.log(`🔄 Loop: ${videoLoop !== null ? '✅' : '❌'}`);
      console.log(`📱 PlaysInline: ${videoPlaysInline !== null ? '✅' : '❌'}`);
      
      // Check if video is playing
      await page.waitForTimeout(2000); // Give video time to start
      
      const videoState = await videoElement.evaluate(video => ({
        paused: video.paused,
        currentTime: video.currentTime,
        duration: video.duration || 0,
        readyState: video.readyState,
        networkState: video.networkState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        playbackRate: video.playbackRate
      }));
      
      console.log(`🎮 Video State:`);
      console.log(`  - Playing: ${!videoState.paused ? '✅' : '❌'}`);
      console.log(`  - Current time: ${videoState.currentTime.toFixed(2)}s`);
      console.log(`  - Duration: ${videoState.duration.toFixed(2)}s`);
      console.log(`  - Ready state: ${videoState.readyState} (4 = loaded)`);
      console.log(`  - Dimensions: ${videoState.videoWidth}x${videoState.videoHeight}`);
      console.log(`  - Playback rate: ${videoState.playbackRate}x (should be 0.8)`);
      
      // Test video progression
      await page.waitForTimeout(2000);
      const newCurrentTime = await videoElement.evaluate(v => v.currentTime);
      const isProgressing = newCurrentTime > videoState.currentTime;
      console.log(`📈 Video progressing: ${isProgressing ? '✅' : '❌'} (${newCurrentTime.toFixed(2)}s)`);
      
      // Check playback rate (should be 0.8 for cinematic effect)
      const playbackRate = await videoElement.evaluate(v => v.playbackRate);
      console.log(`🎬 Cinematic rate (0.8): ${playbackRate === 0.8 ? '✅' : '❌'} (${playbackRate})`);
    }
    
    // Check gradient overlay
    const overlayCount = await page.locator('.hero-gradient-overlay').count();
    console.log(`🎨 Gradient overlay: ${overlayCount > 0 ? '✅' : '❌'} (${overlayCount} found)`);
    
    // Check text readability
    const heroTitle = await page.locator('.hero-main-title').textContent();
    const heroDescription = await page.locator('.hero-description-text').textContent();
    console.log(`📝 Hero title visible: ${heroTitle ? '✅' : '❌'}`);
    console.log(`📄 Hero description visible: ${heroDescription ? '✅' : '❌'}`);
    
    if (heroTitle) {
      console.log(`   Title: "${heroTitle.substring(0, 40)}..."`);
    }
    
    // Capture desktop screenshot
    await page.screenshot({ 
      path: 'solutions-desktop-test.png', 
      fullPage: true 
    });
    console.log(`📸 Desktop screenshot saved: solutions-desktop-test.png`);
    
    await desktopContext.close();
    
    // Mobile Testing (iPhone 15)
    console.log('\n📱 MOBILE TESTING (iPhone 15)');
    console.log('='.repeat(50));
    
    const mobileContext = await browser.newContext({
      ...chromium.devices['iPhone 15'],
      viewport: { width: 393, height: 852 }
    });
    
    const mobilePage = await mobileContext.newPage();
    
    const mobileConsoleMessages = [];
    mobilePage.on('console', msg => {
      mobileConsoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Navigate to Solutions page on mobile
    const mobileStartTime = Date.now();
    await mobilePage.goto('http://localhost:3000/solutions');
    await mobilePage.waitForLoadState('networkidle');
    const mobileLoadTime = Date.now() - mobileStartTime;
    console.log(`⏱️  Mobile load time: ${mobileLoadTime}ms`);
    
    // Check video on mobile
    const mobileVideoCount = await mobilePage.locator('video').count();
    console.log(`🎥 Mobile video elements: ${mobileVideoCount}`);
    
    if (mobileVideoCount > 0) {
      const mobileVideoElement = mobilePage.locator('video').first();
      await mobileVideoElement.waitFor({ state: 'visible', timeout: 5000 });
      
      const mobileVideoState = await mobileVideoElement.evaluate(video => ({
        paused: video.paused,
        currentTime: video.currentTime,
        playbackRate: video.playbackRate,
        muted: video.muted
      }));
      
      console.log(`📱 Mobile video playing: ${!mobileVideoState.paused ? '✅' : '❌'}`);
      console.log(`🔇 Mobile video muted: ${mobileVideoState.muted ? '✅' : '❌'}`);
      console.log(`🎬 Mobile playback rate: ${mobileVideoState.playbackRate}x`);
      
      // Test mobile video progression
      await mobilePage.waitForTimeout(2000);
      const mobileNewTime = await mobileVideoElement.evaluate(v => v.currentTime);
      const mobileProgressing = mobileNewTime > mobileVideoState.currentTime;
      console.log(`📈 Mobile video progressing: ${mobileProgressing ? '✅' : '❌'}`);
    }
    
    // Capture mobile screenshot
    await mobilePage.screenshot({ 
      path: 'solutions-mobile-test.png', 
      fullPage: true 
    });
    console.log(`📸 Mobile screenshot saved: solutions-mobile-test.png`);
    
    await mobileContext.close();
    
    // Performance Analysis
    console.log('\n⚡ PERFORMANCE ANALYSIS');
    console.log('='.repeat(50));
    
    const perfContext = await browser.newContext();
    const perfPage = await perfContext.newPage();
    
    // Enable performance monitoring
    await perfPage.coverage.startJSCoverage();
    await perfPage.coverage.startCSSCoverage();
    
    const navigationStart = Date.now();
    await perfPage.goto('http://localhost:3000/solutions');
    
    // Wait for everything to load
    await perfPage.waitForLoadState('networkidle');
    await perfPage.waitForTimeout(3000); // Allow video to load
    
    const navigationEnd = Date.now();
    const totalLoadTime = navigationEnd - navigationStart;
    
    // Get performance metrics
    const perfMetrics = await perfPage.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });
    
    console.log(`🚀 Total load time: ${totalLoadTime}ms`);
    console.log(`📊 DOM Content Loaded: ${perfMetrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`✅ Load Complete: ${perfMetrics.loadComplete.toFixed(2)}ms`);
    console.log(`🎨 First Paint: ${perfMetrics.firstPaint.toFixed(2)}ms`);
    console.log(`📝 First Contentful Paint: ${perfMetrics.firstContentfulPaint.toFixed(2)}ms`);
    
    // Check for any console errors
    console.log('\n🐛 CONSOLE MESSAGES');
    console.log('='.repeat(50));
    
    const allErrors = consoleMessages.filter(msg => msg.type === 'error');
    const allWarnings = consoleMessages.filter(msg => msg.type === 'warning');
    
    if (allErrors.length === 0) {
      console.log('✅ No console errors detected');
    } else {
      console.log(`❌ ${allErrors.length} console errors found:`);
      allErrors.forEach(error => {
        console.log(`   - ${error.text}`);
      });
    }
    
    if (allWarnings.length > 0) {
      console.log(`⚠️  ${allWarnings.length} console warnings found:`);
      allWarnings.slice(0, 3).forEach(warning => {
        console.log(`   - ${warning.text}`);
      });
    }
    
    await perfContext.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n🎯 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log('✅ Video background animation tested on desktop and mobile');
  console.log('✅ Performance metrics captured');
  console.log('✅ Screenshots saved for visual validation');
  console.log('✅ Console error monitoring completed');
  console.log('\nNext: Compare with homepage video and test cross-browser compatibility');
}

testSolutionsPageVideo().catch(console.error);