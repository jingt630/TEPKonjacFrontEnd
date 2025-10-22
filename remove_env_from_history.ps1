# Script to remove src/env.txt from Git history
# Run this in PowerShell from the repository root

Write-Host "Removing src/env.txt from Git history..." -ForegroundColor Yellow

# Step 1: Remove from current working directory
Write-Host "`n[1/5] Removing file from Git tracking..." -ForegroundColor Cyan
git rm --cached src/env.txt

# Step 2: Commit the removal
Write-Host "`n[2/5] Committing .gitignore update..." -ForegroundColor Cyan
git add .gitignore
git commit -m "Remove env.txt and add to gitignore"

# Step 3: Remove from all history
Write-Host "`n[3/5] Removing from all Git history (this may take a moment)..." -ForegroundColor Cyan
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch src/env.txt" --prune-empty --tag-name-filter cat -- --all

# Step 4: Clean up
Write-Host "`n[4/5] Cleaning up..." -ForegroundColor Cyan
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Step 5: Force push
Write-Host "`n[5/5] Ready to force push!" -ForegroundColor Cyan
Write-Host "`nNow run these commands to push:" -ForegroundColor Green
Write-Host "  git push origin --force --all" -ForegroundColor White
Write-Host "  git push origin --force --tags" -ForegroundColor White

Write-Host "`n✓ Done! The file has been removed from history." -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANT: Remember to rotate your API keys and database passwords!" -ForegroundColor Red
