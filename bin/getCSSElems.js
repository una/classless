const glob = require('glob');
const fs = require('fs');
var request = require('request');

function getClassesAndIds(stylesheet) {
  const classes = [];
  const ids = [];
  let temp;

  // Get the classes
  temp = stylesheet.match(/\.\D\w+/g);
  if (temp) {
    classes.push.apply(classes, temp);
  }

  // Get the IDs
  temp = stylesheet.match(/\#\D\w+/g);
  if (temp) {
    ids.push.apply(ids, temp);
  }

  // Combine classes and ID's and filter for unique ones
  const filteredElems = classes.concat(ids)
    .filter((v, i, a) => a.indexOf(v) === i);

  // Return all of the unique elements
  // console.log(filteredElems);
  return filteredElems;
}

function getAllCSSElems(cssFilePath) {
  //If the CSS file is a url, read the URL and get classes + ids
  if (cssFilePath.includes('http')) {
    getCSSTextFromURL(cssFilePath);
  }

  //If the input is not a url, get all of the files in the glob and run
  //through their elements
  else {
    let eachCSSElemArray = [];
    const files = new glob(cssFilePath, {sync: true});

    files.forEach(file => {
      const cssText = fs.readFileSync(file, 'utf8');
      eachCSSElemArray.push(getClassesAndIds(cssText));
    });

    const totalCSSElemArray = ([ ...new Set( [].concat( ...eachCSSElemArray ) ) ]);

    // Merge all of the elements from each CSS file into one array
    return totalCSSElemArray;
  }

};

function getCSSTextFromURL(url, ) {
  request.get(url, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var cssText = body;
    console.log(body);
    getClassesAndIds(cssText);
    }
  });
}

module.exports = {
  getClassesAndIds: getClassesAndIds,
  getAllCSSElems: getAllCSSElems
};
