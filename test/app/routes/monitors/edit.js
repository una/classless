import Ember from 'ember';
import MonitorAddRoute from './add';
import MonitorNewRoute from './new';
import App from '../../app';

let BaseRoute;

if (App.featureEnabled('newMonitorCreate')) {
  BaseRoute = MonitorNewRoute;
} else {
  BaseRoute = MonitorAddRoute;
}

export default BaseRoute.extend({

  beforeModel(transition) {
    let threshold_id = transition.params['monitors.edit'].threshold_id;

    return this.store.findRecord('threshold', threshold_id, {reload: true})
    .catch(() => {
      this.transitionTo('monitors');
      App.NotificationsManager.show('Sorry! Monitor you requested could not be found in list of your monitors.', 'alert');
    });
  },

  model(params) {
    let modelPromise = Ember.RSVP.hash({
      endpoints: this.get('enums.endpoints'),
      threshold: this.store.peekRecord('threshold', params.threshold_id),
      socialIdentities: this.store.findAll('social-identity')
    });

    if (!App.featureEnabled('newMonitorCreate')) {
      modelPromise = modelPromise.then(this.autoCompleteModel.bind(this));
    }

    return modelPromise;
  },

  setupController: function(controller, model) {
    this._super(controller, model);
    this.controller.set('modalTitle', 'Edit alert policy');
  },

  actions: {
    loading: function(transition) {
      this.controllerFor('monitors.index').setProperties({
        'editLoading': true,
        'thresholdId': transition.params['monitors.edit'].threshold_id
      });
      transition.promise.finally(() => {
        this.controllerFor('monitors.index').setProperties({
          'editLoading': false,
          'thresholdId': null
        });
      });
    }
  }
});
