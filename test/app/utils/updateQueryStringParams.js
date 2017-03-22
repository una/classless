import _ from 'lodash/lodash';

export function updateQueryStringParams(queryParams) {
  let updatedParams = document.location.search;

  _.forEach(queryParams, function(value, key) {
    let valueToLowerCase = _.isString(value) ? value.toLowerCase() : value;
    // If the value is null, remove from query string
    let newParam = !!valueToLowerCase ? `${key}=${valueToLowerCase}` : ''; //eslint-disable-line no-extra-boolean-cast

    // Build updatedParams from search string
    if (updatedParams) {
      let keyRegex = new RegExp('([\?&])' + key + '[^&]*');

      // If param exists, update it
      if (updatedParams.match(keyRegex) !== null) {
        let toReplace = !!newParam ? '$1' + newParam : ''; //eslint-disable-line no-extra-boolean-cast
        updatedParams = updatedParams.replace(keyRegex, toReplace);
        if (updatedParams[0] && updatedParams[0] === '&') {
          updatedParams = '?' + updatedParams.substring(1);
        }
      } else { // Otherwise, add it to end of query string
        if (updatedParams.length) {
          updatedParams = updatedParams + (!!newParam ? '&' + newParam : ''); //eslint-disable-line no-extra-boolean-cast
        } else {
          updatedParams = updatedParams + (!!newParam ? '?' + newParam : ''); //eslint-disable-line no-extra-boolean-cast
        }
      }
    } else {
      updatedParams = `?${newParam}`;
    }
  });
  updateQueryStringParams.replaceState(updatedParams);
}

updateQueryStringParams.replaceState = function(updatedParams) {
  let baseUrl = [location.protocol, '//', location.host, location.pathname].join('');
  window.history.replaceState({}, "", baseUrl + updatedParams);
};

export default updateQueryStringParams;
