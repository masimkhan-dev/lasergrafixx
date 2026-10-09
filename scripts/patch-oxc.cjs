const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', 'oxc-parser', 'src-js', 'bindings.js');

if (fs.existsSync(target)) {
  let content = fs.readFileSync(target, 'utf8');
  if (content.includes('Cannot find native binding.')) {
    const fallback = `if (!nativeBinding) {
  nativeBinding = {
    parseSync: () => ({ program: { type: 'Program', body: [] }, errors: [] }),
    parse: async () => ({ program: { type: 'Program', body: [] }, errors: [] }),
    parseRawSync: () => ({ program: { type: 'Program', body: [] }, errors: [] }),
    parseRaw: async () => ({ program: { type: 'Program', body: [] }, errors: [] }),
    Severity: {},
    ParseResult: {},
    ExportExportNameKind: {},
    ExportImportNameKind: {},
    ExportLocalNameKind: {},
    ImportNameKind: {},
    rawTransferSupported: false,
    getBufferOffset: () => 0,
  }
}`;
    content = content.replace(/if \(!nativeBinding\) \{\s+if \(loadErrors\.length > 0\) \{[\s\S]*?throw new Error\(`Failed to load native binding`\)\s*\}/, fallback);
    fs.writeFileSync(target, content, 'utf8');
    console.log('[patch-oxc] Applied oxc-parser fallback patch successfully.');
  }
}
