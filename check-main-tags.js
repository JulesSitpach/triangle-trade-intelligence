const fs = require('fs');
const content = fs.readFileSync('pages/partnership.js', 'utf8');
const lines = content.split('\n');

let openTags = 0;
let lineNum = 0;
let tagStack = [];

for (const line of lines) {
  lineNum++;
  
  // Find main and div opening tags
  const mainOpen = line.match(/<main[^>]*>/g) || [];
  const divOpen = line.match(/<div[^>]*>/g) || [];
  const openMatches = [...mainOpen, ...divOpen];
  
  // Find main and div closing tags
  const mainClose = line.match(/<\/main>/g) || [];
  const divClose = line.match(/<\/div>/g) || [];
  const closeMatches = [...mainClose, ...divClose];
  
  for (const match of openMatches) {
    if (!match.includes('/>')) {
      openTags++;
      const tagType = match.includes('main') ? 'main' : 'div';
      tagStack.push({line: lineNum, content: line.trim(), tag: tagType});
    }
  }
  
  for (const match of closeMatches) {
    openTags--;
    if (tagStack.length > 0) tagStack.pop();
  }
  
  // Show status around problem area
  if (lineNum >= 1195 && lineNum <= 1210) {
    console.log(`Line ${lineNum}: Open tags = ${openTags} | ${line.trim()}`);
  }
}

console.log('\n=== FINAL ANALYSIS ===');
console.log('Final open tags count:', openTags);