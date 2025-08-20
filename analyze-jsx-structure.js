const fs = require('fs');

const content = fs.readFileSync('pages/partnership.js', 'utf8');
const lines = content.split('\n');

let stack = [];
let errors = [];

console.log('🔍 ANALYZING JSX STRUCTURE FOR PARTNERSHIP PAGE\n');

for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1;
  const line = lines[i].trim();
  
  if (!line) continue;
  
  // Skip comments and imports
  if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('import') || line.startsWith('*')) continue;
  
  // Find JSX fragments
  if (line.includes('<>') || line.match(/return\s*\(/)) {
    stack.push({ type: 'fragment', line: lineNum, tag: 'fragment' });
  }
  
  // Find opening JSX tags (but not self-closing)
  const openTagMatches = line.match(/<(\w+)[^>]*>/g) || [];
  openTagMatches.forEach(match => {
    if (!match.includes('/>')) {  // Not self-closing
      const tagName = match.match(/<(\w+)/)[1];
      stack.push({ type: 'element', line: lineNum, tag: tagName, match });
      console.log(`Line ${lineNum}: OPEN <${tagName}> (Stack depth: ${stack.length})`);
    }
  });
  
  // Find closing JSX tags
  const closeTagMatches = line.match(/<\/(\w+)>/g) || [];
  closeTagMatches.forEach(match => {
    const tagName = match.match(/<\/(\w+)>/)[1];
    
    // Find the matching opening tag
    let found = false;
    for (let j = stack.length - 1; j >= 0; j--) {
      if (stack[j].tag === tagName && stack[j].type === 'element') {
        const openTag = stack.splice(j, 1)[0];
        console.log(`Line ${lineNum}: CLOSE </${tagName}> (matches line ${openTag.line}) (Stack depth: ${stack.length})`);
        found = true;
        break;
      }
    }
    
    if (!found) {
      errors.push(`Line ${lineNum}: Unmatched closing tag </${tagName}>`);
      console.log(`❌ Line ${lineNum}: Unmatched closing tag </${tagName}>`);
    }
  });
  
  // Find JSX fragment closures
  if (line.includes('</>')) {
    let found = false;
    for (let j = stack.length - 1; j >= 0; j--) {
      if (stack[j].type === 'fragment') {
        const openFragment = stack.splice(j, 1)[0];
        console.log(`Line ${lineNum}: CLOSE </> (matches line ${openFragment.line}) (Stack depth: ${stack.length})`);
        found = true;
        break;
      }
    }
    
    if (!found) {
      errors.push(`Line ${lineNum}: Unmatched JSX fragment closure </>`);
      console.log(`❌ Line ${lineNum}: Unmatched JSX fragment closure </>`);
    }
  }
}

console.log('\n📊 FINAL ANALYSIS:');
console.log('==================');

if (stack.length === 0) {
  console.log('✅ All JSX elements properly closed!');
} else {
  console.log(`❌ ${stack.length} unclosed elements found:`);
  stack.forEach(item => {
    console.log(`   - Line ${item.line}: Unclosed <${item.tag}> ${item.match || ''}`);
    errors.push(`Line ${item.line}: Unclosed <${item.tag}>`);
  });
}

if (errors.length > 0) {
  console.log('\n🚨 ERRORS FOUND:');
  errors.forEach(error => console.log(`   ${error}`));
} else {
  console.log('\n✅ No JSX structure errors found!');
}