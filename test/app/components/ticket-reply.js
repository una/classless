import Ember from 'ember';
export default Ember.Component.extend({
  tagName: 'li',
  classNames: ['Ticket', 'Ticket-comment'],

  actions: {
    sendFeedback: function(...feedback) {
      this.sendAction('sendFeedback', ...feedback);
    }
  }
});
