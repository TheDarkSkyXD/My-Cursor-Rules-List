# Cursor Rules Collection

This repository contains a collection of custom rules for the Cursor IDE to help with development, deployment, and best practices.

## How to Use

### First-Time Installation

1. Clone this repository or download the `.mdc` files
2. Run the installation script:
   - Windows: `.\install.ps1`
   - Mac/Linux: `chmod +x install.sh && ./install.sh`

Alternatively, you can manually create a `.cursor/rules` folder in your project and copy the desired `.mdc` files.

### Updating Existing Rules

If you've already installed these rules and want to update to the latest version:

1. Pull the latest changes or download the latest release
2. Run the update script:
   - Windows: `.\update.ps1`
   - Mac/Linux: `chmod +x update.sh && ./update.sh`

The update script will only replace rules that have changed and add new ones, preserving any custom rules you may have created.

## Available Rules

### Development Approaches
- `budget_dev.mdc` - Budget-friendly development strategies
- `innovative_solutions.mdc` - Innovative solution approaches for resource-constrained development
- `learning_path.mdc` - Learning-focused development approach
- `mvp_development.mdc` - MVP development strategies for quick idea validation
- `sustainable_dev.mdc` - Sustainable development practices for long-term success

### Deployment & Security
- `deployment_safety.mdc` - Safe deployment practices and security considerations
- `live_app_security.mdc` - Security best practices for live applications
- `gitignore_templates.mdc` - Gitignore templates for different project types

### DigitalOcean Specific
- `digitalocean_deployment.mdc` - DigitalOcean deployment strategies and best practices
- `digitalocean_nodejs.mdc` - Node.js deployment on DigitalOcean
- `digitalocean_static_sites.mdc` - Static site deployment on DigitalOcean

### Meta
- `rul3s.mdc` - Framework for creating and managing rules

## Rule Creation Framework

The `rul3s.mdc` file contains a framework for creating your own rules, including:
- Rule structure
- Rule categories
- Rule creation process
- Naming conventions
- Tips for effective rules
- Main workflow template for editing files




## DigitalOcean

The DigitalOcean-specific rules provide guidance for deploying applications to DigitalOcean's cloud platform. If you're planning to use DigitalOcean, you can get $200 in free credit for 60 days by signing up with this referral link:

https://www.digitalocean.com/?refcode=d5a4da02539a&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge

## License

MIT 