import Ember from 'ember';
import _ from 'lodash/lodash';

export default Ember.Component.extend({
  classNames: ['team-billing-form'],
  selectedCreditCard: null,
  selectedCreditOption: null,
  billingTab: 'credit-card',
  isLoadingCreditCards: false,
  savingCreditCard: false,

  setup: function() {
    this.skipForFreeUsers();
    Ember.run.scheduleOnce('afterRender', this, this.creditValue);
  }.on('didInsertElement'),

  skipForFreeUsers: function() {
    if (this.get('isFree') && this.get('onSubmit')) {
      this.sendAction('onSubmit');
    }
  },

  _cardsSortingOrder: ['createdAt'],

  sortedValidCreditCards: Ember.computed.sort('validCreditCards', '_cardsSortingOrder'),

  validCreditCards: function() {
    let cards = this.get('creditCards');

    if(cards) {
      cards = cards.slice();
      let today = new Date();

      return cards.filter(function(card) {
        return !card.get('knownExpirationDate') || card.get('formattedExpirationDate') > today;
      });
    }
    return [];
  }.property('creditCards', 'creditCards.length', 'creditCards.@each.id'),

  creditValue: function() {
     let selectedOption = this.get('selectedCreditOption');
     let value = 0;

    if(selectedOption === 'credit-option-balance') {
      value = this.get('creditBalanceValue');
    } else if(selectedOption === 'credit-option-custom') {
      if(this.get('creditCustomValue') <= this.get('creditBalanceValue')) {
        value = this.get('creditCustomValue');
      }
    }

    this.set('credits', value);
  }.observes('selectedCreditOption', 'creditBalanceValue', 'creditCustomValue'),

  setSelectedCreditCard: function() {
    let creditCards = this.get('validCreditCards');
    let selectedCreditCard = _.find(creditCards, {id: this.get('selectedCreditCard.id')});

    if(selectedCreditCard) {
      selectedCreditCard.set('isSelected', false);
    }

    this.setProperties({
      selectedCreditCard: _.find(creditCards, {isSelected: true})
    });
  }.observes('validCreditCards.@each.isSelected'),

  hasEnoughCredits: function() {
    return this.get('credits') >= this.get('minCredits');
  }.property('selectedCreditOption', 'creditBalanceValue', 'creditCustomValue', 'minCredits'),

  maxCreditBalanceValue: function() {
    return Math.max(this.get('creditBalanceValue'), this.get('minCredits'));
  }.property('creditBalanceValue'),

  actions: {
    showTab: function(tabName) {
      this.set('billingTab', tabName);
    },
    onClickCreditOption: function(creditOptionId) {
      this.set('selectedCreditOption', creditOptionId);
    },
    onSubmit: function() {
      if(this.get('onSubmit')) {
        this.sendAction('onSubmit');
      }
    },
    onCCModalHide: function() {
      this.set('showCCForm', false);
    },
    toggleCCForm: function() {
      this.set('showCCForm', true);
    },
    togglePaypalForm: function() {
      this.set('showPaypalForm', true);
    },
    onPaypalModalHide: function() {
      this.set('showPaypalForm', false);
    },
    onPaypalSubmit: function() {
      if (this.get('onPaypalSubmit')) {
        this.sendAction('onPaypalSubmit');
      }
    }
  }
});
