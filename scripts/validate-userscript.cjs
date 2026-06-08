#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { PACKAGE_NAME, RAW_DIST_URL } = require('../userscript.metadata.cjs');

const distPath = path.resolve(__dirname, '..', 'dist');
const productionUserScriptPath = path.join(distPath, `${PACKAGE_NAME}.user.js`);
const productionMetaPath = path.join(distPath, `${PACKAGE_NAME}.meta.js`);

function readRequiredFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required userscript artifact: ${path.relative(process.cwd(), filePath)}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

function getUserscriptHeader(contents, artifactName) {
  const startMarker = '// ==UserScript==';
  const endMarker = '// ==/UserScript==';
  const endIndex = contents.indexOf(endMarker);

  if (!contents.startsWith(startMarker) || endIndex === -1) {
    throw new Error(`${artifactName} is missing a complete userscript metadata header.`);
  }

  return contents.slice(0, endIndex + endMarker.length);
}

function requireHeaderFields(header, artifactName, fields) {
  for (const field of fields) {
    if (!new RegExp(`^//\\s+${field}\\b`, 'm').test(header)) {
      throw new Error(`${artifactName} metadata is missing ${field}.`);
    }
  }
}

function extractHeaderValue(header, field) {
  return header.match(new RegExp(`^//\\s+${field}\\s+(.+)$`, 'm'))?.[1]?.trim();
}

function validateArtifactUrls(header) {
  const downloadURL = extractHeaderValue(header, '@downloadURL');
  const updateURL = extractHeaderValue(header, '@updateURL');
  const expectedDownloadURL = `${RAW_DIST_URL}/${PACKAGE_NAME}.user.js`;
  const expectedUpdateURL = `${RAW_DIST_URL}/${PACKAGE_NAME}.meta.js`;

  if (downloadURL !== expectedDownloadURL) {
    throw new Error(`Invalid @downloadURL: ${downloadURL ?? 'missing'}`);
  }

  if (updateURL !== expectedUpdateURL) {
    throw new Error(`Invalid @updateURL: ${updateURL ?? 'missing'}`);
  }
}

function validateVersion(header) {
  const version = extractHeaderValue(header, '@version');

  if (!version || !/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(version)) {
    throw new Error(`Invalid @version value: ${version ?? 'missing'}`);
  }

  return version;
}

const requiredFields = [
  '@name',
  '@namespace',
  '@version',
  '@description',
  '@author',
  '@match',
  '@grant',
  '@license',
  '@downloadURL',
  '@updateURL',
];

const productionUserScript = readRequiredFile(productionUserScriptPath);
const productionMeta = readRequiredFile(productionMetaPath);
const productionHeader = getUserscriptHeader(productionUserScript, `${PACKAGE_NAME}.user.js`);
const metaHeader = getUserscriptHeader(productionMeta, `${PACKAGE_NAME}.meta.js`);

requireHeaderFields(productionHeader, `${PACKAGE_NAME}.user.js`, requiredFields);
requireHeaderFields(metaHeader, `${PACKAGE_NAME}.meta.js`, requiredFields);

if (productionHeader !== metaHeader) {
  throw new Error('Production userscript and metadata artifacts have different metadata headers.');
}

validateArtifactUrls(productionHeader);
const version = validateVersion(productionHeader);

if (/performance\.(?:user|meta)\.js/.test(productionHeader)) {
  throw new Error('Production metadata still references stale .performance.* artifact URLs.');
}

console.log(
  `Validated ${PACKAGE_NAME}.user.js and ${PACKAGE_NAME}.meta.js metadata version ${version} with canonical update URLs.`,
);
