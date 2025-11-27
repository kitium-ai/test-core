# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-24

### Added

- new exports added for reusable

## [0.1.0] - 2025-11-24

### Added

#### Utilities

- `retry()` - Retry operations with exponential backoff
- `waitUntil()` - Wait for conditions with polling
- `sleep()` - Simple sleep/delay utility
- `deepClone()` - Deep object cloning
- `deepMerge()` - Deep object merging
- `createDeferred()` - Deferred promise creation
- `sanitizeForLogging()` - Sensitive data sanitization

#### Data Generation

- `DataGenerators` - Comprehensive data generation utilities
  - String, number, email, UUID, boolean generators
  - Date and time generators
  - Address and location generators
  - User and company data generators
  - Array and object generators
  - Enum and weighted choice generators
  - JSON structure generators
- `createFactory()` - Factory function creator
- `createFactoryWithBuilder()` - Factory with relationships
- `Factories` - Pre-built factories for common entities
  - User, Post, Comment factories
  - Company, Product, Order factories
  - Todo, Article, Profile factories
  - API Response factory

#### Configuration

- `ConfigManager` - Configuration management class
- `createConfigManager()` - Create config manager instance
- `getConfigManager()` - Get global config manager
- `resetConfig()` - Reset global config
- Environment variable support
- Configuration merging and validation

#### Logging

- `Logger` - Structured logging class
- `createLogger()` - Create logger instance
- `LogLevel` enum - DEBUG, INFO, WARN, ERROR
- Context-aware logging
- Log filtering and retrieval
- Error logging with stack traces

### Features

- Full TypeScript support with comprehensive types
- Environment-aware configuration
- Sensitive data redaction
- Exponential backoff retry strategy
- Polling-based condition waiting
- Deep object operations
- Comprehensive test data generation

### Documentation

- Complete API documentation
- Usage examples
- TypeScript type definitions
- README with quick start guide
