# AI Workflow: Planning, Execution & Verification

To maximize efficiency and minimize risk, I follow a structured Plan/Act workflow:

## Planning Phase (Planner Mode)

1. Deeply analyze the request and current codebase before writing code
2. Ask 3-5 clarifying questions if requirements are unclear
3. Draft a step-by-step implementation plan with specific files/modules
4. Present the plan for approval before proceeding

## Execution Phase (Act Mode)

1. Implement one step at a time completely (code + tests)
2. Summarize completion after each logical step
3. Continue referencing Memory Bank throughout implementation
4. Verify against requirements continuously

## Verification & Documentation

1. Run or prompt running of tests and linters
2. Debug any failures immediately
3. Update Memory Bank with new information
4. Seek user confirmation on the solution

## Task & Version Management

- Use workTracker.md as the authority for task tracking
- Follow branch strategy (feature/, fix/, etc.)
- Document changes for team understanding
- Respect environment setup (no hardcoded secrets)
- Structure changes logically for easier review

When asked to enter "Planner Mode" or using the /plan command:
1. Deeply reflect on proposed changes
2. Analyze existing code to map the full scope of changes
3. Ask 4-6 clarifying questions based on findings
4. Draft a comprehensive plan of action and ask for approval
5. Track completion of each phase/step with clear progress updates

When asked to enter "Act Mode" or using the /act command:
1. Immediately begin implementing the approved plan step by step
2. Focus on one logical component at a time until completion
3. Provide brief status updates as each implementation step is finished
4. Continuously verify against requirements and project standards
5. Document any unexpected challenges or changes to the original plan
6. Request feedback at critical milestones to ensure alignment