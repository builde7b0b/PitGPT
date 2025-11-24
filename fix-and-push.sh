#!/bin/bash
# Fix "src refspec main does not match any" error and push

set -e

cd /Users/wealthybigbean/PitGPT

echo "🔧 Fixing git and pushing to GitHub..."
echo ""

# Configure git
git config user.email "ggives3@gmail.com"
git config user.name "builde7b0b"

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Check if we have any commits
if ! git rev-parse HEAD >/dev/null 2>&1; then
    echo "💾 Creating initial commit..."
    git add -A
    git commit -m "Initial commit: PitGPT - Real-Time Race Strategy Using Predictive Telemetry

- Real-time telemetry analysis from Toyota GR Cup Barber dataset
- Python backend computing 5 strategic metrics
- React dashboard with AI strategy recommendations
- OpenAI integration with rule-based fallback
- Complete data source tracking and verification"
    echo "✅ Initial commit created"
else
    echo "✅ Commits already exist"
fi

# Make sure we're on main branch
echo "🌿 Setting branch to main..."
git branch -M main

# Verify we have commits
COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
echo "📊 Commits: $COMMIT_COUNT"

if [ "$COMMIT_COUNT" = "0" ]; then
    echo "❌ Error: Still no commits. Creating one now..."
    git add -A
    git commit -m "Initial commit: PitGPT" --allow-empty 2>/dev/null || git commit -m "Initial commit: PitGPT"
    git branch -M main
fi

# Set up remote
echo "🔗 Configuring remote..."
git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:builde7b0b/PitGPT.git

# Show current status
echo ""
echo "📋 Current status:"
echo "   Branch: $(git branch --show-current)"
echo "   Remote: $(git remote get-url origin)"
echo "   Commits: $(git rev-list --count HEAD)"
echo ""

# Push
echo "📤 Pushing to GitHub..."
git push -u origin main 2>&1 && {
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "   View at: https://github.com/builde7b0b/PitGPT"
} || {
    echo ""
    echo "❌ Push failed. Common issues:"
    echo "   1. Repository doesn't exist on GitHub - create it at https://github.com/new"
    echo "   2. SSH key not set up - may need to use HTTPS instead"
    echo ""
    echo "Try HTTPS instead:"
    echo "   git remote set-url origin https://github.com/builde7b0b/PitGPT.git"
    echo "   git push -u origin main"
}

