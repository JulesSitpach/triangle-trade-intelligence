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
      divStack.push({line: lineNum, content: line.trim(), tag: match});
    }
  }
  
  for (const match of closeMatches) {
    openDivs--;
    if (divStack.length > 0) divStack.pop();
  }
  
  // Show status around line 1190-1210
  if (lineNum >= 1190 && lineNum <= 1210) {
    console.log(`Line ${lineNum}: Open divs = ${openDivs} | ${line.trim()}`);
  }
}

console.log('\n=== REMAINING OPEN DIVS BEFORE LINE 1200 ===');
// Reset and find what's open at line 1199
divStack = [];
openDivs = 0;
lineNum = 0;

for (const line of lines) {
  lineNum++;
  
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
  
  if (lineNum === 1199) {
    console.log('\nDivs that should still be open at line 1199:');
    divStack.forEach(d => console.log(`  Line ${d.line}: ${d.content}`));
    break;
  }
}