const fs = require('fs');
const log = fs.readFileSync('C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\feb5145f-1d02-428c-8729-db5bb31e6b88\\scratch\\git_log.txt', 'utf8');
const lines = log.split('\n');
let capturing = false;
let output = '';
for(let line of lines) {
    if(line.includes('+interface RoommateProfilePanelProps {')) {
        capturing = true;
    }
    if(capturing) {
        if (line.startsWith('+')) {
            output += line.substring(1) + '\n';
        } else if (line.startsWith(' ')) {
            output += line.substring(1) + '\n';
        } else if (line.includes('-function SelectField')) {
            break;
        }
    }
}
fs.writeFileSync('C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\feb5145f-1d02-428c-8729-db5bb31e6b88\\scratch\\extracted_panel.tsx', output);
