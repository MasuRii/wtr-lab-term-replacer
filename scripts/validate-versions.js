#!/usr/bin/env node

/**
 * Version validation script
 * Ensures version consistency across all files and validates format
 */

const fs = require('fs');
const path = require('path');
const semver = require('semver');
const { versionManager, VERSION_INFO } = require('../config/versions.js');

class VersionValidator {
  constructor() {
    this.versionInfo = versionManager.getAllVersionInfo();
    this.rootDir = path.resolve(__dirname, '..');
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate semantic version format
   */
  validateVersionFormat() {
    const formats = [
      { name: 'semantic', version: this.versionInfo.SEMANTIC },
      { name: 'npm', version: this.versionInfo.NPM },
      { name: 'greasyfork', version: this.versionInfo.GREASYFORK },
      { name: 'badge', version: this.versionInfo.BADGE },
      { name: 'changelog', version: this.versionInfo.CHANGELOG }
    ];

    formats.forEach(({ name, version }) => {
      if (!semver.valid(version)) {
        this.errors.push(`Invalid semantic version for ${name}: "${version}"`);
      }
    });

    // Check that all versions are consistent
    const uniqueVersions = new Set([
      this.versionInfo.SEMANTIC,
      this.versionInfo.NPM,
      this.versionInfo.GREASYFORK,
      this.versionInfo.BADGE,
      this.versionInfo.CHANGELOG
    ]);

    if (uniqueVersions.size > 1) {
      this.warnings.push(`Version inconsistency detected: ${Array.from(uniqueVersions).join(', ')}`);
    }
  }

  /**
   * Validate package.json consistency
   */
  validatePackageJson() {
    try {
      const packagePath = path.join(this.rootDir, 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      if (packageData.version !== this.versionInfo.NPM) {
        this.errors.push(`Package.json version (${packageData.version}) doesn't match centralized version (${this.versionInfo.NPM})`);
      }

      // Check main field consistency
      if (packageData.main && packageData.main.includes('WTR Lab Term Replacer')) {
        const expectedMain = `WTR Lab Term Replacer-${this.versionInfo.NPM}.user.js`;
        if (packageData.main !== expectedMain) {
          this.warnings.push(`Package.json main field (${packageData.main}) might need update to (${expectedMain})`);
        }
      }
    } catch (error) {
      this.errors.push(`Failed to read package.json: ${error.message}`);
    }
  }

  /**
   * Validate README badge consistency
   */
  validateReadme() {
    try {
      const readmePath = path.join(this.rootDir, 'README.md');
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      const badgeMatch = readmeContent.match(/version-([\d.]+)-blue\.svg/);
      if (badgeMatch) {
        const badgeVersion = badgeMatch[1];
        if (badgeVersion !== this.versionInfo.BADGE) {
          this.warnings.push(`README badge version (${badgeVersion}) doesn't match centralized version (${this.versionInfo.BADGE})`);
        }
      } else {
        this.warnings.push('No version badge found in README.md');
      }
    } catch (error) {
      this.warnings.push(`Failed to read README.md: ${error.message}`);
    }
  }

  /**
   * Validate build configurations
   */
  validateWebpackConfigs() {
    const configs = [
      'config/webpack.dev.js',
      'config/webpack.performance.js',
      'config/webpack.greasyfork.js'
    ];

    configs.forEach(configFile => {
      try {
        const configPath = path.join(this.rootDir, configFile);
        const configContent = fs.readFileSync(configPath, 'utf8');
        
        // Check for hardcoded version references
        const versionPatterns = [
          /version['":\s]+['"]?(\d+\.\d+\.\d+)['"]?/g,
          /filename['":\s]+['"]?[^'"]*(\d+\.\d+\.\d+)[^'"]*['"]?/g
        ];

        versionPatterns.forEach(pattern => {
          const matches = configContent.match(pattern);
          if (matches) {
            this.warnings.push(`Potential hardcoded version found in ${configFile}: ${matches.join(', ')}`);
          }
        });
      } catch (error) {
        this.warnings.push(`Failed to read ${configFile}: ${error.message}`);
      }
    });
  }

  /**
   * Validate environment variable support
   */
  validateEnvironmentSupport() {
    // Check if environment variables are being used
    const envPattern = /process\.env\./g;
    
    try {
      const versionJsPath = path.join(this.rootDir, 'config/versions.js');
      const versionJsContent = fs.readFileSync(versionJsPath, 'utf8');
      
      if (envPattern.test(versionJsContent)) {
        console.log('✅ Environment variable support detected');
      }
    } catch (error) {
      // Silent fail - environment support is optional
    }
  }

  /**
   * Check for future-proofing features
   */
  checkFutureProofing() {
    // Check for script directory
    const scriptsDir = path.join(this.rootDir, 'scripts');
    if (fs.existsSync(scriptsDir)) {
      console.log('✅ Scripts directory exists for future extensions');
    } else {
      this.warnings.push('No scripts directory found - consider creating one for future extensions');
    }

    // Check for documentation
    const docFiles = ['VERSION_MANAGEMENT.md', 'README.md', 'Changelog.md'];
    const existingDocs = docFiles.filter(doc => fs.existsSync(path.join(this.rootDir, doc)));
    
    if (existingDocs.length === docFiles.length) {
      console.log('✅ Complete documentation suite found');
    } else {
      this.warnings.push(`Some documentation files missing: ${docFiles.filter(doc => !existingDocs.includes(doc)).join(', ')}`);
    }

    // Check npm scripts for version management
    try {
      const packagePath = path.join(this.rootDir, 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const versionScripts = Object.keys(packageData.scripts || {}).filter(key => key.includes('version'));
      
      if (versionScripts.length >= 3) {
        console.log('✅ Comprehensive version management scripts found');
      } else {
        this.warnings.push('Consider adding more version management scripts');
      }
    } catch (error) {
      this.warnings.push('Failed to check npm scripts');
    }
  }

  /**
   * Run all validations
   */
  validateAll() {
    console.log('🔍 Validating version system...\n');
    console.log(`📦 Current version: ${this.versionInfo.DISPLAY}`);
    console.log('');

    this.validateVersionFormat();
    this.validatePackageJson();
    this.validateReadme();
    this.validateWebpackConfigs();
    this.validateEnvironmentSupport();
    this.checkFutureProofing();

    // Report results
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ Version system validation passed successfully!');
      return true;
    }

    if (this.errors.length > 0) {
      console.log('❌ ERRORS FOUND:');
      this.errors.forEach(error => console.log(`  • ${error}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
      console.log('');
    }

    if (this.errors.length > 0) {
      console.log('🚫 Validation failed. Please fix the errors above.');
      return false;
    } else {
      console.log('✅ Validation passed with warnings. Review warnings if needed.');
      return true;
    }
  }

  /**
   * Get validation report as object
   */
  getReport() {
    return {
      version: this.versionInfo.DISPLAY,
      errors: this.errors,
      warnings: this.warnings,
      passed: this.errors.length === 0,
      timestamp: new Date().toISOString()
    };
  }
}

// CLI interface
if (require.main === module) {
  const validator = new VersionValidator();
  const success = validator.validateAll();
  
  if (!success) {
    process.exit(1);
  }
}

module.exports = VersionValidator;