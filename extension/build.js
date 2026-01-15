#!/usr/bin/env node

/**
 * Build script to verify extension is ready for distribution
 * Checks that all required libraries and files are present
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_LIBRARIES = [
  'lib/pdf.min.js',
  'lib/pdf.worker.min.js',
  'lib/mammoth.browser.min.js',
  'lib/supabase-client.js',
];

const REQUIRED_FILES = [
  'manifest.json',
  'popup/popup.html',
  'popup/popup.js',
  'popup/ai-service.js',
  'popup/file-text-extractor.js',
  'content/content-script.js',
  'background/service-worker.js',
  'config.example.js',
];

const REQUIRED_ICONS = [
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
];

function checkFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    return { exists: false, path: filePath };
  }
  const stats = fs.statSync(fullPath);
  return { 
    exists: true, 
    path: filePath, 
    size: stats.size,
    sizeKB: (stats.size / 1024).toFixed(2)
  };
}

function verifyExtension() {
  console.log('🔍 Verifying extension build...\n');
  
  let allGood = true;
  const errors = [];
  const warnings = [];

  // Check required libraries
  console.log('📚 Checking libraries...');
  REQUIRED_LIBRARIES.forEach(file => {
    const result = checkFile(file);
    if (result.exists) {
      console.log(`  ✅ ${file} (${result.sizeKB} KB)`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
      errors.push(file);
      allGood = false;
    }
  });

  // Check required files
  console.log('\n📄 Checking required files...');
  REQUIRED_FILES.forEach(file => {
    const result = checkFile(file);
    if (result.exists) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
      errors.push(file);
      allGood = false;
    }
  });

  // Check icons
  console.log('\n🖼️  Checking icons...');
  REQUIRED_ICONS.forEach(file => {
    const result = checkFile(file);
    if (result.exists) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ⚠️  ${file} - MISSING (optional but recommended)`);
      warnings.push(file);
    }
  });

  // Check config.js (should exist but might be gitignored)
  console.log('\n⚙️  Checking configuration...');
  const configExists = checkFile('config.js');
  if (configExists.exists) {
    console.log('  ✅ config.js exists');
  } else {
    console.log('  ⚠️  config.js not found - users need to create from config.example.js');
    warnings.push('config.js');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('✅ Extension is ready for distribution!');
    console.log('\n📦 To package the extension:');
    console.log('   1. Zip the extension folder');
    console.log('   2. Or use: npm run package (if package.json exists)');
    console.log('   3. Users can load it in Chrome via chrome://extensions/');
  } else {
    console.log('❌ Extension is NOT ready. Missing files:');
    errors.forEach(file => console.log(`   - ${file}`));
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(file => console.log(`   - ${file}`));
    }
    process.exit(1);
  }
  console.log('='.repeat(50));
}

// Run verification
verifyExtension();
