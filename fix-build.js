import fs from 'fs';
import path from 'path';

console.log('Running post-build fixes...');

// 1. Copy the optimized index.html to dist
try {
  console.log('Copying index-prod.html to dist/index.html...');
  const optimizedHtml = fs.readFileSync('index-prod.html', 'utf8');
  fs.writeFileSync('dist/index.html', optimizedHtml);
  console.log('✓ Successfully copied index-prod.html to dist/index.html');
} catch (err) {
  console.error('Error copying index-prod.html:', err);
}

// 2. Create a script to inject into the HTML that will fix path issues
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
        } else if (!src.startsWith('./') && !src.startsWith('../')) {
          script.setAttribute('src', basePath + src);
        }
      }
    });
    
    // Fix link hrefs
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('/football-tactics-board/')) {
        if (href.startsWith('/')) {
          link.setAttribute('href', basePath + href.substring(1));
        } else if (!href.startsWith('./') && !href.startsWith('../')) {
          link.setAttribute('href', basePath + href);
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

// 4. Update the deployed 404.html to handle redirects
try {
  console.log('Ensuring 404.html exists in dist...');
  if (fs.existsSync('public/404.html')) {
    fs.copyFileSync('public/404.html', 'dist/404.html');
    console.log('✓ Successfully copied 404.html to dist');
  } else {
    console.warn('404.html not found in public folder, skipping');
  }
} catch (err) {
  console.error('Error copying 404.html:', err);
}

console.log('Post-build fixes complete!'); 