import Ember from 'ember';
import { get } from '../../../../utils/apiHelpers';
import ENV from '../../../../config/environment';
import { camelizeObject } from '../../../../utils/normalizeObjects';

export default Ember.Route.extend({
  model: function() {
    const loadBalancer = this.modelFor('networking.loadBalancers.show');

    return Ember.RSVP.hash({
      loadBalancer: loadBalancer,
      droplets: this.getDropletsForLB(),
      backendUp: loadBalancer.getTimeSeriesStatistics('haproxy_backend_up', 'hour'),
      backendDowntime: loadBalancer.getTimeSeriesStatistics('haproxy_backend_downtime', 'hour'),
      backendQueueSize: loadBalancer.getTimeSeriesStatistics('haproxy_backend_queue_size', 'hour'),
      backendHealthChecks: loadBalancer.getTimeSeriesStatistics('haproxy_backend_health_checks', 'hour'),
      tag: loadBalancer.get('tag')
        ? this.store.queryRecord('tag', { query: loadBalancer.get('tag') })
        : null
    });
  },

  getDropletsForLB: function() {
    const id = this.modelFor('networking.loadBalancers.show').get('id');

    return new Ember.RSVP.Promise((resolve, reject) => {
      get(`/${ENV['api-namespace']}/load_balancers/${id}/droplets`)
        .then((resp) => resp.json())
        .then((body) => {
          resolve(body.droplets.map((droplet) => (
            Ember.Object.create(camelizeObject(droplet))
          )));
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  resetControllerState: function() {
    this.controller.send('resetState');
  }.on('deactivate'),

  actions: {
    refreshModel: function() {
      this.model().then((model) => {
        this.setupController(this.controller, model);
        this.controller.send('afterModelRefresh');
      });
    }
  }
});
