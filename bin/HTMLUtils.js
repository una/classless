const glob = require('glob');
const fs = require('fs');

function getHTMLElements(htmlText) {
  const elemStrings = [];
  const allElems = [];
  let temp;

  // Get the classes
  temp = htmlText.match(/[class|id]+[ \t]*=[ \t]*['|"][^'|"]+['|"]/g);
  if (temp) {
    elemStrings.push.apply(elemStrings, temp);
  }

  elemStrings.forEach(elem => {
    let delimeter = '"';

    if (elem.includes("'")) {
      delimeter = "'";
    }

    var substring = elem.split(delimeter)[1].split(' ');

    // console.log(substring);

    substring.forEach(item => {
      // This is for frameworks
      if (item.includes("{") ||  item.includes("}") ||  item.includes("(") || item.includes(")") || item.includes("/")) {
        return
      } else {
        // get all id elements and add '#' to all Elem list
        if (elem.startsWith("id")) {
          allElems.push('#' + item);

        // get all class elements and add '.' to all Elem list
        } else {
          allElems.push('.' + item)
        }
      }
    })
  });

  const filteredElems = allElems.filter((v, i, a) => a.indexOf(v) === i);

  // console.log(filteredElems);
  return filteredElems;
}

// let totalHTMLElemArray = [];

// For each HTML file, run through and grab the elements
function getAllHTMLElems(htmlFilePath) {
  let eachHTMLElemArray = [];
  const files = new glob(htmlFilePath, {sync: true});

  files.forEach(file => {
    const htmlText = fs.readFileSync(file, 'utf8');
    eachHTMLElemArray.push(getHTMLElements(htmlText));
  });

  const totalHTMLElemArray = ([ ...new Set( [].concat( ...eachHTMLElemArray ) ) ]);

  // Merge all of the elements from each HTML file into one array
  return totalHTMLElemArray;
};

module.exports = {
  getHTMLElements: getHTMLElements,
  getAllHTMLElems: getAllHTMLElems
};
