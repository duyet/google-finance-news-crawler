# CLAUDE.md - Project Philosophy & Architecture

## Project Vision

The Google Finance News Crawler is a lean, elegant tool for extracting historical news data from Google Finance. It embodies the Unix philosophy: do one thing exceptionally well.

## Core Principles

### 1. Simplicity First

- Minimal dependencies
- Clear, readable code
- Easy to understand and modify
- No unnecessary abstractions

### 2. Reliability

- Comprehensive error handling
- Retry logic with exponential backoff
- Data validation at every step
- Graceful degradation

### 3. Data Integrity

- Validate all inputs
- Sanitize all outputs
- Deduplication of results
- Schema validation

### 4. Developer Experience

- Clear documentation
- Helpful error messages
- Consistent code style
- Comprehensive tests

## Architecture

### Components

#### 1. Crawler (`src/crawler.js`)

**Purpose**: Fetch news data from Google Finance API

**Responsibilities**:

- Date range iteration
- HTTP requests with proper headers
- Rate limiting to respect server resources
- Error handling and retry logic
- Progress reporting

**Design Decisions**:

- Uses native `node:https` to minimize dependencies
- Implements exponential backoff (2s, 4s, 8s, 16s)
- Saves raw data preserving original structure
- Non-blocking I/O for efficiency

#### 2. Converter (`src/converter.js`)

**Purpose**: Transform raw API responses into structured JSON

**Responsibilities**:

- Read all files from output directory
- Parse JavaScript module exports safely
- Extract and normalize news items
- Validate data structure
- Generate final JSON output

**Design Decisions**:

- Uses safer `vm` module instead of `require()` for untrusted code
- Implements schema validation
- Deduplicates entries by URL
- Preserves data provenance (timestamps, sources)

#### 3. CLI (`src/cli.js`)

**Purpose**: User-friendly command-line interface

**Responsibilities**:

- Argument parsing and validation
- Configuration loading
- Progress display
- Error reporting

**Design Decisions**:

- Uses `commander` for professional CLI experience
- Colorful output for better UX
- Interactive mode for ease of use
- Dry-run capability for safety

#### 4. Utilities (`src/utils/`)

**Purpose**: Reusable helper functions

**Modules**:

- `date-utils.js`: Date parsing, formatting, and iteration
- `logger.js`: Structured logging with levels
- `validator.js`: Input validation and sanitization
- `file-utils.js`: Safe file operations
- `retry.js`: Retry logic with backoff

### Data Flow

```
User Input
    ↓
CLI (argument parsing)
    ↓
Configuration Loading
    ↓
Crawler (fetch raw data)
    ↓
Output Directory (raw .js files)
    ↓
Converter (parse & transform)
    ↓
Validation
    ↓
Deduplication
    ↓
Final JSON Output
```

### Security Considerations

1. **Input Validation**
   - All dates validated against reasonable ranges
   - URL parameters sanitized
   - File paths validated to prevent traversal attacks

2. **Code Execution**
   - Never use `eval()` or unsafe `require()`
   - Use `vm` module with timeout for parsing
   - Validate data structure before processing

3. **Rate Limiting**
   - Respect server resources with delays
   - Implement exponential backoff
   - Maximum retry limits

4. **Error Information**
   - Never expose sensitive data in logs
   - Sanitize error messages
   - No stack traces in production

### Error Handling Strategy

1. **Network Errors**
   - Retry with exponential backoff
   - Log failed requests
   - Continue with remaining dates

2. **Parse Errors**
   - Skip malformed files
   - Log parse failures
   - Don't crash the entire process

3. **File System Errors**
   - Check permissions before writing
   - Handle disk full scenarios
   - Atomic writes to prevent corruption

4. **Validation Errors**
   - Report invalid data clearly
   - Continue processing valid entries
   - Summary report at end

### Testing Philosophy

1. **Unit Tests**
   - Test each function in isolation
   - Mock external dependencies
   - Cover edge cases and error paths

2. **Integration Tests**
   - Test component interactions
   - Use test fixtures for reproducibility
   - Verify data flow end-to-end

3. **Coverage Goals**
   - Minimum 80% code coverage
   - 100% coverage for critical paths
   - Test all error conditions

### Code Style

1. **Modern JavaScript**
   - ES6+ features (const/let, arrow functions, async/await)
   - Destructuring for clarity
   - Template literals for strings
   - Optional chaining and nullish coalescing

2. **Naming Conventions**
   - camelCase for variables and functions
   - PascalCase for classes
   - UPPER_SNAKE_CASE for constants
   - Descriptive names over brevity

3. **Function Design**
   - Single Responsibility Principle
   - Pure functions where possible
   - Max 50 lines per function
   - Clear input/output contracts

4. **Comments**
   - JSDoc for all public functions
   - Explain "why" not "what"
   - Keep comments up to date
   - Remove dead code instead of commenting out

### Performance Considerations

1. **Memory Management**
   - Stream large files instead of loading entirely
   - Clear references when done
   - Avoid memory leaks in loops

2. **I/O Optimization**
   - Batch file operations
   - Use async I/O throughout
   - Parallel processing where safe

3. **Network Optimization**
   - Reuse HTTP connections
   - Compress responses
   - Respect cache headers

### Maintenance

1. **Dependencies**
   - Minimize external dependencies
   - Audit dependencies regularly
   - Keep dependencies up to date
   - Pin versions for reproducibility

2. **Documentation**
   - Keep README current
   - Update CLAUDE.md with architectural changes
   - Document breaking changes
   - Provide migration guides

3. **Backwards Compatibility**
   - Semantic versioning
   - Deprecation warnings before removal
   - Support previous data formats

### Future Enhancements

1. **Potential Improvements**
   - Support for multiple stock symbols
   - Database storage option
   - Real-time crawling mode
   - Export to different formats (CSV, XML)
   - Web UI for visualization

2. **Performance Optimizations**
   - Parallel date range crawling
   - Incremental updates
   - Delta compression for storage
   - Caching layer

3. **Features**
   - Sentiment analysis
   - News categorization
   - Trend detection
   - Export to data analysis tools

### Contributing Guidelines

1. **Before Contributing**
   - Read this CLAUDE.md thoroughly
   - Check existing issues and PRs
   - Discuss major changes first

2. **Code Standards**
   - Follow existing code style
   - Write tests for new features
   - Update documentation
   - Pass all CI checks

3. **Pull Request Process**
   - Clear description of changes
   - Reference related issues
   - Include tests
   - Update CHANGELOG

### Debugging Tips

1. **Enable Debug Logging**

   ```bash
   DEBUG=* node src/cli.js crawl
   ```

2. **Dry Run Mode**

   ```bash
   node src/cli.js crawl --dry-run
   ```

3. **Validate Output**

   ```bash
   node src/cli.js validate output.json
   ```

4. **Common Issues**
   - Check API tokens are current
   - Verify network connectivity
   - Ensure output directory exists
   - Check file permissions

### Philosophy

This project believes in:

- **Clarity over cleverness**: Code should be obvious
- **Reliability over features**: It must work, always
- **Simplicity over complexity**: Solve the problem, nothing more
- **Documentation as code**: The code explains itself

We're not just crawling data; we're crafting a tool that respects both the user's time and the data's integrity. Every line of code should serve a clear purpose, every function should do one thing well, and every error should guide the user toward a solution.

This is not just a script—it's a statement about how software should be built: with intention, with care, and with respect for those who will use and maintain it.
