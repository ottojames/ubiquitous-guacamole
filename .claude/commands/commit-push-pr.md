# /commit-push-pr - Quick commit, push, and create PR

Git status: $(git status --short)
Current branch: $(git branch --show-current)
Unpushed commits: $(git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')

## Instructions

1. Stage all changes: `git add -A`
2. Create a conventional commit message based on the changes:
   - feat: for new features
   - fix: for bug fixes
   - docs: for documentation
   - refactor: for refactoring
   - test: for tests
   - chore: for maintenance
3. Commit with the message
4. Push to origin
5. If this is a feature branch, create a PR to main using `gh pr create --fill`

Execute now.
