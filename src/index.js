const fs = require('fs');
const glob = require('glob');
const getCSSElems = require('./getCSSElems');
const getHTMLElems = require('./getHTMLElems');

// These are the two things that users would update
const cssFilePath = './test/testStyles.css';
const htmlFilePath = './test/**/*.html';

const compiledStyles = fs.readFileSync(cssFilePath, 'utf8');

glob(htmlFilePath, (er, files) => {
  files.forEach(file => {
    const htmlText = fs.readFileSync(file, 'utf8');
    getHTMLElems(htmlText);
  });
});

getCSSElems(compiledStyles);
