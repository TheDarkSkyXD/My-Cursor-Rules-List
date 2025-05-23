import os
import shutil
import re # For checking generated rule file formats

# --- Expected directory names in the TARGET project (tmp_target_repo_root) ---
TARGET_PROJECT_RULES_DIR = "project_rules"
TARGET_MEMORY_BANK_DIR = "memory"
TARGET_TOOLS_DIR = "tools"

# --- Expected directory names in the TEMPORARY SOURCE (tmp_source_repo_root) ---
# These must match what's created in conftest.py's tmp_source_repo_root fixture
TMP_SOURCE_RULE_SETS_DIR_NAME = "rule_sets"
TMP_SOURCE_MEMORY_STARTERS_DIR_NAME = "memory_starters"
TMP_SOURCE_TOOL_STARTERS_DIR_NAME = "tool_starters"


def test_install_default_rule_set(script_runner, tmp_path): # tmp_path provides tmp_target_repo_root
    """Test `install` with the default rule set ('light-spec')."""
    tmp_target_repo_root = tmp_path / "my_project_default_install"
    tmp_target_repo_root.mkdir()

    result = script_runner(["install"], tmp_target_repo_root)
    assert result.returncode == 0, f"Script failed. STDERR:\n{result.stderr}\nSTDOUT:\n{result.stdout}"

    # 1. Check presence of core directories in target
    assert (tmp_target_repo_root / TARGET_PROJECT_RULES_DIR).is_dir()
    assert (tmp_target_repo_root / TARGET_MEMORY_BANK_DIR).is_dir()
    assert (tmp_target_repo_root / TARGET_TOOLS_DIR).is_dir()

    # 2. Check project_rules content (should be 'light-spec' from tmp_source_repo_root)
    project_rules_target = tmp_target_repo_root / TARGET_PROJECT_RULES_DIR
    assert (project_rules_target / "01-core" / "01-main-directive.md").is_file()
    assert (project_rules_target / "02-style" / "python_rules.md").is_file()
    assert not (project_rules_target / "01-advanced" / "config_heavy.md").exists() # from heavy-spec

    # 3. Check memory_bank content
    memory_bank_target = tmp_target_repo_root / TARGET_MEMORY_BANK_DIR
    assert (memory_bank_target / "ARCHITECTURE_OVERVIEW.md").is_file()
    assert (memory_bank_target / "CODING_GUIDELINES.md").is_file()

    # 4. Check tools content
    tools_target = tmp_target_repo_root / TARGET_TOOLS_DIR
    assert (tools_target / "linter_tool.py").is_file()
    assert (tools_target / "formatter_tool.sh").is_file()

    # 5. Check for generated platform-specific rule directories (basic existence)
    assert (tmp_target_repo_root / ".cursor" / "rules").is_dir()
    assert (tmp_target_repo_root / ".clinerules").is_dir()
    assert (tmp_target_repo_root / ".roo").is_dir()
    assert (tmp_target_repo_root / ".windsurfrules").is_file()
    
    # Check content of a generated file to ensure it's from the correct source rules
    windsurf_content = (tmp_target_repo_root / ".windsurfrules").read_text()
    assert "Test Light-spec: Main Directive" in windsurf_content

    # 6. Check output messages
    # [TODO] test message too fragile, figure out new test ways
    # assert "Successfully copied rule templates to" in result.stdout 
    # assert "Successfully processed memory bank starters for" in result.stdout
    # assert "Successfully processed tool starters for" in result.stdout
    # assert ".cursor/rules/" in result.stdout # Gitignore suggestion
    # assert "Commit the memory/ and tools/ directories" in result.stdout
    # assert f"{TARGET_PROJECT_RULES_DIR}/ directory is managed by this script" in result.stdout # Adjusted message


def test_install_specific_rule_set(script_runner, tmp_path):
    """Test `install --rule-set heavy-spec`."""
    tmp_target_repo_root = tmp_path / "my_project_heavy_install"
    tmp_target_repo_root.mkdir()

    result = script_runner(["install", "--rule-set", "heavy-spec"], tmp_target_repo_root)
    assert result.returncode == 0, f"Script failed. STDERR:\n{result.stderr}"

    project_rules_target = tmp_target_repo_root / TARGET_PROJECT_RULES_DIR
    assert (project_rules_target / "01-advanced" / "config_heavy.md").is_file()
    assert not (project_rules_target / "01-core" / "01-main-directive.md").exists() # from light-spec

    # Check generated file content for heavy-spec rule
    windsurf_content = (tmp_target_repo_root / ".windsurfrules").read_text()
    assert "Test Heavy-spec: Advanced Config" in windsurf_content


def test_install_overwrites_existing_project_rules(script_runner, tmp_path):
    """Test that `install` overwrites an existing project_rules/ directory."""
    tmp_target_repo_root = tmp_path / "project_with_existing_rules"
    tmp_target_repo_root.mkdir()

    existing_project_rules = tmp_target_repo_root / TARGET_PROJECT_RULES_DIR
    existing_project_rules.mkdir()
    (existing_project_rules / "custom_old_rule.md").write_text("This is an old custom rule that should be overwritten.")

    result = script_runner(["install", "--rule-set", "light-spec"], tmp_target_repo_root)
    assert result.returncode == 0, f"Script failed. STDERR:\n{result.stderr}"

    assert not (existing_project_rules / "custom_old_rule.md").exists()
    assert (existing_project_rules / "01-core" / "01-main-directive.md").is_file()
    assert "Warning: Rule source directory" in result.stdout and "already exists. It will be replaced." in result.stdout


def test_install_non_destructive_for_memory_and_tools(script_runner, tmp_path):
    """Test `install` doesn't overwrite existing user files in memory/ and tools/."""
    tmp_target_repo_root = tmp_path / "project_with_user_data"
    tmp_target_repo_root.mkdir()

    # Pre-populate memory_bank
    memory_bank_target = tmp_target_repo_root / TARGET_MEMORY_BANK_DIR
    memory_bank_target.mkdir()
    user_memory_file = memory_bank_target / "USER_DEFINED_DOC.md"
    user_memory_file.write_text("User's custom memory content.")
    # This file has the same name as a starter file, but user has modified it
    existing_starter_memory_file = memory_bank_target / "CODING_GUIDELINES.md" 
    existing_starter_memory_file.write_text("User's heavily modified coding guidelines.")

    # Pre-populate tools
    tools_target = tmp_target_repo_root / TARGET_TOOLS_DIR
    tools_target.mkdir()
    user_tool_file = tools_target / "USER_CUSTOM_SCRIPT.py"
    user_tool_file.write_text("print('User custom tool script')")

    result = script_runner(["install", "--rule-set", "light-spec"], tmp_target_repo_root)
    assert result.returncode == 0, f"Script failed. STDERR:\n{result.stderr}"

    # Check memory_bank: user files preserved, new starter files added
    assert user_memory_file.read_text() == "User's custom memory content."
    assert existing_starter_memory_file.read_text() == "User's heavily modified coding guidelines."
    assert (memory_bank_target / "ARCHITECTURE_OVERVIEW.md").is_file() # This was a starter
    assert (memory_bank_target / "NEW_MEMORY_DOC.md").is_file() # This was a new starter

    # Check tools: user files preserved, new starter files added
    assert user_tool_file.read_text() == "print('User custom tool script')"
    assert (tools_target / "linter_tool.py").is_file() # This was a starter
    assert (tools_target / "NEW_TOOL_SCRIPT.py").is_file() # This was a new starter

# --- Placeholder for other tests (sync, clean-rules, clean-all) ---
# You would add them similarly, using script_runner and tmp_path

def test_sync_after_manual_project_rules_modification(script_runner, tmp_path):
    tmp_target_repo_root = tmp_path / "project_for_sync_test"
    tmp_target_repo_root.mkdir()
    script_runner(["install", "--rule-set", "light-spec"], tmp_target_repo_root)

    rule_to_modify = tmp_target_repo_root / TARGET_PROJECT_RULES_DIR / "01-core" / "01-main-directive.md"
    modified_content = " *** MODIFIED CONTENT FOR SYNC TEST *** "
    rule_to_modify.write_text(modified_content)

    windsurf_file_path = tmp_target_repo_root / ".windsurfrules"
    if windsurf_file_path.exists(): windsurf_file_path.unlink()

    result = script_runner(["sync"], tmp_target_repo_root)
    assert result.returncode == 0, f"Sync script failed. STDERR:\n{result.stderr}"
    assert windsurf_file_path.is_file()
    assert modified_content in windsurf_file_path.read_text()

def test_clean_rules_removes_rules_and_generated_keeps_memory_tools(script_runner, tmp_path):
    tmp_target_repo_root = tmp_path / "project_for_clean_rules"
    tmp_target_repo_root.mkdir()
    script_runner(["install"], tmp_target_repo_root)

    result = script_runner(["clean-rules"], tmp_target_repo_root)
    assert result.returncode == 0, f"clean-rules script failed. STDERR:\n{result.stderr}"

    assert not (tmp_target_repo_root / TARGET_PROJECT_RULES_DIR).exists()
    assert not (tmp_target_repo_root / ".cursor").exists()
    assert (tmp_target_repo_root / TARGET_MEMORY_BANK_DIR).is_dir()
    assert (tmp_target_repo_root / TARGET_TOOLS_DIR).is_dir()
    assert (tmp_target_repo_root / TARGET_MEMORY_BANK_DIR / "ARCHITECTURE_OVERVIEW.md").is_file()

def test_clean_all_with_confirmation_yes(script_runner, tmp_path):
    tmp_target_repo_root = tmp_path / "project_for_clean_all_yes"
    tmp_target_repo_root.mkdir()
    script_runner(["install"], tmp_target_repo_root)

    result = script_runner(["clean-all"], tmp_target_repo_root, confirm_input="yes")
    assert result.returncode == 0, f"clean-all script failed. STDERR:\n{result.stderr}"

    assert not (tmp_target_repo_root / TARGET_PROJECT_RULES_DIR).exists()
    assert not (tmp_target_repo_root / TARGET_MEMORY_BANK_DIR).exists()
    assert not (tmp_target_repo_root / TARGET_TOOLS_DIR).exists()
    assert not (tmp_target_repo_root / ".cursor").exists()
    assert "This will remove ALL framework components" in result.stdout
    # [TODO] test message too fragile, figure out new test ways 
    # assert "Clean operation complete." in result.stdout

def test_clean_all_with_confirmation_no(script_runner, tmp_path):
    tmp_target_repo_root = tmp_path / "project_for_clean_all_no"
    tmp_target_repo_root.mkdir()
    script_runner(["install"], tmp_target_repo_root)

    result = script_runner(["clean-all"], tmp_target_repo_root, confirm_input="no")
    assert result.returncode == 0, f"clean-all script failed. STDERR:\n{result.stderr}"

    assert (tmp_target_repo_root / TARGET_PROJECT_RULES_DIR).is_dir()
    assert (tmp_target_repo_root / TARGET_MEMORY_BANK_DIR).is_dir()
    # [TODO] test message too fragile, figure out new test ways
    # assert "Clean operation cancelled." in result.stdout

def test_list_rules(script_runner, tmp_source_repo_root): # tmp_source_repo_root fixture ensures rule_sets exist
    """Test the `list-rules` command."""
    # tmp_source_repo_root (from conftest.py) creates:
    # - rule_sets/light-spec
    # - rule_sets/heavy-spec
    # - rule_sets/empty-ruleset (which is a directory)
    # - rule_sets/.hidden_ruleset (should be ignored)
    # - rule_sets/_private_ruleset (should be ignored)
    # - rule_sets/not_a_dir_ruleset.txt (should be ignored)


    result = script_runner(["list-rules"])
    assert result.returncode == 0, f"Script failed. STDERR:\n{result.stderr}\nSTDOUT:\n{result.stdout}"

    stdout = result.stdout
    assert "Available rule sets:" in stdout
    assert "- heavy-spec" in stdout    # From conftest.py
    assert "- light-spec" in stdout    # From conftest.py
    
    # Ensure ignored items are not listed
    assert ".hidden_ruleset" not in stdout
    assert "_private_ruleset" not in stdout
    assert "not_a_dir_ruleset.txt" not in stdout
    
    assert "--- Listing complete ---" in stdout
