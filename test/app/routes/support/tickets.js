import Ember from 'ember';

export default Ember.Route.extend({
  queryParams: {
    page: {
      refreshModel: true
    },
    filter: {
      refreshModel: true
    }
  },

  model: function (params) {
    let status = params['filter'] ? params['filter'] : 'open';
    let page = params['page'] ? params['page'] : 1;
    return this.store.query('ticket', { page: page, status: status });
  },

  actions: {
    selectTicketItem(ticketId) {
      this.transitionTo('support.tickets.ticket.index', ticketId);
    }
  }
});
