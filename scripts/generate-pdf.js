/**
 * Aquarium Presentation PDF Generator
 *
 * Generate child-friendly PDF presentations from HTML files using Playwright.
 *
 * Usage:
 *   node generate-pdf.js input.html output.pdf
 *   node generate-pdf.js input.html output.pdf --viewport 1404x993
 *   node generate-pdf.js input.html output.pdf --self-test
 *
 * Dependencies:
 *   - Playwright (npm install -g playwright)
 *   - Chromium browser (playwright install chromium)
 */

const path = require('path');
const fs = require('fs');

// Check dependencies before importing
function checkDependencies() {
  const issues = [];

  try {
    require.resolve('playwright');
  } catch (e) {
    issues.push('Playwright is not installed. Run: npm install playwright');
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
  const skillRoot = path.join(__dirname, '..');
  const defaultConfig = {
    viewport: { width: 1404, height: 993 },
    browser: { defaultTimeout: 30 },
    pdf: {
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    },
    quality: { maxFileSizeMB: 50 },
    output: { defaultDir: path.join(skillRoot, 'generated') }
  };

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.output && config.output.defaultDir && config.output.defaultDir.startsWith('~')) {
        config.output.defaultDir = config.output.defaultDir.replace(/^~/, process.env.HOME || '');
      }
      return { ...defaultConfig, ...config };
    } catch (e) {
      console.warn(`Warning: Could not load config.json: ${e.message}`);
      return defaultConfig;
    }
  }
  return defaultConfig;
}

const CONFIG = loadConfig();
const SKILL_ROOT = path.join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const htmlPath = args[0];

let viewport = { ...CONFIG.viewport };
let debugMode = false;
let selfTestMode = false;
let timeout = CONFIG.browser.defaultTimeout * 1000;
let pdfFormat = CONFIG.pdf;
let contentType = null;
let autoTheme = false;
let outputDir = CONFIG.output.defaultDir;
let customPdfPath = null;

// Parse options first (so --output-dir is known before building default filename)
args.slice(1).forEach(arg => {
  if (arg.startsWith('--output-dir')) {
    const [, value] = arg.split('=');
    if (value) outputDir = value.replace(/^~/, process.env.HOME || '');
  } else if (arg.startsWith('--output=')) {
    const [, value] = arg.split('=');
    if (value) customPdfPath = value.replace(/^~/, process.env.HOME || '');
  }
});

const defaultPdfName = htmlPath ? path.basename(htmlPath, '.html') + '.pdf' : null;
const finalPdfPath = customPdfPath || path.join(outputDir, defaultPdfName || 'output.pdf');

args.forEach(arg => {
  if (arg === '--debug' || arg === '-d') {
    debugMode = true;
    console.log('Debug mode enabled');
  }
  if (arg === '--self-test' || arg === '-t') {
    selfTestMode = true;
    console.log('Self-test mode enabled');
  }
  if (arg === '--config' || arg === '-c') {
    console.log('Current configuration:');
    console.log(JSON.stringify(CONFIG, null, 2));
    process.exit(0);
  }
  if (arg === '--auto-theme' || arg === '-a') {
    autoTheme = true;
    console.log('Auto theme detection enabled');
  }
  if (arg.startsWith('--content-type')) {
    const [, value] = arg.split('=');
    if (value) contentType = value;
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
  console.error('Usage: node generate-pdf.js <input.html> [options]');
  console.error('Options:');
  console.error('  --debug              Enable debug mode (saves screenshot on failure)');
  console.error('  --self-test          Run self-tests after generation (PASS/FAIL report)');
  console.error('  --timeout=N          Set network idle timeout in seconds (default: 30)');
  console.error('  --viewport=WxH       Set viewport dimensions (default: 1404x993)');
  console.error('  --content-type=TYPE  Specify content type for auto theme selection');
  console.error('  --auto-theme         Auto detect content type from HTML');
  console.error('  --output-dir=DIR     Set output directory (default: ~/Downloads)');
  console.error('  --output=PATH        Set full output path (overrides --output-dir)');
  console.error('  --config             Display current configuration');
  console.error('');
  console.error('Content Types: cover, intro, main, highlight, nature, education, data, summary, thankyou');
  console.error('');
  console.error('Examples:');
  console.error('  node generate-pdf.js presentation.html');
  console.error('  node generate-pdf.js presentation.html --output-dir=./output');
  console.error('  node generate-pdf.js presentation.html --output=./my-presentation.pdf');
  console.error('  node generate-pdf.js presentation.html --content-type=education --self-test');
  console.error('  node generate-pdf.js presentation.html --auto-theme --debug');
  process.exit(1);
}

// Resolve absolute paths
const htmlAbsPath = path.resolve(htmlPath);
const pdfAbsPath = path.resolve(finalPdfPath);

// Create output directory if needed
const outputDirAbs = path.dirname(pdfAbsPath);
if (fs.existsSync(outputDirAbs)) {
  if (!fs.statSync(outputDirAbs).isDirectory()) {
    console.error(`Error: Output directory exists but is not a directory: ${outputDirAbs}`);
    process.exit(1);
  }
} else {
  fs.mkdirSync(outputDirAbs, { recursive: true });
  console.log(`Created output directory: ${outputDirAbs}`);
}

if (!fs.existsSync(htmlAbsPath)) {
  console.error(`Error: Input file not found: ${htmlAbsPath}`);
  process.exit(1);
}

console.log(`Generating PDF from: ${htmlAbsPath}`);
console.log(`Output PDF: ${pdfAbsPath}`);
console.log(`Output directory: ${outputDirAbs}`);
console.log(`Viewport: ${viewport.width}x${viewport.height}`);

(async () => {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(debugMode && { slowMo: 100 })
    });

    const page = await browser.newPage({ viewport });

    if (debugMode) {
      page.on('console', msg => {
        console.log(`  [${msg.type().toUpperCase()}] ${msg.text()}`);
      });
      page.on('pageerror', err => {
        console.error(`  [PAGE ERROR] ${err.message}`);
      });
    }

    // Load HTML file
    console.log('Loading HTML file...');
    try {
      await page.goto(`file://${htmlAbsPath}`, {
        waitUntil: 'networkidle',
        timeout: timeout
      });
    } catch (e) {
      if (e.name === 'TimeoutError') {
        console.warn('Warning: Network idle timeout, proceeding anyway...');
      } else {
        throw e;
      }
    }

    // Apply automatic theme selection if enabled
    if (autoTheme || contentType) {
      console.log('Applying theme selection...');
      await page.evaluate((detectedType) => {
        const contentTypeMap = {
          cover: 'blue', intro: 'blue', main: 'orange', highlight: 'yellow',
          nature: 'green', education: 'green', data: 'orange', summary: 'yellow',
          thankyou: 'blue', formal: 'blue', activity: 'orange', energetic: 'orange',
          health: 'green', growth: 'green', warm: 'yellow', keypoint: 'yellow'
        };

        function detectContentType(pageIndex, totalPages, text, pageClasses) {
          // First/last page detection
          if (pageIndex === 0) return 'cover';
          if (pageIndex === totalPages - 1) return 'thankyou';

          const lower = text.toLowerCase();

          // Layout-based detection
          if (pageClasses.includes('timeline') || pageClasses.includes('timeline-horizontal')) {
            // Timeline layouts are usually steps/process
            if (text.includes('步骤') || text.includes('step') || text.includes('过程')) return 'main';
          }
          if (pageClasses.includes('card-grid') || pageClasses.includes('content-cards')) {
            // Card grids with many items
            if (text.includes('维护') || text.includes('maintenance') || text.includes('技巧') || text.includes('tip')) return 'main';
            if (text.includes('错误') || text.includes('mistake') || text.includes('避坑') || text.includes('avoid')) return 'highlight';
          }
          if (pageClasses.includes('three-column') || pageClasses.includes('content-grid')) {
            // Three column layouts
            if (text.includes('选择') || text.includes('selection') || text.includes('搭配') || text.includes('arrangement')) return 'nature';
            if (text.includes('对比') || text.includes('compare') || text.includes('comparison')) return 'data';
          }
          if (pageClasses.includes('top-bottom') || pageClasses.includes('content-vertical')) {
            // Top-bottom layouts
            if (text.includes('底床') || text.includes('substrate') || text.includes('光照') || text.includes('light')) return 'highlight';
            if (text.includes('参数') || text.includes('parameter') || text.includes('water')) return 'data';
          }

          // Keyword-based detection
          if (lower.includes('总结') || lower.includes('summary') || lower.includes('结论') || lower.includes('conclusion') || lower.includes('感谢') || lower.includes('thank')) return 'summary';
          if (lower.includes('数据') || lower.includes('data') || lower.includes('统计') || lower.includes('参数') || lower.includes('parameter') || lower.includes('水质') || lower.includes('water parameter')) return 'data';
          if (lower.includes('动物') || lower.includes('植物') || lower.includes('nature') || lower.includes('animal') || lower.includes('plant') || lower.includes('水草') || lower.includes('草缸')) return 'nature';
          if (lower.includes('重点') || lower.includes('highlight') || lower.includes('关键') || lower.includes('key') || lower.includes('关键要素')) return 'highlight';
          if (lower.includes('教育') || lower.includes('学习') || lower.includes('education') || lower.includes('learn') || lower.includes('教程') || lower.includes('guide') || lower.includes('搭建') || lower.includes('setup')) return 'education';
          if (lower.includes('介绍') || lower.includes('intro') || lower.includes('概述') || lower.includes('overview') || lower.includes('什么是') || lower.includes('what is')) return 'intro';

          return 'main';
        }

        const pages = document.querySelectorAll('.page, section');
        const totalPages = pages.length;

        pages.forEach((pg, index) => {
          let theme = detectedType ? (contentTypeMap[detectedType] || 'blue') : 'blue';
          if (!detectedType) {
            const text = pg.textContent || '';
            const pageClasses = pg.className.split(' ');
            theme = contentTypeMap[detectContentType(index, totalPages, text, pageClasses)] || 'blue';
          }
          pg.classList.remove('blue', 'orange', 'green', 'yellow');
          pg.classList.add(theme);
          const content = pg.querySelector('.content, .content-center, .content-vertical, .content-grid, .content-timeline, .content-cards');
          if (content) {
            content.classList.remove('blue', 'orange', 'green', 'yellow');
            content.classList.add(theme);
          }
        });
      }, contentType);
    }

    // Check for broken images (debug or self-test mode)
    if (debugMode || selfTestMode) {
      console.log('Checking for broken images...');
      const brokenImages = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        const broken = [];
        images.forEach(img => {
          if (!img.complete || img.naturalWidth === 0) {
            broken.push({ src: img.src, alt: img.alt || 'no alt' });
          }
        });
        return broken;
      });
      if (brokenImages.length > 0) {
        console.warn(`  Warning: Found ${brokenImages.length} broken images:`);
        brokenImages.forEach(img => console.warn(`    - src: ${img.src}`));
      } else {
        console.log('  All images loaded successfully');
      }
    }

    // Check placeholder text
    if (selfTestMode) {
      console.log('Checking for placeholder text...');
      const placeholders = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const found = [];
        elements.forEach(el => {
          if (el.children.length === 0 && el.textContent) {
            const text = el.textContent.trim();
            if (text.startsWith('[') && text.endsWith(']')) {
              found.push({ tag: el.tagName, text: text.substring(0, 50), src: el.src || null });
            }
          }
        });
        return found;
      });
      if (placeholders.length > 0) {
        console.warn(`  Warning: Found ${placeholders.length} placeholder elements:`);
        placeholders.forEach(p => console.warn(`    - <${p.tag}> "${p.text}"`));
      } else {
        console.log('  No placeholder text found');
      }
    }

    // Generate PDF
    console.log('Generating PDF...');
    await page.pdf({
      path: pdfAbsPath,
      format: pdfFormat.format,
      landscape: pdfFormat.landscape,
      printBackground: pdfFormat.printBackground,
      margin: pdfFormat.margin
    });

    // Self-test mode: run comprehensive checks
    if (selfTestMode) {
      console.log('\n' + '='.repeat(50));
      console.log('  SELF-TEST REPORT');
      console.log('='.repeat(50));

      const testResults = {
        passed: 0,
        failed: 0,
        warnings: 0,
        details: []
      };

      function report(test, status, detail) {
        const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
        console.log(`  ${icon} [${test}] ${detail}`);
        testResults[status === 'PASS' ? 'passed' : status === 'FAIL' ? 'failed' : 'warnings']++;
        testResults.details.push({ test, status, detail });
      }

      // 1. File exists
      report('PDF_EXISTS', fs.existsSync(pdfAbsPath) ? 'PASS' : 'FAIL', 'PDF file generated');

      if (fs.existsSync(pdfAbsPath)) {
        // 2. File size
        const stats = fs.statSync(pdfAbsPath);
        const sizeMB = stats.size / 1024 / 1024;
        const maxMB = CONFIG.quality.maxFileSizeMB;
        report('FILE_SIZE', sizeMB < maxMB ? 'PASS' : 'FAIL', `${sizeMB.toFixed(2)} MB (max: ${maxMB} MB)`);

        // 3. File size not zero
        report('FILE_NOT_EMPTY', stats.size > 0 ? 'PASS' : 'FAIL', `${(stats.size / 1024).toFixed(1)} KB`);

        // 4. PDF is valid (starts with %PDF)
        const header = fs.readFileSync(pdfAbsPath).slice(0, 4).toString();
        report('PDF_VALID', header === '%PDF' ? 'PASS' : 'FAIL', header === '%PDF' ? 'Valid PDF header' : `Invalid header: ${header}`);
      }

      // 5. Check HTML structure
      const pageElements = await page.evaluate(() => {
        const pages = document.querySelectorAll('.page, section');
        return {
          pageCount: pages.length,
          hasTopband: document.querySelectorAll('.topband').length,
          hasBottomReef: document.querySelectorAll('.bottom-reef').length,
          themes: Array.from(pages).map(p => {
            const classes = p.className.split(' ');
            return classes.find(c => ['blue', 'orange', 'green', 'yellow'].includes(c)) || 'none';
          }),
          layouts: Array.from(pages).map(p => {
            const hasFull = p.classList.contains('full-screen');
            const hasTopBottom = p.classList.contains('top-bottom');
            const hasThreeCol = p.classList.contains('three-column');
            const hasTimeline = p.classList.contains('timeline');
            const hasCardGrid = p.classList.contains('card-grid');
            if (hasFull) return 'full-screen';
            if (hasTopBottom) return 'top-bottom';
            if (hasThreeCol) return 'three-column';
            if (hasTimeline) return 'timeline';
            if (hasCardGrid) return 'card-grid';
            return 'split';
          }),
          imageCount: document.querySelectorAll('img').length,
          altCount: Array.from(document.querySelectorAll('img')).filter(i => i.alt && i.alt !== '').length
        };
      });

      report('PAGE_COUNT', pageElements.pageCount > 0 ? 'PASS' : 'FAIL', `${pageElements.pageCount} pages`);
      report('PAGE_STRUCTURE', pageElements.hasTopband > 0 ? 'PASS' : 'FAIL', `topband: ${pageElements.hasTopband}`);
      report('DECORATION', pageElements.hasBottomReef > 0 ? 'PASS' : 'FAIL', `bottom-reef: ${pageElements.hasBottomReef}`);
      report('THEME_ASSIGNED', pageElements.themes.every(t => t !== 'none') ? 'PASS' : 'FAIL',
        `themes: ${pageElements.themes.join(', ')}`);
      report('LAYOUT_TYPES', pageElements.layouts.length > 0 ? 'PASS' : 'FAIL',
        `layouts: ${[...new Set(pageElements.layouts)].join(', ')}`);
      report('IMAGE_COUNT', pageElements.imageCount > 0 ? 'PASS' : 'WARN', `${pageElements.imageCount} images`);
      report('IMAGE_ALT', pageElements.imageCount > 0 && pageElements.altCount === pageElements.imageCount ? 'PASS' : 'WARN',
        `${pageElements.altCount}/${pageElements.imageCount} images have alt text`);

      // 6. Check text content
      const textInfo = await page.evaluate(() => {
        const pages = document.querySelectorAll('.page, section');
        const textPerPage = Array.from(pages).map(p => p.textContent || '');
        const emptyPages = textPerPage.filter(t => t.trim().length < 10).length;
        const hasChinese = textPerPage.some(t => /[一-鿿]/.test(t));
        const hasEnglish = textPerPage.some(t => /[a-zA-Z]/.test(t));

        // Check for duplicate titles
        const titleChips = Array.from(document.querySelectorAll('.title-chip')).map(e => e.textContent.trim());
        const uniqueTitles = [...new Set(titleChips)];
        const hasDuplicates = titleChips.length > uniqueTitles.length;

        return {
          hasChinese, hasEnglish, emptyPages,
          titleCount: titleChips.length,
          hasDuplicateTitles: hasDuplicates,
          shortPages: textPerPage.filter(t => t.trim().length < 20).length
        };
      });

      report('CHINESE_TEXT', textInfo.hasChinese ? 'PASS' : 'FAIL', textInfo.hasChinese ? 'Chinese text found' : 'No Chinese text detected');
      report('ENGLISH_TEXT', textInfo.hasEnglish ? 'PASS' : 'WARN', textInfo.hasEnglish ? 'English text found' : 'No English text detected');
      report('NO_EMPTY_PAGES', textInfo.emptyPages === 0 ? 'PASS' : 'FAIL', `${textInfo.emptyPages} empty page(s)`);
      report('NO_DUPLICATE_TITLES', !textInfo.hasDuplicateTitles ? 'PASS' : 'WARN',
        textInfo.hasDuplicateTitles ? `${textInfo.titleCount} titles, some may be duplicates` : `${textInfo.titleCount} unique titles`);
      report('CONTENT_DENSITY', textInfo.shortPages === 0 ? 'PASS' : 'WARN',
        `${textInfo.shortPages} page(s) with very short content (< 20 chars)`);

      // 7. Check CSS print properties
      const printStyles = await page.evaluate(() => {
        const styles = Array.from(document.styleSheets);
        let hasColorAdjust = false;

        for (const sheet of styles) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule.style && rule.style.cssText) {
                const text = rule.style.cssText.toLowerCase();
                if (text.includes('print-color-adjust') || text.includes('-webkit-print-color-adjust')) {
                  hasColorAdjust = true;
                }
              }
            }
          } catch (e) {}
        }

        // Also check computed style
        const bodyStyle = window.getComputedStyle(document.body);
        const colorAdjust = bodyStyle.getPropertyValue('-webkit-print-color-adjust') ||
                           bodyStyle.getPropertyValue('print-color-adjust');
        if (colorAdjust === 'exact') hasColorAdjust = true;

        return { hasColorAdjust };
      });

      report('PRINT_COLOR_ADJUST', printStyles.hasColorAdjust ? 'PASS' : 'FAIL',
        printStyles.hasColorAdjust ? 'print-color-adjust found' : 'Missing print-color-adjust, backgrounds may not render');

      // Check @page rule in HTML source
      const htmlSource = fs.readFileSync(htmlAbsPath, 'utf8');
      const hasPageRule = /@page/.test(htmlSource);
      report('PAGE_SETUP', hasPageRule ? 'PASS' : 'FAIL',
        hasPageRule ? '@page rule found in HTML' : 'Missing @page rule');

      // Summary
      console.log('\n' + '-'.repeat(50));
      console.log(`  SUMMARY: ${testResults.passed} passed, ${testResults.warnings} warnings, ${testResults.failed} failed`);
      console.log('-'.repeat(50));

      if (testResults.failed > 0) {
        console.log('\n  FAILED TESTS:');
        testResults.details.filter(d => d.status === 'FAIL').forEach(d => {
          console.log(`    ✗ ${d.test}: ${d.detail}`);
        });
        console.log('');
        process.exitCode = 1;
      }

      // Save screenshots for visual verification
      const screenshotsDir = path.join(path.dirname(pdfAbsPath), '.self-test-screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      const fullScreenshot = path.join(screenshotsDir, 'full-preview.png');
      await page.screenshot({ path: fullScreenshot, fullPage: true });
      console.log(`  Preview screenshot: ${fullScreenshot}`);
    }

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
