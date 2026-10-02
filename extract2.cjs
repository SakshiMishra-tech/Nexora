const fs = require('fs');
const log = fs.readFileSync('C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\feb5145f-1d02-428c-8729-db5bb31e6b88\\scratch\\git_log.txt', 'utf8');
const lines = log.split('\n');
let capturing = false;
let output = '';
let openBrackets = 0;
let started = false;

for(let line of lines) {
    if(line.includes('+interface RoommateProfilePanelProps {')) {
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
        
        // Count brackets to know when the function ends
        if (codeLine.includes('function RoommateProfilePanel')) {
            started = true;
        }
        
        if (started) {
            for (let char of codeLine) {
                if (char === '{') openBrackets++;
                if (char === '}') openBrackets--;
            }
            
            // If we've started the function and brackets balance out to 0, it's done!
            if (openBrackets === 0 && codeLine.includes('}')) {
                break;
            }
        }
    }
}
fs.writeFileSync('C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\feb5145f-1d02-428c-8729-db5bb31e6b88\\scratch\\extracted_panel.tsx', output);
