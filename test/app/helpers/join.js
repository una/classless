import Ember from 'ember';

export function join(params) {
  let delimiter = params[0];
  let array = params[1];

  return Ember.String.htmlSafe(array.join(delimiter));
}

export default Ember.Helper.helper(join);
