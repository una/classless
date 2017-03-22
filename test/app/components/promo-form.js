import Ember from 'ember';
import {PropTypes} from 'ember-prop-types';
import ENV from '../config/environment';
import {get} from '../utils/apiHelpers';
import {DEBOUNCE_AMOUNT} from '../constants';
import _ from 'lodash/lodash';
import App from '../app';

/**
  Example Usage:

  ```
  {{promo-form
    onSubmit="onSubmit"
    promo=promo
  }}
  ```
 */

let promoErrorHandler = function () {
  let $this = this.$();
  this.set('isValid', false);
  if ($this) {
    $this.removeClass('validatePass');
    let errorMessage = this.get('error') || (this.get('placeholder').replace(/^Enter /, '') + ' cannot be blank');
    $this.addClass('validateFail is-active').find('label').text(errorMessage);
  }
  this.validateForm();
};

let promoSuccessHandler = function (response) {
  response.json().then((response) => {
    let promo = response.promo;
    if (App.User.get('isContextOnboarded') && !promo.eligible) {
      this.set('error', 'Account not eligible to use this promo code.');
      promoErrorHandler.call(this);
      return;
    }
    let $this = this.$();
    if ($this) {
      let $input = $this.find(this.get('inputTag'));
      this.set('isValid', true);
      $this.addClass('validatePass');
      $this.removeClass('validateFail').find('label').text($input.attr('placeholder'));
      $this.attr('data-amount', parseInt(promo.amount, 10));
      this.validateForm();
    }
  });
};

let getPromoCode = function () {
  let promoCode = this.get('value');
  let uri = '/' + ENV['api-namespace'] + '/billing/promos/' + encodeURIComponent(promoCode);
  get(uri).then(promoSuccessHandler.bind(this), promoErrorHandler.bind(this));
};

export default Ember.Component.extend({
  propTypes: {
    onSubmit: PropTypes.string.isRequired
  },

  validatePromo: function () {
    let promoCode = this.get('value');
    if (_.isUndefined(promoCode) || _.isNull(promoCode)) {
      return;
    }
    if (!promoCode || !promoCode.length) {
      this.set('error', 'Promo code cannot be blank');
      promoErrorHandler.call(this);
      return;
    }
    this.set('error', 'Invalid promo code');
    Ember.run.debounce(this, getPromoCode, DEBOUNCE_AMOUNT);
  }
});
