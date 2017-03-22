import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'li',
  classNames: ['credit-card'],
  classNameBindings: ['card.isSelected:credit-card-selected'],

  name: function() {
    return this.get('card.name') || this.get('card.billingName');
  }.property('card.name', 'card.billingName'),

  inputId: function() {
    return '' + this.get('card.id') + this.get('card.lastFour');
  }.property('card.id', 'card.lastFour'),

  expiresDate: function() {
    let dateParts = this.get('card.expirationMonthAndYear');
    return dateParts.month + '/' + dateParts.year;
  }.property('card.expirationMonthAndYear'),

  isExpired: function() {
    let expirationDate = this.get('card.formattedExpirationDate');
    let now = new Date();

    if(expirationDate) {
      return expirationDate < now;
    }

    return false;
  }.property('card.formattedExpirationDate')
});
