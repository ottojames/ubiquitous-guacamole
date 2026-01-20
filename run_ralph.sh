#!/bin/bash

# Wrapper script to run Ralph from project root
# Usage: ./run_ralph.sh [max_iterations] [sleep_seconds]

# Execute the actual script in scripts/ directory
exec ./scripts/run_ralph.sh "$@"