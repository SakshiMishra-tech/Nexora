const fs = require('fs');
const log = fs.readFileSync('C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\feb5145f-1d02-428c-8729-db5bb31e6b88\\scratch\\git_log.txt', 'utf8');
const lines = log.split('\n');
let capturing = false;
let output = '';
let openBrackets = 0;
let started = false;

for(let line of lines) {
    if(line.includes('+function CompatibilityArc(')) {
        capturing = true;
    }
    
    if(capturing) {
        if (line.startsWith('-')) {
            continue; // Skip deletions
        }
        
        let codeLine = '';
        if (line.startsWith('+')) {
            codeLine = line.substring(1);
        } else if (line.startsWith(' ')) {
            codeLine = line.substring(1);
        } else {
            // Context lines or weird diff lines, skip
            continue;
        }
        
        output += codeLine + '\n';
        
        if (codeLine.includes('function CompatibilityArc(')) {
            started = true;
        }
        
        if (started) {
            for (let char of codeLine) {
                if (char === '{') openBrackets++;
                if (char === '}') openBrackets--;
            }
            
            if (openBrackets === 0 && codeLine.includes('}')) {
                break;
            }
        }
    }
}
fs.writeFileSync('C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\feb5145f-1d02-428c-8729-db5bb31e6b88\\scratch\\compatibility_arc.tsx', output);
