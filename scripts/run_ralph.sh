#!/bin/bash

# Simple runner for Ralph Loop
# Usage: ./scripts/run_ralph.sh [max_iterations] [sleep_seconds]

# Default values
MAX_ITERATIONS=${1:-5}
SLEEP_SECONDS=${2:-2}

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root to ensure correct file paths
cd "$PROJECT_ROOT"

# Make sure the main script is executable
chmod +x "$SCRIPT_DIR/ralph_loop.sh"

# Clear screen for clean start
clear

echo "🚀 Starting Ralph Loop for Civic Notices"
echo "----------------------------------------"
echo "📁 Project: Ralph's Civic Notices"
echo "📋 Task list: PRD.md"
echo "📝 Progress log: progress.txt"
echo "🔄 Max iterations: $MAX_ITERATIONS"
echo "⏱️  Pause between: ${SLEEP_SECONDS}s"
echo "----------------------------------------"
echo ""

# Create backup of PRD.md and progress.txt
cp PRD.md PRD.md.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
cp progress.txt progress.txt.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Run the main loop
"$SCRIPT_DIR/ralph_loop.sh" "$MAX_ITERATIONS" "$SLEEP_SECONDS"

# Capture exit code
EXIT_CODE=$?

# Show summary
echo ""
echo "----------------------------------------"
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Ralph completed successfully!"
else
    echo "⚠️  Ralph stopped (exit code: $EXIT_CODE)"
fi
echo "----------------------------------------"

exit $EXIT_CODE