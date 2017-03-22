import Ember from 'ember';
import stringUtils from '../utils/stringUtils';

export function capitalize(params) {
  let str = params[0];
  return stringUtils.capitalize(str);
}

export default Ember.Helper.helper(capitalize);
