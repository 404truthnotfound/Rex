#!/bin/bash
# Script to clear GitHub Actions cache for the REX repository
# Requires GitHub CLI (gh) to be installed and authenticated

# List all caches and delete them
echo "Listing GitHub Actions caches..."
gh cache list

echo "Deleting all GitHub Actions caches..."
gh cache list | awk '{print $1}' | xargs -I {} gh cache delete {} --confirm

echo "Cache clearing complete. Re-run your workflow for a fresh build."
