let LWEST_LEVEL_DOMAIN_REGEX = /^[^\.]+/;
let ITERATING_NAME_REGEX = /(-*)(\d+)$/;

export function getDropletName(name, offset) {
  let highLevelDomains = '';
  if(name.indexOf('.') !== -1) {
    highLevelDomains = name.replace(LWEST_LEVEL_DOMAIN_REGEX, '');
    name = name.split('.')[0];
  }

  let iteratingNameMatch = name.match(ITERATING_NAME_REGEX);
  let seperator = iteratingNameMatch ? iteratingNameMatch[1] || '' : (name.charAt(name.length - 1) === '-' ? '' : '-');
  let matchingNum = iteratingNameMatch ? iteratingNameMatch[2] : '01';
  let num = iteratingNameMatch ? parseInt(matchingNum, 10) + offset - 1 : offset;
  name = name.replace(ITERATING_NAME_REGEX, '');
  while(matchingNum.length > num.toString().length) {
    num = '0' + num;
  }

  return `${name}${seperator}${num}${highLevelDomains}`;
}

export function getInitialDropletName(image, size, region) {
  return `${image || ''}-${size || ''}-${region || ''}-01`.toLowerCase();
}
