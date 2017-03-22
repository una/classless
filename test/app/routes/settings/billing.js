import Ember from 'ember';
import App from '../../app';
import updateQueryStringParams from '../../utils/updateQueryStringParams';
import _ from 'lodash/lodash';

let errorCb = function() {
  this.error = true;
  return Ember.A();
};

export default Ember.Route.extend({
  queryParams: {
    sort: {
      refreshModel: true
    },
    sort_direction: {
      refreshModel: true
    },
    page: {
      refreshModel: true
    }
  },

  initialCreditBalance: null,

  model: function(params) {
    let hash = {
      user: this.store.findAll('user', { reload: true }).then((model) => { //Hard refresh of App's User model on route load
        return App.User = model.get('firstObject');
      }),
      billingState: this.modelFor('application').fetchBillingState(),
      countries: this.store.findAll('country').then((countries) => {
        let unitedStates = this.store.peekRecord('country', 'US');
        let countriesWithoutUSA = countries.without(unitedStates);
        countriesWithoutUSA.unshift(unitedStates);
        return countriesWithoutUSA;
      }),
      creditCards: this.store.findAll('creditCard', { reload: true }),
      events: this.store.query('billingHistoryEvent', _.pick(params, ['sort', 'sort_direction', 'page'])).then(null, errorCb.bind(this))
    };

    // Only fetch bank account data if the user has the feature flipper enabled.
    if (App.featureEnabled('ach')) {
      hash.bankAccount = this.store.findAll('bankAccount').then(function (model) {
        return model.get('firstObject');
      }).catch(() => {
        // this catch prevents the 404 takeover if the user does not have a bank account
      });
    }

    if (params.paypal) {
      hash.paypalRedirect = true; // This becomes a flag for whether or not we will be polling on the page
      if (params.existingCredit) {
        this.set('initialCreditBalance', decodeURIComponent(params.existingCredit));
      }
    }

    return Ember.RSVP.hash(hash);
  },

  afterModel: function(routeModel) {
    if (routeModel.billingState.alert_enabled) {
      this.controllerFor('settings.billing').set('billingAlertEnabled', routeModel.billingState.alert_enabled);
    }
    if (routeModel.billingState.alert_dollars_amount) {
      this.controllerFor('settings.billing').set('billingAlertDollarsAmount', routeModel.billingState.alert_dollars_amount);
    }
    if (routeModel.billingState.taxation_identity) {
      this.controllerFor('settings.billing').set('taxId', routeModel.billingState.taxation_identity);
    }
    if (routeModel.creditCards) {
      this.controllerFor('settings.billing').set('displayCreditCards', routeModel.creditCards.slice());
    }
    if (routeModel.paypalRedirect) {
      updateQueryStringParams({
        paypal: null,
        existingCredit: null
      });

      this.controllerFor('settings.billing').set('billingTab', 'paypal');
      Ember.run.scheduleOnce('afterRender', this, () => {
        App.NotificationsManager.show('Paypal payment processing.', 'notice');
      });
      App.User.poll((model) => {
        if(!_.isNull(this.get('initialCreditBalance'))) {
          let initialCreditBalance = parseFloat(this.get('initialCreditBalance'));
          let currentBalance = parseFloat(model.get('credit'));
          // If the credit amount has just increased
          // -20 credit is $20 of credits
          // With a $5 paypal payment that equals -25 credit
          if (currentBalance < initialCreditBalance) {
            this.set('initialCreditBalance', currentBalance);
            App.NotificationsManager.show('Credit successfully added.', 'notice');
            App.User.cancelPoll();
          }
        }
        this.controllerFor('settings.billing').set('model.user', App.User = model);
      });
    }
  },

  resetController: function (controller) {
    controller.set('paypal', null);
    controller.set('existingCredit', null);
  },

  actions: {
    willTransition: function () {
      App.User.cancelPoll();
    }
  }
});
