import Ember from 'ember';

export default Ember.Route.extend({
  // XXX(nan) ugh, this shouldn't have been done...
  // We should refactor our template to not need this.
  renderTemplate() {
    this._super();
    this.render('support/suggestions/search', {
      outlet: 'header'
    });
  },

  actions: {
    openNewTicket(location) {
      if(this.segment) {
        this.segment.trackEvent('Lifeboat open new ticket form', { from: location });
      }
      this.transitionTo('support.tickets.new');
    },
    didTransition: function() {
      if (this.controller.$columns) {
        Ember.run.next(this.controller.reSetupStickyCols.bind(this.controller));
      }
      return true;
    }
  }
});
