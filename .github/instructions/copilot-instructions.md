# Instructions for GitHub Copilot

These instructions guide how GitHub Copilot should assist developers working on this project.

## Project Context

This is a Chrome browser extension that automatically navigates to the Videos tab on YouTube channel pages. It's built with TypeScript, follows BDD testing principles, and uses Chrome Extension Manifest V3.

## Development Workflow with `.copilot/` Directory

The project uses a `.copilot/` directory for collaboration artifacts and development notes that should not be committed:

```
.copilot/
├── README.md                    # (committed - explains the directory)
├── TYPESCRIPT_MIGRATION.md      # (ignored - internal notes)
└── your-notes.md                # (ignored - add your own)
```

### What Should Go in `.copilot/`?

When assisting the developer, suggest creating files in `.copilot/` for:
- Design discussions and architecture decisions
- Migration notes and refactoring plans
- Development scripts and automation helpers
- Interview prep materials
- Temporary documentation during active development
- Planning documents for complex features

### What Gets Committed?

- ✅ **Committed**: `.copilot/README.md` (explains the directory to other developers)
- ❌ **Ignored**: All other `.copilot/` files (collaboration artifacts)

## Code Quality Requirements

### Architecture
- **Language**: TypeScript with strict mode
- **Target**: Chrome Extension Manifest V3
- **Build Process**: TypeScript compiles to `dist/` directory
- **Source**: `src/` contains TypeScript files
- **Tests**: `tests/` contains TypeScript test files

### Testing Philosophy - CRITICAL

**ALWAYS follow the BDD testing principles documented in [BDD_TESTING_STYLE_GUIDE.md](../../BDD_TESTING_STYLE_GUIDE.md):**

1. **Test Real Implementation** - Import and test actual functions from `src/`, never duplicate logic in tests
2. **Given-When-Then Structure** - Organize all tests with clear Given/When/Then comments
3. **User-Focused Test Names** - Use `user_does_something_format` describing behavior, not implementation
4. **Black Box Testing** - Test observable behavior from the user's perspective
5. **No Mocking Unless Necessary** - Test the real implementation; only mock external dependencies

**Before creating or modifying tests:**
- Read the BDD_TESTING_STYLE_GUIDE.md file
- Follow the examples provided
- Ensure tests import and call real implementation code
- Use descriptive Given-When-Then comments
- Name tests to describe user stories

### Code Quality Standards
- Always start with a BDD test describing the intention of the code to be implemented - it is expected that the test will fail initially
- Achieve green test status by implementing the minimum code required to pass the test
- Ensure all tests pass before finalizing any code changes
- TypeScript strict mode (`strict: true` in tsconfig.json)
- ESLint with TypeScript ESLint plugin
- 80% minimum code coverage - but aim for 100% as failure cases are part of what should be described in tests
- No console errors (console.log is acceptable for extension debugging)
- All code must pass: `npm test && npm run typecheck && npm run lint`

### Development Commands
```bash
npm run build         # Compile TypeScript to dist/
npm run build:watch   # Auto-compile on changes
npm test              # Run Jest with ts-jest
npm run test:watch    # Run tests in watch mode
npm run typecheck     # Type check without building
npm run lint          # Check code style
npm run lint:fix      # Auto-fix linting issues
```

## How to Assist Developers

### When Making Code Changes

1. **First write a design document** in `.copilot/` for complex features or refactors to discuss with the developer
2. **Always start with a BDD test** that describes the desired behavior
3. **Implement the minimum code** to make the test pass
4. **Run checks** after edits: Suggest running `npm test && npm run typecheck && npm run lint`
5. **Follow TypeScript best practices**: Explicit types, no `any`, proper return types
6. **Use tools efficiently**: Prefer `multi_replace_string_in_file` for multiple independent edits
7. **Prefer tools over terminal commands** when possible for efficiency and consistency

### When Creating Tests

1. **Read BDD_TESTING_STYLE_GUIDE.md first** if you haven't already
2. **Import real functions** from `src/` - never duplicate implementation in tests
3. **Follow Given-When-Then** structure with clear comments
4. **Use descriptive names**: `user_navigates_to_channel_format` not `test_regex_matching`
5. **Test behavior** not implementation details

### When Working on Complex Features

1. **Suggest creating planning docs** in `.copilot/` for:
   - Architecture decisions
   - Migration plans
   - Complex feature breakdowns
2. **Keep implementation notes** in `.copilot/` during development
3. **Reference existing patterns** from the codebase

### When Debugging

1. **Analyze error messages** thoroughly
2. **Check all quality gates**: tests, types, linting
3. **Suggest saving error context** to `.copilot/` for complex issues
4. **Look for similar patterns** in existing code

## File Organization Rules

- **Source code**: `src/*.ts` (TypeScript)
- **Compiled output**: `dist/*.js` (generated, not committed)
- **Tests**: `tests/*.test.ts` (TypeScript with Jest)
- **Collaboration notes**: `.copilot/*` (only README.md committed)
- **Extension assets**: `manifest.json`, `icons/`
- **Config files**: Root level (tsconfig.json, jest.config.js, etc.)

## Communication Style

- **Be concise** - Keep responses brief for simple tasks
- **Be thorough** - Provide detailed explanations for complex issues
- **Discuss design first** - Propose designs in `.copilot/` before coding, this is a collaborative process
- **No unnecessary framing** - Skip "I'll now do X" unless it adds value
- **Verify completion** - After edits, confirm tests pass and types check

## Critical Reminders

1. ⚠️ **NEVER duplicate implementation in tests** - Always import from `src/`
2. ⚠️ **ALWAYS follow BDD_TESTING_STYLE_GUIDE.md** for test structure and naming
3. ⚠️ **TypeScript strict mode** - No `any`, explicit types, proper return types
4. ⚠️ **Test real code** - Black box testing of actual implementation
5. ⚠️ **Use `.copilot/` for collaboration** - Keep work artifacts out of commits
