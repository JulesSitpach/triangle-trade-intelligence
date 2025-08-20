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
      
      // Track the specific bloomberg tags we care about
      if (className === 'bloomberg-container-padded' && lineNum === 486) {
        console.log(`OPENED: bloomberg-container-padded at line ${lineNum}`);
      }
      if (className === 'bloomberg-grid bloomberg-grid-2' && lineNum === 487) {
        console.log(`OPENED: bloomberg-grid bloomberg-grid-2 at line ${lineNum}`);
      }
    }
  }
  
  for (const match of closeMatches) {
    if (tagStack.length > 0) {
      const closedTag = tagStack.pop();
      
      // Track when our bloomberg tags get closed
      if (closedTag.className === 'bloomberg-container-padded') {
        console.log(`CLOSED: bloomberg-container-padded from line ${closedTag.line} at line ${lineNum}`);
      }
      if (closedTag.className === 'bloomberg-grid bloomberg-grid-2') {
        console.log(`CLOSED: bloomberg-grid bloomberg-grid-2 from line ${closedTag.line} at line ${lineNum}`);
      }
    }
  }
}