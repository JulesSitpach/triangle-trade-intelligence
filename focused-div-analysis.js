const fs = require('fs');
const content = fs.readFileSync('pages/partnership.js', 'utf8');
const lines = content.split('\n');

console.log('🎯 FOCUSED DIV ANALYSIS: Form Section (490-1121)\n');

let divStack = [];
let errors = [];

// Analyze the form section specifically
for (let i = 489; i < 1121; i++) {
  const lineNum = i + 1;
  const line = lines[i];
  
  if (!line) continue;
  
  // Find opening divs
  const openMatches = line.match(/<div[^>]*>/g) || [];
  openMatches.forEach(match => {
    if (!match.includes('/>')) {
      const className = match.match(/className="([^"]*)"/) ? match.match(/className="([^"]*)"/) [1] : 'no-class';
      divStack.push({ line: lineNum, className, tag: match });
      console.log(`Line ${lineNum}: OPEN <div className="${className}"> (Stack: ${divStack.length})`);
    }
  });
  
  // Find closing divs
  const closeMatches = line.match(/<\/div>/g) || [];
  closeMatches.forEach(() => {
    if (divStack.length > 0) {
      const opened = divStack.pop();
      console.log(`Line ${lineNum}: CLOSE </div> (was: ${opened.className} from line ${opened.line}) (Stack: ${divStack.length})`);
    } else {
      console.log(`Line ${lineNum}: ❌ EXTRA CLOSING </div> - no matching opening tag`);
      errors.push(`Line ${lineNum}: Extra closing div`);
    }
  });
}

console.log('\n📊 FORM SECTION ANALYSIS COMPLETE:');
console.log(`Unclosed divs: ${divStack.length}`);

if (divStack.length > 0) {
  console.log('\n❌ UNCLOSED DIVS IN FORM SECTION:');
  divStack.forEach(div => {
    console.log(`   Line ${div.line}: <div className="${div.className}"> never closed`);
    errors.push(`Line ${div.line}: Unclosed div (${div.className})`);
  });
}

if (errors.length > 0) {
  console.log('\n🚨 ALL ERRORS FOUND:');
  errors.forEach(error => console.log(`   ${error}`));
} else {
  console.log('\n✅ Form section has balanced div tags');
}

// Now check the intelligence section
console.log('\n🎯 INTELLIGENCE SECTION ANALYSIS (1124-1201):\n');

let intStack = [];
for (let i = 1123; i < 1201; i++) {
  const lineNum = i + 1;
  const line = lines[i];
  
  if (!line) continue;
  
  const openMatches = line.match(/<div[^>]*>/g) || [];
  openMatches.forEach(match => {
    if (!match.includes('/>')) {
      const className = match.match(/className="([^"]*)"/) ? match.match(/className="([^"]*)"/) [1] : 'no-class';
      intStack.push({ line: lineNum, className });
      console.log(`Line ${lineNum}: OPEN <div className="${className}"> (Stack: ${intStack.length})`);
    }
  });
  
  const closeMatches = line.match(/<\/div>/g) || [];
  closeMatches.forEach(() => {
    if (intStack.length > 0) {
      const opened = intStack.pop();
      console.log(`Line ${lineNum}: CLOSE </div> (was: ${opened.className} from line ${opened.line}) (Stack: ${intStack.length})`);
    } else {
      console.log(`Line ${lineNum}: ❌ EXTRA CLOSING </div>`);
    }
  });
}

console.log(`\nIntelligence section unclosed divs: ${intStack.length}`);
if (intStack.length > 0) {
  intStack.forEach(div => {
    console.log(`   Line ${div.line}: <div className="${div.className}"> never closed`);
  });
}