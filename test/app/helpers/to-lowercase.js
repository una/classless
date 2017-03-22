import Ember from 'ember';
import _ from 'lodash/lodash';

export function lowercase(params) {
  let str = params[0];
  if (_.isString(str)) {
    str = str.toLowerCase();
  }
  return str;
}

export default Ember.Helper.helper(lowercase);
