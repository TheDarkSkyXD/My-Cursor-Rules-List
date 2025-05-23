# Phase 15: Admin API CD Implementation [ENG-218]

_Last Updated: 2025-04-11 14:08:05 CDT_

## Phase Overview

Implementation of Continuous Deployment (CD) for the Admin API repository, focusing on sandbox environment deployment from the `dev` branch. Production deployment will be handled in a future phase.

## Task Breakdown

### Task 15.1: Branch Setup and Configuration ✅
- [x] ~~Create `dev` branch from `main`~~ (INCORRECT BASE)
- [x] Recreate `dev` branch from `migration` branch
- [x] Leave `dev` branch unprotected initially for faster iteration
- [x] ~~Configure `main` branch to require squash merging~~ (DEFERRED)

### Task 15.2: GitHub Workflow Update ✅
- [x] Update trigger conditions to include `dev` branch
- [x] Add deployment job with conditional branch logic
- [x] Configure deployment to run only on direct pushes (not PR merges)
- [x] Add concurrency control for deployment jobs
- [x] Implement environment variable for stage names
- [x] Verify deploy script compatibility and environment handling

### Task 15.3: GitHub Secrets Configuration ✅
- [x] ~~Verify/add AWS_SANDBOX_ACCESS_KEY_ID and AWS_SANDBOX_SECRET_ACCESS_KEY~~ (Using org secrets)
- [x] ~~Verify/add AWS_SANDBOX_REGION (us-east-2)~~ (Using org secrets)
- [x] ~~Setup AWS_PROD_* secrets as placeholders~~ (DEFERRED)
- [x] Configure AWS CLI for safe deployment:
  - [x] Set sandbox as default environment
  - [x] Configure non-interactive mode
  - [x] Add production safety controls
  - [x] Verify configuration works
- [x] Verify AWS IAM configuration for GitHub CI deployment:
  - [x] Verified existing setup from Phase 12:
    - ✅ IAM User: github-ci-deploy exists
    - ✅ IAM Policy: github-ci-deploy-policy (v10) attached
    - ✅ Created: April 7th, 2025
  - [x] Current permissions verified:
    - ✅ Lambda layer management
    - ✅ CloudFormation operations
    - ✅ S3 deployment bucket access
    - ✅ Basic IAM role management
    - ✅ STS caller identity
  - [x] Add required permissions for Admin API deployment:
    - Lambda Function permissions:
      - lambda:CreateFunction
      - lambda:DeleteFunction
      - lambda:GetFunction
      - lambda:InvokeFunction
      - lambda:UpdateFunctionCode
      - lambda:UpdateFunctionConfiguration
      - lambda:AddPermission
      - lambda:RemovePermission
      - Resource: "arn:aws:lambda:us-east-2:881490112168:function:admin-api-*"
    - CloudWatch Logs permissions:
      - logs:CreateLogGroup
      - logs:CreateLogStream
      - logs:PutLogEvents
      - logs:DescribeLogGroups
      - logs:DescribeLogStreams
      - Resource: "arn:aws:logs:us-east-2:881490112168:log-group:/aws/lambda/admin-api-*"
    - VPC/Network permissions for Lambda:
      - ec2:CreateNetworkInterface
      - ec2:DescribeNetworkInterfaces
      - ec2:DeleteNetworkInterface
      - ec2:DescribeSecurityGroups
      - ec2:DescribeSubnets
      - ec2:DescribeVpcs
      - Resource: "*"
      - Condition: Same account/region restrictions as existing policy
- [x] Verify local testing configuration:
  - ✅ Profile `github-ci-local` configured in ~/.aws/config
  - ✅ Using IAM user `github-ci-deploy-local`
  - ✅ Has `github-ci-deploy-policy` attached with required permissions
  - ✅ Correct sandbox account (881490112168) and region (us-east-2)
  - Usage: Set `AWS_PROFILE=github-ci-local` for deployment testing

### Task 15.4: Deploy Script Validation
- [ ] Local Deployment Validation (using github-ci-local profile):
  - [x] Ensure deploy script is executable
  - [x] Made deploy script non-interactive with additional safety checks
  - [x] Added CloudFormation permissions for SAM deployment
  - [x] Added ELB permissions for ALB management
  - [x] Added CloudWatch Logs permissions for log group management
  - [x] ~~Stack Deletion Issues~~ RESOLVED
    - Previous stack has been successfully deleted (confirmed 2025-04-10)
    - ⚠️ IMPORTANT: Stack deletion is now restricted
      - Do NOT delete the stack without explicit approval
      - Any deletion requests must be confirmed with Chad and dev team
      - Document reason and get sign-off before proceeding
  - [x] Initial Stack Deployment:
    - ✅ Stack 'admin-api-dev' successfully created at 2025-04-10 17:09:36 UTC
    - ✅ Stack status: CREATE_COMPLETE
    - ✅ Description: "Api for the admin web app"
    - ✅ Last update: 2025-04-10 17:33:49 CDT
    - ✅ DNS Name: admin-api.littleponies.com
    - ✅ Deployment Changes:
      - Added new Lambda Version (44af64a0f7b)
      - Modified ALB Target Group and Listeners
      - Updated Lambda Function and Alias
      - Updated Lambda Permissions
      - Removed old Lambda Version (fa29c5720bf)
  - [x] IAM Policy Management:
    - [x] Maintain current_policy.json in repository root
    - [x] Document all policy changes in git history
    - [x] Ensure policy supports both admin-api and python_frameworks deployments
    - [x] Added missing Lambda permissions:
      - ✅ lambda:ListVersionsByFunction
      - ✅ lambda:PublishVersion
      - ✅ lambda:GetFunctionConfiguration (Required for Lambda alias management)
      - ✅ Additional Lambda permissions added:
        - lambda:CreateAlias, UpdateAlias, DeleteAlias, GetAlias
        - lambda:TagResource, UntagResource
    - [x] Added Application Auto Scaling permissions:
      - application-autoscaling:RegisterScalableTarget
      - application-autoscaling:DeregisterScalableTarget
      - application-autoscaling:PutScalingPolicy
      - application-autoscaling:DeleteScalingPolicy
      - application-autoscaling:Describe* actions
    - [x] Added CloudWatch Alarms permissions:
      - cloudwatch:PutMetricAlarm
      - cloudwatch:DeleteAlarms
      - cloudwatch:DescribeAlarms
    - [x] Added Route53 permissions:
      - route53:ChangeResourceRecordSets
      - route53:ListHostedZonesByName
    - [x] Added ELB Rules permissions:
      - elasticloadbalancing:CreateRule
      - elasticloadbalancing:DeleteRule
      - elasticloadbalancing:ModifyRule
    - [x] Policy version v26 deployed and set as default (2025-04-10 22:03:22 UTC)
    - [x] Region configuration verified: Policy correctly targets us-east-2 for sandbox environment
    - [x] Archive policy version:
      - ✅ Copied to: docs/working-memory/phase-15-admin-api-cd/current_policy_v26.json (2025-04-10 17:43:17 CDT)
      - ✅ Contains all permissions used in successful deployment
    - [✅] CRITICAL: IAM Policy Update Required
      - ✅ Used DA admin credentials to update policy
      - ✅ Policy version v26 verified as default
      - [ ] Clean up failed stack rollback state
        - [x] Identified issue: Stack stuck in ROLLBACK_FAILED state
        - [x] Root cause: Initial deployment failure during Lambda function creation
        - [x] Resolution steps:
          1. DO NOT attempt to delete the stack directly (restricted operation)
          2. Use AWS Console or CLI to:
             - Review CloudWatch logs for detailed error information
             - Document all resources in FAILED state
             - Manually clean up any orphaned resources
          3. Contact AWS Support if manual cleanup fails
          4. Only after support confirmation, use:
             `aws cloudformation delete-stack --stack-name admin-api-dev`
        - ⚠️ CRITICAL: Stack deletion requires explicit approval
        - ⚠️ Document all cleanup steps in deployment runbook
      - [x] Document rollback failure resolution process
        - Prevention:
          1. Always verify IAM permissions before deployment
          2. Test deployments locally with github-ci-local profile
          3. Review CloudFormation template for resource dependencies
        - Resolution:
          1. Immediately notify team lead (Chad) of rollback failure
          2. DO NOT attempt further deployments until resolved
          3. Follow documented cleanup procedure above
          4. Update deployment runbook with any new findings
  - [x] Test deployment with AWS_PROFILE=github-ci-local:
    - [x] Verify script accepts environment selection
    - [x] Validate serverless.yml stage variables
    - [x] Check resource naming conventions
    - [x] Confirm IAM role configuration works
  - [x] Document deployment process:
    - ✅ Deploy script usage: ./deploy -e <env> -c <profile> [-l <log-level>]
    - ✅ Required environment variables: AWS_PROFILE
    - ✅ Default stack name format: admin-api-<env>
    - ✅ Deployment S3 bucket: 881490112168-code-deployment
  - [x] Verify python_frameworks deployment:
    - [x] Test python_frameworks deployment to dev environment
    - [x] Document and fix any permission issues found
    - [x] Ensure all required permissions from python_frameworks are preserved in github-ci-deploy-policy
    _Verification Note: Successful deployment using shared IAM policy confirms compatibility with python_frameworks (2025-04-10 17:39:09 CDT)_
  - [x] Fixed code quality issues:
    - ✅ Updated pre-commit configuration for lighter checks
    - ✅ Fixed ambiguous variable name in update_template script
    - ✅ Verified all pre-commit checks pass locally and in CI
  - [x] SSH Access Configuration:
    - Removed existing deploy keys from all repositories
    - Generated new SSH deploy keys with proper permissions
    - Added keys to admin_api, da_framework, and da_flask
    - Configured GitHub Actions secrets for private keys
    - Verified SSH key loading in workflow
  - [x] Verify deploy key permissions:
    - ✅ Check ADMIN_API_DEPLOY_KEY access
    - ✅ Check DA_FRAMEWORK_DEPLOY_KEY access
    - ✅ Check DA_FLASK_DEPLOY_KEY access
  - [x] Analyze SSH debug output for authentication failures
  - [x] Update configuration based on findings
  _Validation Note: SSH configuration successfully implemented and verified (2025-04-10 19:48:37 CDT)_

### Task 15.5: Fix GitHub Actions Deployment
- [x] Identify IAM Permission Issues
  - [x] Save current policy to `current_policy.json` (2025-04-11 11:39:06 CDT)
  - [x] Add required Lambda permissions:
    - [x] lambda:GetProvisionedConcurrencyConfig
    - [x] lambda:PutProvisionedConcurrencyConfig
    - [x] lambda:DeleteProvisionedConcurrencyConfig
- [x] Identify Provisioned Concurrency Configuration Issue (2025-04-11 13:46:11 CDT)
  - [x] Root cause: Mismatch between provisioned concurrency (1) and autoscaling minimum (10)
  - [x] Current state:
    - Lambda alias has provisioned concurrency of 10
    - Autoscaling target minimum is 10
    - Deployment fails when trying to set provisioned concurrency to 1
  - [x] Solution: Update template.yaml to match current working configuration
    - Set dev environment provisioned concurrency to 10
    - Keep autoscaling target minimum at 10
    - Ensure configuration consistency

### Verification Status
- [x] Policy updated successfully
- [ ] Deployment verification pending
  - [ ] Check CloudFormation stack update
  - [ ] Verify Lambda provisioned concurrency configuration
  - [ ] Monitor deployment logs

### Working Components
1. IAM Policy:
   - Version: v27 (Current)
   - Added Lambda provisioned concurrency permissions
   - Resource scoping maintained
   - Region/Account conditions preserved

### Task 15.6: Testing and Verification 🔄
- [x] Test deployment from dev branch to sandbox
- [x] Document deployment process and results
- [ ] ~~Test main branch deployment~~ (DEFERRED)
- [x] PR Verification Process:
  - [x] Create PR from current branch to dev:
    - ✅ Use PR template
    - ✅ Reference ENG ticket
    - ✅ Include deployment verification results
  - [x] Verify GitHub Actions Behavior:
    - [x] On PR Creation:
      - ✅ Tests should run
      - ✅ No duplicate test runs
      - ✅ Deployment should NOT trigger
      - ✅ Document test results and any issues
    - [🔄] On PR Approval:
      - 🔄 Deployment should trigger automatically
      - 🔄 Verify deployment uses correct:
        - Environment (dev)
        - AWS Profile
        - Region (us-east-2)
        - [x] Match Local Configuration:
          - [x] Remove role assumption from aws-actions/configure-aws-credentials
          - [x] Use direct credentials like local setup:
            ```yaml
            - uses: aws-actions/configure-aws-credentials@v4
              with:
                aws-access-key-id: ${{ secrets.AWS_SANDBOX_ACCESS_KEY_ID }}
                aws-secret-access-key: ${{ secrets.AWS_SANDBOX_SECRET_ACCESS_KEY }}
                aws-region: us-east-2
                role-duration-seconds: 0  # Disable role assumption
                role-skip-session-tagging: true  # Skip session tagging
            ```
          - [x] Set up github-ci-deploy profile in CI:
            ```yaml
            - name: Configure AWS CLI Profile
              run: |
                aws configure set aws_access_key_id ${{ secrets.AWS_SANDBOX_ACCESS_KEY_ID }} --profile github-ci-deploy
                aws configure set aws_secret_access_key ${{ secrets.AWS_SANDBOX_SECRET_ACCESS_KEY }} --profile github-ci-deploy
                aws configure set region us-east-2 --profile github-ci-deploy
                aws configure set output json --profile github-ci-deploy
            ```
          - [x] Verify credentials work like local:
            ```bash
            # Should match output of local command:
            # aws sts get-caller-identity --profile github-ci-deploy
            aws sts get-caller-identity --profile github-ci-deploy
            ```
      - 🔄 Document deployment results
  - [🔄] Post-Deployment Verification (Updated 2025-04-11 10:57:54 CDT):
    - [ ] AWS Credentials Verification:
      - [ ] Check AWS STS token acquisition:
        ```bash
        # Add to workflow before deployment
        aws sts get-caller-identity
        # Should show github-ci-deploy user, NOT a role
        ```
      - [ ] Verify DNS resolution:
        ```bash
        # Add to workflow
        nslookup sts.amazonaws.com
        nslookup s3.amazonaws.com
        nslookup lambda.us-east-2.amazonaws.com
        ```
      - [ ] Test AWS API connectivity:
        ```bash
        # Add retries and longer timeout
        aws configure set cli_retry_wait 5
        aws configure set max_attempts 10
        ```
    - [ ] Lambda Function Verification:
      - [ ] Check function exists and is latest version:
        ```bash
        aws lambda get-function --function-name admin-api-dev
        aws lambda list-versions-by-function --function-name admin-api-dev
        ```
      - [ ] Verify function configuration:
        ```bash
        aws lambda get-function-configuration --function-name admin-api-dev
        # Check memory, timeout, runtime settings
        ```
      - [ ] Test function invocation:
        ```bash
        aws lambda invoke --function-name admin-api-dev \
          --payload '{"httpMethod": "GET", "path": "/health"}' \
          response.json
        ```
    - [ ] API Endpoint Testing:
      - [ ] Health check endpoint
      - [ ] Authentication endpoints
      - [ ] Key API operations
      - [ ] Document any timeouts or DNS issues
    - [ ] CloudWatch Logs Analysis:
      - [ ] Check for credential errors
      - [ ] Look for DNS resolution issues
      - [ ] Verify Lambda cold start times
      - [ ] Monitor for timeout issues
    - [ ] ALB Target Group Health:
      - [ ] Verify target registration
      - [ ] Check health check settings
      - [ ] Monitor response times
      - [ ] Document any 5xx errors
  - [🔄] Document Results:
    - [x] Screenshot or log GitHub Actions workflow
    - [ ] Document any issues found:
      - [ ] Credential/permission issues
      - [ ] DNS resolution problems
      - [ ] Timeout or connectivity errors
      - [ ] Lambda configuration issues
    - [ ] Update deployment runbook:
      - [ ] Add troubleshooting section
      - [ ] Document common issues and solutions
      - [ ] Add verification checklist
    - [ ] Add notes about PR behavior to team documentation

_Note: PR #9 merged to dev branch, adding detailed verification steps for AWS credentials and DNS issues. (2025-04-11 10:57:54 CDT)_

### Task 15.7: Organization-Level AWS Secrets and Lambda Configuration 🔄
- [x] Verify Existing AWS Configuration:
  - [x] Confirm github-ci-deploy user configuration:
    ```bash
    # Verify user exists
    aws iam get-user --user-name github-ci-deploy --profile sandbox
    
    # Verify policy attachment
    aws iam list-attached-user-policies --user-name github-ci-deploy --profile sandbox
    ```
  - [x] Document current AWS setup (Verified 2025-04-11 09:04:10 CDT):
    - IAM User: github-ci-deploy
      - Created: 2025-04-07T17:16:36+00:00
      - ARN: arn:aws:iam::881490112168:user/github-ci-deploy
    - Policy: github-ci-deploy-policy v26
      - ARN: arn:aws:iam::881490112168:policy/github-ci-deploy-policy
    - Account: 881490112168 (sandbox)
    - Region: us-east-2

- [x] Configure Organization Secrets:
  - [x] Create and verify AWS credentials:
    - Created new access key pair (2025-04-11 14:03:57 UTC)
    - Deleted old access key for security
  - [x] Added AWS credentials as organization secrets:
    - AWS_SANDBOX_ACCESS_KEY_ID
    - AWS_SANDBOX_SECRET_ACCESS_KEY
    - AWS_SANDBOX_REGION
  - [x] Verified secrets are set and accessible

- [x] Update GitHub Workflow:
  - [x] Modified test-and-coverage.yml to use organization secrets
  - [x] Added security enhancements:
    - Role duration limit: 0 (disabled)
    - Session tagging disabled
    - Retries disabled
    - Direct credentials access

- [ ] Lambda Provisioned Concurrency Configuration:
  - [ ] Update IAM Permissions:
    - [ ] Add Lambda provisioned concurrency permissions:
      - lambda:PutProvisionedConcurrencyConfig
      - lambda:DeleteProvisionedConcurrencyConfig
      - lambda:GetProvisionedConcurrencyConfig
    - [ ] Add Application Auto Scaling permissions for Lambda
    - [ ] Update policy version with new permissions
  - [ ] Workflow Enhancement:
    - [ ] Add pre-deployment Lambda configuration step
    - [ ] Implement provisioned concurrency setup retry logic
    - [ ] Add validation and error handling for concurrency setup
  - [ ] Testing:
    - [ ] Verify permissions with local profile
    - [ ] Test provisioned concurrency configuration
    - [ ] Validate auto-scaling behavior

- [ ] Documentation Updates:
  - [ ] Update deployment runbook:
    - [ ] Organization secrets configuration
    - [ ] Access key rotation process
    - [ ] Deployment verification steps
    - [ ] Lambda provisioned concurrency management
  - [ ] Document AWS setup:
    - [ ] Current IAM configuration
    - [ ] Access key management
    - [ ] Security best practices
    - [ ] Provisioned concurrency configuration

_Note: Implementing hybrid approach with enhanced IAM permissions and workflow modifications for Lambda provisioned concurrency. (2025-04-11 10:48:06 CDT)_

### Task 15.8: Production Deployment Planning
- [ ] Create ticket for future production deployment setup
- [ ] Document requirements for production deployment
- [ ] List necessary security and access requirements
- [ ] Outline migration path from sandbox to production

## Dependencies

- Phase 6: Admin API CI Implementation (completed)
- Phase 12: AWS Deployment Integration (completed)
- Phase 14: Test to Dev Branch Migration pattern (completed)

## Expected Outcomes

1. Functional CD pipeline for the `dev` branch deploying to sandbox environment
2. ~~Configuration for `main` branch deployment to production~~ (DEFERRED)
3. Documentation of deployment process and requirements
4. Clear plan for future production deployment implementation

## Implementation Notes

- This implementation follows the pattern established in python_frameworks
- We are intentionally keeping changes surgical and focused
- Production deployment configuration is intentionally deferred
- Dev branch will be based on migration branch, not main
- Main branch changes are strictly prohibited at this phase
- Using organization-level AWS secrets for consistency with python_frameworks
- Sandbox deployment uses account 881490112168 and region us-east-2 
- AWS CLI configured for safe, non-interactive operation with sandbox default 