# GitHub Repository Setup Guide

Follow these steps to create a GitHub repository for your Cursor rules collection and push your code to it.

## 1. Create a New Repository on GitHub

1. Go to [GitHub](https://github.com/) and sign in to your account
2. Click on the "+" icon in the top-right corner and select "New repository"
3. Enter a name for your repository (e.g., "cursor-rules")
4. Add a description: "A collection of custom rules for the Cursor IDE"
5. Choose whether to make the repository public or private
6. Do NOT initialize the repository with a README, .gitignore, or license (we already have these files)
7. Click "Create repository"

## 2. Push Your Local Repository to GitHub

After creating the repository on GitHub, you'll see instructions for pushing an existing repository. Follow these commands in your terminal:

```bash
# Make sure you're in the cursor-rules-backup directory
# Replace YOUR_USERNAME with your GitHub username and REPO_NAME with your repository name
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

## 3. Verify Your Repository

1. Refresh your GitHub repository page
2. You should see all your files and the README displayed

## 4. Share Your Repository

Now you can share your Cursor rules collection with others by sharing the URL to your GitHub repository. Users can follow the instructions in the README.md to install and use your rules.

## 5. Making Updates

If you make changes to your rules in the future:

```bash
git add .
git commit -m "Description of your changes"
git push
```

## 6. Creating a Release (Optional)

To make it easier for users to download your rules:

1. Go to your repository on GitHub
2. Click on "Releases" in the right sidebar
3. Click "Create a new release"
4. Enter a tag version (e.g., "v1.0.0")
5. Add a title and description
6. Click "Publish release"

Users can then download a zip file of your rules directly from the releases page. 