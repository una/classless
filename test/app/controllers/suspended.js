import BaseController from '../controllers/base';
import {CURRENCY_USD_PRECISION} from '../constants';

export default BaseController.extend({
  paymentBalance: function(){
    let balance = this.get('model.balance') || '0.0';
    return parseFloat(balance).toFixed(CURRENCY_USD_PRECISION);
  }.property('model.balance')
});

