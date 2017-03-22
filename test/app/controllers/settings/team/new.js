import Ember from 'ember';
import BaseController from '../../../controllers/base';
import App from '../../../app';
import {CURRENCY_USD_PRECISION} from '../../../constants';
import {camelizeObject} from '../../../utils/normalizeObjects';

export default BaseController.extend({
  context: Ember.inject.service('context'),
  queryParams: ['step', 'orgName', 'orgSlug', 'orgEmail', 'paypal', 'existingCredit'],
  paypal: null,
  existingCredit: null,
  step: 1,
  trackPageName: 'Create Team',
  invalidSlugs: ['droplet', 'setting', 'user', 'floating_ip'],
  validSlugs: [],
  creditCards: [],
  minCredits: 5,
  isGmailAuthenticated: false,
  newTeamId: null,
  orgName: null,
  orgSlug: null,
  orgEmail: null,
  orgTransfer: false,
  selectedCreditCard: null,
  credits: null,
  creditCustomValue: 0,
  billingTab: 'credit-card',
  selectedCreditOption: null,
  billingService: Ember.inject.service('billing'),
  showCCForm: false,
  savingCreditCard: false,
  paypalPending: false,

  stepNames: [
    'Name Team',
    'Billing Info',
    'Invite Members'
  ],

  auroraSlugRoutes: false, //Localized feature flipper for slugged routes

  init: function() {
    this.resetState();
  },

  paypalLoading: function() {
    return !!this.get('model.pageLoadTime') || this.get('paypalPending');
  }.property('model.pageLoadTime', 'model.user', 'model.user.credit', 'paypalPending'),

  initializeBillingService: function () {
    this.get('billingService').loadStripe();
    this.get('billingService').loadStripePaymentLib();
  }.on('init'),

  resetState: function() {
    this.org = this.store.createRecord('organization');

    let isFree = false;

    if(!App.User.get('isDestroying') && !App.User.get('isDestroyed')) {
      isFree = App.User.get('isFree');
    }

    this.setProperties({
      step: 1,
      newTeamId: null,
      isFree: isFree,
      paypal: null,
      existingCredit: null
    });
  },

  resetParams: function() {
    this.setProperties({
      paypal: null,
      existingCredit: null
    });
  }.observes('step'),

  creditBalance: function() {
    // -10 means the user has $10 in credits,
    // 10 means the user owes $10 in credits
    return -1 * parseFloat(App.User.get('credit')).toFixed(CURRENCY_USD_PRECISION);
  }.property('model.user.credit'),

  saveCard: function (card) {
    let creditCard = this.store.createRecord('credit-card');
    //Submit token to our api
    creditCard.save(card).then((response) => {
      response.json().then((json) => {
        let cardResponse = camelizeObject(json.user_payment_profile);
        creditCard.setProperties(cardResponse);
        creditCard.set('isSelected', true);
        this.set('showCCForm', false);
      });
    }).catch((err) => {
      this.errorHandler(err, 'Saving Credit Card');
    }).finally(() => {
      this.set('savingCreditCard', false);
    });
  },

  actions: {
    onSubmit: function(invites) {
      let creditCard = this.get('billingTab') === 'credit-card' ? this.get('selectedCreditCard') : null;
      let credits = this.get('billingTab') === 'credits' ? this.get('credits') : null;
      let bankAccountSelected = this.get('billingTab') === 'bank-accounts' && this.get('model.bankAccount.isSelected');
      let isFree = this.get('isFree') || false;

      let properties = {
        name: this.get('orgName'),
        email: this.get('orgEmail'),
        convert: this.get('orgTransfer')
      };

      if (this.get('auroraSlugRoutes')) {
        properties.slug = this.get('orgSlug');
      }

      this.org.setProperties(properties);

      this.set('isSubmitting', true);
      this.org.create(invites, creditCard, bankAccountSelected, credits, isFree).then((team) => {
        team.json().then((json) => {
          this.setProperties({
            step: 4,
            newTeamId: json.team.id
          });
          this.org.setProperties({
            id: json.team.id,
            avatarInitials: json.team.avatar_initials,
            avatarColor: json.team.avatar_color
          });
          App.User.reload();
          App.NotificationsManager.show('Team Created', 'notice');
        });
      }).catch((err) => {
        this.errorHandler(err, 'Error creating team');
      }).finally(() => {
        this.set('isSubmitting', false);
      });
    },
    onValidateSlug: function(slug) {
      // cache valid and invalid slugs to prevent duplicate requests
      let validSlugs = this.get('validSlugs').slice(),
          invalidSlugs = this.get('invalidSlugs').slice();

      if(validSlugs.indexOf(slug) !== -1) {
        this.set('isSlugValid', true);
      } else if(invalidSlugs.indexOf(slug) !== -1) {
        this.set('isSlugValid', false);
      } else {
        this.org.validateSlug(slug).then((resp) => {
          resp.json().then((json) => {
            if(json.valid) {
              validSlugs.push(slug);
              this.set('validSlugs', validSlugs);
            } else {
              invalidSlugs.push(slug);
              this.set('invalidSlugs', invalidSlugs);
            }
            this.set('isSlugValid', json.valid);
          });
        });
      }
    },
    fetchCreditCards: function() {
      this.set('isLoadingCreditCards', true);
      this.send('getCreditCards');
    },
    authenticateGmail: function() {
      this.send('authenticate', 'google-proxy');
    },
    navigateToTeamsPage: function() {
      this.get('context').switchUserContext(this.get('newTeamId'), '/settings/team/');
    },
    onErrorFetchingSocialAccountData: function(err) {
      this.errorHandler(err, 'Fetching social account identities');
    },
    onErrorFetchingGmailContacts: function(err) {
      this.errorHandler(err, 'Fetching Gmail contacts');
    },
    onStripeSuccess: function(card) {
      this.saveCard(card);
    },
    toggleCCForm: function() {
      this.set('showCCForm', true);
    },
    onPaypalSubmit: function() {
      this.set('paypalPending', true);
    }
  }
});
