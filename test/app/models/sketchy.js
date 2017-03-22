import Ember from 'ember';

export default Ember.Object.extend({
  firstName: null,
  lastName: null,
  phoneNumber: null,
  location: null,
  typeOfTraffic: null,
  otherAccounts: null,
  whyNewAccount: null,
  name: function() {
    return `${this.get('firstName')} ${this.get('lastName')}`;
  }.property('firstName', 'lastName')
});