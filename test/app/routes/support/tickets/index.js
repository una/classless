import Ember from 'ember';

export default Ember.Route.extend({
  model: function () {
    return this.modelFor('support.tickets');
  },

  afterModel: function (model) {
    let page = this.paramsFor('support.tickets').page;
    let filter = this.paramsFor('support.tickets').filter;

    this.controllerFor('support.tickets').set('filter', filter);

    if (filter === 'open') {
      if (model.get('length') > 0) {
        this.transitionTo('support.tickets.ticket', model.get('firstObject'), {
          queryParams: {
            filter: filter,
            page: page
          }
        });
      } else if (model.get('meta.anyTickets')) {
        this.transitionTo('support.tickets.new', {
          queryParams: {
            filter: filter,
            page: page
          }
        });
      }
    } else {
      if (model.get('length') > 0) {
        this.transitionTo('support.tickets.ticket', model.get('firstObject'), {
          queryParams: {
            filter: filter,
            page: page
          }
        });
      }
    }
  }
});
