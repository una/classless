import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return Ember.RSVP.hash({
      loadBalancer: this.modelFor('networking.loadBalancers.show'),
      loadBalancers: this.store.findAll('load-balancer'),
      certificates: this.store.findAll('certificate')
    });
  },

  resetControllerState: function() {
    this.controller.send('resetState');
  }.on('deactivate')
});
