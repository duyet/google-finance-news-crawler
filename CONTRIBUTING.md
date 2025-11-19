# Contributing to Google Finance News Crawler

First off, thank you for considering contributing to Google Finance News Crawler! It's people like you that make this tool better for everyone.

## Code of Conduct

This project and everyone participating in it is governed by respect, professionalism, and kindness. By participating, you are expected to uphold these values.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if relevant**
- **Include your environment details** (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other tools if applicable**

### Pull Requests

1. **Fork the repository** and create your branch from `master`
2. **Follow the coding standards** outlined below
3. **Write tests** for your changes
4. **Ensure all tests pass** (`npm test`)
5. **Run linter** and fix any issues (`npm run lint:fix`)
6. **Format your code** (`npm run format`)
7. **Update documentation** as needed
8. **Use semantic commit messages** (see below)

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/google-finance-news-crawler.git
cd google-finance-news-crawler

# Install dependencies
npm install

# Create a branch for your feature
git checkout -b feat/my-awesome-feature

# Make your changes and test
npm test
npm run lint
```

## Coding Standards

### JavaScript Style Guide

We use ESLint and Prettier to maintain code quality:

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix

# Format code
npm run format
```

### Code Style Rules

- **ES6+ features**: Use modern JavaScript (const/let, arrow functions, async/await)
- **Async/await**: Prefer async/await over callbacks or raw promises
- **Error handling**: Always handle errors appropriately
- **Function size**: Keep functions under 50 lines when possible
- **Comments**: Use JSDoc for all public functions
- **Naming**: Use descriptive names (camelCase for variables, PascalCase for classes)

### Example of Good Code

```javascript
/**
 * Fetches news data for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} config - Crawler configuration
 * @returns {Promise<Object>} News data
 */
async function fetchNewsForDate(date, config) {
  try {
    const data = await makeRequest(url, headers);
    return processData(data);
  } catch (error) {
    logger.error(`Failed to fetch news for ${date}: ${error.message}`);
    throw error;
  }
}
```

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools
- **ci**: CI/CD configuration changes
- **security**: Security improvements

### Examples

```bash
feat(crawler): add retry logic with exponential backoff
fix(validator): handle null values in news items
docs(readme): update installation instructions
test(utils): add tests for date utilities
chore(deps): update dependencies to latest versions
```

### Breaking Changes

For breaking changes, add `!` after the type and include `BREAKING CHANGE:` in the footer:

```bash
feat!: migrate to ES6 modules

BREAKING CHANGE: Requires Node.js >= 18.0.0
```

## Testing

### Writing Tests

- Write tests for all new features
- Maintain or improve code coverage
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)

```javascript
describe('validateNewsItem', () => {
  test('validates correct news item', () => {
    // Arrange
    const item = {
      title: 'Test Title',
      url: 'https://example.com/news',
    };

    // Act
    const result = validateNewsItem(item);

    // Assert
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Documentation

- Update README.md if you change functionality
- Add JSDoc comments to all public functions
- Update CLAUDE.md if architectural changes are made
- Keep examples up to date

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
