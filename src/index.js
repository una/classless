const fs = require('fs');
const glob = require('glob');
const getCSSElems = require('./getCSSElems');
const cssFilePath = './test/testStyles.css';
const htmlFilePath = './test/**/*.html';

const compiledStyles = fs.readFileSync(cssFilePath, 'utf8');

glob(htmlFilePath, (er, files) => {
  files.forEach(file => {
    console.log(file);
  });
})

getCSSElems(compiledStyles);
