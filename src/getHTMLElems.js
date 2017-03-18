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
      // get all id elements and add '#' to all Elem list
      if (elem.startsWith("id")) {
        allElems.push('#' + item);

      // get all class elements and add '.' to all Elem list
      } else {
        allElems.push('.' + item)
      }
    })
  });

  const filteredElems = allElems.filter((v, i, a) => a.indexOf(v) === i);

  // console.log(filteredElems);
  return filteredElems;
}

module.exports = getHTMLElements;
