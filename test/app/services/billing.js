import Ember from 'ember';
import App from '../app';
import _ from 'lodash/lodash';

const DEFAULT_RETRY_COUNT = 2;

export default Ember.Service.extend({
  stripeLoaded: false,
  jqueryPaymentLoaded: false,
  loadStripe: function (retryCount) {
    if (!this.get('stripeLoaded')) {
      retryCount = _.isNumber(retryCount) || DEFAULT_RETRY_COUNT;
      Ember.$.getScript('https://js.stripe.com/v2/').done(() => {
        if (window.Stripe && window.stripePublicKey) {
          window.Stripe.setPublishableKey(window.stripePublicKey);
        }
        this.set('stripeLoaded', true);
      }).fail(() => {
        if (retryCount > 0) {
          this.loadStripe(retryCount - 1);
        } else {
          App.NotificationsManager.show('Sorry! We were unable to load Stripe, our billing client.', 'alert');
        }
      });
    }
  },
  loadStripePaymentLib: function (retryCount) {
    if (!this.get('jqueryPaymentLoaded')) {
      retryCount = _.isNumber(retryCount) || DEFAULT_RETRY_COUNT;
      // Alias Ember's jquery to the window for use with the payment formatting library
      window.$ = window.$ || Ember.$;
      Ember.$.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery.payment/1.4.1/jquery.payment.min.js').done(() => {
        Ember.$ = window.$;
        this.set('jqueryPaymentLoaded', true);
      }).fail(() => {
        if (retryCount > 0) {
          this.loadStripePaymentLib(retryCount - 1);
        } else {
          App.NotificationsManager.show('Sorry! We were unable to load our billing client.', 'alert');
        }
      });
    }
  },
  createToken: function (cardMeta) {
    if (this.get('stripeLoaded')) {
      return new Ember.RSVP.Promise(function (resolve, reject) {
        window.Stripe.createToken(cardMeta, function(status, response) {
          if (response.error) {
            return reject(response.error);
          }
          resolve(response);
        });
      });
    }
  }
});
