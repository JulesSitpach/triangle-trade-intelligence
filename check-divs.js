const fs = require('fs');
const content = fs.readFileSync('pages/partnership.js', 'utf8');
const lines = content.split('\n');

let openDivs = 0;
let lineNum = 0;
let divStack = [];

for (const line of lines) {
  lineNum++;
  
  // Find div tags
  const openMatches = line.match(/<div[^>]*>/g) || [];
  const closeMatches = line.match(/<\/div>/g) || [];
  
  for (const match of openMatches) {
    if (!match.includes('/>')) {
      openDivs++;
      divStack.push({line: lineNum, content: line.trim()});
    }
  }
  
  for (const match of closeMatches) {
    openDivs--;
    if (divStack.length > 0) divStack.pop();
  }
  
  if (lineNum % 200 === 0 || lineNum === lines.length) {
    console.log(`Line ${lineNum}: Open divs = ${openDivs}`);
  }
}

console.log('\n=== FINAL ANALYSIS ===');
console.log('Final open divs count:', openDivs);
if (divStack.length > 0) {
  console.log('\nUnclosed divs:');
  divStack.slice(-10).forEach(d => console.log(`Line ${d.line}: ${d.content}`));
}