import Ember from 'ember';
// import {LinkView} from 'ember';

export default Ember.Component.extend({
  classNameBindings: 'isSelected:selected :source-item'.w(),

  isSelected: false,

  authorName: function() {
    return this.get('user.fullName');
  }.property('ticket.user'),

  click() {
    this.sendAction('select', this.get('ticket.id'));
  }
});
