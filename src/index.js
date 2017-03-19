// User defines config path
const configPath = './test/classless.config';

const fs = require('fs');
const glob = require('glob');
const getCSSElems = require('./getCSSElems');
const getHTMLElems = require('./getHTMLElems');
const config = JSON.parse(fs.readFileSync(configPath));
const cssFilePath = config.cssPath;
const htmlFilePath = config.htmlPath;

const compiledStyles = fs.readFileSync(cssFilePath, 'utf8');

// For the computed CSS file, grab the unique elements
const cssElemArray = getCSSElems(compiledStyles);
let eachHTMLElemArray = [];

// For each HTML file, run through and grab the elements (sidenote: this should be better structured)
glob(htmlFilePath, (er, files) => {
  files.forEach(file => {
    const htmlText = fs.readFileSync(file, 'utf8');
    eachHTMLElemArray.push(getHTMLElems(htmlText));
  });

  // Merge all of the elements from each HTML file into one array
  const totalHTMLElemArray = ([ ...new Set( [].concat( ...eachHTMLElemArray ) ) ]);

  // This should be in its own function probably, but keeping
  // it here because re: scope lol, this is easier for now

  //Add elements from accepted elements list to the total CSS array
  const approvedElems = config.acceptedElems;
  cssElemArray.push(approvedElems);

  // console.log('All CSS Allowed: \n' + cssElemArray, '\n\nAll HTML Classes/Ids Used: \n' + totalHTMLElemArray);

  // Comparing total HTML to CSS Elements allowed in design system
  const unmatchedElems = totalHTMLElemArray.filter((obj) => {
    return (cssElemArray.indexOf(obj) == -1);
  });

  console.log(unmatchedElems);

  console.log(
    `    😬  Uh oh! Your markup includes the
    following elements that do not live in the
    design system or accepted classes config:

    ${unmatchedElems}

    Please revisit the design system documenation
    or add them to your approved class list in your
    \`classless.config\` file 💕  💁`

  );
});
