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
let eachHTMLElemArray = [];

// For each HTML file, run through and grab the elements
glob(htmlFilePath, (er, files) => {
  files.forEach(file => {
    const htmlText = fs.readFileSync(file, 'utf8');
    eachHTMLElemArray.push(getHTMLElems(htmlText));
  });

  // Merge all of the elements from each HTML file into one array
  const totalHTMLElemArray = ([ ...new Set( [].concat( ...eachHTMLElemArray ) ) ]);

  // This should be in its own function probably, but keeping
  // it here because re: scope lol, this is easier for now
  console.log('All CSS Allowed: \n' + cssElemArray, '\n\nAll HTML Classes/Ids Used: \n' + totalHTMLElemArray);
  //TO DO: Add elements from accepted elements list to the total CSS array

  // Comparing total HTML to CSS Elements allowed in design system
  const unmatchedElems = totalHTMLElemArray.filter(function(obj) { return cssElemArray.indexOf(obj) == -1; });

  console.log(
    `    Your markup includes the following elements
    that do not live in the design system or
    accepted classes file:

    ${unmatchedElems}`);
});
