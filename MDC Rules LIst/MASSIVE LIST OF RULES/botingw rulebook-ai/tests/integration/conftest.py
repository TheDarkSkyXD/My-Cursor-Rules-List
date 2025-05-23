import pytest
import os
import shutil
import subprocess

# --- Absolute path to the root of your ACTUAL project framework ---
FRAMEWORK_ROOT_ACTUAL = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
# Path to the ORIGINAL manage_rules.py script that will be COPIED
MANAGE_RULES_SCRIPT_ORIGINAL_PATH = os.path.join(FRAMEWORK_ROOT_ACTUAL, "src", "manage_rules.py")

# --- Directory names to be used INSIDE the temporary SOURCE framework ---
TMP_SOURCE_RULE_SETS_DIR_NAME = "rule_sets"
TMP_SOURCE_MEMORY_STARTERS_DIR_NAME = "memory_starters"
TMP_SOURCE_TOOL_STARTERS_DIR_NAME = "tool_starters"
TMP_SOURCE_SRC_DIR_NAME = "src" # For the script itself
COPIED_MANAGE_RULES_SCRIPT_NAME = "manage_rules.py"

@pytest.fixture(scope="session")
def tmp_source_repo_root(tmp_path_factory):
    """
    Creates a temporary, isolated 'source framework' directory (tmp_source_repo_root)
    that mimics the actual project structure.
    This directory will contain:
    1. 'rule_sets/', 'memory_starters/', 'tool_starters/' with dummy content.
    2. A 'src/' subdirectory.
    3. A copy of the actual manage_rules.py script placed into 'src/'.
    This entire structure is temporary and created once per test session.
    """
    source_base_dir = tmp_path_factory.mktemp("tmp_source_repo_") # This is our tmp_source_repo_root
    
    # 1. Create dummy template directories directly under tmp_source_repo_root
    (source_base_dir / TMP_SOURCE_RULE_SETS_DIR_NAME / "light-spec" / "01-core").mkdir(parents=True, exist_ok=True)
    (source_base_dir / TMP_SOURCE_RULE_SETS_DIR_NAME / "light-spec" / "02-style").mkdir(parents=True, exist_ok=True)
    (source_base_dir / TMP_SOURCE_RULE_SETS_DIR_NAME / "heavy-spec" / "01-advanced").mkdir(parents=True, exist_ok=True)

    (source_base_dir / TMP_SOURCE_RULE_SETS_DIR_NAME / "light-spec" / "01-core" / "01-main-directive.md").write_text("Test Light-spec: Main Directive")
    (source_base_dir / TMP_SOURCE_RULE_SETS_DIR_NAME / "light-spec" / "02-style" / "python_rules.md").write_text("Test Light-spec: Python Style")
    (source_base_dir / TMP_SOURCE_RULE_SETS_DIR_NAME / "heavy-spec" / "01-advanced" / "config_heavy.md").write_text("Test Heavy-spec: Advanced Config")
    (source_base_dir / TMP_SOURCE_RULE_SETS_DIR_NAME / "light-spec" / "top_level_light_rule.txt").write_text("Top level light rule")

    (source_base_dir / TMP_SOURCE_MEMORY_STARTERS_DIR_NAME).mkdir(parents=True, exist_ok=True)
    (source_base_dir / TMP_SOURCE_MEMORY_STARTERS_DIR_NAME / "ARCHITECTURE_OVERVIEW.md").write_text("Test Memory: Architecture Overview")
    (source_base_dir / TMP_SOURCE_MEMORY_STARTERS_DIR_NAME / "CODING_GUIDELINES.md").write_text("Test Memory: Coding Guidelines")
    (source_base_dir / TMP_SOURCE_MEMORY_STARTERS_DIR_NAME / "NEW_MEMORY_DOC.md").write_text("A new memory starter doc for testing non-destructive copy.")

    (source_base_dir / TMP_SOURCE_TOOL_STARTERS_DIR_NAME).mkdir(parents=True, exist_ok=True)
    (source_base_dir / TMP_SOURCE_TOOL_STARTERS_DIR_NAME / "linter_tool.py").write_text("print('Executing test linter tool...')")
    (source_base_dir / TMP_SOURCE_TOOL_STARTERS_DIR_NAME / "formatter_tool.sh").write_text("#!/bin/bash\necho 'Executing test formatter tool'")
    (source_base_dir / TMP_SOURCE_TOOL_STARTERS_DIR_NAME / "NEW_TOOL_SCRIPT.py").write_text("print('A new tool script for testing non-destructive copy.')")

    # Create dummy env.example and requirements.txt at the root of tmp_source_repo_root
    (source_base_dir / "env.example").write_text("TEST_ENV_VAR=example_value\n")
    (source_base_dir / "requirements.txt").write_text("test-package==1.0.0\n")

    # 2. Create the src/ subdirectory within tmp_source_repo_root
    tmp_src_dir = source_base_dir / TMP_SOURCE_SRC_DIR_NAME
    tmp_src_dir.mkdir(parents=True, exist_ok=True)

    # 3. Copy the actual manage_rules.py script into tmp_source_repo_root/src/
    assert os.path.exists(MANAGE_RULES_SCRIPT_ORIGINAL_PATH), \
        f"Original manage_rules.py not found at {MANAGE_RULES_SCRIPT_ORIGINAL_PATH}. Ensure path is correct."
    shutil.copy2(MANAGE_RULES_SCRIPT_ORIGINAL_PATH, tmp_src_dir / COPIED_MANAGE_RULES_SCRIPT_NAME)

    print(f"Created temporary source repo root for tests (with src/ subdir) at: {source_base_dir}")
    return source_base_dir


def _run_script_from_tmp_source(
        tmp_source_root_path,
        command_args_list,
        tmp_target_path=None, # Made optional
        confirm_input=None
    ):

    # Path to the manage_rules.py script WITHIN the temporary source structure
    script_to_run_path = tmp_source_root_path / TMP_SOURCE_SRC_DIR_NAME / COPIED_MANAGE_RULES_SCRIPT_NAME

    full_command = [
        "python",
        str(script_to_run_path), # e.g., .../tmp_source_repo_0/src/manage_rules.py
        *command_args_list
    ]
    if tmp_target_path: # Only add target_path if it's provided
        full_command.append(str(tmp_target_path))

    # The Current Working Directory (CWD) is set to tmp_source_root_path.
    # When manage_rules.py (now in .../tmp_source_repo_0/src/) calculates its
    # PROJECT_FRAMEWORK_ROOT using os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    # it will correctly resolve to tmp_source_root_path.
    print(f"Running: {' '.join(full_command)} (CWD: {tmp_source_root_path})")
    process = subprocess.run(
        full_command,
        capture_output=True,
        text=True,
        input=(confirm_input + "\n") if confirm_input is not None else None,
        check=False, 
        cwd=tmp_source_root_path # Execute from the root of the temporary source framework
    )
    
    print(f"STDOUT:\n{process.stdout}")
    if process.stderr:
        print(f"STDERR:\n{process.stderr}")
    return process

@pytest.fixture
def script_runner(tmp_source_repo_root):
    def runner_func(command_args_list, tmp_target_path_for_script=None, confirm_input=None): # Made optional
        return _run_script_from_tmp_source(
            tmp_source_repo_root,
            command_args_list,
            tmp_target_path_for_script, # This can be None
            confirm_input
        )
    return runner_func
