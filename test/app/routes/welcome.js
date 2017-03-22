import Ember from 'ember';
import App from '../app';

export default Ember.Route.extend({
  titleToken: 'Welcome',

  previousStep: null,
  previousPendingPayments: false,

  redirectIfComplete: function () {
    if (App.User.get('isOnboarded')) {
      this.transitionTo('droplets');
      return true;
    }
  },

  beforeModel: function () {
    this.redirectIfComplete();
  },

  model: function(params) {
    let modelHash = {
      user: App.User,
      countries: this.store.findAll('country').then((countries) => {
        let unitedStates = this.store.peekRecord('country', 'US');
        let countriesWithoutUSA = countries.without(unitedStates);
        countriesWithoutUSA.unshift(unitedStates);
        return countriesWithoutUSA;
      })
    };
    if (params.paypal) {
      let unixTime = (Date.now() / 1000 | 0); // eslint-disable-line no-magic-numbers
      modelHash.paypalIpns = this.store.query('paypal-ipn', {
        from: unixTime
      });
      modelHash.pageLoadTime = unixTime;
    }
    return Ember.RSVP.hash(modelHash);
  },

  afterModel: function (routeModel) {
    this.set('previousStep', App.User.get('effectiveOnboardingStep'));
    this.set('previousPendingPayments', App.User.get('hasPendingPayments'));

    App.User.poll((model) => {
      if (routeModel.paypalIpns) {
        let failedpayPalIpn = routeModel.paypalIpns.findBy('isFailed', true);
        if (failedpayPalIpn) {
          App.NotificationsManager.show('Your PayPal payment was unsuccessful. Please try again.', 'alert');
          routeModel.pageLoadTime = null;
        } else if (routeModel.pageLoadTime) {
          this.store.query('paypal-ipn', {
            from: routeModel.pageLoadTime
          }).then((paypalIpns) => {
            routeModel.paypalIpns = paypalIpns;
          });
        }
      }

      let currentStep = model.get('effectiveOnboardingStep');
      let currentPendingPayments = model.get('hasPendingPayments');
      let prevStep = this.get('previousStep');
      // If the user model has just changed to activated
      if (prevStep === 'confirmed' && currentStep === 'activated') {
        App.NotificationsManager.show('Payment method successfully added.', 'notice');
      }
      this.set('previousStep', currentStep);
      this.set('previousPendingPayments', currentPendingPayments);
      this.controllerFor('welcome').set('model.user', App.User = model);
      this.controllerFor('welcome').setStep();
    }).catch(() => {
      // https://jira.internal.digitalocean.com/browse/AI-155
      window.location.href = '/logout';
    });
  },

  actions: {
    willTransition: function () {
      App.User.cancelPoll();
    }
  }
});
