#!/bin/bash

# Publishing Preparation Script for worker-queue
# This script helps prepare the package for npm publication

set -e  # Exit on error

echo "🚀 Publishing Preparation Script"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if user is logged in to npm
echo -e "${BLUE}Checking npm authentication...${NC}"
if npm whoami > /dev/null 2>&1; then
    NPM_USER=$(npm whoami)
    echo -e "${GREEN}✓ Logged in as: $NPM_USER${NC}"
else
    echo -e "${RED}✗ Not logged in to npm${NC}"
    echo ""
    echo "Please run: npm login"
    exit 1
fi

echo ""
echo -e "${BLUE}Available package name options:${NC}"
echo "1. @$NPM_USER/worker-queue (Scoped - Recommended)"
echo "2.worker-que (Current name)"
echo "3. Custom name"
echo ""

read -p "Choose option (1-3): " OPTION

case $OPTION in
    1)
        NEW_PKG_NAME="@$NPM_USER/worker-que"
        ;;
    2)
        NEW_PKG_NAME="worker-que"
        ;;
    3)
        read -p "Enter custom package name: " CUSTOM_NAME
        NEW_PKG_NAME="$CUSTOM_NAME"
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}Checking if '$NEW_PKG_NAME' is available...${NC}"
if npm view "$NEW_PKG_NAME" > /dev/null 2>&1; then
    echo -e "${RED}✗ Package name '$NEW_PKG_NAME' is already taken${NC}"
    echo ""
    echo "Please choose a different name or use a scoped package:"
    echo "  @$NPM_USER/worker-queue"
    exit 1
else
    echo -e "${GREEN}✓ Package name '$NEW_PKG_NAME' is available!${NC}"
fi

echo ""
echo -e "${BLUE}Updating package.json...${NC}"

# Update package name
npm pkg set name="$NEW_PKG_NAME"
echo -e "${GREEN}✓ Set name to: $NEW_PKG_NAME${NC}"

# Ask for author info
read -p "Enter your name (or press Enter to skip): " AUTHOR_NAME
read -p "Enter your email (or press Enter to skip): " AUTHOR_EMAIL

if [ -n "$AUTHOR_NAME" ] && [ -n "$AUTHOR_EMAIL" ]; then
    npm pkg set author="$AUTHOR_NAME <$AUTHOR_EMAIL>"
    echo -e "${GREEN}✓ Set author info${NC}"
elif [ -n "$AUTHOR_NAME" ]; then
    npm pkg set author="$AUTHOR_NAME"
    echo -e "${GREEN}✓ Set author name${NC}"
fi

# Ask for repository URL
read -p "Enter GitHub repository URL (or press Enter to skip): " REPO_URL
if [ -n "$REPO_URL" ]; then
    npm pkg set repository.url="$REPO_URL"
    npm pkg set bugs.url="${REPO_URL%.git}/issues"
    npm pkg set homepage="${REPO_URL%.git}#readme"
    echo -e "${GREEN}✓ Set repository URLs${NC}"
fi

echo ""
echo -e "${BLUE}Cleaning and building...${NC}"
npm run clean
npm run build
echo -e "${GREEN}✓ Build complete${NC}"

echo ""
echo -e "${BLUE}Running tests...${NC}"
if npm test; then
    echo -e "${GREEN}✓ All tests passed${NC}"
else
    echo -e "${RED}✗ Tests failed${NC}"
    read -p "Continue anyway? (y/N): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}Checking package contents...${NC}"
npm pack --dry-run

echo ""
echo -e "${GREEN}✓ Package is ready for publication!${NC}"
echo ""
echo -e "${YELLOW}To publish, run:${NC}"

if [[ $NEW_PKG_NAME == @* ]]; then
    echo ""
    echo "  npm publish --access public"
    echo ""
    echo -e "${YELLOW}(Scoped packages require --access public flag)${NC}"
else
    echo ""
    echo "  npm publish"
fi

echo ""
echo -e "${YELLOW}Or to do a dry run first:${NC}"
echo "  npm publish --dry-run"

echo ""
echo -e "${BLUE}Package Info:${NC}"
echo "  Name: $NEW_PKG_NAME"
echo "  Version: $(npm pkg get version | tr -d '"')"
echo "  Description: $(npm pkg get description | tr -d '"')"

echo ""
echo -e "${GREEN}Ready to publish! 🎉${NC}"
