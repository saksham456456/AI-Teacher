const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Add an empty build script so Vercel doesn't fail trying to run it
pkg.scripts.build = "echo 'No build step required'";

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
