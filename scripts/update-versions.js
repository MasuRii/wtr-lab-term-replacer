#!/usr/bin/env node

/**
 * Build-time version injection script
 * This script reads the centralized version and updates all necessary files
 */

const fs = require('fs');
const path = require('path');
const { versionManager, VERSION_INFO } = require('../config/versions.js');

class BuildVersionInjector {
  constructor() {
    this.versionInfo = versionManager.getAllVersionInfo();
    this.rootDir = path.resolve(__dirname, '..');
  }

  /**
   * Update package.json with current version
   */
  updatePackageJson() {
    const packagePath = path.join(this.rootDir, 'package.json');
    
    try {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const oldVersion = packageData.version;
      
      // Update version
      packageData.version = this.versionInfo.NPM;
      
      // Update main field filename if it contains version
      if (packageData.main && packageData.main.includes('WTR Lab Term Replacer')) {
        const fileName = packageData.main.split('-')[0];
        packageData.main = `${fileName}-${this.versionInfo.NPM}.user.js`;
      }
      
      // Write updated package.json
      fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
      
      console.log(`✅ Updated package.json: ${oldVersion} → ${this.versionInfo.NPM}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update package.json:`, error.message);
      return false;
    }
  }

  /**
   * Update README.md badge version
   */
  updateReadme() {
    const readmePath = path.join(this.rootDir, 'README.md');
    
    try {
      let readmeContent = fs.readFileSync(readmePath, 'utf8');
      const oldVersion = readmeContent.match(/version-([\d.]+)-blue\.svg/);
      
      if (oldVersion) {
        readmeContent = readmeContent.replace(
          /version-[\d.]+-blue\.svg/,
          `version-${this.versionInfo.BADGE}-blue.svg`
        );
        
        fs.writeFileSync(readmePath, readmeContent);
        console.log(`✅ Updated README.md badge: ${oldVersion[1]} → ${this.versionInfo.BADGE}`);
        return true;
      } else {
        console.log('⚠️  No version badge found in README.md');
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to update README.md:`, error.message);
      return false;
    }
  }

  /**
   * Update GreasyForkREADME.md version references
   */
  updateGreasyForkReadme() {
    const greasyForkPath = path.join(this.rootDir, 'GreasyForkREADME.md');
    
    try {
      let content = fs.readFileSync(greasyForkPath, 'utf8');
      let updated = false;
      
      // Update title version
      const titleMatch = content.match(/# WTR Lab Term Replacer v([\d.]+)/);
      if (titleMatch) {
        content = content.replace(
          /# WTR Lab Term Replacer v[\d.]+/,
          `# WTR Lab Term Replacer ${this.versionInfo.DISPLAY}`
        );
        console.log(`✅ Updated GreasyForkREADME.md title: v${titleMatch[1]} → ${this.versionInfo.DISPLAY}`);
        updated = true;
      }
      
      // Update badge version
      const badgeMatch = content.match(/version-([\d.]+)-blue\.svg/);
      if (badgeMatch) {
        content = content.replace(
          /version-[\d.]+-blue\.svg/,
          `version-${this.versionInfo.BADGE}-blue.svg`
        );
        console.log(`✅ Updated GreasyForkREADME.md badge: ${badgeMatch[1]} → ${this.versionInfo.BADGE}`);
        updated = true;
      }
      
      // Update installation link version
      const installMatch = content.match(/WTR%20Lab%20Term%20Replacer-([\d.]+)\.user\.js/);
      if (installMatch) {
        content = content.replace(
          /WTR%20Lab%20Term%20Replacer-[\d.]+\.user\.js/,
          `WTR%20Lab%20Term%20Replacer-${this.versionInfo.NPM}.user.js`
        );
        console.log(`✅ Updated GreasyForkREADME.md installation link: ${installMatch[1]} → ${this.versionInfo.NPM}`);
        updated = true;
      }
      
      if (updated) {
        fs.writeFileSync(greasyForkPath, content);
        return true;
      } else {
        console.log('⚠️  No version references found in GreasyForkREADME.md');
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to update GreasyForkREADME.md:`, error.message);
      return false;
    }
  }

  /**
   * Generate banner for build output files
   */
  generateBanner() {
    const currentDate = new Date().toISOString().split('T')[0];
    
    return `/**
 * WTR Lab Term Replacer - ${this.versionInfo.DISPLAY}
 * Generated on ${currentDate}
 * 
 * A modular, Webpack-powered version of the WTR Lab Term Replacer userscript.
 * For updates and documentation, visit the project repository.
 */`;
  }

  /**
   * Generate userscript header
   */
  generateUserscriptHeader(target = 'default') {
    const version = versionManager.getVersionForTarget(target);
    const currentDate = new Date().toISOString().split('T')[0];
    
    return `// ==UserScript==
// @name         WTR Lab Term Replacer
// @description  A modular, Webpack-powered version of the WTR Lab Term Replacer userscript.
// @version      ${version}
// @author       MasuRii
// @match        *://*/*
// @match        *://*/*/*
// @match        *://*/*/*/*
// @grant        none
// @run-at       document-start
// @homepageURL  https://github.com/MasuRii/wtr-lab-term-replacer-webpack
// @supportURL   https://github.com/MasuRii/wtr-lab-term-replacer-webpack/issues
// @updateURL    https://raw.githubusercontent.com/MasuRii/wtr-lab-term-replacer-webpack/main/dist/wtr-lab-term-replacer.${target}.user.js
// @downloadURL  https://raw.githubusercontent.com/MasuRii/wtr-lab-term-replacer-webpack/main/dist/wtr-lab-term-replacer.${target}.user.js
// @namespace    masurii.userscripts
// ==/UserScript==

/**
 * WTR Lab Term Replacer v${version}
 * Generated on ${currentDate}
 * 
 * A modular, Webpack-powered version of the WTR Lab Term Replacer userscript.
 * For updates and documentation, visit: https://github.com/MasuRii/wtr-lab-term-replacer-webpack
 * 
 * This userscript replaces academic terms with their industry counterparts.
 * It provides a comprehensive mapping system for better understanding
 * of academic vs industry terminology.
 */
`;
  }

  /**
   * Generate meta file content
   */
  generateMetaContent(target = 'default') {
    const version = versionManager.getVersionForTarget(target);
    
    return `// @description A modular, Webpack-powered version of the WTR Lab Term Replacer userscript.
// @version ${version}
// @author MasuRii
// @namespace masurii.userscripts`;
  }

  /**
   * Run all update operations
   */
  updateAll() {
    console.log('🚀 Starting version update process...');
    console.log(`📦 Current version: ${this.versionInfo.DISPLAY}`);
    console.log('');
    
    let success = true;
    
    // Update source files
    success &= this.updatePackageJson();
    success &= this.updateReadme();
    success &= this.updateGreasyForkReadme();
    
    if (success) {
      console.log('');
      console.log('✅ All version updates completed successfully!');
      console.log('📝 Remember to update CHANGELOG.md manually if needed');
      console.log('🚀 Ready to build!');
    } else {
      console.log('');
      console.log('❌ Some updates failed. Please check the errors above.');
      process.exit(1);
    }
  }

  /**
   * Get version for webpack
   */
  getVersionForWebpack() {
    return {
      semantic: this.versionInfo.SEMANTIC,
      display: this.versionInfo.DISPLAY,
      npm: this.versionInfo.NPM,
      greasyfork: this.versionInfo.GREASYFORK,
      major: this.versionInfo.META.MAJOR,
      minor: this.versionInfo.META.MINOR,
      patch: this.versionInfo.META.PATCH
    };
  }
}

// CLI interface
if (require.main === module) {
  const injector = new BuildVersionInjector();
  
  const args = process.argv.slice(2);
  const command = args[0] || 'update';
  
  switch (command) {
    case 'update':
      injector.updateAll();
      break;
    case 'version':
      console.log(injector.getVersionForWebpack());
      break;
    case 'banner':
      console.log(injector.generateBanner());
      break;
    case 'header':
      const target = args[1] || 'default';
      console.log(injector.generateUserscriptHeader(target));
      break;
    default:
      console.log('Usage: node scripts/update-versions.js [command]');
      console.log('Commands:');
      console.log('  update  - Update all version references (default)');
      console.log('  version - Get version info for webpack');
      console.log('  banner  - Generate build banner');
      console.log('  header  - Generate userscript header');
  }
}

module.exports = BuildVersionInjector;