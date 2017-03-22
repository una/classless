import {CURRENCY_USD_PRECISION} from '../constants';
import Ember from 'ember';

export function formatCurrency(params) {
  let amount = params[0] || 0;
  amount = parseFloat(amount);
  let prepend = '$';

  if(amount < 0) {
    prepend = '-' + prepend;
  }

  return prepend + Math.abs(amount).toFixed(CURRENCY_USD_PRECISION);
}

export default Ember.Helper.helper(formatCurrency);
