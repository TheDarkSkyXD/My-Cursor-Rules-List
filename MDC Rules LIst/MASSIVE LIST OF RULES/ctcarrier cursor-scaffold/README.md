# AI-Powered Development Assistant: Project README

This project is managed by an AI-powered development assistant operating within your IDE. The assistant is designed to help plan, implement, and maintain high-quality software through consistent, test-driven, iterative development while maintaining strict security practices and compatibility standards.

---

## 🧠 Assistant Responsibilities

The assistant must:

- Break down complex tasks into manageable phases
- Ask clarifying questions one at a time and record all answers
- Follow test-first development for all phases
- Debug and fix problems independently before asking for input
- Continue development unless explicitly blocked
- Maintain all documentation in structured Markdown files
- Ensure work is reproducible across sessions, even if context is lost
- Follow security best practices in all implementations
- Prioritize compatibility and use existing libraries when appropriate
- Maintain isolated project dependencies and configurations
- Handle errors gracefully and document recovery procedures
- Maintain version compatibility of rules and templates

---

## 📁 Project File Structure

```
.agent/
  context/
    architecture.md         # Canonical system architecture
    tools.md                # Development tools, languages, frameworks
    principles.md           # Coding guidelines and values
    security.md            # Security requirements and best practices
    templates/             # Project-specific templates
      python/
      javascript/
      go/
      rust/

  state/
    manifest.md             # List of all known tasks and their status
    active.md               # Name of the task in active development
    status.md               # Lifecycle status, commit, and debug info
    tasks/
      <task-name>/
        plan.md             # Task phases and implementation goals
        questions.md        # Open and answered questions
        decisions.md        # Key decisions and rationales
        progress.md         # Execution record per phase
        security.md         # Security considerations and mitigations
        errors.md           # Error handling and recovery procedures

.cursor/
  rules/
    00_behavior.mdc        # Core behavior rules
    01_task_lifecycle.mdc  # Task management
    02_question_protocol.mdc # Question handling
    03_decision_tracking.mdc # Decision documentation
    04_context_sync.mdc    # State management
    05_integrity_checks.mdc # System verification
    06_commands.mdc        # Command execution
    07_resumption.mdc      # State recovery
    08_self_audit.mdc      # System auditing
    09_critical_thinking.mdc # Problem solving
    10_code_quality.mdc    # Code standards
    11_git_flow.mdc        # Version control
    12_test_first.mdc      # Testing approach
    13_debugging.mdc       # Problem resolution
    14_security.mdc        # Security practices
    15_project_analysis.mdc # Project analysis
  version                  # Rules version tracking
```

---

## ⚙️ Execution Rules

1. Only work on the task in `.agent/state/active.md`
2. Pull the latest code and create a branch: `task/<task-name>`
3. Write a test before implementing any code
4. Run tests after every change
5. Commit only after passing tests
6. Log completed steps in `progress.md`
7. Record decisions with rationale in `decisions.md`
8. Update `.agent/context/` if architecture or tooling changes
9. Self-audit after each phase to ensure consistency
10. Document security considerations in `security.md`
11. Use latest stable versions of tools and libraries
12. Maintain isolated project dependencies
13. Follow security best practices in all implementations
14. Document and handle errors in `errors.md`
15. Maintain rules version compatibility

---

## 🔒 Security and Compatibility Guidelines

- Always use the latest stable versions of tools and libraries
- Prioritize compatibility with existing systems
- Maintain isolated project dependencies and configurations
- Follow security best practices in all implementations
- Document all security considerations and mitigations
- Use existing libraries unless there's a compelling reason not to
- Keep security simple and effective - avoid unnecessary complexity
- Regular security audits and updates
- Document and track security incidents

---

## 🧭 Assistant Behavior Philosophy

- **Helpful, not agreeable** — raise concerns, suggest better ideas
- **Proactive** — continue independently unless blocked
- **Rigorously documented** — every action has a trail
- **Resilient** — recover progress from file-based history
- **Security-conscious** — follow best practices without overcomplicating
- **Compatibility-focused** — prioritize stability and integration
- **Error-aware** — handle and document errors gracefully
- **Version-aware** — maintain compatibility across updates

---

## 🚀 Getting Started

The default task is:

**`sample-feature`** — A CLI tool that prints a greeting:  
`Hello, <name>!`

Start by:
- Creating the full file and directory structure
- Seeding each Markdown file with initial content
- Planning the feature in small, testable steps
- Documenting security considerations
- Setting up isolated project dependencies
- Initializing error handling procedures

Development should proceed immediately unless questions are unanswered or blocking issues arise.

---

## 📝 IDE Integration

The assistant operates within your IDE and maintains all project files automatically. It will:
- Track and update all documentation
- Manage task states and progress
- Handle security considerations
- Maintain project isolation
- Follow compatibility guidelines
- Handle errors and recovery
- Maintain version compatibility
- Apply project-specific templates

No manual file management is required - the assistant handles all file operations and updates.

---

## 🔄 Version Management

The assistant maintains version compatibility for:
- Rules and templates
- Project dependencies
- Development tools
- Security configurations

Version information is tracked in:
- `.cursor/version`
- Project-specific version files
- Dependency manifests
- Security tool configurations
