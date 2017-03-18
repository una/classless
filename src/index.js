const fs = require('fs');
const glob = require('glob');
const getCSSElems = require('./getCSSElems');
const getHTMLElems = require('./getHTMLElems');

// These are the two things that users would update
const cssFilePath = './test/testStyles.css';
const htmlFilePath = './test/**/*.html';

const compiledStyles = fs.readFileSync(cssFilePath, 'utf8');

// For the computed CSS file, grab the unique elements
const cssElemArray = getCSSElems(compiledStyles);
let htmlElemArrays = [];

// For each HTML file, run through and grab the elements
glob(htmlFilePath, (er, files) => {
  files.forEach(file => {
    const htmlText = fs.readFileSync(file, 'utf8');
    htmlElemArrays.push(getHTMLElems(htmlText));
  });

  // Merge all of the elements from each HTML file into one array
  const allHTMLElems = ([ ...new Set( [].concat( ...htmlElemArrays ) ) ]);
  console.log(allHTMLElems);
});

// console.log(cssElemArray, htmlElemArray);
