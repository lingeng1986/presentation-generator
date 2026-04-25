#!/bin/bash
#
# Check PDF using Claude CLI with comprehensive standards
# Usage: ./check-pdf.sh <pdf-file> [task-requirements-file]
#
# Examples:
#   ./check-pdf.sh slides.pdf
#   ./check-pdf.sh slides.pdf "儿童演讲，5岁，需要中英双语，颜色鲜艳"
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
PDF_FILE="$1"
TASK_REQS="${2:-}"

# Check dependencies
check_dependencies() {
    local missing=()

    # Check claude CLI
    if ! command -v claude &> /dev/null; then
        missing+=("claude CLI not found in PATH")
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        echo "Error: Missing dependencies"
        for issue in "${missing[@]}"; do
            echo "  ✗ $issue"
        done
        echo ""
        echo "Please install Claude CLI: https://claude.ai/code"
        exit 1
    fi
}

if [ -z "$PDF_FILE" ]; then
    echo "Usage: $0 <pdf-file> [task-requirements]"
    echo ""
    echo "Examples:"
    echo "  $0 slides.pdf"
    echo "  $0 slides.pdf '儿童演讲，5岁，需要中英双语'"
    echo "  $0 slides.pdf /path/to/requirements.txt"
    exit 1
fi

# Run dependency check
check_dependencies

# Check if PDF file exists
    echo "Error: PDF file not found: $PDF_FILE"
    exit 1
fi

# Read standards
declare -a STANDARDS_ARRAY
while IFS= read -r line; do
    # Skip empty lines and comments
    [[ -z "$line" || "$line" =~ ^# ]] && continue
    STANDARDS_ARRAY+=("$line")
done < "$SKILL_DIR/references/checklist-standards.md"

STANDARDS=$(IFS=$'\n'; echo "${STANDARDS_ARRAY[*]}")

# Build task requirements
if [ -n "$TASK_REQS" ]; then
    if [ -f "$TASK_REQS" ]; then
        TASK_TEXT=$(cat "$TASK_REQS")
    else
        TASK_TEXT="$TASK_REQS"
    fi
else
    TASK_TEXT="通用演示文稿，需要符合视觉规范、文字规范和技术规范。"
fi

echo "========================================"
echo "PDF Quality Check"
echo "========================================"
echo "File: $PDF_FILE"
echo "Task: ${TASK_TEXT:0:50}..."
echo ""

# Run Claude CLI check with full context
claude --print --permission-mode bypassPermissions \
"Please check this PDF presentation against comprehensive standards.

## File to Check
$PDF_FILE

## Task Requirements
$TASK_TEXT

## General Standards to Apply

### Visual Standards
1. Colors: Background displays correctly (not white/gray), gradients complete, text contrast good
2. Layout: No text truncation, proper alignment, consistent spacing, vertical centering
3. Images: All images load, clear resolution, correct border-radius, no distortion

### Typography Standards
1. Font sizes (minimums):
   - Main title: 28px+
   - English title: 24px+
   - Chinese body: 28px+
   - English body: 22px+
2. Child-friendly: Readable for ages 5-7, TV/projector visible
3. Content: No placeholders, correct spelling, bilingual complete

### Technical Standards
1. PDF quality: < 50MB, correct page count, proper pagination
2. Accessibility: Text selectable, images have alt attributes
3. Compatibility: A4 landscape, safe margins, multi-device

### Best Practices
1. Child presentations: Short sentences, simple words, engaging titles
2. Bilingual: Chinese on top, English below, natural translation
3. Versioning: Proper naming, traceable versions

## Check Priority Levels
P0 - Blocking (must fix): Broken images, severe truncation, missing colors, unreadable file
P1 - Important (should fix): Wrong font sizes, spelling errors, alignment issues
P2 - Nice-to-have: Spacing tweaks, color refinements

## Output Format

**Overall Result**: PASS / FAIL

**P0 Issues** (Blocking):
- [List or 'None']

**P1 Issues** (Important):
- [List or 'None']

**P2 Suggestions** (Optional):
- [List or 'None']

**Confidence**: High / Medium / Low

**Fix Instructions** (if issues found):
[Specific guidance on what to fix and how]

Please be thorough and specific in your findings."

echo ""
echo "========================================"
echo "Check complete."
echo "========================================"