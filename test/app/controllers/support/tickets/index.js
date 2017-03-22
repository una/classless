import Ember from 'ember';

export default Ember.Controller.extend({
  needs: 'tickets',
  ticketsController: Ember.inject.controller('support.tickets'),
  filter: Ember.computed.reads('ticketsController.filter'),

  currentFilterPartial: function() {
    return ['support/tickets', this.get('filter')].join('/');
  }.property('filter'),

  shouldShowClosedTicketsBlankSlate: function () {
    if (this.get('model.meta.anyTickets') &&
        this.get('model.length') === 0) {
      return true;
    }

    return false;
  }.property('model')
});
