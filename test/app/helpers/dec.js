import Ember from 'ember';

export function dec(params) {
  let step = params[0];
  let val = params[1];

  if (!val) {
    val = step;
    step = undefined;
  }

  val = Number(val);

  if (isNaN(val)) {
    return;
  }

  if (step === undefined) {
    step = 1;
  }

  return val - step;
}

export default Ember.Helper.helper(dec);
