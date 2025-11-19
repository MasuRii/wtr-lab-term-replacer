# WTR Lab Term Replacer

[![Version](https://img.shields.io/badge/version-5.4.4-blue.svg)](https://github.com/MasuRii/wtr-lab-term-replacer-webpack)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow.svg)](#)
[![Webpack](https://img.shields.io/badge/Webpack-5.x-orange.svg)](#)

A modular, Webpack-powered version of the WTR Lab Term Replacer userscript. Features a dual-build system for performance and GreasyFork compliance, hot-reloading for development, and a modern, maintainable JavaScript codebase.

## 🎯 Project Overview

WTR Lab Term Replacer is an advanced userscript that enhances the reading experience on WTR-Lab.com by providing intelligent text replacement functionality. The project has been refactored from a monolithic structure to a modern modular architecture using Webpack 5, enabling better maintainability, testability, and development workflow.

### Key Technical Features

- **🏗️ Modular Architecture**: Clean separation of concerns with ES6 modules
- **⚡ Dual Build System**: Optimized builds for performance and GreasyFork compatibility
- **🔥 Hot Module Replacement**: Real-time development with webpack-dev-server
- **🔧 Modern JavaScript**: ES6+ features with Babel transpilation
- **📱 Responsive UI**: Mobile-first design with Bootstrap CSS variables
- **🛡️ Robust Error Handling**: Comprehensive error recovery and logging
- **🔄 Multi-Script Coordination**: Intelligent handling of script conflicts
- **💾 Advanced State Management**: Persistent storage with session recovery

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher) or **yarn**
- **Modern browser** with userscript support

### Installation

```bash
# Clone the repository
git clone https://github.com/MasuRii/wtr-lab-term-replacer-webpack.git
cd wtr-lab-term-replacer-webpack

# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build
```

## 🏗️ Architecture

### Module Structure

```
src/
├── index.js              # Main entry point
├── modules/
│   ├── config.js         # Configuration constants
│   ├── engine.js         # Core replacement engine
│   ├── ui.js            # User interface management
│   ├── handlers.js      # Event handlers and utilities
│   ├── state.js         # Global state management
│   ├── storage.js       # Data persistence layer
│   ├── observer.js      # DOM observation and content detection
│   ├── duplicates.js    # Duplicate detection algorithms
│   └── utils.js         # Utility functions
```

### Core Components

#### 1. **Engine Module** (`src/modules/engine.js`)
The heart of the replacement system featuring:
- Intelligent text node traversal and aggregation
- Optimized pattern matching with regex compilation
- Conflict resolution for overlapping matches
- Robust error handling with retry mechanisms

#### 2. **State Management** (`src/modules/state.js`)
Centralized state handling including:
- Global settings and user preferences
- Novel-specific configurations
- Session persistence and recovery
- Inter-module state synchronization

#### 3. **UI Module** (`src/modules/ui.js`)
Responsive user interface with:
- Bootstrap-based responsive design
- Dynamic content rendering
- Modal dialogs and floating controls
- Mobile-optimized interactions

#### 4. **Storage Layer** (`src/modules/storage.js`)
Data persistence featuring:
- GM_* API abstraction
- Cross-novel data isolation
- Backup and recovery mechanisms
- Import/export functionality

## 🔧 Development Workflow

### Build System

The project uses a sophisticated webpack configuration with multiple build targets:

```bash
# Development with hot reload
npm run dev

# Performance-optimized build
npm run build:performance

# GreasyFork-compatible build
npm run build:greasyfork

# Build all targets
npm run build
```

### Webpack Configurations

#### `config/webpack.common.js`
- Base configuration shared across all builds
- Babel transpilation with `@babel/preset-env`
- Module resolution and bundling

#### `config/webpack.dev.js`
- Development server with hot module replacement
- Source maps for debugging
- Optimized for rapid development

#### `config/webpack.performance.js`
- Production-optimized bundle
- Minification and tree shaking
- Performance monitoring

#### `config/webpack.greasyfork.js`
- GreasyFork compliance optimizations
- Metadata header injection
- Content policy adherence

## 🛠️ Development Guidelines

### Code Style

- **ES6+ Modules**: Use modern JavaScript module syntax
- **Async/Await**: Prefer over callbacks and promises
- **Error Handling**: Comprehensive try-catch blocks with meaningful messages
- **Logging**: Structured logging with configurable levels
- **Documentation**: JSDoc comments for complex functions

### Module Guidelines

```javascript
// Good: Clear module boundaries
export async function performReplacements(targetElement) {
  // Implementation with proper error handling
}

// Good: Comprehensive error handling
try {
  const result = await complexOperation();
  return result;
} catch (error) {
  log(globalSettings, 'Operation failed:', error);
  throw new ProcessingError('Failed to perform replacements', error);
}
```

### State Management

- **Immutable Updates**: Always create new state objects
- **Validation**: Validate state transitions
- **Persistence**: Sync critical state to storage
- **Recovery**: Implement state recovery mechanisms

## 🧪 Testing

### Manual Testing Checklist

- [ ] Basic term replacement functionality
- [ ] Case-sensitive and case-insensitive matching
- [ ] Regular expression pattern support
- [ ] Whole word matching
- [ ] Import/export operations
- [ ] Duplicate detection
- [ ] Mobile responsiveness
- [ ] Error recovery scenarios
- [ ] Cross-novel data isolation

### Debug Mode

Enable detailed logging through the Tampermonkey menu:
```
Tampermonkey Menu → Toggle Logging
```

This provides comprehensive debugging information including:
- DOM manipulation tracking
- State change monitoring
- Performance metrics
- Error stack traces

## 📊 Performance Optimizations

### Algorithm Efficiency

- **Pattern Compilation**: Pre-compile regex patterns for repeated use
- **Text Node Aggregation**: Minimize DOM queries through intelligent batching
- **Conflict Resolution**: O(n log n) algorithm for overlap resolution
- **Caching**: Cache processed text nodes to avoid reprocessing

### Memory Management

- **WeakMap Usage**: Leverage WeakMap for automatic garbage collection
- **DOM Cleanup**: Proper event listener removal
- **Processing Queue**: Limit concurrent operations to prevent memory bloat

### Network Optimization

- **Lazy Loading**: Defer non-critical operations
- **Batch Operations**: Group multiple storage operations
- **Progressive Enhancement**: Graceful degradation for slow networks

## 🔒 Security Considerations

### Data Protection

- **Local Storage Only**: No external data transmission
- **Input Sanitization**: Validate all user inputs
- **XSS Prevention**: Escape output in dynamic content
- **CSP Compliance**: Compatible with Content Security Policy

### Userscript Security

- **Minimal Permissions**: Only request necessary browser permissions
- **Safe DOM Manipulation**: Avoid dangerous innerHTML usage
- **Event Handler Security**: Sanitize event data
- **Storage Validation**: Validate all stored data

## 🚀 Deployment

### Build Process

1. **Clean Build**: Remove previous build artifacts
2. **Dependency Check**: Verify all dependencies are resolved
3. **Code Quality**: Run linting and type checks
4. **Bundle Optimization**: Apply production optimizations
5. **Metadata Injection**: Add userscript headers
6. **Validation**: Verify build output integrity

### Release Process

1. **Version Bump**: Update version in package.json
2. **Changelog Update**: Document changes in CHANGELOG.md
3. **Build Verification**: Test both build targets
4. **Documentation Update**: Ensure README is current
5. **Tag Release**: Create Git tag for the version

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the coding guidelines
4. Test thoroughly across different scenarios
5. Commit with clear messages: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Submit a pull request

### Contribution Guidelines

- **Clear PR Description**: Explain the feature/fix and testing performed
- **Code Quality**: Follow existing patterns and maintain consistency
- **Documentation**: Update relevant documentation for new features
- **Testing**: Include manual testing scenarios in PR description
- **Backward Compatibility**: Maintain compatibility with existing userscripts

### Bug Reports

When reporting bugs, include:
- Browser and version information
- Steps to reproduce the issue
- Expected vs actual behavior
- Console error messages (if any)
- Screenshot or screen recording if relevant

## 📋 API Reference

### Core Functions

#### `performReplacements(targetElement)`
Executes term replacement on a DOM element.

```javascript
// Parameters
targetElement: HTMLElement - The DOM element to process

// Returns
Promise<void> - Resolves when processing is complete
```

#### `createUI()`
Initializes the user interface.

```javascript
// Returns
void - UI is appended to document body
```

#### `handleSaveTerm()`
Processes term creation/updates.

```javascript
// Parameters
None - Reads from form elements

// Returns
Promise<void> - Resolves when term is saved
```

### State Management

#### `state.terms`
Array of term definitions for the current novel.

#### `state.settings`
Configuration object including:
- `isDisabled`: Boolean - Master enable/disable switch
- Other novel-specific settings

#### `state.globalSettings`
Global configuration including:
- `isLoggingEnabled`: Boolean - Enable detailed logging

## 🐛 Known Issues

- **Large Novels**: Very large term lists (>1000 terms) may experience slower performance
- **Mobile Safari**: Some users report issues with text selection on iOS Safari
- **Multiple Scripts**: In rare cases, conflicts with other userscripts may occur

## 🔄 Migration from v4.x

The v5.4 release includes breaking changes:

1. **Data Format**: Updated to v5.4 format for improved compatibility
2. **Storage Keys**: Changed to use novel slug-based isolation
3. **API Changes**: Some internal APIs have been refactored for better performance

### Migration Steps

1. **Backup Data**: Export all terms before updating
2. **Clean Install**: Remove old script version
3. **Install v5.4**: Install the new version
4. **Import Data**: Use the import feature to restore your terms

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WTR-Lab.com**: The platform that inspired this enhancement
- **Webpack Community**: For the excellent build tooling
- **Contributors**: All developers who have contributed to the project
- **Users**: The community providing feedback and bug reports

## 📞 Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/MasuRii/wtr-lab-term-replacer-webpack/issues)
- **Documentation**: This README and inline code comments
- **Community**: WTR-Lab.com community forums

---

**Happy coding!** 🚀

*This project is actively maintained and welcomes contributions from the developer community.*
