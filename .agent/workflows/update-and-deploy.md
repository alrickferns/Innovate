---
description: Auto-deploy changes to GitHub Pages after any update to the Innovation Hub Tracker
---

# Update & Deploy to GitHub Pages

Whenever the user requests ANY change to the Innovation Hub Executive Tracker (UI, data, styling, content, etc.), follow these steps EVERY TIME after making the code changes:

// turbo-all

1. Stage all changes:
```
git add -A
```

2. Commit with a descriptive message summarizing the change:
```
git commit -m "<brief description of what changed>"
```

3. Push to the main branch (which GitHub Pages serves from):
```
git push origin main
```

4. Confirm to the user that the changes have been pushed and the GitHub Pages site will update in ~1 minute.

## Important Notes
- The project lives at: `C:\Users\fernande-11\.gemini\antigravity\scratch\innovation-hub-tracker`
- GitHub Pages serves from the `main` branch root (no build step needed)
- All files are static HTML/CSS/JS — no compilation required
- If git is not initialized yet, run `git init` and `git remote add origin <repo-url>` first
- Always use `git add -A` to capture all changes including new files and deletions
