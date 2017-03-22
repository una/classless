import Ember from 'ember';

const DELETE_DELAY_MS = 500;

export default Ember.Route.extend({

  model: function() {
    let thresholds = this.store.findAll('threshold');
    let activeAlerts = this.store.findAll('activeAlert');

    return Ember.RSVP.hash({
      thresholds: thresholds,
      activeAlerts: activeAlerts
    });
  },

  setupController: function(controller, model) {
    this._super(controller, model);
    this.controller.set('menuItems', [{
      name: 'Edit'
    }, {
      name: 'Delete'
    }]);
  },

  actions: {
    didTransition: function() {
      this.controllerFor('monitors').send(this.error ? 'modelError' : 'modelLoaded');
    },
    menuItemClick: function(clickedKey, threshold) {
      if(clickedKey === 'Edit') {
        this.transitionTo('monitors.edit', threshold.get('id'));
      } else if (clickedKey === 'Delete') {
        this.controllerFor('monitors').set('thresholdBeingDeleted', threshold);
      }
    },
    confirmDelete: function(res) {
      if (res) {
        let threshold = this.controllerFor('monitors').get('thresholdBeingDeleted');
        this.store.deleteRecord(threshold);
        threshold.save();

        Ember.run.later(this, () => {
          this.controllerFor('monitors').set('thresholdBeingDeleted', false);
        }, DELETE_DELAY_MS);
      }
    },
    loading: function(transition) {
      return !transition.queryParams.wasCancelled;
    }
  }
});
