import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Support Center',
  actions: {
    openTicketsIndex() {
      if(this.segment) {
        this.segment.trackEvent('Lifeboat open tickets index', { from: 'header nav' });
      }
      this.transitionTo('support.tickets.index');
    },

    retryCurrentRoute() {
      let transition = this.get('retryTransition');
      if (transition) {
        transition.retry();
      }else{
        window.location.reload();
      }
    }
  }
});
