import Ember from 'ember';
import _ from 'lodash/lodash';

export function uppercase(params) {
  let str = params[0];
  if (_.isString(str)) {
    str = str.toUpperCase();
  }
  return str;
}

export default Ember.Helper.helper(uppercase);
