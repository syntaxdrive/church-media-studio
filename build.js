const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
let html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(rootDir, 'css', 'style.css'), 'utf8');

// Read modular scripts
const zipJs = fs.readFileSync(path.join(rootDir, 'js', 'zip.js'), 'utf8');
const stateJs = fs.readFileSync(path.join(rootDir, 'js', 'state.js'), 'utf8');
const rendererJs = fs.readFileSync(path.join(rootDir, 'js', 'renderer.js'), 'utf8');
const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
const quotesJs = fs.readFileSync(path.join(rootDir, 'js', 'quotes.js'), 'utf8');
const quotesUiJs = fs.readFileSync(path.join(rootDir, 'js', 'quotes-ui.js'), 'utf8');
const lameJs = fs.readFileSync(path.join(rootDir, 'js', 'lame.min.js'), 'utf8');
const audioTaggerJs = fs.readFileSync(path.join(rootDir, 'js', 'audio-tagger.js'), 'utf8');
const audioEngineJs = fs.readFileSync(path.join(rootDir, 'js', 'audio-engine.js'), 'utf8');
const audioStudioJs = fs.readFileSync(path.join(rootDir, 'js', 'audio-studio.js'), 'utf8');
const suiteHubJs = fs.readFileSync(path.join(rootDir, 'js', 'suite-hub.js'), 'utf8');

// Inline CSS safely using function replacement to prevent $& expansion
html = html.replace('<link rel="stylesheet" href="css/style.css">', () => '<style>\n' + css + '\n  </style>');

// Inline JS scripts safely using function replacement to prevent $& / $' expansion
const scriptBundle = '<script>\n' + [
  zipJs,
  stateJs,
  rendererJs,
  appJs,
  quotesJs,
  quotesUiJs,
  lameJs,
  audioTaggerJs,
  audioEngineJs,
  audioStudioJs,
  suiteHubJs
].join('\n\n') + '\n  </script>';

html = html.replace(
  /<script src="js\/zip\.js"><\/script>\s*<script src="js\/state\.js"><\/script>\s*<script src="js\/renderer\.js"><\/script>\s*<script src="js\/app\.js"><\/script>\s*<script src="js\/quotes\.js"><\/script>\s*<script src="js\/quotes-ui\.js"><\/script>\s*<script src="js\/lame\.min\.js"><\/script>\s*<script src="js\/audio-tagger\.js"><\/script>\s*<script src="js\/audio-engine\.js"><\/script>\s*<script src="js\/audio-studio\.js"><\/script>\s*<script src="js\/suite-hub\.js"><\/script>/,
  () => scriptBundle
);

fs.writeFileSync(path.join(rootDir, 'Church Media Batch Watermark Studio (4).html'), html, 'utf8');
console.log('Build completed safely! Standalone file size:', (html.length / 1024).toFixed(1), 'KB');
