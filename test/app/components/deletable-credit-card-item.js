import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'tr',
  classNames: ['payment_profile'],
  showDeleteModal: false,

  name: Ember.computed('card.name', 'card.billingName', function() {
    return this.get('card.name') || this.get('card.billingName');
  }),

  expiresDate: Ember.computed('card.expirationMonthAndYear', function() {
    let dateParts = this.get('card.expirationMonthAndYear') || {};
    return dateParts.month + '/' + dateParts.year;
  }),

  isExpired: Ember.computed('card.formattedExpirationDate', function() {
    let expirationDate = this.get('card.formattedExpirationDate');
    let now = new Date();

    if(expirationDate) {
      return expirationDate < now;
    }

    return false;
  }),

  actions: {
    showDeleteModal: function () {
      if (!this.get('deletingCard')) {
        this.set('showDeleteModal', true);
      }
    },

    confirmDelete: function (confirm) {
      this.set('showDeleteModal', false);
      if(confirm && this.get('onDelete')) {
        this.get('onDelete')(this.get('card'));
      }
    }
  }
});

