const fs = require('fs');
const content = fs.readFileSync('pages/partnership.js', 'utf8');
const lines = content.split('\n');

let tagStack = [];
let lineNum = 0;

for (const line of lines) {
  lineNum++;
  
  // Find opening tags  
  const mainOpen = line.match(/<main[^>]*>/g) || [];
  const divOpen = line.match(/<div[^>]*>/g) || [];
  const openMatches = [...mainOpen, ...divOpen];
  
  // Find closing tags
  const mainClose = line.match(/<\/main>/g) || [];
  const divClose = line.match(/<\/div>/g) || [];
  const closeMatches = [...mainClose, ...divClose];
  
  for (const match of openMatches) {
    if (!match.includes('/>')) {
      const tagType = match.includes('main') ? 'main' : 'div';
      const className = match.match(/className="([^"]*)"/) ? match.match(/className="([^"]*)"/) [1] : '';
      tagStack.push({
        line: lineNum, 
        content: line.trim(), 
        tag: tagType,
        className: className
      });
    }
  }
  
  for (const match of closeMatches) {
    if (tagStack.length > 0) tagStack.pop();
  }
  
  // Check at line 1124 (Intelligence Panel start)
  if (lineNum === 1124) {
    console.log('=== OPEN TAGS AT LINE 1124 (Intelligence Panel Start) ===');
    tagStack.forEach((tag, i) => {
      console.log(`${i+1}. Line ${tag.line}: <${tag.tag}${tag.className ? ` className="${tag.className}"` : ''}>`);
    });
    console.log(`Total: ${tagStack.length} open tags\n`);
  }
  
  // Check at line 1202 (after grid closes)  
  if (lineNum === 1202) {
    console.log('=== OPEN TAGS AT LINE 1202 (After Grid Closes) ===');
    tagStack.forEach((tag, i) => {
      console.log(`${i+1}. Line ${tag.line}: <${tag.tag}${tag.className ? ` className="${tag.className}"` : ''}>`);
    });
    console.log(`Total: ${tagStack.length} open tags\n`);
  }
}