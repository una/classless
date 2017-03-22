import Ember from 'ember';
import PollModelMixin from '../../../mixins/poll-model';

export default Ember.Route.extend({
  titleToken: 'Load Balancers',

  queryParams: {
    page: {
      refreshModel: true
    }
  },

  combinedLoadBalancerMetrics: Ember.inject.service(),

  model: function(params) {
    this.set('cachedParams', params);

    return Ember.RSVP.hash({
      loadBalancers: this.store.query('load-balancer', params)
    });
  },

  setupController: function(controller, model) {
    this._super(...arguments);

    this.updateMetrics(model.loadBalancers);
  },

  updateMetrics: function(loadBalancers) {
    const metricsService = this.get('combinedLoadBalancerMetrics');
    const loadBalancerIds = loadBalancers.map((lb) => lb.get('id'));

    metricsService.getMetricsForLoadBalancers(
      loadBalancerIds,
      'haproxy_backend_up',
      '6hour'
    ).then((backendUp) => {
      this.setProperties({
        'controller.model.backendUp': backendUp,
        'controller.backendUpLoaded': true
      });
    }).catch(() => {
      if (!this.get('controller.backendUpLoaded')) {
        this.set('controller.backendUpUnavailable', true);
      }
    });

    metricsService.getMetricsForLoadBalancers(
      loadBalancerIds,
      'haproxy_frontend_http_requests_per_second',
      '6hour'
    ).then((frontendReqPerSec) => {
      this.setProperties({
        'controller.model.frontendReqPerSec': frontendReqPerSec,
        'controller.frontendReqPerSecLoaded': true
      });
    }).catch(() => {
      if (!this.get('controller.frontendReqPerSecLoaded')) {
        this.set('controller.frontendReqPerSecUnavailable', true);
      }
    });
  },

  cancelPolling: function () {
    const modelPoller = this.get('modelPoller');

    if (modelPoller) {
      modelPoller.cancelPoll();
      this.set('modelPoller', null);
    }
  },

  willDestroy: function() {
    this.cancelPolling();
    this._super(...arguments);
  },

  onDeactivate: function() {
    this.cancelPolling();

    // Hide welcome message and "just now" timestamp when transitioning away.
    this.get('controller.model.loadBalancers').forEach((lb) => {
      lb.set('justCreated', false);
    });
  }.on('deactivate'),

  actions: {
    didTransition: function() {
      const poller = Ember.Object.extend(PollModelMixin);
      const modelPoller = poller.create();

      modelPoller.reload = () => {
        return this.model(this.get('cachedParams')).then((model) => {
          this.set('controller.model.loadBalancers', model.loadBalancers);
          this.updateMetrics(model.loadBalancers);
        });
      };

      modelPoller.poll(
        () => false,
        () => false,
        10000 // eslint-disable-line no-magic-numbers
      );

      this.set('modelPoller', modelPoller);
    }
  }
});
