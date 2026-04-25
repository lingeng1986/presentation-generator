---
name: presentation-pdf-generator
description: Generate presentation PDFs from HTML templates with version control and self-check. Use when creating any visual presentation (educational, business, portfolio, etc.) that needs to be exported as PDF. Supports HTML-to-PDF workflow, automatic versioning, and quality assurance checks. Ideal for iterative design work where multiple revisions are expected.
---

# Presentation PDF Generator

A robust workflow for creating presentation PDFs from HTML templates with built-in version control and quality checks.

## When to Use

- Creating presentation PDFs from HTML templates
- Projects requiring multiple design iterations
- Presentations needing consistent styling across pages
- Any work where version history and rollback matters
- Collaborative presentations with review cycles

## Core Workflow (HTML → PDF)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. Create  │ → │  2. Version │ → │  3. Generate│ → │  4. Self-   │
│    HTML     │    │   (Save)    │    │    PDF      │    │    Check    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                        ↓
                                              ┌─────────────┐
                                              │ 5. Iterate  │
                                              │  or Deliver │
                                              └─────────────┘
```

### Step 1: Create HTML

Start from `assets/template.html` or copy an existing version.

**Key rules:**
- Use absolute paths for images: `src="/full/path/to/image.jpg"`
- Include `print-color-adjust: exact` for background colors
- Test layout at viewport 1404×993 (A4 landscape preview)

### Step 2: Version Control (CRITICAL)

**Every HTML change must be saved as a new version.**

Naming convention:
```
presentation_YYYYMMDD_HHMM_description.html
```

Examples:
- `slides_20260424_0900_v1.html`
- `slides_20260424_1030_fixed_colors.html`
- `slides_20260424_1145_final_review.html`

**Why version?**
- Rollback to any previous design
- Compare iterations side-by-side
- Track what changed between versions
- Never lose work to bad edits

### Step 3: Generate PDF

```bash
node scripts/generate-pdf.js input.html output.pdf
```

PDF naming follows same convention:
```
slides_20260424_0900_v1.pdf
```

### Step 4: Self-Check (MANDATORY)

Before delivering any PDF, run through this checklist.

**Two-tier checking:**
1. **AI-Assisted Check** (recommended first) - Use Claude CLI to review PDF against requirements
2. **Manual Check** - Human verification of subjective elements

---

#### AI-Assisted Check (Using Claude CLI)

Use Claude CLI with comprehensive standards to review the PDF.

**Quick check (with embedded standards):**
```bash
./scripts/check-pdf.sh slides.pdf
./scripts/check-pdf.sh slides.pdf "儿童演讲，5岁，需要中英双语，颜色鲜艳"
```

**Advanced check (with full requirements file):**
```bash
./scripts/check-pdf.sh slides.pdf requirements.txt
```

**What Claude checks:**

*Visual Standards*
- ✅ Background colors render correctly (not white/gray)
- ✅ Gradients complete without banding
- ✅ Text contrast and readability
- ✅ Image loading and quality
- ✅ Layout alignment and spacing

*Typography Standards*
- ✅ Font sizes meet minimums (title 28px+, body 22px+)
- ✅ Child-friendly sizing (ages 5-7)
- ✅ No placeholder text remaining
- ✅ Spelling accuracy (CN/EN)
- ✅ Bilingual completeness

*Technical Standards*
- ✅ File size reasonable (< 50MB)
- ✅ Correct page count and pagination
- ✅ Text selectable (not image-only)
- ✅ A4 landscape format

*Best Practices*
- ✅ Short sentences for children
- ✅ Natural bilingual translation
- ✅ Proper version naming

**Claude's output format:**

```
**Overall Result**: PASS / FAIL

**P0 Issues** (Blocking - must fix):
- [Specific issues]

**P1 Issues** (Important - should fix):
- [Specific issues]

**P2 Suggestions** (Optional):
- [Improvements]

**Confidence**: High / Medium / Low

**Fix Instructions**:
[Detailed guidance]
```

**If Claude finds issues:**
1. Read the detailed feedback
2. Note the P0/P1/P2 classification
3. Open corresponding HTML
4. Make fixes (prioritize P0, then P1)
5. Save as NEW version
6. Re-generate PDF
7. Re-check with Claude (don't skip!)

**Reference:** See `references/checklist-standards.md` for complete standards

---

#### Manual Check

After AI check passes, verify these subjective elements:

**Visual Check**
- [ ] Overall "feel" matches design intent
- [ ] Animation/transition ideas noted (if applicable)
- [ ] Brand consistency (colors, fonts)

**Content Check**
- [ ] Tone appropriate for audience
- [ ] Story flow makes sense
- [ ] Client-specific requirements met

**Technical Check**
- [ ] File size reasonable (< 50MB)
- [ ] Opens on target device (TV/projector/phone)
- [ ] Print test successful (if needed)

---

**If any check fails:**
1. Note the issue (AI or manual)
2. Go back to HTML
3. Fix and save as NEW version
4. Re-generate PDF
5. **Re-run AI check** (don't skip!)
6. Re-run manual check

**Do NOT deliver until both AI and manual checks pass.**

## Version Management Best Practices

### Directory Structure

```
project-name/
├── v1/
│   ├── slides_20260424_0900_initial.html
│   ├── slides_20260424_0900_initial.pdf
│   └── notes.md              # Optional: what worked/didn't
├── v2/
│   ├── slides_20260424_1030_fixed_layout.html
│   └── slides_20260424_1030_fixed_layout.pdf
├── v3/
│   ├── slides_20260424_1145_client_feedback.html
│   └── slides_20260424_1145_client_feedback.pdf
└── final/
    ├── slides_20260424_1430_final.html
    └── slides_20260424_1430_final.pdf
```

### Version Control Tips

1. **Commit frequently**: Save every meaningful change
2. **Describe in filename**: `fixed_spacing`, `added_chart`, `client_edits`
3. **Keep HTML source**: Never delete HTML, only archive old versions
4. **Tag milestones**: `v1`, `v2`, `review1`, `final`

## HTML Template System

### Page Structure

```html
<section class="page [THEME]">
  <!-- Decorative elements -->
  <div class="topband"></div>
  <div class="bottom-reef"></div>
  
  <!-- Main content grid -->
  <div class="content [THEME]">
    <div class="left">
      <!-- Photo/visual area -->
      <div class="title-chip">Title</div>
      <div class="hero-box">
        <img src="image.jpg" alt="Description" />
      </div>
    </div>
    <div class="right">
      <!-- Text content -->
      <div class="text-card">
        <div class="main-text">Content here</div>
        <div class="sub-text">Subtitle here</div>
      </div>
    </div>
  </div>
</section>
```

### Available Themes

| Theme | Color | Best For | Psychology |
|-------|-------|----------|------------|
| **blue** | Ocean Blue | Cover, Intro, Thank You | Trust, professional, calm |
| **orange** | Coral Orange | Main content, Data | Energy, creativity, action |
| **green** | Fresh Green | Nature, Education, Health | Growth, harmony, comfort |
| **yellow** | Sunshine Yellow | Highlights, Summary | Optimism, attention, key points |

### Content Types to Theme Mapping

```
┌─────────────────┬──────────────────┬──────────────────┐
│ Content Type    │ Recommended      │ When to Use      │
├─────────────────┼──────────────────┼──────────────────┤
│ cover           │ blue             │ First page,      │
│                 │                  │ title slide      │
├─────────────────┼──────────────────┼──────────────────┤
│ intro           │ blue             │ Agenda, overview │
├─────────────────┼──────────────────┼──────────────────┤
│ main            │ orange           │ Core content,    │
│                 │                  │ detailed info    │
├─────────────────┼──────────────────┼──────────────────┤
│ highlight       │ yellow           │ Key points,      │
│                 │                  │ important data   │
├─────────────────┼──────────────────┼──────────────────┤
│ nature          │ green            │ Animals, plants, │
│                 │                  │ environment      │
├─────────────────┼──────────────────┼──────────────────┤
│ education       │ green            │ Teaching,        │
│                 │                  │ child-friendly   │
├─────────────────┼──────────────────┼──────────────────┤
│ data            │ orange           │ Charts, stats,   │
│                 │                  │ analysis         │
├─────────────────┼──────────────────┼──────────────────┤
│ summary         │ yellow           │ Conclusion,      │
│                 │                  │ takeaways        │
├─────────────────┼──────────────────┼──────────────────┤
│ thankyou        │ blue             │ Final page,      │
│                 │                  │ contact info     │
└─────────────────┴──────────────────┴──────────────────┘
```

### Applying Themes

**Manual selection:**
```html
<section class="page blue">   <!-- Cover page -->
<section class="page orange"> <!-- Main content -->
<section class="page green">  <!-- Nature topic -->
<section class="page yellow"> <!-- Key highlight -->
```

**Auto-detection (see Script Reference):**
```bash
node generate-pdf.js input.html output.pdf --content-type=education
```

### Color Psychology

**Blue (Ocean)**
- Use when: Establishing credibility, opening/closing
- Avoid: High-energy content, urgent messages
- Works with: Corporate, educational, technical topics

**Orange (Coral)**
- Use when: Presenting detailed information, data
- Avoid: Too many consecutive orange slides (can be overwhelming)
- Works with: Sales, marketing, analytics, action items

**Green (Fresh)**
- Use when: Environmental, health, educational content
- Avoid: Financial/serious topics (can feel too casual)
- Works with: Biology, sustainability, children's content

**Yellow (Sunshine)**
- Use when: Highlighting key takeaways, summarizing
- Avoid: Long content sections (best for short, punchy slides)
- Works with: Tips, callouts, conclusions, celebrations

### Critical CSS Properties

```css
/* Must include for PDF color accuracy */
* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* Page setup */
@page {
  size: A4 landscape;
  margin: 0;
}
```

## Common Pitfalls & Solutions

### Images not loading in PDF

**Problem**: Relative paths break when PDF is moved.
**Solution**: Use absolute paths:
```html
<!-- BAD -->
<img src="photo.jpg" />

<!-- GOOD -->
<img src="/Users/name/project/photo.jpg" />
```

### Colors printing as white/gray

**Problem**: Browser default print styles override.
**Solution**: Add to CSS:
```css
-webkit-print-color-adjust: exact !important;
print-color-adjust: exact !important;
```

### Text too small on TV/projector

**Problem**: Font size not suitable for distance viewing.
**Solution**: Minimum sizes:
- Body text: 24px
- Headings: 30px+
- Subtitles: 20px+

### Page breaks in wrong places

**Problem**: Content flows across page boundaries unexpectedly.
**Solution**: Use `page-break-after: always` on section elements.

## Iteration Workflow

When client requests changes:

```
1. Open current HTML
2. Make edits
3. Save as NEW version (timestamp + description)
4. Generate PDF
5. Run self-check
6. If checks pass → deliver
   If checks fail → fix and re-generate
```

**Never overwrite existing versions.** Always create new ones.

## Script Reference

### generate-pdf.js

Generates PDF from HTML using Playwright/Chromium.

**Usage:**
```bash
node generate-pdf.js input.html output.pdf
node generate-pdf.js input.html output.pdf --viewport 1404x993
node generate-pdf.js input.html output.pdf --debug
node generate-pdf.js input.html output.pdf --timeout=60
node generate-pdf.js input.html output.pdf --content-type=education
node generate-pdf.js input.html output.pdf --auto-theme
node generate-pdf.js --config  # Display current configuration
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--debug` / `-d` | Enable debug mode, logs console messages, checks broken images | off |
| `--timeout=N` | Network idle timeout in seconds | 30 |
| `--viewport=WxH` | Set viewport dimensions | 1404x993 |
| `--content-type=TYPE` | Force theme based on content type (see below) | auto |
| `--auto-theme` / `-a` | Auto-detect theme from HTML content | off |
| `--config` / `-c` | Display current configuration from config.json | - |

**Content Types & Themes:**
| Content Type | Theme | Best For |
|--------------|-------|----------|
| `cover` | blue | Title page, first slide |
| `intro` | blue | Agenda, overview, introduction |
| `main` | orange | Core content, detailed information |
| `highlight` | yellow | Key points, important data |
| `nature` | green | Animals, plants, environment topics |
| `education` | green | Teaching content, child-friendly |
| `data` | orange | Charts, statistics, analysis |
| `summary` | yellow | Conclusions, takeaways |
| `thankyou` | blue | Final page, contact info |

**Features:**
- Waits for network idle (images load before PDF)
- Full A4 landscape format (configurable)
- Preserves background colors
- Zero margins for full-bleed designs
- **Debug mode** with screenshot on failure
- **Broken image detection**
- **Dependency checking** (Playwright/Chromium)
- **Configuration file support** (config.json)
- **Automatic theme selection** based on content type

## Configuration

The skill supports a `config.json` file for customizing default values.

### Default Configuration

```json
{
  "pdf": {
    "format": "A4",
    "landscape": true,
    "printBackground": true,
    "margin": { "top": "0", "right": "0", "bottom": "0", "left": "0" }
  },
  "viewport": { "width": 1404, "height": 993 },
  "browser": { "defaultTimeout": 30 },
  "themes": {
    "blue": { "titleChip": "#2eaee9", "gradientStart": "#62d8ff", ... },
    "orange": { "titleChip": "#ff8a5b", ... },
    "green": { "titleChip": "#68c98f", ... },
    "yellow": { "titleChip": "#f7bf3c", ... }
  },
  "typography": {
    "fontFamily": "PingFang SC, Hiragino Sans GB, Microsoft YaHei, ...",
    "titleSize": "30px",
    "minTitleSize": "28px"
  },
  "quality": { "maxFileSizeMB": 50 }
}
```

### View Current Config

```bash
node scripts/generate-pdf.js --config
```

---

## Dependencies

```bash
# Install Playwright globally
npm install -g playwright

# Install Chromium browser
playwright install chromium
```

## Quick Reference Card

| Task | Command |
|------|---------|
| Generate PDF | `node scripts/generate-pdf.js input.html output.pdf` |
| Generate with debug | `node scripts/generate-pdf.js input.html output.pdf --debug` |
| Auto theme selection | `node scripts/generate-pdf.js input.html output.pdf --auto-theme` |
| Specify content type | `node scripts/generate-pdf.js input.html output.pdf --content-type=education` |
| New version | Copy HTML, rename with timestamp |
| AI Check (Claude) | `claude --print "Check PDF: /path/to/file.pdf"` |
| AI Check (script) | `./scripts/check-pdf.sh slides.pdf requirements.txt` |
| Manual check | Open PDF, run through checklist |
| View config | `node scripts/generate-pdf.js --config` |
| Fix issue | Edit HTML, save as new version, regenerate |
| Full cycle | Generate → AI Check → Manual Check → Deliver |

## Example Session

```bash
# ========== INITIAL VERSION ==========

# Create initial version
cp template.html slides_20260424_0900_v1.html
# ... edit content ...

# Generate PDF
node scripts/generate-pdf.js slides_20260424_0900_v1.html slides_20260424_0900_v1.pdf

# AI Check (Claude CLI)
claude --print --permission-mode bypassPermissions \
  "Check this PDF: /path/to/slides_20260424_0900_v1.pdf"
# → Claude reports: "Text too small on page 3"

# Fix issue
cp slides_20260424_0900_v1.html slides_20260424_1030_v2_fixed_text.html
# ... edit CSS, increase font size ...

# Generate v2
node scripts/generate-pdf.js slides_20260424_1030_v2.html slides_20260424_1030_v2.pdf

# Re-check with Claude
claude --print --permission-mode bypassPermissions \
  "Check this PDF: /path/to/slides_20260424_1030_v2.pdf"
# → Claude: "All checks pass"

# Manual check
open slides_20260424_1030_v2.pdf
# → Looks good, colors correct, images load

# Deliver to client


# ========== CLIENT FEEDBACK ==========

# Client wants changes
cp slides_20260424_1030_v2.html slides_20260424_1145_v3_client_edits.html
# ... make edits per feedback ...

# Generate and check
node scripts/generate-pdf.js slides_20260424_1145_v3.html slides_20260424_1145_v3.pdf
./scripts/check-pdf.sh slides_20260424_1145_v3.pdf requirements.txt

# If checks pass → deliver
# If fails → fix, save as v4, regenerate, re-check


# ========== FINAL VERSION ==========

# After approval
cp slides_20260424_1145_v3.html slides_20260424_1430_final.html
cp slides_20260424_1145_v3.pdf slides_20260424_1430_final.pdf

# Archive all versions
mkdir -p versions/{v1,v2,v3,final}
mv slides_20260424_0900* versions/v1/
mv slides_20260424_1030* versions/v2/
mv slides_20260424_1145* versions/v3/
mv slides_20260424_1430* versions/final/
```

## File Structure

```
presentation-pdf-generator/
├── SKILL.md                           # This file - workflow & guidelines
├── config.json                        # Configuration file (optional)
├── assets/
│   └── template.html                 # HTML template with CSS
├── references/
│   ├── checklist-standards.md       # Technical checking standards
│   └── presentation-best-practices.md # General design best practices (READ THIS FIRST)
└── scripts/
    ├── generate-pdf.js               # PDF generation (Playwright)
    └── check-pdf.sh                  # AI-assisted PDF checking (Claude CLI with standards)
```

## Using Task-Specific Requirements

When checking, provide specific requirements for better results:

### Method 1: Inline requirements
```bash
./scripts/check-pdf.sh slides.pdf "儿童演讲，5岁，中英双语，鱼缸主题，6种动物"
```

### Method 2: Requirements file
Create `requirements.txt`:
```
目标受众：5岁儿童
语言：中英双语
主题：鱼缸里的小动物
页数：6页
特殊要求：
- 每页介绍一种动物
- 文字要大，方便远处观看
- 颜色鲜艳活泼
- 最后一张介绍6种观赏虾
```

Then run:
```bash
./scripts/check-pdf.sh slides.pdf requirements.txt
```

### Method 3: Direct Claude CLI with full context
```bash
claude --print --permission-mode bypassPermissions \
  "Check this PDF: slides.pdf
   
   Requirements:
   - 5-year-old audience
   - Bilingual Chinese/English
   - Aquarium theme
   - Large fonts for TV display
   - 6 pages total
   
   Standards: $(cat references/checklist-standards.md)"
```

Claude will check the PDF against ALL provided requirements and standards.

---

## Best Practices Reference

Before creating any presentation, read `references/presentation-best-practices.md` for comprehensive design guidance.

### Key Principles Summary

**Design (简洁至上)**
- One core message per page
- 6×6 rule: max 6 lines, 6 words per line
- Whitespace is your friend

**Typography (文字规范)**
- Title: 44-60px (projection), 32-44px (screen)
- Body: 24-32px (projection), 16-24px (screen)
- Max 2 font families
- Left-align body text

**Visual (视觉层次)**
- Size contrast: Title > Subtitle > Body > Note
- Color contrast: foreground/background ≥ 4.5:1
- Use 12-column grid for layout
- High-quality images only (≥150 DPI)

**Content (内容组织)**
- Opening 10% → Body 75% → Closing 15%
- Problem → Solution, or Past → Present → Future
- Every page connects to the next

See the full best practices document for:
- Color schemes and templates
- Chart and visualization guidelines
- Presentation delivery tips
- Common mistakes to avoid
- Scene-specific advice (business, education, product)

---

## File Naming Convention

### Local File Naming

Always use **semantic + timestamp + version + description** format:

```
[semantic]_[YYYYMMDD]_[HHMM]_v[version]_[description].pdf
```

Examples:
- `aquarium_20260424_1311_v17_precise_center.pdf`
- `slides_20260424_0900_v1_initial.pdf`
- `presentation_20260424_1430_final.pdf`

**Benefits:**
- Chronological sorting
- Version traceability
- Purpose clarity
- Easy rollback

### Delivery Note

**Important:** When sending files via certain channels (e.g., WeChat), the system may convert filenames to temporary UUIDs (e.g., `8a8dd53e-dd25-4...946f.pdf`).

**Workarounds:**
1. **Reference by path**: Tell user the correct local path with semantic filename
2. **Rename after download**: User renames file after receiving
3. **Use alternative channels**: Email or file sharing services preserve original names

**Communication template:**
```
File sent! Note: The filename may appear as a UUID in the chat.

Correct filename: aquarium_20260424_1311_v17_precise_center.pdf
Local path: /path/to/your/workspace/

Please rename after download to maintain version history.
```