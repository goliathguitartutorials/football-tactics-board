import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running post-build fixes...');

// Define paths
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');

// Function to get built asset filenames
function getAssetFilenames() {
  try {
    // Find JS and CSS files in the assets directory
    const assetFiles = fs.readdirSync(path.join(distDir, 'assets'));
    const jsFile = assetFiles.find(file => file.endsWith('.js'));
    const cssFile = assetFiles.find(file => file.endsWith('.css'));
    
    return { jsFile, cssFile };
  } catch (err) {
    console.error('Error reading asset files:', err);
    return { jsFile: null, cssFile: null };
  }
}

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run build first.');
  process.exit(1);
}

// 1. Use our custom production HTML file with the correct asset paths
try {
  console.log('Creating production index.html with correct asset paths...');
  
  // Get the asset filenames
  const { jsFile, cssFile } = getAssetFilenames();
  
  if (!jsFile || !cssFile) {
    throw new Error('Could not find JS or CSS files in dist/assets/');
  }
  
  // Read our production HTML template
  let prodHtml = fs.readFileSync(path.join(publicDir, 'index-prod.html'), 'utf8');
  
  // Replace placeholders with actual filenames
  prodHtml = prodHtml.replace('JS_PLACEHOLDER', `assets/${jsFile}`);
  prodHtml = prodHtml.replace('CSS_PLACEHOLDER', `assets/${cssFile}`);
  
  // Write to dist/index.html
  fs.writeFileSync(path.join(distDir, 'index.html'), prodHtml);
  console.log(`✓ Successfully created production index.html with assets: JS=${jsFile}, CSS=${cssFile}`);
} catch (err) {
  console.error('Error creating production index.html:', err);
}

// 2. Create or ensure .nojekyll file exists
try {
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
  console.log('✓ Created .nojekyll file in dist');
} catch (err) {
  console.error('Error creating .nojekyll file:', err);
}

// 3. Copy all HTML files from public directory to dist
try {
  console.log('Copying HTML files from public to dist...');
  
  // Get all HTML files from public
  const htmlFiles = fs.readdirSync(publicDir)
    .filter(file => file.endsWith('.html') && file !== 'index-prod.html');
  
  // Copy each file
  htmlFiles.forEach(file => {
    fs.copyFileSync(
      path.join(publicDir, file),
      path.join(distDir, file)
    );
    console.log(`✓ Copied ${file} to dist`);
  });
} catch (err) {
  console.error('Error copying HTML files:', err);
}

// 4. Create a fallback 404.html if it doesn't exist
try {
  if (!fs.existsSync(path.join(distDir, '404.html'))) {
    console.log('Creating fallback 404.html...');
    
    const fallback404 = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Page Not Found</title>
  <script>
    // Redirect to index
    window.location.href = '/football-tactics-board/';
  </script>
  <style>
    body {
      font-family: sans-serif;
      background-color: #242424;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    div {
      text-align: center;
      background-color: #333;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
    }
    h1 { color: #4CAF50; }
    a { color: #4CAF50; }
  </style>
</head>
<body>
  <div>
    <h1>Page Not Found</h1>
    <p>Redirecting to home page...</p>
    <p>If you are not redirected, <a href="/football-tactics-board/">click here</a>.</p>
  </div>
</body>
</html>`;
    
    fs.writeFileSync(path.join(distDir, '404.html'), fallback404);
    console.log('✓ Created fallback 404.html');
  }
} catch (err) {
  console.error('Error creating fallback 404.html:', err);
}

console.log('Post-build fixes complete!'); 