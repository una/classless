import Ember from 'ember';
import App from '../../../app';
import {MS_IN_SIX_MINUTES} from '../../../constants';
import updateQueryStringParams from '../../../utils/updateQueryStringParams';

export default Ember.Route.extend({
  queryParams: {
    step: {
      refreshModel: false
    }
  },
  context: Ember.inject.service('context'),
  titleToken: 'Create Team',
  pollPaypal: false,
  initialCreditBalance: null,
  renderTemplate: function () {
    this.render('settings.team.new', {
      into: 'application',
      controller: 'settings.team.new'
    });
  },

  beforeModel: function() {
    // make sure we are in the user context and can create a team
    if(!App.User.get('isUserContext')) {
      return this.get('context').switchUserContext(App.User.get('internalIdentifier'), '/settings/team/new');
    } else if(!App.User.get('canCreateTeams')) {
      this.transitionTo('settings');
    }
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

    if (App.featureEnabled('ach')) {
      modelHash.bankAccount = this.store.findAll('bankAccount').then(function (model) {
        let bankAccount = model.get('firstObject');
        if (bankAccount && bankAccount.get('isVerified')) {
          return model.get('firstObject');
        }
      }).catch(() => {
        // this catch prevents the 404 takeover if the user does not have a bank account
      });
    }

    if (params.paypal) {
      let unixTime = (Date.now() / 1000 | 0); // eslint-disable-line no-magic-numbers
      modelHash.paypalIpns = this.store.query('paypal-ipn', {
        from: unixTime
      });
      modelHash.pageLoadTime = unixTime; // This becomes a flag for whether or not we will be polling on the page
      this.set('initialCreditBalance', decodeURIComponent(params.existingCredit));
      updateQueryStringParams({
        paypal: null,
        existingCredit: null
      });
    }
    return Ember.RSVP.hash(modelHash);
  },

  afterModel: function(routeModel) {
    if (routeModel.pageLoadTime) {
      routeModel.paypalTimeout = setTimeout(() => {
        App.NotificationsManager.show('Your PayPal payment timed out. Please try again.', 'alert');
        this.controllerFor('settings.team.new').set('model.pageLoadTime', null);
        App.User.cancelPoll();
      }, MS_IN_SIX_MINUTES);

      App.User.poll((model) => {
        if (routeModel.paypalIpns) {
          let failedpayPalIpn = routeModel.paypalIpns.findBy('isFailed', true);
          if (failedpayPalIpn) {
            App.NotificationsManager.show('Your PayPal payment was unsuccessful. Please try again.', 'alert');
            Ember.set(routeModel, 'pageLoadTime', null);
            App.User.cancelPoll();
            if (routeModel.paypalTimeout) {
              clearTimeout(routeModel.paypalTimeout);
            }
          } else if (routeModel.pageLoadTime) {
            this.store.query('paypal-ipn', {
              from: routeModel.pageLoadTime
            }).then((paypalIpns) => {
              routeModel.paypalIpns = paypalIpns;
            });
          }
        }

        let initialCreditBalance = parseFloat(this.get('initialCreditBalance'));
        let currentBalance = parseFloat(model.get('credit'));
        // If the credit amount has just increased
        // -20 credit is $20 of credits
        // With a $5 paypal payment that equals -25 credit
        if (currentBalance < initialCreditBalance && routeModel.pageLoadTime) {
          App.User.cancelPoll();
          App.NotificationsManager.show('Credit successfully added.', 'notice');
          Ember.set(routeModel, 'pageLoadTime', null);
          this.controllerFor('settings.team.new').set('billingTab', 'credits');
          if (routeModel.paypalTimeout) {
            clearTimeout(routeModel.paypalTimeout);
          }
        }
        this.controllerFor('settings.team.new').set('model.user', App.User = model);
      });
    }
  },

  resetController: function (controller) {
    controller.set('paypal', null);
    controller.set('existingCredit', null);
  },

  actions: {
    getCreditCards: function() {
      this.store.findAll('creditCard', { reload: true }).then((creditCards) => {
        this.controllerFor('settings.team.new').setProperties({
          creditCards: creditCards
        });
      }).finally(() => {
        this.controllerFor('settings.team.new').setProperties({
          isLoadingCreditCards: false
        });
      });
    },
    authenticate: function(provider) {
      let controller = this.controllerFor('settings.team.new');
      this.get('torii').open(provider).then(function() {
        controller.set('isGmailAuthenticated', true);
      })
      .catch(function() {
        App.NotificationsManager.show('Oops! Something went wrong while authenticating!', 'alert');
      });
    }
  }
});
