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

module.exports = getClassesAndIds;
