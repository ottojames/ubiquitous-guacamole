import fs from 'fs';

const filePath = '/Users/ottoclarke/projects/ubiquitous-guacamole/server/routes/representations.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Remove the old getSupabase function and related code
const lines = content.split('\n');
const newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Start skipping when we hit the function definition
  if (line.includes('function getSupabase()')) {
    skip = true;
    continue;
  }

  // Stop skipping after the closing brace
  if (skip && line === '}') {
    skip = false;
    continue;
  }

  // Skip the supabaseClient declaration line
  if (line.includes('let supabaseClient:')) {
    continue;
  }

  // Skip lines inside the function
  if (skip) {
    continue;
  }

  newLines.push(line);
}

// Join back and clean up extra blank lines
content = newLines.join('\n').replace(/\n\n\n+/g, '\n\n');

// Remove any createClient import if it exists
content = content.replace(/import\s*{\s*createClient\s*}\s*from\s*'@supabase\/supabase-js';\s*\n/g, '');

fs.writeFileSync(filePath, content);
console.log('✅ Fixed representations.ts');