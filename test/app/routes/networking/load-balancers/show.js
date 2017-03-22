import Ember from 'ember';

export default Ember.Route.extend({
  networkingController: Ember.computed(function() {
    return this.controllerFor('networking');
  }),

  renderTemplate() {
    this.render('networking.loadBalancers.show', {
      into: 'application'
    });
  },

  model(params) {
    return this.store.findRecord('load-balancer', params.load_balancer_id);
  },

  beforeModel(transition) {
    if (transition.targetName.indexOf('networking.loadBalancers.show') === 0) {
      this.get('networkingController').set('hideNetworkingHeader', true);
    }

    if (transition.targetName === 'networking.loadBalancers.show.index') {
      this.transitionTo('networking.loadBalancers.show.droplets');
    }
  },

  deactivate() {
    this.get('networkingController').set('hideNetworkingHeader', false);
  }
});
