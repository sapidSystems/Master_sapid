import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      results.push(file);
    }
  });
  return results;
}

const dirPath = path.join(__dirname, '..', 'src', 'procurement');
const files = walk(dirPath);

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const cleaned = content.replace(/\sdark:[a-zA-Z0-9_\-\/\[\]:]+/g, '');
  if (content !== cleaned) {
    fs.writeFileSync(filePath, cleaned, 'utf8');
    console.log('Cleaned dark classes from:', filePath);
  }
});
