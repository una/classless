import _ from 'lodash/lodash';

let isNonEmptyObject = function(obj) {
  return _.isObject(obj) && !_.isArray(obj) && !_.isEmpty(obj);
};

// TODO(@jenna): write tests
export function decamelizeObject(obj) {
  if (isNonEmptyObject(obj)) {
    let keys = Object.keys(obj);
    return keys.reduce(function(acc, curr) {
      let newKey = curr.decamelize();
      let val = obj[curr];
      val = decamelizeObject(val);
      acc[newKey] = val;
      return acc;
    }, {});
  } else {
    return obj;
  }
}

export function camelizeObject(obj) {
  if (isNonEmptyObject(obj)) {
    let keys = Object.keys(obj);
    return keys.reduce(function(acc, curr) {
      let newKey = curr.camelize();
      let val = obj[curr];
      val = camelizeObject(val);
      acc[newKey] = val;
      return acc;
    }, {});
  } else {
    return obj;
  }
}
