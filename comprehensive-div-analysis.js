const fs = require('fs');

const content = fs.readFileSync('pages/partnership.js', 'utf8');
const lines = content.split('\n');

console.log('🔍 COMPREHENSIVE DIV ANALYSIS FROM LINE 487-1202\n');

let divCount = 0;
let detailedLog = [];

// Start from line 487 where bloomberg-grid opens
for (let i = 486; i < 1202; i++) {
  const lineNum = i + 1;
  const line = lines[i];
  
  if (!line) continue;
  
  // Count opening divs (excluding self-closing)
  const openMatches = line.match(/<div[^>]*>/g) || [];
  openMatches.forEach(match => {
    if (!match.includes('/>')) {
      divCount++;
      detailedLog.push(`Line ${lineNum}: +1 div (${divCount}) - ${match}`);
    }
  });
  
  // Count closing divs
  const closeMatches = line.match(/<\/div>/g) || [];
  closeMatches.forEach(() => {
    divCount--;
    detailedLog.push(`Line ${lineNum}: -1 div (${divCount}) - </div>`);
  });
}

console.log('📊 DETAILED DIV TRACKING:');
detailedLog.forEach(log => console.log(log));

console.log(`\n🎯 FINAL COUNT AFTER LINE 1201: ${divCount}`);
console.log('Expected: 4 (bloomberg-grid + bloomberg-container-padded + page-content + triangle-layout)');

if (divCount !== 4) {
  console.log('❌ MISMATCH DETECTED!');
  console.log(`Missing ${4 - divCount} opening div tags or ${divCount - 4} extra closing div tags`);
} else {
  console.log('✅ Count matches expected structure');
}