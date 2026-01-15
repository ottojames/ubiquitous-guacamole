#!/usr/bin/env python3

import subprocess
import time
import os

# Change to project directory
os.chdir("/Users/ottoclarke/projects/Ralph's Civic Notices")

ralph_prompt = """You are Ralph. Work on ONE story per iteration. Fresh context each iteration.

Read Files: PRD.md (find first [ ] task), progress.txt (learnings from previous iterations), AGENTS.md, CLAUDE.md, AVATAR_PROFILES.md, PRD_SUCCESS_CRITERIA.md

Implement ONE Task: Follow acceptance criteria. Run npm run typecheck && npm run lint && npm test. Start npm run dev. BROWSER TEST at http://localhost:5173 following exact test steps.

CRITICAL - Always Update progress.txt: WHETHER YOU PASS OR FAIL, append to progress.txt: Iteration {}, Task ID, STATUS (PASS/FAIL), what was attempted, files changed, browser testing results, why it failed if failed, learnings for next iteration.

If Pass: Mark [x] in PRD.md, add evidence BROWSER TESTED, commit. If Fail: Do NOT mark complete, Do NOT commit, STILL append to progress.txt what failed and learnings. Next iteration gets fresh context and tries different approach.

Start by reading PRD.md to find the next incomplete task."""

def run_ralph_iteration(iteration_num):
    """Run a single Ralph iteration"""
    print(f"\n{'='*50}")
    print(f"Running Ralph Iteration {iteration_num} of 10")
    print(f"{'='*50}\n")

    prompt = ralph_prompt.format(iteration_num)

    try:
        # Run claude with the prompt
        result = subprocess.run(
            ['claude', '--dangerously-skip-permissions', '-p', prompt],
            capture_output=False,
            text=True,
            timeout=300  # 5 minute timeout per iteration
        )
        print(f"\nIteration {iteration_num} completed with exit code: {result.returncode}")
    except subprocess.TimeoutExpired:
        print(f"\nIteration {iteration_num} timed out after 5 minutes")
    except Exception as e:
        print(f"\nIteration {iteration_num} failed with error: {e}")

def main():
    """Run 10 Ralph iterations"""
    print("Starting Ralph automation - 10 iterations")
    print("Each iteration gets fresh context")
    print("Monitor progress.txt in another terminal with: tail -f progress.txt\n")

    for i in range(1, 11):
        run_ralph_iteration(i)

        # Wait between iterations (except after the last one)
        if i < 10:
            print("\nWaiting 5 seconds before next iteration...")
            time.sleep(5)

    print(f"\n{'='*50}")
    print("All 10 Ralph iterations complete!")
    print("Check progress.txt for detailed results")
    print(f"{'='*50}\n")

if __name__ == "__main__":
    main()