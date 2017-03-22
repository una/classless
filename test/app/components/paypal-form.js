import Ember from 'ember';
import {ESC_KEY} from '../constants';

export default Ember.Component.extend({
  classNames: 'paypal-form',
  payPalAmounts: [5, 10, 25, 50, 100], // eslint-disable-line no-magic-numbers
  payPalIpnUrl: window.payPalIpnUrl,
  merchantId: window.payPalMerchantId,
  payPalLoading: false,
  pageLoadTime: null,
  payPalAmount: 5,

  payPalValueCopy: function () {
    switch (this.get('payPalAmount')) {
      case 5: // eslint-disable-line no-magic-numbers
        return 'one month with our $5';
      case 10: // eslint-disable-line no-magic-numbers
        return 'two months with our $5';
      case 25: // eslint-disable-line no-magic-numbers
        return 'five months with our $5';
      case 50: // eslint-disable-line no-magic-numbers
        return 'five months with our $10';
      case 100: // eslint-disable-line no-magic-numbers
        return 'five months with our $20';
    }
  }.property('payPalAmount'),

  paypalReturnUrl: function () {
    let credits = this.get('creditBalanceValue');
    if (credits) {
      return this.get('returnURL') + '&paypal=true&existingCredit=' + credits;
    }
    return this.get('returnURL') + '&paypal=true&existingCredit=0';
  }.property('returnURL','creditBalanceValue'),

  actions: {
    onPayPalAmountChange: function (value) {
      this.set('payPalAmount', parseInt(value.replace('Pay', ''), 10));
    },
    submitPaypal: function () {
      //Disable escape key to not allow cancel of the pending paypal redirect
      this.$(document).keydown(function(e) {
        if (e.keyCode === ESC_KEY) {
          return false;
        }
      });
      if (this.get('onPaypalSubmit')) {
        this.sendAction('onPaypalSubmit');
      }
      this.set('payPalLoading', true);
    }
  }
});
