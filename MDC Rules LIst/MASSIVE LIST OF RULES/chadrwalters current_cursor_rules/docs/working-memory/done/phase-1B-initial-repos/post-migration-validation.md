# Post-Migration Validation Plan
Last Updated: 2025-03-24 16:49:48 CDT

## Step-by-Step Validation Process

### Step 1: Create Validation Directory
```bash
# Create a validation directory
REPO_NAME="auth_web"
VALIDATION_DIR=$(mktemp -d)
echo "Using validation directory: $VALIDATION_DIR"

# Clone both repositories
git clone git@bitbucket.org:zyncup/$REPO_NAME.git $VALIDATION_DIR/bitbucket
git clone git@github.com:degree-analytics/$REPO_NAME.git $VALIDATION_DIR/github

# Change to validation directory
cd $VALIDATION_DIR
```

### Step 2: Repository Structure Validation

#### 2.1: Compare Repository Sizes
```bash
# Get Bitbucket size
cd $VALIDATION_DIR/bitbucket
BB_SIZE=$(du -sh . | cut -f1)

# Get GitHub size
cd $VALIDATION_DIR/github
GH_SIZE=$(du -sh . | cut -f1)

echo "Bitbucket size: $BB_SIZE"
echo "GitHub size: $GH_SIZE"

# Expected: Sizes should be similar (some small difference due to .git directory is normal)
```

#### 2.2: Compare Branches
```bash
# Get Bitbucket branches
cd $VALIDATION_DIR/bitbucket
git branch -a | grep -v HEAD | sed -e 's/remotes\/origin\///' | sort -u > ../bb_branches.txt

# Get GitHub branches
cd $VALIDATION_DIR/github
git branch -a | grep -v HEAD | sed -e 's/remotes\/origin\///' | sort -u > ../gh_branches.txt

# Compare
diff ../bb_branches.txt ../gh_branches.txt

# Expected: No differences (empty output from diff)
```

#### 2.3: Compare Tags
```bash
# Get Bitbucket tags
cd $VALIDATION_DIR/bitbucket
git tag -l | sort > ../bb_tags.txt

# Get GitHub tags
cd $VALIDATION_DIR/github
git tag -l | sort > ../gh_tags.txt

# Compare
diff ../bb_tags.txt ../gh_tags.txt

# Expected: No differences (empty output from diff)
```

#### 2.4: Compare Commit History
```bash
# Get Bitbucket commits
cd $VALIDATION_DIR/bitbucket
git log --pretty=format:"%H %s" > ../bb_commits.txt

# Get GitHub commits
cd $VALIDATION_DIR/github
git log --pretty=format:"%H %s" > ../gh_commits.txt

# Compare
diff ../bb_commits.txt ../gh_commits.txt

# Expected: No differences (empty output from diff)
```

### Step 3: Branch Protection Validation

#### 3.1: Check Branch Protection Rules
```bash
# Get protection rules
gh api repos/degree-analytics/$REPO_NAME/branches/main/protection | jq .

# Expected Output should show:
# - required_status_checks.strict: true
# - required_pull_request_reviews.required_approving_review_count: 1
# - required_pull_request_reviews.dismiss_stale_reviews: true
# - enforce_admins.enabled: true
```

#### 3.2: Verify Protection Works
```bash
# Try direct push to main (should fail)
cd $VALIDATION_DIR/github
echo "test" > test.txt
git add test.txt
git commit -m "test: should fail"
git push origin main

# Expected: Error about branch being protected
```

### Step 4: Repository Settings Validation

#### 4.1: Check Repository Visibility
```bash
gh repo view degree-analytics/$REPO_NAME --json isPrivate | jq .

# Expected: {"isPrivate": true}
```

#### 4.2: Check Team Access
```bash
gh api orgs/degree-analytics/teams/Engineering/repos/degree-analytics/$REPO_NAME | jq .permission

# Expected: "admin"
```

#### 4.3: Check Merge Settings
```bash
gh repo view degree-analytics/$REPO_NAME --json mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed | jq .

# Expected:
# {
#   "mergeCommitAllowed": false,
#   "squashMergeAllowed": true,
#   "rebaseMergeAllowed": false
# }
```

### Step 5: Code Integrity Validation

#### 5.1: Verify Build Process
```bash
# Clone fresh copy
cd $(mktemp -d)
git clone git@github.com:degree-analytics/$REPO_NAME.git
cd $REPO_NAME

# Check if package.json exists (Node.js)
if [ -f "package.json" ]; then
    npm install
    npm run build
fi

# Check if requirements.txt exists (Python)
if [ -f "requirements.txt" ]; then
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    # Run any build/test commands
fi

# Expected: All commands should complete without errors
```

#### 5.2: Check File Permissions
```bash
# Compare file permissions
cd $VALIDATION_DIR
find bitbucket -type f -exec stat -f "%OLp %N" {} \; | sort > bb_perms.txt
find github -type f -exec stat -f "%OLp %N" {} \; | sort > gh_perms.txt
diff bb_perms.txt gh_perms.txt

# Expected: No differences (empty output from diff)
```

### Step 6: CI/CD Validation

#### 6.1: Check GitHub Actions
```bash
# Verify workflows exist
gh api repos/degree-analytics/$REPO_NAME/actions/workflows | jq '.workflows[] | {name, path, state}'

# Expected: Should list all workflow files
```

#### 6.2: Check Secrets
```bash
# List repository secrets (names only)
gh api repos/degree-analytics/$REPO_NAME/actions/secrets | jq '.secrets[].name'

# Expected: Should list all required secrets
```

### Step 7: Cleanup
```bash
# Remove validation directory
rm -rf $VALIDATION_DIR
```

## Validation Results Template
```markdown
# Migration Validation Results: $REPO_NAME
Date: $(date '+%Y-%m-%d %H:%M:%S %Z')

## Structure Validation
- [ ] Repository sizes match
- [ ] All branches present
- [ ] All tags present
- [ ] Commit history matches

## Protection Rules
- [ ] Branch protection enabled
- [ ] Direct push blocked
- [ ] PR reviews required
- [ ] Status checks required

## Settings
- [ ] Private repository
- [ ] Team access correct
- [ ] Merge settings correct

## Code Integrity
- [ ] Build succeeds
- [ ] Dependencies resolved
- [ ] File permissions correct

## CI/CD
- [ ] Workflows present
- [ ] Secrets configured

## Issues Found
1. 
2. 

## Recommendations
1. 
2. 
```

Would you like me to start running these validation steps on the auth_web repository? 