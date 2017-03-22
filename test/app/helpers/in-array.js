import Ember from 'ember';

export function inArray(params) {
  let obj = params[0];
  let arr = params[1];

  if(Array.isArray(arr)) {
    return arr.indexOf(obj) > -1;
  }
  return false;
}

export default Ember.Helper.helper(inArray);
