import Ember from 'ember';
import App from '../app';
import ENV from '../config/environment';
import BaseController from '../controllers/base';
import {post} from '../utils/apiHelpers';

export default BaseController.extend({
  queryParams: [
    'paypal'
  ],

  steps: {
    registered: 1,
    confirmed: 2,
    activated: 3,
    engaged: 4,
    established: 4
  },

  payPalAmount: 5,

  billingTab: 'credit-card',

  savingCreditCard: false,

  showPromoModal: false,

  appliedPromo: null,

  stepNames: [
    'Confirm Email',
    'Verification',
    'Create Droplets'
  ],

  step: 1,

  checkSketchy: function () {
    if (this.get('model.user.isSketchy')) {
      this.transitionToRoute('sketchy');
    }
  }.observes('model.user.isSketchy'),

  billingService: Ember.inject.service('billing'),

  onInit: function () {
    this.get('billingService').loadStripe();
    this.get('billingService').loadStripePaymentLib();
    if(window.dataLayer && this.get('model.user.effectiveOnboardingStep')) {
      window.dataLayer.push({
        'event': this.get('model.user.effectiveOnboardingStep') + '_state_pageview'
      });
    }
  }.on('init'),

  setStep: function () {
    this.set('step', this.steps[this.get('model.user.effectiveOnboardingStep')]);
  }.observes('model.user,model.user.effectiveOnboardingStep,'),

  onCardSuccess: function () {
    this.transitionToRoute('welcome');
  },

  postPromoCode: function () {
    let promoCode = this.get('appliedPromo');
    if (promoCode) {
      let uri = '/' + ENV['api-namespace'] + '/billing/promos/';
      post(uri, {
        code: promoCode
      }).then(() => {
        this.onCardSuccess();
      }, () => {
        App.NotificationsManager.show('We were unable to apply your promo code', 'alert');
        this.onCardSuccess();
      });
    } else {
      this.onCardSuccess();
    }
  },

  saveCard: function (card) {
    let creditCard = this.store.createRecord('credit-card');
    //Submit token to our api
    creditCard.save(card).then(() => {
      this.postPromoCode();
    }).catch((err) => {
      this.errorHandler(err, 'Saving Credit Card');
    }).finally(() => {
      this.set('savingCreditCard', false);
    });
  },

  actions: {
    resendEmail: function () {
      let uri = '/' + ENV['api-namespace'] + '/users/' + this.get('model.user.uuid') + '/resend_email_confirmation';
      post(uri).then(() => {
        App.NotificationsManager.show('An email has been sent to ' + this.get('model.user.email'), 'notice');
      }, function () {
        App.NotificationsManager.show('Sorry! Something went wrong!', 'alert');
      });

      if(this.segment) {
        this.segment.trackEvent('Welcome : Resend Email');
      }
    },
    onStripeSuccess: function (card) {
      this.saveCard(card);
    },
    togglePromoModal: function () {
      this.set('showPromoModal', true);

      if(this.segment) {
        this.segment.trackEvent('Web Interaction', {
          category: 'Modal',
          action: 'Open',
          name: 'Promo Code'
        });
      }
    },
    updatePromoCode: function () {
      this.set('showPromoModal', false);
      App.NotificationsManager.show('The promo code entered is valid and will be applied upon completion of sign up.', 'notice');
      this.set('appliedPromo', this.get('promo'));
    },
    onModalHide: function () {
      this.set('showPromoModal', false);
    }
  }
});
