/**
 * Aquarium Presentation PDF Generator
 * 
 * Generate child-friendly PDF presentations from HTML files using Playwright.
 * 
 * Usage:
 *   node generate-pdf.js input.html output.pdf
 *   node generate-pdf.js input.html output.pdf --viewport 1404x993
 * 
 * Dependencies:
 *   - Playwright (npm install -g playwright)
 *   - Chromium browser (playwright install chromium)
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Check dependencies before importing
function checkDependencies() {
  const issues = [];

  // Check if playwright is installed
  try {
    require.resolve('playwright');
  } catch (e) {
    issues.push('Playwright is not installed. Run: npm install -g playwright');
  }

  // Check if chromium is installed
  try {
    const playwrightPath = require.resolve('playwright');
    const playwrightDir = path.dirname(playwrightPath);
    const chromiumPath = path.join(playwrightDir, '..', '.local-browsers', 'chromium');
    if (!fs.existsSync(chromiumPath)) {
      issues.push('Chromium browser not found. Run: playwright install chromium');
    }
  } catch (e) {
    issues.push('Cannot verify Chromium installation. Run: playwright install chromium');
  }

  return issues;
}

const dependencyIssues = checkDependencies();
if (dependencyIssues.length > 0) {
  console.error('Error: Missing dependencies\n');
  dependencyIssues.forEach(issue => console.error('  ✗ ' + issue));
  console.error('\nPlease install dependencies and try again.');
  process.exit(1);
}

const { chromium } = require('playwright');

// Load configuration
function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  const defaultConfig = {
    viewport: { width: 1404, height: 993 },
    browser: { defaultTimeout: 30 },
    pdf: {
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    }
  };

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { ...defaultConfig, ...config };
    } catch (e) {
      console.warn(`Warning: Could not load config.json: ${e.message}`);
      console.warn('Using default configuration');
      return defaultConfig;
    }
  }
  return defaultConfig;
}

const CONFIG = loadConfig();

// Parse command line arguments
const args = process.argv.slice(2);
const htmlPath = args[0];
const pdfPath = args[1] || (htmlPath ? htmlPath.replace('.html', '.pdf') : null);

let viewport = { ...CONFIG.viewport };
let debugMode = false;
let timeout = CONFIG.browser.defaultTimeout * 1000;
let pdfFormat = CONFIG.pdf;

// Parse arguments
args.forEach(arg => {
  if (arg === '--debug' || arg === '-d') {
    debugMode = true;
    console.log('Debug mode enabled');
  }
  if (arg === '--config' || arg === '-c') {
    console.log('Current configuration:');
    console.log(JSON.stringify(CONFIG, null, 2));
    process.exit(0);
  }
  if (arg.startsWith('--timeout')) {
    const [, value] = arg.split('=') || arg.split(' ');
    if (value) timeout = parseInt(value, 10) * 1000;
  }
  if (arg.startsWith('--viewport')) {
    const [, dimensions] = arg.split('=') || arg.split(' ');
    if (dimensions) {
      const [w, h] = dimensions.split('x').map(Number);
      if (w && h) viewport = { width: w, height: h };
    }
  }
});

if (!htmlPath) {
  console.error('Usage: node generate-pdf.js <input.html> [output.pdf] [options]');
  console.error('Options:');
  console.error('  --debug              Enable debug mode (saves screenshot on failure)');
  console.error('  --timeout=N          Set network idle timeout in seconds (default: 30)');
  console.error('  --viewport=WxH       Set viewport dimensions (default: 1404x993)');
  console.error('  --config             Display current configuration');
  console.error('');
  console.error('Configuration file: config.json');
  console.error('');
  console.error('Example: node generate-pdf.js presentation.html my-presentation.pdf --debug');
  process.exit(1);
}

// Resolve absolute paths
const htmlAbsPath = path.resolve(htmlPath);
const pdfAbsPath = path.resolve(pdfPath);

// Check if input file exists
if (!fs.existsSync(htmlAbsPath)) {
  console.error(`Error: Input file not found: ${htmlAbsPath}`);
  process.exit(1);
}

console.log(`Generating PDF from: ${htmlAbsPath}`);
console.log(`Output PDF: ${pdfAbsPath}`);
console.log(`Viewport: ${viewport.width}x${viewport.height}`);

(async () => {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(debugMode && { slowMo: 100 }) // Slow down in debug mode
    });

    const page = await browser.newPage({ viewport });

    // Log console messages in debug mode
    if (debugMode) {
      page.on('console', msg => {
        const type = msg.type().toUpperCase();
        console.log(`  [${type}] ${msg.text()}`);
      });
      page.on('pageerror', err => {
        console.error(`  [PAGE ERROR] ${err.message}`);
      });
    }

    // Load HTML file with timeout
    console.log('Loading HTML file...');
    try {
      await page.goto(`file://${htmlAbsPath}`, {
        waitUntil: 'networkidle',
        timeout: timeout
      });
    } catch (e) {
      if (e.name === 'TimeoutError') {
        console.warn('Warning: Network idle timeout, proceeding anyway...');
        // Continue with PDF generation even if network didn't fully idle
      } else {
        throw e;
      }
    }

    // Check for broken images
    if (debugMode) {
      console.log('Checking for broken images...');
      const brokenImages = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        const broken = [];
        images.forEach(img => {
          if (!img.complete || img.naturalWidth === 0) {
            broken.push({
              src: img.src,
              alt: img.alt || 'no alt',
              selector: img.outerHTML.substring(0, 100) + '...'
            });
          }
        });
        return broken;
      });
      if (brokenImages.length > 0) {
        console.warn(`Warning: Found ${brokenImages.length} broken images:`);
        brokenImages.forEach(img => {
          console.warn(`  - src: ${img.src} (alt: ${img.alt})`);
        });
      } else {
        console.log('  All images loaded successfully');
      }
    }

    // Generate PDF with print-friendly settings
    console.log('Generating PDF...');
    await page.pdf({
      path: pdfAbsPath,
      format: pdfFormat.format,
      landscape: pdfFormat.landscape,
      printBackground: pdfFormat.printBackground,
      margin: pdfFormat.margin
    });
    
    await browser.close();
    
    // Verify output
    if (fs.existsSync(pdfAbsPath)) {
      const stats = fs.statSync(pdfAbsPath);
      console.log('✓ PDF generated successfully!');
      console.log(`  File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Location: ${pdfAbsPath}`);
    } else {
      console.error('✗ PDF generation failed - output file not found');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n✗ PDF generation failed!');
    console.error(`Error: ${error.message}`);

    // Save debug screenshot if in debug mode
    if (debugMode && browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          const screenshotPath = pdfAbsPath.replace('.pdf', '_debug.png');
          await pages[0].screenshot({ path: screenshotPath, fullPage: true });
          console.log(`\nDebug screenshot saved to: ${screenshotPath}`);
        }
      } catch (screenshotError) {
        console.error('Failed to save debug screenshot:', screenshotError.message);
      }
    }

    if (browser) await browser.close();
    process.exit(1);
  }
})();