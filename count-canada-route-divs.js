const fs = require('fs');
const content = fs.readFileSync('pages/partnership.js', 'utf8');
const lines = content.split('\n');

let divCount = 0;
let inCanadaRoute = false;
let inMexicoRoute = false;

for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1;
  const line = lines[i];
  
  // Start tracking at Canada Route
  if (lineNum === 647) {
    inCanadaRoute = true;
    divCount = 0;
    console.log('=== CANADA ROUTE STARTS (line 647) ===');
  }
  
  // Stop tracking when Mexico Route starts
  if (lineNum === 716) {
    inCanadaRoute = false;
    inMexicoRoute = true;
    console.log(`\n=== CANADA ROUTE ENDS ===`);
    console.log(`Final div count for Canada Route: ${divCount}`);
    console.log(`\n=== MEXICO ROUTE STARTS (line 716) ===`);
    divCount = 0;
  }
  
  if (lineNum === 783) {
    inMexicoRoute = false;
    console.log(`\n=== MEXICO ROUTE ENDS ===`);
    console.log(`Final div count for Mexico Route: ${divCount}`);
  }
  
  if (inCanadaRoute || inMexicoRoute) {
    // Count opening divs
    const openMatches = line.match(/<div[^>]*>/g) || [];
    openMatches.forEach(match => {
      if (!match.includes('/>')) {
        divCount++;
        console.log(`Line ${lineNum}: +1 div (total: ${divCount}) - ${line.trim().substring(0, 60)}`);
      }
    });
    
    // Count closing divs
    const closeMatches = line.match(/<\/div>/g) || [];
    closeMatches.forEach(() => {
      divCount--;
      console.log(`Line ${lineNum}: -1 div (total: ${divCount}) - ${line.trim().substring(0, 60)}`);
    });
  }
}