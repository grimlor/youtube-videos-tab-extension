# BDD Testing Style Guide

## Overview

This guide establishes testing standards using Behavior-Driven Development (BDD) principles. Tests should be clear, maintainable, and focused on business behavior rather than implementation details.

**Note on Examples:** This guide uses examples from multiple testing frameworks (Python/pytest, TypeScript/Jest) to illustrate BDD principles. The concepts apply universally, but syntax varies by framework—particularly for assertion messages (see [Assertion Quality Standards](#assertion-quality-standards)).

## Why BDD? Tests as Specification

**BDD tests are not just tests—they are executable specifications.** 

The key insight: While the value of well-defined unit tests is often misunderstood, the value of a well-defined **specification** is universally understood. BDD bridges this gap by making tests read like specifications:

- **Traditional Unit Tests**: "Test that function X returns Y when given Z"
- **BDD Specifications**: "When a user does X in context Y, the system behaves as Z"

**A complete BDD test suite defines:**
- All expected user scenarios and workflows
- How the system handles unexpected situations
- Edge cases and error conditions
- The complete scope of system behavior

When you achieve 100% coverage with BDD tests, you've done more than test your code—you've **completely specified your system's behavior**. Anyone can read your tests and understand exactly what the system does, who uses it, and why it matters.

## Core BDD Principles

### 1. Focus on Behavior, Not Implementation

Tests should describe **what** the system does, **who** uses it, and **why** it matters, rather than **how** it works internally.

```python
# Good: Describes user behavior and business value
def test_analyst_can_export_excel_to_tsv_for_data_sharing(self):
    """
    As a business analyst
    When I export Excel data to TSV format
    Then I can share tab-delimited data with external stakeholders
    """

# Bad: Focuses on implementation details
def test_export_function_calls_polars_write_csv_with_tab_separator(self):
```

### 2. Use Given-When-Then Structure

Organize test logic using the BDD pattern:
- **Given**: Set up the initial state/context
- **When**: Execute the action being tested
- **Then**: Verify the expected outcomes

```python
def test_engineer_processes_quarterly_data_correctly(self):
    """
    As a data engineer
    When I process quarterly financial data
    Then I get properly formatted output with all required fields
    """
    # Given: Quarterly financial data in expected format
    q1_data = create_test_financial_data(
        contracts=["ABC Corp", "XYZ Ltd"],
        quarters=["Q1 2024"],
        amounts=[100000.0, 150000.0]
    )
    
    # When: Engineer processes the data
    result = process_quarterly_data(q1_data)
    
    # Then: Output contains all required financial fields
    assert "Contract" in result.columns
    assert "Premium_Amount" in result.columns
    assert len(result) == 2
```

### 3. Write Self-Documenting Test Names

Test names should clearly communicate the user story being tested:

```python
# Good: Clear user story and outcome
def test_operations_team_gets_clear_errors_for_missing_excel_files(self):
def test_analyst_receives_guidance_when_client_files_missing(self):
def test_engineer_handles_large_plan_data_chunking(self):

# Bad: Implementation-focused names
def test_file_not_found_exception_raised(self):
def test_validate_input_parameters(self):
def test_chunk_size_calculation(self):
```

### 4. Black Box Testing - Test Behavior, Not Implementation

Tests should treat the system as a **black box**, verifying behavior from the user's perspective without knowledge of internal implementation details.

```python
# Good: Black box - tests observable behavior
def test_analyst_exports_multi_sheet_excel_to_separate_tsv_files(self):
    """
    As a business analyst
    When I export a multi-sheet Excel file
    Then I get separate TSV files for each sheet
    """
    # Given: Excel file with multiple sheets
    excel_file = create_test_excel(sheets=["Q1", "Q2", "Q3"])
    
    # When: User exports to TSV
    result = export_excel_to_tsv(excel_file, output_dir)
    
    # Then: Each sheet becomes a TSV file
    assert len(result) == 3, f"Expected 3 TSV files, got {len(result)}"
    for sheet_name in ["Q1", "Q2", "Q3"]:
        assert sheet_name in result, f"Missing TSV for sheet '{sheet_name}'"
        assert result[sheet_name].exists(), f"TSV file not created for '{sheet_name}'"

# Bad: White box - tests internal implementation
def test_export_calls_polars_write_csv_with_separator(self):
    with patch('polars.DataFrame.write_csv') as mock_write:
        export_excel_to_tsv(test_file, output_dir)
        mock_write.assert_called_with(ANY, separator='\t')
```

**Why Black Box Testing?**
- Allows refactoring internal implementation without breaking tests
- Tests remain stable as code evolves
- Forces focus on user-facing behavior rather than implementation details
- Makes tests more maintainable and less brittle

### 5. Minimal Mocking - Only Mock I/O Boundaries

Mocks should be used sparingly and **only at I/O boundaries** (file system, network, databases, external services). Avoid mocking internal functions or business logic.

```python
# Good: Mock only I/O boundary (external API call)
def test_engineer_handles_api_timeout_gracefully(self):
    """
    As a data engineer
    When the external data API times out
    Then I receive a clear error message with retry instructions
    """
    # Given: API that will timeout
    with patch('requests.get', side_effect=Timeout("Connection timeout")):
        # When: Engineer attempts to fetch data
        result = fetch_external_data(api_url)
        
        # Then: Clear error with actionable guidance
        assert not result.success, "Should fail gracefully on timeout"
        assert "timeout" in result.error_message.lower(), (
            f"Error should mention timeout. Got: '{result.error_message}'"
        )

# Good: Mock file system I/O for edge case testing
def test_operations_team_handles_read_only_output_directory(self):
    """
    As operations team member
    When the output directory is read-only
    Then I get a clear permission error with the directory path
    """
    with patch('pathlib.Path.write_text', side_effect=PermissionError("Permission denied")):
        with pytest.raises(PermissionError) as exc_info:
            export_to_file(data, read_only_path)
        
        assert "Permission denied" in str(exc_info.value)

# Bad: Over-mocking internal logic
def test_data_processing_pipeline(self):
    with patch('module.validate_data') as mock_validate, \
         patch('module.transform_data') as mock_transform, \
         patch('module.aggregate_data') as mock_aggregate:
        
        mock_validate.return_value = True
        mock_transform.return_value = transformed_data
        mock_aggregate.return_value = final_result
        
        result = process_pipeline(input_data)
        
        # This tests mock configuration, not actual behavior!
        mock_validate.assert_called_once()
        mock_transform.assert_called_once()
```

**Why Minimal Mocking?**
- **Over-mocking tests the mocks, not the real code**: Tests pass even when actual implementation is broken
- **Brittle tests**: Every internal refactor requires updating mocks
- **False confidence**: Tests give green light while real system fails
- **I/O boundaries are the exception**: File system, network, databases are legitimately slow/unreliable in tests

**When to Mock:**
- ✅ External API calls (network I/O, 3rd party libraries)
- ✅ File system operations (for permission/missing file edge cases)
- ✅ Database connections
- ✅ Time/date functions (for deterministic testing)
- ❌ Internal business logic functions
- ❌ Data transformations
- ❌ Validation logic
- ❌ Calculations

## Assertion Quality Standards

### Framework-Specific Assertion Approaches

**Python (pytest):** Supports custom assertion messages via the second parameter to `assert`:
```python
assert condition, "Custom error message"
```

**TypeScript/Jest:** Does NOT support custom assertion messages in `expect()`. Instead, use:
- Descriptive test names (`user_does_something_format`)
- Given-When-Then comments explaining context
- Jest's built-in failure messages (which are comprehensive)

```typescript
// ✅ Jest approach: Use comments for context
// Then: Extension should not activate on non-channel pages
expect(mockSetTimeout).not.toHaveBeenCalled();

// ❌ Does not work in Jest
expect(mockSetTimeout).not.toHaveBeenCalled(), "Extension should not activate";
```

### 1. Always Provide Descriptive Context

Every assertion should include meaningful context that helps debug failures without running a debugger.

**Python/pytest examples:**
```python
# Excellent: Descriptive with context
assert len(exported_files) == expected_count, (
    f"Expected {expected_count} exported files but got {len(exported_files)}. "
    f"Available files: {list(exported_files.keys())}"
)

# Good: Basic descriptive message
assert result.is_valid, f"Processing should succeed but got errors: {result.errors}"

# Bad: No context when it fails
assert len(exported_files) == 2
assert result.is_valid
```

**TypeScript/Jest examples:**
```typescript
// Good: Context via comments
// Then: All channel formats should be exported
expect(exportedFiles.length).toBe(expectedCount);
expect(exportedFiles).toContain('@username');
expect(exportedFiles).toContain('/channel/');

// Bad: No context
expect(exportedFiles.length).toBe(3);
```

### 2. Show Expected vs Actual Values

When comparing values, show both what was expected and what was actually received.

```python
# Good: Clear expected vs actual
expected_header = "Client_ID\tPlan_Code\tPremium_Amount"
assert header == expected_header, (
    f"Header mismatch. Expected: '{expected_header}', Got: '{header}'"
)

# Bad: Unclear what was expected
assert "Client_ID" in header, f"Missing Client_ID in header: {header}"
```

### 3. Provide Relevant Context for Debugging

Include enough context in error messages to understand the failure:

```python
# Good: Includes relevant context
for sheet_name, tsv_path in exported_files.items():
    assert tsv_path.exists(), (
        f"TSV file for sheet '{sheet_name}' should exist at: {tsv_path}"
    )
    content = tsv_path.read_text()
    assert "\t" in content, (
        f"Content for sheet '{sheet_name}' should contain tabs. "
        f"Content preview: '{content[:100]}...'"
    )

# Bad: No context about which file or what content
assert tsv_path.exists()
assert "\t" in content
```

### 4. Use Multi-line Format for Readability

For complex assertions, use parentheses to break messages across multiple lines:

```python
# Good: Readable multi-line format
assert len(validation_results) == expected_validation_count, (
    f"Expected {expected_validation_count} validation results "
    f"but got {len(validation_results)}. "
    f"Results: {[r.message for r in validation_results]}"
)

# Avoid: Long single lines that exceed 88 characters
assert len(validation_results) == expected_validation_count, f"Expected {expected_validation_count} validation results but got {len(validation_results)}. Results: {[r.message for r in validation_results]}"
```

### 5. Handle File and Path Assertions Clearly

File operations should provide clear context about what failed:

```python
# Good: Shows the actual path and operation
assert output_file.exists(), (
    f"Output file should be created at: {output_file}"
)

assert output_file.suffix == ".csv", (
    f"Output file should have .csv extension but got: {output_file.suffix}"
)

# Bad: No indication of what file or where
assert output_file.exists()
assert output_file.suffix == ".csv"
```

### 6. Collection and Dictionary Assertions

When working with collections, provide insight into the actual contents:

```python
# Good: Shows what was actually in the collection
assert "Q1 2024" in exported_files, (
    f"Expected 'Q1 2024' sheet in exported files. "
    f"Available sheets: {list(exported_files.keys())}"
)

assert len(datasets) == expected_count, (
    f"Expected {expected_count} datasets but got {len(datasets)}. "
    f"Dataset names: {list(datasets.keys())}"
)

# Bad: No context about collection contents
assert "Q1 2024" in exported_files
assert len(datasets) == 5
```

## Test Organization Standards

### 1. Group Tests by User Role

Organize test classes around the personas who use the functionality:

```python
class TestBusinessAnalystWorkflows:
    """Business analysts need reliable data export capabilities."""

class TestDataEngineerPipelines:
    """Data engineers need robust data processing pipelines."""

class TestOperationsTeamReliability:
    """Operations teams need clear error reporting and edge case handling."""
```

### 2. Use Descriptive Test Class Documentation

Each test class should explain the user's needs and context:

```python
class TestFinanceTeamQuarterlyReporting:
    """
    Finance teams need to generate quarterly reports that combine
    data from multiple sources with consistent formatting for
    regulatory compliance and stakeholder communication.
    """
```

### 3. Include Business Context in Test Documentation

Test docstrings should explain the business value, not just the technical behavior:

```python
def test_analyst_can_reconcile_plan_vs_actual_variances(self):
    """
    As a business analyst
    When I compare planned vs actual financial data
    Then I can identify significant variances that need investigation
    
    This supports monthly variance reporting required by finance leadership
    and helps identify trends that impact business forecasting accuracy.
    """
```

## Acceptable Magic Values in Tests

### When Magic Values Are Acceptable

Magic values are acceptable in tests when they:

1. **Have clear explanatory comments**:
   ```python
   expected_line_count = 4  # Header + 3 data rows
   expected_tab_count = 3   # 4 columns = 3 tabs
   ```

2. **Are part of test data setup**:
   ```python
   test_amounts = [100.0, 200.0, 300.0]  # Sample premium amounts
   quarters = ["Q1 2024", "Q2 2024"]     # Test quarterly periods
   ```

3. **Have good assertion messages that explain the context**:
   ```python
   assert len(results) == 5, (
       f"Expected 5 quarterly results (Q1-Q4 + annual) but got {len(results)}"
   )
   ```

### When to Extract Constants

Extract constants when values:
- Appear multiple times across tests
- Represent important business rules
- Are used in both test setup and assertions

```python
# Good: Extract frequently used business values
MIN_PREMIUM_AMOUNT = 50.0
MAX_QUARTERLY_VARIANCE_PERCENT = 15.0
REQUIRED_EXCEL_COLUMNS = ["Contract", "Premium", "Effective_Date"]
```

## Test Data Management

### 1. Use Test Data Generators

Create reusable test data generators for complex scenarios:

```python
class TestDataGenerator:
    @staticmethod
    def create_financial_scenario(
        scenario: str,
        num_contracts: int = 3,
        num_quarters: int = 4
    ) -> tuple[pl.LazyFrame, pl.LazyFrame, pl.LazyFrame, list[str]]:
        """Generate realistic test data for financial analysis scenarios."""
```

### 2. Make Test Data Representative

Test data should reflect real-world patterns and edge cases:

```python
# Good: Realistic test data with business context
contracts = ["Acme Corp", "Beta Industries", "Gamma Solutions"]
premium_amounts = [125000.50, 89750.25, 234567.89]  # Realistic dollar amounts
dates = ["2024-01-01", "2024-04-01", "2024-07-01"]  # Quarterly start dates

# Bad: Overly simplified test data
contracts = ["A", "B", "C"]
amounts = [1, 2, 3]
dates = ["1", "2", "3"]
```

## Error Testing Standards

### 1. Test Error Messages, Not Just Exceptions

Verify that error messages provide actionable guidance:

```python
def test_operations_team_gets_clear_errors_for_missing_excel_files(self):
    with pytest.raises(FileNotFoundError) as exc_info:
        export_excel_to_tsv(excel_path=missing_file, output_dir=output_dir)
    
    error_message = str(exc_info.value)
    assert "Excel file not found" in error_message, (
        f"Error message should mention 'Excel file not found'. Got: '{error_message}'"
    )
    assert str(missing_file) in error_message, (
        f"Error message should include the missing file path. Got: '{error_message}'"
    )
```

### 2. Verify Error Context

Ensure error messages include enough context for troubleshooting:

```python
# Good: Validates helpful error context
assert "Unable to process file" in error_message
assert str(problematic_file_path) in error_message
assert "Sheet 'InvalidSheet' not found" in error_message

# Bad: Only checks that an error occurred
with pytest.raises(ValueError):
    process_invalid_file(bad_file)
```

## Summary

Following these BDD testing standards ensures that:

- Tests clearly communicate business value and user needs
- Test failures provide actionable debugging information
- Tests remain maintainable as the codebase evolves
- New team members can understand test intent and context
- Tests serve as living documentation of system behavior
- **Tests function as a complete, executable specification of the system**

Remember: **BDD tests are not just for catching bugs—they're a well-defined specification that describes exactly how the system should behave from a user's perspective.** When written properly, they provide the same clarity as traditional specification documents, but with the added benefit of being automatically verified on every test run.
