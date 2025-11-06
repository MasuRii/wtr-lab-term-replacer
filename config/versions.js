/**
 * Centralized Version Management System
 * 
 * This file serves as the single source of truth for all version information.
 * When updating versions, only edit this file - all other references will be
 * automatically updated during the build process.
 * 
 * Environment variable support:
 * - WTR_VERSION: Override version (e.g., "1.0.0")
 * - WTR_BUILD_ENV: Override build environment
 * - WTR_BUILD_DATE: Override build date (ISO format)
 */

/**
 * Current version information
 * Update this object when releasing a new version
 * 
 * Environment variables take precedence if set
 */
const envVersion = process.env.WTR_VERSION;
const envBuildEnv = process.env.WTR_BUILD_ENV || 'production';
const envBuildDate = process.env.WTR_BUILD_DATE;

const VERSION_INFO = {
  // Semantic version (MAJOR.MINOR.PATCH) - can be overridden by WTR_VERSION
  SEMANTIC: envVersion || '5.4.1',
  
  // Human-readable version display
  DISPLAY: `v${envVersion || '5.4.1'}`,
  
  // Build metadata - can be overridden by environment variables
  BUILD_DATE: envBuildDate || '2025-11-06',
  BUILD_ENV: envBuildEnv,
  
  // GreasyFork specific version (can differ from semantic)
  GREASYFORK: envVersion || '5.4.1',
  
  // NPM version
  NPM: envVersion || '5.4.1',
  
  // Badge version for README
  BADGE: envVersion || '5.4.1',
  
  // Changelog version
  CHANGELOG: envVersion || '5.4.1',
  
  // Additional metadata
  META: {
    MAJOR: parseInt((envVersion || '5.4.1').split('.')[0]),
    MINOR: parseInt((envVersion || '5.4.1').split('.')[1]),
    PATCH: parseInt((envVersion || '5.4.1').split('.')[2]),
    PRE_RELEASE: null, // e.g., 'alpha', 'beta', 'rc.1'
    BUILD_METADATA: null // e.g., 'build.123'
  }
};

/**
 * Version validation and utility functions
 */
class VersionManager {
  constructor() {
    this.currentVersion = VERSION_INFO;
  }

  /**
   * Get semantic version (e.g., "1.2.3")
   */
  getSemanticVersion() {
    return this.currentVersion.SEMANTIC;
  }

  /**
   * Get display version (e.g., "v1.2.3")
   */
  getDisplayVersion() {
    return this.currentVersion.DISPLAY;
  }

  /**
   * Get NPM version
   */
  getNpmVersion() {
    return this.currentVersion.NPM;
  }

  /**
   * Get GreasyFork version
   */
  getGreasyforkVersion() {
    return this.currentVersion.GREASYFORK;
  }

  /**
   * Get badge version for README
   */
  getBadgeVersion() {
    return this.currentVersion.BADGE;
  }

  /**
   * Get changelog version
   */
  getChangelogVersion() {
    return this.currentVersion.CHANGELOG;
  }

  /**
   * Get build metadata
   */
  getBuildMetadata() {
    return {
      buildDate: this.currentVersion.BUILD_DATE,
      buildEnv: this.currentVersion.BUILD_ENV,
      version: this.currentVersion.SEMANTIC
    };
  }

  /**
   * Get full version object
   */
  getAllVersionInfo() {
    return { ...this.currentVersion };
  }

  /**
   * Update version information
   * This should be called when preparing a new release
   */
  updateVersion(newVersion) {
    const parts = newVersion.split('.');
    if (parts.length !== 3) {
      throw new Error('Version must be in semantic format MAJOR.MINOR.PATCH');
    }

    const [major, minor, patch] = parts.map(Number);
    
    this.currentVersion.SEMANTIC = newVersion;
    this.currentVersion.DISPLAY = `v${newVersion}`;
    this.currentVersion.NPM = newVersion;
    this.currentVersion.GREASYFORK = newVersion;
    this.currentVersion.BADGE = newVersion;
    this.currentVersion.CHANGELOG = newVersion;
    this.currentVersion.META = {
      MAJOR: major,
      MINOR: minor,
      PATCH: patch,
      PRE_RELEASE: null,
      BUILD_METADATA: null
    };

    return this.getAllVersionInfo();
  }

  /**
   * Validate version format
   */
  validateVersion(version) {
    const semanticVersionRegex = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
    return semanticVersionRegex.test(version);
  }

  /**
   * Get version for different targets
   */
  getVersionForTarget(target) {
    const targetMap = {
      'npm': this.getNpmVersion(),
      'greasyfork': this.getGreasyforkVersion(),
      'badge': this.getBadgeVersion(),
      'changelog': this.getChangelogVersion(),
      'default': this.getSemanticVersion()
    };

    return targetMap[target] || targetMap.default;
  }

  /**
   * Check if version is from environment override
   */
  isEnvironmentOverride() {
    return Boolean(process.env.WTR_VERSION);
  }

  /**
   * Get environment info
   */
  getEnvironmentInfo() {
    return {
      versionOverride: process.env.WTR_VERSION || null,
      buildEnvOverride: process.env.WTR_BUILD_ENV || null,
      buildDateOverride: process.env.WTR_BUILD_DATE || null,
      isOverride: this.isEnvironmentOverride()
    };
  }
}

// Create singleton instance
const versionManager = new VersionManager();

// Export both the current version and the manager instance
module.exports = {
  VERSION_INFO: versionManager.getAllVersionInfo(),
  versionManager,
  // Convenience exports
  getVersion: () => versionManager.getSemanticVersion(),
  getDisplayVersion: () => versionManager.getDisplayVersion(),
  getNpmVersion: () => versionManager.getNpmVersion(),
  getGreasyforkVersion: () => versionManager.getGreasyforkVersion(),
  getBadgeVersion: () => versionManager.getBadgeVersion(),
  getChangelogVersion: () => versionManager.getChangelogVersion(),
  getBuildMetadata: () => versionManager.getBuildMetadata(),
  // Environment support
  isEnvironmentOverride: () => versionManager.isEnvironmentOverride(),
  getEnvironmentInfo: () => versionManager.getEnvironmentInfo()
};