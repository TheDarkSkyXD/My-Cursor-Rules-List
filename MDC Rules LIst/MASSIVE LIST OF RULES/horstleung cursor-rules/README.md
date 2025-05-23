# Effective project.md for AI Editor Guidance

This README outlines the recommended structure and content for your `project.md` file, designed to clearly communicate your project's goals, architecture, and requirements to AI coding assistants.

## Purpose of project.md

The `project.md` file serves as the primary source of information for AI assistants to understand:
- The project's overall purpose and objectives
- Technical architecture and design decisions
- Development standards and workflow requirements
- Current project status and roadmap
- Contextual information needed to make informed contributions

A well-crafted `project.md` enables AI tools to provide more accurate, relevant, and aligned assistance with your project's specific needs.

## Recommended Structure for project.md

### 1. Project Overview
- **Project Name**: Clear, descriptive title
- **High-Level Description**: 2-3 sentences explaining what the project does
- **Business Context**: Why this project exists, what problem it solves
- **Key Stakeholders**: Who uses this project and why

### 2. Project Goals and Objectives
- **Primary Goals**: The main objectives you want to achieve
- **Success Criteria**: How you'll measure whether goals are met
- **Non-Goals**: What's explicitly out of scope (to avoid misguided efforts)
- **Priority Order**: Which aspects are most important when trade-offs are needed

### 3. Technical Architecture
- **System Architecture**: Overview of main components and their relationships
- **Technology Stack**: Key technologies, frameworks, and libraries
- **Infrastructure**: Deployment model, hosting, and infrastructure requirements
- **Integration Points**: External systems and APIs the project interacts with
- **Data Flow**: How data moves through the system
- **Diagrams**: Visual representations of architecture (links or simple ASCII diagrams)

### 4. Development Standards
- **Code Style**: Formatting standards, naming conventions
- **Architectural Patterns**: Design patterns to follow throughout the codebase
- **Testing Requirements**: Testing approaches, coverage expectations
- **Performance Requirements**: Performance goals and constraints
- **Security Requirements**: Security standards and practices

### 5. Project Structure
- **Directory Organization**: How the codebase is organized
- **Key Components**: Most important files/directories and their purposes
- **Configuration Files**: Important configuration settings

### 6. Workflow Process
- **Development Workflow**: Steps for making changes
- **Review Process**: How code is reviewed and approved
- **Documentation Requirements**: When and how to update documentation
- **Release Process**: How code gets deployed

### 7. Current Status
- **Implementation Progress**: What's been completed vs. what's still needed
- **Known Issues**: Current bugs or limitations
- **Technical Debt**: Areas that need improvement
- **Roadmap**: Upcoming planned features or changes

### 8. Getting Started
- **Setup Instructions**: How to set up the development environment
- **Quick Start Guide**: Basic commands to build, test, and run the project
- **Link to progress.md**: Reference to the project's current checkpoint

## Tips for Creating an Effective project.md

1. **Be Specific**: Vague descriptions lead to misaligned output from AI tools
2. **Prioritize Information**: Put the most critical information first
3. **Update Regularly**: Keep the document current as the project evolves
4. **Use Consistent Terminology**: Define terms and use them consistently
5. **Include Examples**: Provide examples of good implementation patterns
6. **Link to Resources**: Reference additional documentation when available
7. **Highlight Constraints**: Be explicit about technical limitations and constraints
8. **Keep It Concise**: Focus on what's necessary for making decisions

## Example project.md Section

```markdown
# Project Overview

## Goals
- Create a maintainable, scalable, and well-documented codebase
- Establish clear coding standards and architectural guidelines
- Automate quality checks and documentation processes
- Implement robust error handling and logging

## Project Architecture
The project follows a modular architecture with clear separation of concerns:

- **Frontend**: React-based SPA with TypeScript, following atomic design principles
- **Backend**: Node.js API with Express, using three-layer architecture (controllers/services/data access)
- **Database**: PostgreSQL with Prisma ORM for type-safe database access
- **Authentication**: JWT-based auth with role-based access control

## Development Standards
[Detailed standards specific to your project...]
```

By following this structure, your `project.md` will provide AI assistants with the context needed to provide valuable and aligned contributions to your project. 