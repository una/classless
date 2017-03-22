import Ember from 'ember';
import { get } from '../../../../utils/apiHelpers';
import ENV from '../../../../config/environment';
import { camelizeObject } from '../../../../utils/normalizeObjects';

function getLoadBalancerStats(loadBalancer, droplets, period) {
  return Ember.RSVP.hash({
    frontendReqPerSec: loadBalancer.getTimeSeriesStatistics('haproxy_frontend_http_requests_per_second', period),
    frontendConnections: loadBalancer.getTimeSeriesStatistics('haproxy_frontend_connections', period),
    frontendTrafficRecAndSent: loadBalancer.getTimeSeriesStatistics('haproxy_frontend_traffic_received_and_sent', period),
    frontendHttpResponses: loadBalancer.getTimeSeriesStatistics('haproxy_frontend_http_responses', period),
    frontendReqDuration: loadBalancer.getTimeSeriesStatistics('haproxy_frontend_http_request_duration', period),
    backendHttpResponses: loadBalancer.getTimeSeriesStatistics('haproxy_backend_http_responses', period),
    backendDowntime: loadBalancer.getTimeSeriesStatistics('haproxy_backend_downtime', period),
    backendQueueSize: loadBalancer.getTimeSeriesStatistics('haproxy_backend_queue_size', period),
    backendHealthChecks: loadBalancer.getTimeSeriesStatistics('haproxy_backend_health_checks', period),
    backendUp: loadBalancer.getTimeSeriesStatistics('haproxy_backend_up', period),
    loadBalancer: loadBalancer,
    droplets: droplets
  });
}

export default Ember.Route.extend({
  queryParams: {
    period: {
      refreshModel: false
    }
  },

  initRoute: function() {
    this.initialModelLoad = true;
  }.on('deactivate', 'init'),

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

  model: function(params) {
    params = params || {period: 'hour'};
    params.period = params.period || 'hour';

    const loadBalancer = this.modelFor('networking.loadBalancers.show');
    const droplets = this.getDropletsForLB();

    return getLoadBalancerStats(loadBalancer, droplets, params.period);
  },

  setupController: function(controller, models) {
    const loadBalancer = this.modelFor('loadBalancer');
    controller.set('loadBalancer', loadBalancer);
    controller.set('model', models);
    controller.set('getLoadBalancerStats', getLoadBalancerStats);
    controller.set('getDropletsForLB', this.getDropletsForLB.bind(this));
    this.controller = controller;
  },

  actions: {
    loading: function() {
      if(!this.initialModelLoad) {
        this.controller.send('loading');
      }
      return this.initialModelLoad;
    },
    didTransition: function () {
      this.initialModelLoad = false;
    }
  }
});
