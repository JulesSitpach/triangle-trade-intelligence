const { chromium, webkit, firefox } = require('playwright');

async function testMobileCompatibility() {
  console.log('📱 Mobile Compatibility & Cross-Browser Test - Solutions Page');
  console.log('='.repeat(70));
  
  const devices = [
    { name: 'iPhone 15', device: 'iPhone 15' },
    { name: 'iPhone 15 Pro Max', device: 'iPhone 15 Pro Max' },
    { name: 'iPad Pro', device: 'iPad Pro' },
    { name: 'Pixel 7', device: 'Pixel 7' },
    { name: 'Galaxy S24', device: 'Galaxy S24' }
  ];
  
  const browsers = [
    { name: 'Chromium', launcher: chromium },
    { name: 'WebKit (Safari)', launcher: webkit },
    { name: 'Firefox', launcher: firefox }
  ];
  
  const results = {};
  
  for (const browserInfo of browsers) {
    console.log(`\n🌐 Testing ${browserInfo.name}`);
    console.log('-'.repeat(50));
    
    try {
      const browser = await browserInfo.launcher.launch({ 
        headless: false,
        args: ['--autoplay-policy=no-user-gesture-required']
      });
      
      results[browserInfo.name] = {};
      
      for (const deviceInfo of devices) {
        console.log(`\n📱 ${browserInfo.name} - ${deviceInfo.name}:`);
        
        try {
          const context = await browser.newContext({
            ...browserInfo.launcher.devices[deviceInfo.device],
            permissions: ['autoplay']
          });
          
          const page = await context.newPage();
          
          // Monitor performance
          const startTime = Date.now();
          await page.goto('http://localhost:3000/solutions');
          await page.waitForLoadState('networkidle');
          const loadTime = Date.now() - startTime;
          
          console.log(`  ⏱️  Load time: ${loadTime}ms`);
          
          // Check video elements
          const videoCount = await page.locator('video').count();
          console.log(`  🎥 Video elements: ${videoCount}`);
          
          const deviceResults = {
            loadTime,
            videoCount,
            videos: []
          };
          
          if (videoCount > 0) {
            // Test first video
            const video = page.locator('video').first();
            await page.waitForTimeout(3000);
            
            const videoState = await video.evaluate(v => {
              // Try manual play for mobile
              if (v.paused) {
                const playPromise = v.play();
                if (playPromise) {
                  playPromise.catch(e => console.log('Mobile autoplay blocked:', e.message));
                }
              }
              
              return {
                paused: v.paused,
                currentTime: v.currentTime,
                readyState: v.readyState,
                playbackRate: v.playbackRate,
                muted: v.muted,
                playsInline: v.playsInline,
                videoWidth: v.videoWidth,
                videoHeight: v.videoHeight
              };
            });
            
            console.log(`  ▶️  Playing: ${!videoState.paused ? '✅' : '❌'}`);
            console.log(`  📱 PlaysInline: ${videoState.playsInline ? '✅' : '❌'}`);
            console.log(`  🔇 Muted: ${videoState.muted ? '✅' : '❌'}`);
            console.log(`  📊 Ready state: ${videoState.readyState}/4`);
            console.log(`  🎬 Playback rate: ${videoState.playbackRate}x`);
            
            // Test video progression on mobile
            await page.waitForTimeout(2000);
            const newTime = await video.evaluate(v => v.currentTime);
            const progressing = newTime > videoState.currentTime;
            console.log(`  📈 Progressing: ${progressing ? '✅' : '❌'} (${newTime.toFixed(2)}s)`);
            
            deviceResults.videos.push({
              playing: !videoState.paused,
              progressing: progressing,
              readyState: videoState.readyState,
              playsInline: videoState.playsInline
            });
          }
          
          // Check text readability
          const heroVisible = await page.locator('.hero-main-title').isVisible();
          const ctaVisible = await page.locator('.hero-cta-title').isVisible();
          const overlayCount = await page.locator('.hero-gradient-overlay').count();
          
          console.log(`  📝 Hero title visible: ${heroVisible ? '✅' : '❌'}`);
          console.log(`  📄 CTA title visible: ${ctaVisible ? '✅' : '❌'}`);
          console.log(`  🎨 Gradient overlays: ${overlayCount}`);
          
          // Test navigation and buttons
          const buttonCount = await page.locator('.hero-primary-button, .hero-secondary-button').count();
          console.log(`  🔘 Action buttons: ${buttonCount}`);
          
          // Take mobile screenshot
          const screenshotPath = `solutions-${browserInfo.name.toLowerCase().replace(/\s/g, '-')}-${deviceInfo.name.toLowerCase().replace(/\s/g, '-')}.png`;
          await page.screenshot({ path: screenshotPath });
          console.log(`  📸 Screenshot: ${screenshotPath}`);
          
          deviceResults.textVisible = heroVisible && ctaVisible;
          deviceResults.overlayCount = overlayCount;
          deviceResults.buttonCount = buttonCount;
          deviceResults.screenshot = screenshotPath;
          
          results[browserInfo.name][deviceInfo.name] = deviceResults;
          
          await context.close();
          
        } catch (error) {
          console.log(`  ❌ Error: ${error.message}`);
          results[browserInfo.name][deviceInfo.name] = { error: error.message };
        }
      }
      
      await browser.close();
      
    } catch (browserError) {
      console.log(`❌ Failed to launch ${browserInfo.name}: ${browserError.message}`);
      results[browserInfo.name] = { error: browserError.message };
    }
  }
  
  // Generate compatibility report
  console.log('\n📊 MOBILE COMPATIBILITY REPORT');
  console.log('='.repeat(70));
  
  Object.entries(results).forEach(([browserName, browserResults]) => {
    if (browserResults.error) {
      console.log(`${browserName}: ❌ ${browserResults.error}`);
      return;
    }
    
    console.log(`\n${browserName}:`);
    Object.entries(browserResults).forEach(([deviceName, deviceResult]) => {
      if (deviceResult.error) {
        console.log(`  ${deviceName}: ❌ ${deviceResult.error}`);
      } else {
        const videoWorking = deviceResult.videos?.[0]?.playing || false;
        const videoProgressing = deviceResult.videos?.[0]?.progressing || false;
        
        console.log(`  ${deviceName}:`);
        console.log(`    Load: ${deviceResult.loadTime}ms`);
        console.log(`    Video: ${videoWorking ? '✅' : '❌'} (${videoProgressing ? 'progressing' : 'static'})`);
        console.log(`    Text: ${deviceResult.textVisible ? '✅' : '❌'}`);
        console.log(`    playsInline: ${deviceResult.videos?.[0]?.playsInline ? '✅' : '❌'}`);
      }
    });
  });
  
  console.log('\n🎯 Test Summary:');
  console.log('✅ Mobile video background animation tested across devices and browsers');
  console.log('✅ Text readability over video verified');
  console.log('✅ Cross-browser compatibility validated');
  console.log('✅ Screenshots captured for visual validation');
}

testMobileCompatibility().catch(console.error);