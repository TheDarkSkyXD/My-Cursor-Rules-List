# Cursor AI Rules: Senior Principal Engineer Guardrails

This repository contains a set of Cursor IDE [AI rules](https://docs.cursor.com/context/rules-for-ai) designed to transform Cursor's AI capabilities from basic code completion to strategic, business-focused engineering guidance.

## Purpose

These rules implement guardrails that guide Cursor AI to behave like a senior principal engineer who:

- Identifies the underlying business problem before writing code
- Makes small, focused changes with clear business value
- Writes production-ready code with proper testing and documentation
- Considers maintainability, monitoring, and cross-team impacts
- Documents technical debt and knowledge transfer

## Installation

### Option 1: Using the installation script

```bash
./install.sh /path/to/your/project
```

### Option 2: Manual installation

1. Create a `.cursor/rules` directory in your project root:

```bash
mkdir -p /path/to/your/project/.cursor/rules
```

2. Copy the `.mdc` files from this repository into that directory:

```bash
cp .cursor/rules/*.mdc /path/to/your/project/.cursor/rules/
```

## Rules

| Rule | Description |
|------|-------------|
| [Cursor Rules Location](.cursor/rules/cursor-rules-location.mdc) | Standards for placing Cursor rule files in the correct directory |
| [Root Problem Identification](.cursor/rules/root-problem-identification.mdc) | Ensures AI identifies underlying business problems before suggesting solutions |
| [Minimum Viable Change](.cursor/rules/minimum-viable-change.mdc) | Implements the smallest set of changes needed to solve problems effectively |
| [Business Value Prioritization](.cursor/rules/business-value-prioritization.mdc) | Prioritizes business impact over technical elegance or novelty |
| [Frequent Commit Strategy](.cursor/rules/frequent-commit-strategy.mdc) | Breaks work into small, testable commits using conventional format |
| [Explicit Requirement Extraction](.cursor/rules/explicit-requirement-extraction.mdc) | Clarifies unstated requirements and validates understanding before coding |
| [Proactive Edge Case Handling](.cursor/rules/proactive-edge-case-handling.mdc) | Identifies potential failure points and handles them without prompting |
| [Production-Ready Mindset](.cursor/rules/production-ready-mindset.mdc) | Writes code assuming it will be deployed immediately to production |
| [Knowledge Transfer Focus](.cursor/rules/knowledge-transfer-focus.mdc) | Documents solutions in a way that builds team capability and understanding |
| [Technical Debt Awareness](.cursor/rules/technical-debt-awareness.mdc) | Labels and documents technical compromises made for business urgency |
| [Self-Review Before Submission](.cursor/rules/self-review-before-submission.mdc) | Critically evaluates solutions for bugs, edge cases, and maintenance issues |

## Usage

When working with Cursor AI, these rules will automatically guide the AI's responses toward higher-quality, business-focused solutions. You should notice:

1. More thorough requirement analysis
2. Clearer documentation of design decisions
3. Better error handling and edge case coverage
4. Production-ready considerations like monitoring and rollback plans
5. Conventional commit message suggestions

## Customization

You can customize these rules for your specific needs:

1. Edit the `.mdc` files to adjust validation criteria, suggestions, or examples
2. Disable specific rules by removing the files
3. Add your own rules following the same MDC format

## Contributing

Contributions are welcome! If you have improvements or additional rules:

1. Fork this repository
2. Create a new branch for your changes
3. Submit a pull request with a clear description of your additions

## License

[MIT License](LICENSE)