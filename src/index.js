// User defines config path
const configPath = './classless.config';
const fs = require('fs');
const getCSSElems = require('./getCSSElems');
const htmlUtils = require('./HTMLUtils');
const config = JSON.parse(fs.readFileSync(configPath));
const cssFilePath = config.cssPath;
const htmlFilePath = config.htmlPath;

// For the computed CSS file, grab the unique elements
const compiledStyles = fs.readFileSync(cssFilePath, 'utf8');
const cssElemArray = getCSSElems(compiledStyles);
//Add elements from accepted elements list to the total CSS array
const approvedElems = config.acceptedElems;
cssElemArray.push(approvedElems);

// get all of the HTML Elements used
const totalHTMLElemArray = htmlUtils.getAllHTMLElems(htmlFilePath);

function compareMatches(htmlList, cssList) {
  // Comparing total HTML to CSS Elements allowed in design system
  const unmatchedElems = htmlList.filter((obj) => {
    return (cssList.indexOf(obj) == -1);
  });

  console.log(
    `    😬  Uh oh! Your markup includes the
    following elements that do not live in the
    design system or accepted classes config:

    ${unmatchedElems}

    Please revisit the design system documenation
    or add them to your approved class list in your
    \`classless.config\` file 💕  💁`
  );

  return unmatchedElems;
}

compareMatches(totalHTMLElemArray, cssElemArray);
