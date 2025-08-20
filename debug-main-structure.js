const fs = require('fs');

const content = fs.readFileSync('pages/partnership.js', 'utf8');
const lines = content.split('\n');

console.log('🔍 DEBUGGING MAIN CONTAINER STRUCTURE\n');

const keyLines = [
  { line: 432, desc: 'triangle-layout DIV' },
  { line: 434, desc: 'main ELEMENT' }, 
  { line: 441, desc: 'page-content DIV' },
  { line: 486, desc: 'bloomberg-container-padded DIV' },
  { line: 487, desc: 'bloomberg-grid DIV' },
  { line: 1202, desc: 'CLOSE bloomberg-grid' },
  { line: 1203, desc: 'CLOSE bloomberg-container-padded' },
  { line: 1204, desc: 'CLOSE page-content' },
  { line: 1205, desc: 'CLOSE main' },
  { line: 1206, desc: 'CLOSE triangle-layout' }
];

keyLines.forEach(item => {
  const lineContent = lines[item.line - 1] || 'LINE NOT FOUND';
  console.log(`Line ${item.line}: ${item.desc}`);
  console.log(`   ${lineContent.trim()}`);
  console.log('');
});

// Count opening vs closing tags
let divCount = 0;
let mainCount = 0;

console.log('\n📊 COUNTING TAGS FROM LINE 432 TO END:');

for (let i = 431; i < lines.length; i++) {
  const lineNum = i + 1;
  const line = lines[i];
  
  // Count main tags
  if (line.includes('<main')) {
    mainCount++;
    console.log(`Line ${lineNum}: +1 main (total: ${mainCount})`);
  }
  if (line.includes('</main>')) {
    mainCount--;
    console.log(`Line ${lineNum}: -1 main (total: ${mainCount})`);
  }
  
  // Count divs (excluding self-closing)
  const openMatches = line.match(/<div[^>]*>/g) || [];
  openMatches.forEach(match => {
    if (!match.includes('/>')) {
      divCount++;
    }
  });
  
  const closeMatches = line.match(/<\/div>/g) || [];
  closeMatches.forEach(() => {
    divCount--;
  });
  
  // Report significant div changes
  if (lineNum === 432 || lineNum === 441 || lineNum === 486 || lineNum === 487 || 
      lineNum === 1202 || lineNum === 1203 || lineNum === 1204 || lineNum === 1206) {
    console.log(`Line ${lineNum}: div count = ${divCount}`);
  }
}

console.log(`\nFINAL COUNTS:`);
console.log(`Divs: ${divCount} (should be 0)`);
console.log(`Main: ${mainCount} (should be 0)`);