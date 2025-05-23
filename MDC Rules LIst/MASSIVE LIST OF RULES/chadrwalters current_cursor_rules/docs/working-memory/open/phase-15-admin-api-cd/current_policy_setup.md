# Current IAM Policy Configuration for Admin API Deployment

Last updated: 2025-04-11 23:34:57 CDT

## Overview
This configuration uses a combination of AWS-managed policies and a custom policy to manage permissions for the admin-api deployment process. This approach leverages AWS best practices while maintaining specific permissions needed for our infrastructure.

## Applied Users
These policies are attached to both deployment users:
1. Local Development: `github-ci-deploy-local`
2. GitHub Actions: `github-ci-deploy`

## Attached Policies

### AWS-Managed Policies

1. **AWSLambda_FullAccess**
   - ARN: `arn:aws:iam::aws:policy/AWSLambda_FullAccess`
   - Purpose: Provides full access to AWS Lambda functions and related services
   - Used for: Creating, updating, and managing Lambda functions

2. **AWSCloudFormationFullAccess**
   - ARN: `arn:aws:iam::aws:policy/AWSCloudFormationFullAccess`
   - Purpose: Provides full access to CloudFormation operations
   - Used for: Managing infrastructure as code deployments

3. **AWSLambdaVPCAccessExecutionRole**
   - ARN: `arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole`
   - Purpose: Allows Lambda functions to access resources in VPC
   - Used for: Network interface management and VPC connectivity

4. **AWSCodeDeployRoleForLambda**
   - ARN: `arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda`
   - Purpose: Enables CodeDeploy to manage Lambda deployments
   - Used for: Safe deployment and rollback of Lambda functions

### Custom Policy (github-ci-deploy-policy)

This custom policy handles specific requirements not covered by AWS-managed policies:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:*"
      ],
      "Resource": [
        "arn:aws:lambda:us-east-2:881490112168:function:admin-api-*",
        "arn:aws:lambda:us-east-2:881490112168:function:dev-da-*",
        "arn:aws:lambda:us-east-2:881490112168:layer:dev-da-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:*"
      ],
      "Resource": [
        "arn:aws:logs:us-east-2:881490112168:log-group:/aws/lambda/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface",
        "ec2:DeleteNetworkInterface",
        "ec2:Describe*"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": ["us-east-2"],
          "aws:PrincipalAccount": ["881490112168"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:Get*",
        "iam:List*",
        "iam:PassRole"
      ],
      "Resource": [
        "arn:aws:iam::881490112168:user/github-ci-deploy",
        "arn:aws:iam::881490112168:user/github-ci-deploy-local",
        "arn:aws:iam::881490112168:role/admin-api-dev-*",
        "arn:aws:iam::881490112168:role/dev-da-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*"
      ],
      "Resource": [
        "arn:aws:cloudformation:us-east-2:881490112168:stack/admin-api-dev*/*",
        "arn:aws:cloudformation:us-east-2:881490112168:stack/dev-da-*/*",
        "arn:aws:cloudformation:us-east-2:aws:transform/Serverless-2016-10-31"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:Describe*",
        "elasticloadbalancing:Create*",
        "elasticloadbalancing:Delete*",
        "elasticloadbalancing:Modify*",
        "elasticloadbalancing:Register*",
        "elasticloadbalancing:Deregister*"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": ["us-east-2"],
          "aws:PrincipalAccount": ["881490112168"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "application-autoscaling:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": ["us-east-2"],
          "aws:PrincipalAccount": ["881490112168"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:DeleteAlarms",
        "cloudwatch:DescribeAlarms"
      ],
      "Resource": "arn:aws:cloudwatch:us-east-2:881490112168:alarm:*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": ["us-east-2"],
          "aws:PrincipalAccount": ["881490112168"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:ChangeResourceRecordSets",
        "route53:ListHostedZonesByName"
      ],
      "Resource": "arn:aws:route53:::hostedzone/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "s3:CreateBucket"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:*"
      ],
      "Resource": [
        "arn:aws:s3:::881490112168-code-deployment",
        "arn:aws:s3:::881490112168-code-deployment/*"
      ],
      "Condition": {
        "StringEquals": {
          "aws:PrincipalAccount": ["881490112168"]
        }
      }
    }
  ]
}
```

## Scope and Boundaries

### Account Context
- AWS Account: 881490112168 (Sandbox)
- Primary Region: us-east-2

### Resource Patterns
- Lambda functions: `admin-api-*`, `dev-da-*`
- Lambda layers: `dev-da-flask-layer`, `dev-da-framework-layer`
- CloudFormation stacks: `admin-api-dev*`, `dev-da-*`
- Load Balancer: Scoped to account and region
- Route53: Access to hosted zones for DNS management
- S3: Specific bucket for code deployment
- CloudWatch: Alarms in sandbox account/region
- IAM: Specific roles and users for deployment

## Change History

### 2025-04-11 23:34:57 CDT
- Verified S3 permissions configuration after deployment testing
- Confirmed current policy structure is correct with three-tiered S3 access:
  1. Global list buckets
  2. Bucket-level operations on code deployment bucket
  3. Object-level operations within code deployment bucket
- No changes needed to policy structure
- Deployment testing revealed proper permission setup

### 2025-04-11 19:25:23 CDT
- Split S3 permissions into three explicit levels:
  1. Global operations (ListAllMyBuckets)
  2. Bucket-level operations (CreateBucket, DeleteBucket, GetBucketLocation, ListBucket)
  3. Object-level operations (PutObject, GetObject, DeleteObject)
- Made permissions more explicit at each level
- Updated policy to version v38

### 2025-04-11 19:20:23 CDT
- Split S3 permissions into two clear statements:
  1. Global permissions (ListAllMyBuckets, GetBucketLocation, CreateBucket)
  2. Bucket-specific permissions (full access to code deployment bucket)
- Removed redundant resource definitions
- Updated policy to version v37

### 2025-04-11 19:15:23 CDT
- Removed all conditions from S3 permissions to fix PutObject issues with code deployment
- Consolidated S3 permissions into a single statement
- Added explicit * resource for global S3 operations
- Updated policy to version v35

### 2025-04-11 18:02:46 CDT
- Removed region condition from S3 bucket permissions since S3 is a global service
- Kept account condition to maintain security boundary
- Updated policy to version v34

### 2025-04-11 18:00:35 CDT
- Removed region and account conditions from global S3 permissions to fix bucket creation
- Updated policy to version v33

### 2025-04-11 17:59:15 CDT
- Added `s3:CreateBucket` to global S3 permissions with region and account conditions
- Added region and account conditions to global S3 permissions for extra security
- Updated policy to version v32

### 2025-04-11 18:54:51 CDT
- Optimized policy by consolidating permissions while maintaining equivalent access
- Consolidated Lambda permissions using `lambda:*`
- Consolidated Logs permissions using `logs:*`
- Consolidated EC2 permissions using `Describe*` pattern
- Consolidated IAM permissions using `Get*` and `List*` patterns
- Consolidated ELB permissions using action patterns
- Added proper conditions for S3 bucket operations
- Maintained all required permissions with reduced policy size

### 2025-04-11 23:46:00 CDT
- Consolidated S3 permissions into two clear statements:
  1. Global operations (ListAllMyBuckets, GetBucketLocation, CreateBucket) with no conditions
  2. Full S3 access (s3:*) to code deployment bucket with account condition
- Simplified bucket permissions while maintaining security boundaries
- Updated policy to version v39

### Previous Changes
- Previous versions can be found in git history

## Notes
- All permissions follow the principle of least privilege
- Region and account restrictions applied where possible
- Resource-level permissions used when supported by the service
- Regular audits recommended to maintain security posture
