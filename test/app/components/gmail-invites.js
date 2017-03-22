import Ember from 'ember';
import _ from 'lodash/lodash';

export default Ember.Component.extend({
  classNames: 'gmail-invites',
  searchQuery: '',

  atMaxCapacity: function() {
    return this.get('selectedContacts.length') >= this.get('limit');
  }.property('limit', 'selectedContacts'),

  filteredContacts: function() {
    let searchQuery = this.get('searchQuery');
    let contacts = this.get('contacts').slice();

    if(searchQuery) {
      searchQuery = searchQuery.toLowerCase().trim();
      return _.filter(contacts, function(contact) {
        let email = contact.email ? contact.email.toLowerCase() : '';
        let fullName = contact.full_name ? contact.full_name.toLowerCase() : '';

        if(email.indexOf(searchQuery) > -1 || fullName.indexOf(searchQuery) > -1) {
          return contact;
        }
      });
    }

    return contacts;
  }.property('contacts', 'searchQuery'),

  contactsObserver: function() {
    if(this.get('updateInvites')) {
      let emails = [];

      emails = this.get('selectedContacts').slice().map(function(contact) {
        return contact.email;
      });

      this.sendAction('updateInvites', emails);
    }
  }.observes('selectedContacts'),

  selectedContacts: function() {
    let contacts = this.get('contacts').slice();
    return _.filter(contacts, {isSelected: true});
  }.property('contacts.@each.isSelected')
});
