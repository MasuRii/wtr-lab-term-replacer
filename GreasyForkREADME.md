# WTR Lab Term Replacer v5.4.1

![Version](https://img.shields.io/badge/version-5.4.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-WTR--Lab.com-lightgrey.svg)

## 🎯 What Does This Script Do?

**WTR Lab Term Replacer** is a powerful userscript that enhances your reading experience on [WTR-Lab.com](https://wtr-lab.com) by automatically replacing specified terms with your preferred alternatives as you read novels. Whether you want to standardize character names, fix translations, or replace inconsistent terminology, this script makes reading smoother and more enjoyable.

### ✨ Key Features

- **🔄 Smart Term Replacement**: Automatically replaces text as you read, with support for case-sensitive and case-insensitive matching
- **🎯 Whole Word Matching**: Option to match whole words only, preventing accidental replacements within other words
- **🔤 Regular Expression Support**: Advanced pattern matching for complex replacement rules
- **📱 Mobile-Friendly Interface**: Fully responsive design that works perfectly on desktop and mobile devices
- **💾 Import/Export Functionality**: Backup and share your term lists easily
- **🔍 Duplicate Detection**: Find and resolve conflicting or duplicate terms
- **⚡ Performance Optimized**: Fast processing with intelligent caching and retry mechanisms
- **🔧 Multi-Script Coordination**: Works seamlessly with other WTR Lab enhancement scripts

## 📥 Installation Guide

### Step 1: Install Tampermonkey

1. **For Chrome**: Install [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) from the Chrome Web Store
2. **For Firefox**: Install [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/) from Firefox Add-ons
3. **For Safari**: Install [Tampermonkey](https://apps.apple.com/app/tampermonkey/id1482490089) from the App Store
4. **For Edge**: Install [Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) from Microsoft Store

### Step 2: Install the Script

1. Click [here to install WTR Lab Term Replacer](WTR%20Lab%20Term%20Replacer-5.4.1.user.js) (this will open the script in Tampermonkey)
2. Click **"Install"** when prompted
3. The script is now active and ready to use!

### Step 3: Verify Installation

1. Visit any novel page on [WTR-Lab.com](https://wtr-lab.com)
2. Look for a **"Term Settings"** button in the chapter controls
3. Click it to open the term management interface
4. If you see the interface, installation was successful! 🎉

## 🚀 Getting Started

### Opening the Term Manager

**Method 1**: Click the "Term Settings" button that appears in chapter controls
**Method 2**: Use the Tampermonkey menu (click the Tampermonkey icon) and select "Term Replacer Settings"
**Method 3**: Right-click on selected text to quickly add it as a term

### Your First Term Replacement

1. **Open the Term Manager** using any method above
2. **Click "Add/Edit Term" tab**
3. **Enter the original text** you want to replace (e.g., "character name")
4. **Enter the replacement text** (e.g., "preferred name")
5. **Configure options**:
   - ✅ **Case Sensitive**: Check if you want exact case matching
   - 🔤 **Use Regex**: For advanced pattern matching
   - 📝 **Whole Word**: Only replace complete words
6. **Click "Save Term"**
7. **Navigate to a chapter** - your replacement will be applied automatically!

## 📖 User Interface Guide

### Main Interface Tabs

#### 📋 Terms List Tab
- **View all your terms** in an organized list
- **Search functionality** to quickly find specific terms
- **Pagination** for large term lists (100 terms per page)
- **Edit** terms by clicking the "Edit" button
- **Delete selected** terms using checkboxes
- **Find Duplicates** to identify conflicting terms

#### ➕ Add/Edit Term Tab
- **Original Text**: The text you want to replace
- **Replacement Text**: What you want to replace it with
- **Options**:
  - Case Sensitive: Match exact case
  - Use Regex: Enable regular expression patterns
  - Whole Word: Match only complete words

#### 💾 Import/Export Tab
- **Export Novel Terms**: Save terms for current novel
- **Export All Terms**: Backup all your terms across all novels
- **Export Both**: Download both current novel and all terms
- **Import to This Novel**: Load terms specifically for current novel
- **Import All (Global)**: Import terms for all novels

### Additional Features

#### 🎯 Quick Add from Selection
1. **Select text** in any chapter
2. **A floating "Add Term" button** appears
3. **Click it** to automatically populate the add form with your selection

#### 🔄 Enable/Disable All Replacements
- Use the **"Disable All" checkbox** in the header to temporarily turn off all replacements
- Useful for checking original text or troubleshooting

## ⚙️ Advanced Features

### Regular Expression Support
For power users, enable "Use Regex" to create complex patterns:

**Examples**:
- `Chapter \d+` → Replace any "Chapter" followed by numbers
- `(Mr|Mrs|Ms)\. (\w+)` → Replace titles with names
- `color|colour` → Match both spellings

### Duplicate Detection
- Click **"Find Duplicates"** in the Terms List
- Navigate through duplicate groups to resolve conflicts
- Remove unnecessary duplicate terms

### Import/Export Workflows

**Backup Strategy**:
1. Use "Export All Terms" regularly to backup your data
2. Keep multiple backup files with dates

**Sharing Terms**:
1. Create terms for a novel
2. Use "Export Novel Terms" to share with others
3. Others can "Import to This Novel" to get your terms

## 🔧 Troubleshooting

### Common Issues

#### ❌ Script Not Working
**Symptoms**: No replacements happening, interface not appearing
**Solutions**:
1. **Check URL**: Make sure you're on a WTR-Lab.com novel page
2. **Refresh page**: Sometimes a page refresh is needed
3. **Disable/Enable**: Try disabling and re-enabling the script in Tampermonkey
4. **Check for errors**: Open browser console (F12) and look for error messages

#### ❌ Replacements Not Applied
**Symptoms**: Terms are saved but not replaced in text
**Solutions**:
1. **Check "Disable All"**: Make sure it's unchecked
2. **Verify terms**: Ensure your terms are correctly formatted
3. **Clear browser cache**: Sometimes cached content interferes
4. **Re-process**: Try navigating away and back to the chapter

#### ❌ Interface Not Appearing
**Symptoms**: Can't find the "Term Settings" button or menu
**Solutions**:
1. **Check script status**: Verify Tampermonkey shows the script as enabled
2. **Manual access**: Use Tampermonkey menu → "Term Replacer Settings"
3. **Page reload**: Refresh the page after script installation
4. **Check permissions**: Ensure script has access to the site

#### ❌ Import/Export Issues
**Symptoms**: Files won't import or export properly
**Solutions**:
1. **File format**: Ensure you're using .json files exported by this script
2. **Browser blocking**: Check if browser is blocking downloads
3. **Storage space**: Make sure you have sufficient storage space
4. **Network issues**: Try again with stable internet connection

### Getting Help

If you're still experiencing issues:

1. **Enable logging**: Use Tampermonkey menu → "Toggle Logging" for detailed error messages
2. **Check console**: Press F12 to open browser console and look for error messages
3. **Version compatibility**: Ensure you're using the latest version of both Tampermonkey and this script
4. **Browser compatibility**: Try a different browser to isolate the issue

## 📱 Mobile Usage

The script is fully optimized for mobile devices:

- **Touch-friendly interface** with appropriate button sizes
- **Responsive design** that adapts to different screen sizes
- **Mobile-optimized controls** for easy term management on small screens
- **Swipe-friendly navigation** for term lists

## 🔒 Privacy & Security

- **No data collection**: The script doesn't send any data to external servers
- **Local storage only**: All your terms are stored locally in your browser
- **No tracking**: No analytics or user tracking implemented
- **Open source**: Code is available for inspection

## 🎨 Customization

### Appearance
The script automatically adapts to your browser's theme and WTR-Lab's styling for a seamless experience.

### Performance
- **Intelligent caching** reduces processing time
- **Efficient algorithms** minimize impact on page performance
- **Progressive loading** handles large term lists smoothly

## 📄 License

This script is released under the MIT License. You're free to use, modify, and distribute it according to the license terms.

## 🙏 Acknowledgments

- Built for the WTR-Lab.com reading community
- Inspired by the need for better reading customization tools
- Thanks to all users who provided feedback and suggestions

---

**Enjoy your enhanced reading experience with WTR Lab Term Replacer!** 📚✨

*For technical support or feature requests, please refer to the project repository or contact the development team.*