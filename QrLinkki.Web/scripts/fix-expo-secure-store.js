#!/usr/bin/env node

/**
 * Corrige a depreciação do Gradle no expo-secure-store
 * Substitui o uso deprecated de 'classifier' por 'archiveClassifier.set()'
 */

const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-secure-store',
  'android',
  'build.gradle'
);

if (!fs.existsSync(buildGradlePath)) {
  console.log('⚠️  expo-secure-store/android/build.gradle not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(buildGradlePath, 'utf8');

// Verifica se já foi aplicado o patch
if (content.includes('archiveClassifier.set')) {
  console.log('✅ expo-secure-store já está com o patch');
  process.exit(0);
}

// Aplica o patch: substitui o 'classifier' deprecado por 'archiveClassifier.set()'
const oldPattern = /task androidSourcesJar\(type: Jar\) \{[\s\S]*?classifier = ['"]sources['"]/;
const newCode = `task androidSourcesJar(type: Jar) {
  archiveClassifier.set('sources')`;

if (oldPattern.test(content)) {
  content = content.replace(oldPattern, newCode);
  fs.writeFileSync(buildGradlePath, content, 'utf8');
  console.log('✅ expo-secure-store patched successfully');
} else {
  console.log('⚠️  Could not find pattern to patch in expo-secure-store');
}
