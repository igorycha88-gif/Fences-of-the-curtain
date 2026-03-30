#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const API_DIR = path.join(ROOT_DIR, 'src/app/api');

function addDynamicExport(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  if (content.includes('export const dynamic')) {
    return;
  }

  const lastImportIndex = lines.findIndex((line, index) => {
    if (index === 0) return false;
    const isImportLine = line.trim().startsWith('import ');
    const nextLine = lines[index + 1];
    const nextIsNotImport = !nextLine || !nextLine.trim().startsWith('import ');
    return isImportLine && nextIsNotImport;
  });

  const importEndIndex = lines.reduce((maxIndex, line, index) => {
    if (line.trim().startsWith('import ')) {
      return index;
    }
    return maxIndex;
  }, -1);

  if (importEndIndex >= 0) {
    lines.splice(importEndIndex + 1, 0, '');
    lines.splice(importEndIndex + 2, 0, "export const dynamic = 'force-dynamic';");
  } else {
    lines.unshift('');
    lines.unshift("export const dynamic = 'force-dynamic';");
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(`✓ Added dynamic export to ${filePath.replace(ROOT_DIR, '')}`);
}

function findAndFixRouteFiles() {
  const findFilesRecursively = (dir) => {
    const files = fs.readdirSync(dir);
    let result = [];

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        result = result.concat(findFilesRecursively(filePath));
      } else if (file === 'route.ts') {
        result.push(filePath);
      }
    }

    return result;
  };

  const routeFiles = findFilesRecursively(API_DIR);
  const filesNeedingFix = routeFiles.filter((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasDynamic = content.includes('export const dynamic');
    const usesHeaders = content.includes('getServerSession') || content.includes('headers()');
    return !hasDynamic && usesHeaders;
  });

  console.log(`Found ${filesNeedingFix.length} files to fix...\n`);

  filesNeedingFix.forEach((file) => {
    addDynamicExport(file);
  });

  console.log('\n✅ Done!');
}

findAndFixRouteFiles();
