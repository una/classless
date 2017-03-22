const glob = require('glob');
const request = require('sync-request');
const fs = require('fs');

function getClassesAndIds(stylesheet) {
  const elemArray = [];
  let temp;

  // Get the classes and id's
  temp = stylesheet.match(/[\.|#]\D\w+[_|-]?(-)?\w+/g);
  if (temp) {
    elemArray.push.apply(elemArray, temp);
  }

  // Combine classes and ID's and filter for unique ones
  const filteredElems = elemArray.filter((v, i, a) => a.indexOf(v) === i);

  // Return all of the unique elements
  // console.log(filteredElems);
  return filteredElems;
}

function getAllCSSElems(cssPathInput) {
  //If the CSS file is a url, read the URL and get classes + ids
  if (cssPathInput.includes('http')) {
    let cssText = getCSSTextFromURL(cssPathInput);
    return (getClassesAndIds(cssText));
  }

  //If the input is not a url, get all of the files in the glob and run
  //through their elements
  else {
    let eachCSSElemArray = [];
    const files = new glob(cssPathInput, {sync: true});
    const cssFilePath = cssPathInput.substr(0, cssPathInput.indexOf(','));
    // console.log(cssFilePath);

    files.forEach(file => {
      const cssText = fs.readFileSync(file, 'utf8');
      eachCSSElemArray.push(getClassesAndIds(cssText));
    });

    const totalCSSElemArray = ([ ...new Set( [].concat( ...eachCSSElemArray ) ) ]);

    // Merge all of the elements from each CSS file into one array
    return totalCSSElemArray;
  }

};

function getCSSTextFromURL(url) {
  var res = request('GET', url);
  let cssText = (res.getBody()).toString();
  return cssText;
}

module.exports = {
  getClassesAndIds: getClassesAndIds,
  getAllCSSElems: getAllCSSElems
};
