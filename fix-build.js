import fs from 'fs';
import path from 'path';

console.log('Running post-build fixes...');

// 1. Add base path to the script and asset URLs in the built index.html
try {
  console.log('Fixing paths in dist/index.html...');
  let indexHtml = fs.readFileSync('dist/index.html', 'utf8');
  
  // Replace asset paths - this works for both scripts and links
  indexHtml = indexHtml.replace(/src="\/assets\//g, 'src="/football-tactics-board/assets/');
  indexHtml = indexHtml.replace(/href="\/assets\//g, 'href="/football-tactics-board/assets/');
  
  // Replace vite.svg path
  indexHtml = indexHtml.replace(/href="\/vite.svg"/g, 'href="/football-tactics-board/vite.svg"');
  
  fs.writeFileSync('dist/index.html', indexHtml);
  console.log('✓ Successfully fixed paths in dist/index.html');
} catch (err) {
  console.error('Error fixing paths:', err);
}

// 2. Create a script to inject into the HTML that will fix runtime path issues
const fixScript = `
<script>
  // Inject base path for scripts and assets
  (function() {
    const basePath = '/football-tactics-board/';
    const scripts = document.querySelectorAll('script[src]');
    const links = document.querySelectorAll('link[href]');
    
    // Fix script sources
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('/football-tactics-board/')) {
        if (src.startsWith('/')) {
          script.setAttribute('src', basePath + src.substring(1));
        }
      }
    });
    
    // Fix link hrefs
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('/football-tactics-board/')) {
        if (href.startsWith('/')) {
          link.setAttribute('href', basePath + href.substring(1));
        }
      }
    });
    
    console.log('Path fix script executed');
  })();
</script>
`;

// 3. Add the fix script to the built index.html file
try {
  console.log('Adding path fix script to dist/index.html...');
  let indexHtml = fs.readFileSync('dist/index.html', 'utf8');
  
  // Insert the fix script before the closing </body> tag
  indexHtml = indexHtml.replace('</body>', `${fixScript}\n</body>`);
  
  fs.writeFileSync('dist/index.html', indexHtml);
  console.log('✓ Successfully added path fix script to dist/index.html');
} catch (err) {
  console.error('Error adding path fix script:', err);
}

// 4. Copy necessary files to dist
try {
  console.log('Copying static files to dist...');
  if (fs.existsSync('public/404.html')) {
    fs.copyFileSync('public/404.html', 'dist/404.html');
    console.log('✓ Successfully copied 404.html to dist');
  }
  
  if (fs.existsSync('public/test.html')) {
    fs.copyFileSync('public/test.html', 'dist/test.html');
    console.log('✓ Successfully copied test.html to dist');
  }
  
  if (fs.existsSync('public/static.html')) {
    fs.copyFileSync('public/static.html', 'dist/static.html');
    console.log('✓ Successfully copied static.html to dist');
  }
  
  if (fs.existsSync('public/direct.html')) {
    fs.copyFileSync('public/direct.html', 'dist/direct.html');
    console.log('✓ Successfully copied direct.html to dist');
  }
  
  // Create .nojekyll file to prevent GitHub Pages from using Jekyll processing
  fs.writeFileSync('dist/.nojekyll', '');
  console.log('✓ Created .nojekyll file in dist');
} catch (err) {
  console.error('Error copying files:', err);
}

console.log('Post-build fixes complete!'); 