const fs = require('fs');
const path = require('path');

const files = ['public/styles/liberty.json', 'public/styles/satellite.json'];

files.forEach(file => {
    try {
        const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
        JSON.parse(content);
        console.log(`${file} is valid JSON.`);
    } catch (err) {
        console.error(`Error parsing ${file}:`, err.message);
    }
});
