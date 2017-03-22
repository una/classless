import Ember from 'ember';

export default Ember.Route.extend({
  model: function (params) {
    return this.store.findRecord('droplet', params.droplet_id);
  },

  beforeModel: function (transition) {
    if (transition.targetName === 'droplet.index') {
      this.transitionTo('droplet.graphs');
    }
  },

  afterModel: function (model, transition) {
    if(model.get('hasBeenDestroyed') && transition.targetName !== 'droplet.history') {
      this.transitionTo('droplet.history');
    }
  },

  redirect: function () {
    let droplet = this.modelFor('droplet');
    if(droplet.get('adminLocked')) {
      this.transitionTo('droplet_admin_locked');
    }
  },

  setupController: function (controller, model) {
    model.getHostMetrics()
      .then((metrics) => {
        let hasMetrics = !!(metrics && metrics[0] && metrics[0].metrics && metrics[0].metrics.length);
        controller.setProperties({
          hasMetrics: hasMetrics,
          shouldSeeUpdateMessage: !hasMetrics
        });
      }).catch((err) => {
        controller.logException(err, 'Getting Host Metrics');
      });

    this.set('titleToken', model.get('name'));
    controller.setProperties({
      model: model,
      hasMetrics: false,
      shouldSeeUpdateMessage: false
    });
  },

  onDeactivate: function () {
    this.controllerFor('droplet').send('pageUnloaded');
  }.on('deactivate'),

  actions: {
    loading: function () {
      return true;
    }
  }
});
