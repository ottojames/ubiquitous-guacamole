const puppeteer = require('puppeteer');

async function testMapView() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Testing FIX-003: Map View 70/30 Split Layout...');
    
    // Navigate to notices page with search parameters
    await page.goto('http://localhost:5173/notices?q=SW1A1AA&radius_km=2&view=map');
    await page.waitForTimeout(2000);
    
    // Check if the grid layout has 70/30 split
    const gridClass = await page.evaluate(() => {
      const gridElement = document.querySelector('.lg\\:grid-cols-\\[70\\%_30\\%\\]');
      return gridElement ? gridElement.className : null;
    });
    
    console.log('Grid layout class found:', gridClass ? 'YES ✓' : 'NO ✗');
    
    // Check for custom scrollbar
    const hasScrollbar = await page.evaluate(() => {
      const scrollElement = document.querySelector('.custom-scrollbar');
      return scrollElement !== null;
    });
    
    console.log('Custom scrollbar class found:', hasScrollbar ? 'YES ✓' : 'NO ✗');
    
    // Check for map container
    const hasMap = await page.evaluate(() => {
      return document.querySelector('.maplibregl-map') !== null;
    });
    
    console.log('Map container found:', hasMap ? 'YES ✓' : 'NO ✗');
    
    // Check for notice cards in sidebar
    const noticeCount = await page.evaluate(() => {
      const articles = document.querySelectorAll('article');
      return articles.length;
    });
    
    console.log('Notice cards in sidebar:', noticeCount);
    
    // Verify the layout proportions
    const layoutDimensions = await page.evaluate(() => {
      const gridContainer = document.querySelector('.lg\\:grid-cols-\\[70\\%_30\\%\\]');
      if (!gridContainer) return null;
      
      const mapSection = gridContainer.querySelector('section:first-child');
      const listSection = gridContainer.querySelector('section:last-child');
      
      if (!mapSection || !listSection) return null;
      
      const containerWidth = gridContainer.getBoundingClientRect().width;
      const mapWidth = mapSection.getBoundingClientRect().width;
      const listWidth = listSection.getBoundingClientRect().width;
      
      return {
        containerWidth,
        mapWidth,
        listWidth,
        mapRatio: (mapWidth / containerWidth * 100).toFixed(1),
        listRatio: (listWidth / containerWidth * 100).toFixed(1)
      };
    });
    
    if (layoutDimensions) {
      console.log('Layout dimensions:', layoutDimensions);
      console.log(`Map takes ${layoutDimensions.mapRatio}% of width`);
      console.log(`List takes ${layoutDimensions.listRatio}% of width`);
    }
    
    // Overall test result
    const allChecks = gridClass && hasScrollbar && hasMap && noticeCount > 0;
    console.log('\n=== FIX-003 TEST RESULT:', allChecks ? 'PASSED ✓' : 'FAILED ✗', '===');
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testMapView();
