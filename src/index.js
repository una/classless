const fs = require('fs');
const getCSSElems = require('./getCSSElems');
const cssFilePath = './test/testStyles.css';
const htmlFilePath = './test/test.html';

const compiledStyles = fs.readFileSync(cssFilePath, 'utf8');

console.log(compiledStyles);
getCSSElems(compiledStyles);
