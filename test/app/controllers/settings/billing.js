import Ember from 'ember';
import BaseController from '../base';
import App from '../../app';
import ENV from '../../config/environment';
import {CURRENCY_USD_PRECISION} from '../../constants';
import {post, put} from '../../utils/apiHelpers';
import {camelizeObject} from '../../utils/normalizeObjects';
import _ from 'lodash/lodash';

let formatAmount = function(amount) {
  amount = Math.abs(amount) || 0
  return parseFloat(amount).toFixed(CURRENCY_USD_PRECISION);
};

let hasMorePages = function (collection) {
  return collection && collection.meta && collection.meta.pagination && collection.meta.pagination.pages > 1;
};

export default BaseController.extend({
  queryParams: [
    'paypal',
    'existingCredit'
  ],
  paypal: null,
  existingCredit: null,
  trackPageName: 'Settings Billing',
  showPayNowModal: false,
  showDeleteBankAccountModal: false,
  showCCModal: false,
  showDeleteTaxationIdentityModal: false,
  sendingUserPayment: false,
  page: 1,
  paginating: false,
  addingBankAccount: false,
  verifyingBankAccount: false,
  deletingBankAccount: false,
  routingNumber: null,
  accountNumber: null,
  bankAccountsEnabled: App.featureEnabled('ach'),
  billingTab: 'credit-card',
  creditCards: [],
  savingCreditCard: false,
  promo: null,
  savingPromo: false,
  billingService: Ember.inject.service('billing'),
  deletingCreditCard: false,
  taxId: null,
  savingTaxId: false,
  deletingTaxId: false,
  billingAlertEnabled: null,
  billingAlertDollarsAmount: null,
  savingBillingAlert: false,
  taxIdModel: null,
  displayCreditCards: [],

  needsPagination: Ember.computed('model', 'error', function() {
    return !this.get('error') && hasMorePages(this.get('model.events'));
  }),

  getTaxIdModel: function() {
    if (!this.get('taxIdModel')) {
      this.store.push(this.store.normalize('taxation-identity', {
        taxation_id: this.get('taxId')
      }));
      this.set('taxIdModel', this.store.peekRecord('taxation-identity', this.get('taxId')));
    }
    return this.get('taxIdModel');
  },

  init: function() {
    this.resetProperties();
  },

  formattedBalance: Ember.computed('model.user.balance', function() {
    return formatAmount(this.get('model.user.balance'));
  }),

  formattedCredit: Ember.computed('model.user.credit', function() {
    return -1 * parseFloat(this.get('model.user.credit')).toFixed(CURRENCY_USD_PRECISION);
  }),

  formattedUsage: Ember.computed('model.billingState.current_invoice_total', function() {
    return formatAmount(this.get('model.billingState.current_invoice_total'));
  }),

  payNowTooltip: Ember.computed('formattedBalance', function() {
    return `Pay your entire balance of $${this.get('formattedBalance')}`;
  }),

  paypalReturnURL: Ember.computed('model.user', 'model.user.credit', 'formattedCredit', function() {
    return document.location.href;
  }),

  sendUserPayment: function() {
    this.get('model.user').sendCCPayment().then(() => {
      // Since this is a complete balance payment we're setting balance to 0
      //   This should be updated if partial payments are allowed
      this.set('model.user.balance', 0);
      App.NotificationsManager.show('Your payment has been successfully submitted.', 'notice');
    }).catch((err) => {
      this.errorHandler(err, 'Sending user payment');
    }).finally(() => {
      this.set('sendingUserPayment', false);
    });
  },

  integerErrorName: Ember.computed('billingAlertDollarsAmount', function() {
    if (_.isNumber(this.get('billingAlertDollarsAmount')) && this.get('billingAlertDollarsAmount') % 1 === 0) {
      return null;
    } else if (this.get('billingAlertDollarsAmount').length > 11) {
      return 'Too large';
    }
    return 'Invalid number';
  }),

  hasNotEditedBillingAlert: Ember.computed('model.billingState.alert_enabled', 'billingAlertEnabled', 'model.billingState.alert_dollars_amount', 'billingAlertDollarsAmount', function () {
    let hasNotEditedEnabled = !!this.get('model.billingState.alert_enabled') === !!this.get('billingAlertEnabled');
    let hasNotEditedDollarsAmount = this.get('model.billingState.alert_dollars_amount') === parseInt(this.get('billingAlertDollarsAmount'), 10);
    return hasNotEditedEnabled && hasNotEditedDollarsAmount;
  }),

  saveBillingAlert: function () {
    this.set('savingBillingAlert', true)
    let billingAlertEnabled = this.get('billingAlertEnabled');
    let billingAlertDollarsAmount = this.get('billingAlertDollarsAmount');
    if (billingAlertEnabled || billingAlertDollarsAmount) {
      let uri = '/' + ENV['api-namespace'] + '/billing/alert/';
      put(uri, {
        billing_alert: {
          enabled: billingAlertEnabled,
          dollars_amount: billingAlertDollarsAmount
        }
      }).then((response) => {
        response.json().then(() => {
          this.set('model.billingState.alert_enabled', billingAlertEnabled);
          this.set('model.billingState.alert_dollars_amount', parseInt(billingAlertDollarsAmount, 10));
          App.NotificationsManager.show('Billing alert saved successfully.', 'notice');
        });
      }).catch((err) => {
        this.errorHandler(err, 'Saving Billing Alert');
      }).finally(() => {
        this.set('savingBillingAlert', false);
      });
    }
  },

  resetProperties: function () {
    this.set('paginating', false);
  },

  addBankAccount: function() {
    let bankAccount = this.store.createRecord('bankAccount', {
      routingNumber: this.get('routingNumber'),
      accountNumber: this.get('accountNumber')
    });

    bankAccount.save().then((record) => {
      this.set('model.bankAccount', record);
      App.NotificationsManager.show('Successfully added bank account.', 'notice');
    }).catch((err) => {
      this.errorHandler(err, 'Adding Bank Account');
    }).finally(() => {
      this.set('addingBankAccount', false);
    });
  },

  verifyBankAccount: function() {
    this.get('model.bankAccount').verify({
      amount_1: this.get('microDeposit1'),
      amount_2: this.get('microDeposit2')
    }).then(() => {
      this.set('model.bankAccount.isVerified', true);
      App.NotificationsManager.show('Confirmed bank account.', 'notice');
    }).catch((err) => {
      this.errorHandler(err, 'Verifying Bank Account');
    }).finally(() => {
      this.set('verifyingBankAccount', false);
    });
  },

  deleteBankAccount: function() {
    this.get('model.bankAccount').delete().then(() => {
      this.set('model.bankAccount', null);
      App.NotificationsManager.show('Bank account removed.', 'notice');
    }).catch((err) => {
      this.errorHandler(err, 'Removing Bank Account');
    }).finally(() => {
      this.set('deletingBankAccount', false);
    });
  },

  paypalLoading: Ember.computed('model.pageLoadTime', 'model.user', 'model.user.credit', 'paypalPending', function() {
    return !!this.get('model.pageLoadTime') || this.get('paypalPending');
  }),

  initializeBillingService: Ember.on('init', function () {
    this.get('billingService').loadStripe();
    this.get('billingService').loadStripePaymentLib();
  }),

  saveCard: function (card) {
    let creditCard = this.store.createRecord('credit-card');
    //Submit token to our api
    creditCard.save(card).then((response) => {
      response.json().then((json) => {
        let cardResponse = camelizeObject(json.user_payment_profile);
        creditCard.setProperties(cardResponse);
        this.set('model.creditCards', this.store.peekAll('credit-card'));
        this.set('displayCreditCards', this.store.peekAll('credit-card').slice());
        App.NotificationsManager.show('Credit card added successfully.', 'notice');
        this.set('showCCModal', false);
      });
    }).catch((err) => {
      creditCard.deleteRecord();
      this.errorHandler(err, 'Saving Credit Card');
    }).finally(() => {
      this.set('savingCreditCard', false);
    });
  },

  savePromoCode: function () {
    this.set('savingPromo', true)
    let promoCode = this.get('promo');
    if (promoCode) {
      let uri = '/' + ENV['api-namespace'] + '/billing/promos/';
      post(uri, {
        code: promoCode
      }).then((response) => {
        response.json().then((json) => {
          let promoAmount = json.amount;
          this.set('model.billingState.promo_amount', promoAmount);
          this.set('model.billingState.promo_code', promoCode);
          App.NotificationsManager.show('Promo code added successfully.', 'notice');
          this.set('promo', null);
        });
      }).catch((err) => {
        this.errorHandler(err, 'Applying Promo Code');
      }).finally(() => {
        this.set('savingPromo', false);
      });
    }
  },

  deleteCC: function (card) {
    this.set('deletingCreditCard', true);
    card.destroyRecord().then(() => {
      card.unloadRecord();
      this.set('model.creditCards', this.get('model.creditCards').rejectBy('id', card.id));
      this.set('displayCreditCards', this.get('model.creditCards').slice());
      App.NotificationsManager.show('Credit card deleted successfully.', 'notice');
    }).catch((err) => {
      this.errorHandler(err, 'Deleting Credit Card');
    }).finally(() => {
      this.set('deletingCreditCard', false);
    });
  },

  taxationStatus: Ember.computed('model.billingState.taxation_status', function() {
    return this.get('model.billingState.taxation_status');
  }),

  indianTaxation: Ember.computed('taxationStatus.taxation_location_iso3', function() {
    return this.get('taxationStatus.taxation_location_iso3') === 'IND' && App.featureEnabled('indianTaxation');
  }),

  taxationType: Ember.computed('taxationStatus.taxation_scheme_name', function() {
    return this.get('taxationStatus.taxation_scheme_name') + ' ID';
  }),

  taxationModalTitle: Ember.computed(function() {
    return `Remove ${this.get('taxationType')}`;
  }),

  taxationIdSubmitButtonText: Ember.computed('model.billingState.taxation_identity', function () {
    return this.get('model.billingState.taxation_identity') ? 'Update' : 'Save';
  }),

  hasNotEditedTaxationId: Ember.computed('model.billingState.taxation_identity', 'taxId', function () {
    return this.get('model.billingState.taxation_identity') === this.get('taxId');
  }),

  updateTaxId: function() {
    let taxIdModel = this.getTaxIdModel();
    taxIdModel.set('taxationId', this.get('taxId'));
    taxIdModel.update().then(() => {
      App.NotificationsManager.show(this.get('taxationType') + ' updated successfully.', 'notice');
      this.set('model.billingState.taxation_identity', this.get('taxId'));
    }).catch((err) => {
      this.errorHandler(err, 'Updating Taxation ID');
    }).finally(() => {
      this.set('savingTaxId', false);
    });
  },

  saveTaxId: function() {
    if (this.get('model.billingState.taxation_identity')) {
      this.updateTaxId();
      return;
    }
    let taxIdModel = this.store.createRecord('taxation-identity');
    this.set('taxIdModel', taxIdModel)
    taxIdModel.set('taxationId', this.get('taxId'));
    taxIdModel.save().then(() => {
      App.NotificationsManager.show(this.get('taxationType') + ' added successfully.', 'notice');
      this.set('model.billingState.taxation_identity', this.get('taxId'));
    }).catch((err) => {
      this.errorHandler(err, 'Saving Taxation ID');
    }).finally(() => {
      this.set('savingTaxId', false);
    });
  },

  deleteTaxId: function() {
    this.getTaxIdModel().delete().then(() => {
      App.NotificationsManager.show(this.get('taxationType') + ' removed successfully.', 'notice');
      this.set('model.billingState.taxation_identity', null);
      this.set('taxId', null);
    }).catch((err) => {
      this.errorHandler(err, 'Removing Taxation ID');
    }).finally(() => {
      this.set('deletingTaxId', false);
    });
  },

  actions: {
    savePromoCode: function() {
      this.savePromoCode();
    },

    showPayNowModal: function() {
      this.set('showPayNowModal', true);
    },

    saveBillingAlert: function() {
      this.set('savingBillingAlert', true);
      this.saveBillingAlert();
    },

    showDeleteBankAccountModal: function() {
      this.set('showDeleteBankAccountModal', true);
    },

    deleteBankAccount: function(confirm) {
      this.set('showDeleteBankAccountModal', false);
      if(confirm) {
        this.set('deletingBankAccount', true);
        this.deleteBankAccount();
      }
    },

    confirmPayNow: function(confirm) {
      this.set('showPayNowModal', false);
      if(confirm) {
        this.set('sendingUserPayment', true);
        this.sendUserPayment();
      }
    },

    changePage: function() {
      this.trackAction('Change billing history page');
      this.set('paginating', true);
    },

    modelLoaded: function () {
      this.resetProperties();
    },

    modelError: function () {
      this.resetProperties();
    },

    showTab: function(tabName) {
      this.set('billingTab', tabName);
    },

    onPaypalSubmit: function() {
      this.set('paypalPending', true);
    },

    onStripeSuccess: function(card) {
      this.saveCard(card);
    },

    addBankAccount: function() {
      this.set('addingBankAccount', true);
      this.addBankAccount();
    },

    verifyBankAccount: function() {
      this.set('verifyingBankAccount', true);
      this.verifyBankAccount();
    },

    deleteCC: function(cc) {
      this.deleteCC(cc);
    },

    showCCModal: function() {
      this.set('showCCModal', true);
    },

    hideCCModal: function() {
      this.set('showCCModal', false);
    },

    saveTaxId: function() {
      this.set('savingTaxId', true);
      this.saveTaxId();
    },

    showDeleteTaxationIdentityModal: function() {
      this.set('showDeleteTaxationIdentityModal', true);
    },

    deleteTaxId: function(confirm) {
      this.set('showDeleteTaxationIdentityModal', false);
      if(confirm) {
        this.set('deletingTaxId', true);
        this.deleteTaxId();
      }
    }
  }
});
