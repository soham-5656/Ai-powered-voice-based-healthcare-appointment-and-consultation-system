const fs = require('fs');
const path = require('path');

const replacements = {
    'Ã°Å¸â€˜â€¹': '👋',
    'Ã¢Å“â€¦': '✅',
    'Ã¢â‚¬â€œ': '–',
    'Ã¢â‚¬â€ ': '—',
    'Ã¢â‚¬Â¦': '…',
    'Ã°Å¸Â©Âº': '🩺',
    'Ã¢Â Â¤Ã¯Â¸Â ': '❤️',
    'Ã°Å¸Â§Â ': '🧠',
    'Ã°Å¸â€˜Â¶': '👶',
    'Ã°Å¸Å’Â¿': '🌿',
    'Ã°Å¸Â«Â ': '🫁',
    'Ã°Å¸â€ Â¬': '🔬',
    'Ã°Å¸Â¦Â´': '🦴',
    'Ã°Å¸â€™Â­': '💭',
    'Ã°Å¸â€˜â€š': '👂',
    'Ã°Å¸Å’Â¸': '🌸',
    'Ã°Å¸â€ Â´': '🔴',
    'Ã‚Â·': '·',
    'Ã¢â€ â‚¬Ã¢â€ â‚¬': '──',
    'Ã°Å¸Å½Â¤': '🎤',
    'Ã‚©': '©',
    'Ã¢â‚¬Â¢': '•',
    'Ã¢â€ â€™': '→',
    'Ã¢Å¡Â Ã¯Â¸Â ': '⚠️',
    'Ã°Å¸â€˜Â¤': '👤',
    'Ã°Å¸â€˜Â¨Ã¢â‚¬Â Ã¢Å¡•Ã¯Â¸Â ': '👨‍⚕️',
    'Ã¢Â Â³': '⏳',
    'Ã°Å¸â€“Å Ã¯Â¸Â ': '🖊️',
    'Ã°Å¸â€™Å ': '💊',
    'Ã¢Å“â€œ': '✅',
    'Ã¢•Â ': '═',
    'Ã¢â€ Â ': '↳'
};

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(path.join(__dirname, 'frontend/src'), function(filePath) {
    if (filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        for (const [k, v] of Object.entries(replacements)) {
            content = content.split(k).join(v);
        }
        fs.writeFileSync(filePath, content, 'utf8');
    }
});
console.log('Node UI text cleanup done');
