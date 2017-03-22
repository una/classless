import Ember from 'ember';
import App from '../app';

let validatePaymentField = function (isValid) {
  let $this = this.$();
  let $input = $this.find(this.get('inputTag'));
  this.set('isValid', isValid);
  if(this.get('isValid')) {
    $this.addClass('validatePass');
    $this.removeClass('validateFail').find('label').text($input.attr('placeholder'));
  } else {
    $this.removeClass('validatePass');
    let errorMessage = this.get('error') || (this.get('placeholder').replace(/^Enter /, '') + ' cannot be blank');
    $this.addClass('validateFail is-active').find('label').text(errorMessage);
  }
  this.validateForm();
};

export default Ember.Component.extend({
  disableFocusFirstEl: false,
  setupBillingForm: function () {
    if (Ember.$.payment) {
      Ember.$('.cc-num').payment('formatCardNumber');
      Ember.$('.cc-expiry').payment('formatCardExpiry');
      Ember.$('.cc-cvc').payment('formatCardCVC');
    }
  }.on('didRender'),

  jqueryLibLoaded: function () {
    if (this.get('billingService.jqueryPaymentLoaded')) {
      this.setupBillingForm();
    }
  }.observes('billingService.jqueryPaymentLoaded'),

  validateCCInput: function() {
    if (Ember.$.payment) {
      let isValid = Ember.$.payment.validateCardNumber(this.get('value'));
      validatePaymentField.call(this, isValid);
    }
  },

  validateExpiryInput: function() {
    if (Ember.$.payment) {
      let expiry = Ember.$.payment.cardExpiryVal(this.get('value'));
      let isValid = Ember.$.payment.validateCardExpiry(expiry.month, expiry.year);
      validatePaymentField.call(this, isValid);
    }
  },

  validateCVVInput: function() {
    if (Ember.$.payment) {
      let isValid = Ember.$.payment.validateCardCVC(this.get('value'), this.get('ccType'));
      validatePaymentField.call(this, isValid);
    }
  },

  ccError: function () {
    let number = this.get('number');
    if (number && Ember.$.payment && !Ember.$.payment.validateCardNumber(number)) {
      return 'Invalid number';
    }
    return 'Number required';
  }.property('number'),

  expiryError: function () {
    let expiry = Ember.$.payment && this.get('expiry') && Ember.$.payment.cardExpiryVal(this.get('expiry'));
    if (expiry && !Ember.$.payment.validateCardExpiry(expiry.month, expiry.year)) {
      return 'Invalid expiration';
    }
    return 'Expiration required';
  }.property('expiry'),

  cvvError: function () {
    let cvv = this.get('cvv');
    if (cvv && Ember.$.payment && this.get('ccType') && !Ember.$.payment.validateCardCVC(cvv, this.get('ccType'))) {
      return 'Invalid CVV';
    }
    return 'CVV required';
  }.property('cvv'),

  ccType: function () {
    if (Ember.$.payment) {
      return Ember.$.payment.cardType(this.get('number'));
    }
  }.property('number'),

  cvvTip: function () {
    let type = this.get('ccType');
    if (type === 'visa' || type === 'mastercard') {
      return 'A three digit security code on the back of your card.';
    }
    if (type === 'amex') {
      return 'A four digit security code on the front of your card.';
    }
    return 'A three or four digit security code on your card.';
  }.property('ccType'),

  actions: {
    onCCSubmit: function () {
      if (Ember.$.payment) {
        if (!Ember.$.payment.validateCardNumber(this.get('number'))) {
          return App.NotificationsManager.show('Invalid credit card number.', 'alert');
        }
        let expiry = Ember.$.payment.cardExpiryVal(this.get('expiry'));
        if (!Ember.$.payment.validateCardExpiry(expiry.month, expiry.year)) {
          return App.NotificationsManager.show('Invalid expiration date.', 'alert');
        }
        let type = Ember.$.payment.cardType(this.get('number'));
        if (!Ember.$.payment.validateCardCVC(this.get('cvv'), type)) {
          return App.NotificationsManager.show('Invalid CVV for the credit card provided.', 'alert');
        }
        this.set('savingCreditCard', true);
        this.get('billingService').createToken({
          number: this.get('number'),
          cvc: this.get('cvv'),
          exp_month: expiry.month,
          exp_year: expiry.year,
          address_zip: this.get('zip'),
          name: this.get('firstname') + ' ' + this.get('lastname'),
          address_country: this.get('country'),
          address_state: this.get('state'),
          address_line1: this.get('address'),
          address_city: this.get('city')
        }).then((response) => {
          this.get('onStripeSuccess')({
            paymentProfile: {
              firstName: this.get('firstname'),
              lastName: this.get('lastname'),
              address: this.get('address'),
              city: this.get('city'),
              state: this.get('state'),
              country: this.get('country'),
              zip: this.get('zip'),
              phoneNumber: this.get('phone')
            },
            stripeToken: response.id,
            expiry: expiry
          });
        }).catch((err) => {
          this.set('savingCreditCard', false);
          App.NotificationsManager.show(err.message, 'alert');
        });
      } else {
        App.NotificationsManager.show('Sorry! We were unable to initialize the billing client.', 'alert');
      }
    },
    onCountryChange: function (e) {
      this.set('country', e.target.value);
      this.get('actionReceiver').send('validateForm');
    }
  }
});
