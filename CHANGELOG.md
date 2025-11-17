# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Modern ES6+ architecture with async/await
- Professional CLI with commander.js, ora spinners, and chalk colors
- Robust crawler with retry logic and exponential backoff
- Safe VM-based data conversion (replacing unsafe eval/require)
- Multi-source configuration (environment variables, config files, CLI arguments)
- Comprehensive input validation and sanitization
- Structured logging with Winston
- 45 unit tests with Jest (100% pass rate)
- ESLint with strict rules (zero errors)
- Prettier for consistent code formatting
- GitHub Actions CI/CD pipeline
- TypeScript type definitions
- Pre-commit hooks with Husky
- Project philosophy documentation (CLAUDE.md)
- Comprehensive README with examples
- JSDoc comments on all public functions
- Example configuration files (.env.example, config.example.json)

### Changed
- **BREAKING**: Minimum Node.js version is now 18.0.0
- **BREAKING**: Project structure reorganized (all code in src/)
- **BREAKING**: Configuration format updated to support new features
- Updated README with modern documentation
- Improved error messages with helpful context

### Security
- Added path traversal protection
- Added input sanitization for all user data
- Replaced eval/require with safe VM module parsing
- Environment variable support (no hardcoded credentials)

### Performance
- Implemented retry logic with exponential backoff (2s, 4s, 8s, 16s)
- Added rate limiting to respect server resources
- Optimized file operations with atomic writes

## [1.0.0] - 2016-11-24

### Added
- Initial release
- Basic bash script crawler (crawl.sh)
- Simple JavaScript converter (convert_raw_to_json.js)
- Basic documentation

[Unreleased]: https://github.com/duyetdev/google-finance-news-crawler/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/duyetdev/google-finance-news-crawler/releases/tag/v1.0.0
