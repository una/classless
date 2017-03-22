import _ from 'lodash/lodash';
import Ember from 'ember';
import App from '../../../app';
import BaseController from '../../base';
import {
  METRIC_UNAVAILABLE,
  COLLECTING_METRICS,
  METRIC_LOADING,
  COLLECTING_METRICS_TOOLTIP_TEXT
} from '../../../constants';

const LB_STATUSES = {
  loading: {
    label: 'Loading...',
    iconClass: 'lb-status-healthy'
  },
  healthy: {
    label: 'Healthy',
    iconClass: 'lb-status-healthy'
  },
  new: {
    label: 'New',
    iconClass: 'lb-status-healthy',
    tooltipText: COLLECTING_METRICS_TOOLTIP_TEXT
  },
  issue: {
    label: 'Issue',
    iconClass: 'lb-status-issue'
  },
  down: {
    label: 'Down',
    iconClass: 'lb-status-down'
  },
  noDroplets: {
    label: 'No droplets',
    iconClass: 'lb-status-down'
  }
};

export default BaseController.extend({
  loadBalancersCreationDisabled: App.featureEnabled('loadBalancersCreationBlocked'),
  queryParams: ['page'],
  paginating: false,
  page: 1,

  backendUpLoaded: false,
  frontendReqPerSecLoaded: false,
  backendUpUnavailable: false,
  frontendReqPerSecUnavailable: false,

  actionDropdownItems: [
    {
      name: 'View Droplets'
    },
    {
      name: 'View graphs'
    },
    {
      name: 'Edit settings'
    }
  ],

  loadBalancers: Ember.computed.alias('model.loadBalancers'),

  sortProp: ['createdAt.seconds:desc'],
  loadBalancersSorted: Ember.computed.sort('loadBalancers', 'sortProp'),

  lbsWithStats: Ember.computed(
    'loadBalancersSorted',
    'model.frontendReqPerSec.@each',
    'model.backendUp.@each',
    function() {
      return this.get('loadBalancersSorted').map((lb) => {
        lb.set('metrics', this.getMetricsForLB(lb));
        return lb;
      });
    }
  ),

  getMetricsForLB: function(loadBalancer) {
    const id = loadBalancer.get('id');

    let status;
    let healthyDropletCount;
    let dropletCount;
    let backendUpDroplets;
    let reqPerSec;

    backendUpDroplets = this.get(`model.backendUp.${id}.stat`);
    reqPerSec = this.getWithDefault(
      `model.frontendReqPerSec.${id}.stat.firstObject.values.lastObject.y`,
      METRIC_UNAVAILABLE
    );

    if (reqPerSec !== METRIC_UNAVAILABLE) {
      // Round to 2 decimal places at most
      reqPerSec = Math.round(reqPerSec * 100) / 100; // eslint-disable-line no-magic-numbers
    }

    // If the LB API has targetDroplets but the metrics response doesn't, we
    // assume that we're still waiting on metrics for this load balancer.
    const isCollectingMetrics = loadBalancer.get('backendDropletCount') > 0
      && backendUpDroplets && backendUpDroplets.length === 0;

    if (isCollectingMetrics || loadBalancer.get('justCreated')) {
      status = LB_STATUSES.new;
      healthyDropletCount = reqPerSec = COLLECTING_METRICS;
    } else if (backendUpDroplets) {
      const lbTargetDropletIds = loadBalancer.get('targetDroplets').map((droplet) => (
        parseInt(Ember.get(droplet, 'id'), 10)
      ));

      // On production, radar returns each backend droplet twice (one for each
      // load balancer), so we filter out the duplicates here. Note that the
      // 'name' field is not the droplet's name, but the name as returned from
      // radar, normally in the format "node-[dropletId]".
      backendUpDroplets = _.uniq(backendUpDroplets, false, 'name');

      // The metrics response can sometimes include droplets that are no longer
      // associated with a load balancer, so we want to filter those out too.
      backendUpDroplets = _.filter(backendUpDroplets, (droplet) => {
        const backendUpDropletId = parseInt(
          Ember.get(droplet, 'name').replace('node-', ''), 10
        );

        return _.includes(lbTargetDropletIds, backendUpDropletId);
      });

      const dropletStatuses = _.map(backendUpDroplets, (droplet) => (
        Ember.get(droplet, 'values.lastObject.y') > 0
      ));

      dropletCount = dropletStatuses.length;
      healthyDropletCount = _.compact(dropletStatuses).length;

      if (dropletCount === 0) {
        status = LB_STATUSES.noDroplets;
      } else if (healthyDropletCount === 0) {
        status = LB_STATUSES.down;
      } else if (healthyDropletCount < dropletCount) {
        status = LB_STATUSES.issue;
      } else {
        status = LB_STATUSES.healthy;
      }
    } else {
      status = healthyDropletCount = dropletCount = METRIC_UNAVAILABLE;
    }

    if (this.get('backendUpUnavailable')) {
      status = healthyDropletCount = dropletCount = METRIC_UNAVAILABLE;
    } else if (!this.get('backendUpLoaded')) {
      status = LB_STATUSES.loading;
      healthyDropletCount = dropletCount = METRIC_LOADING;
    }

    if (this.get('frontendReqPerSecUnavailable')) {
      reqPerSec = METRIC_UNAVAILABLE;
    } else if (!this.get('frontendReqPerSecLoaded')) {
      reqPerSec = METRIC_LOADING;
    }

    return {
      status,
      dropletCount,
      healthyDropletCount,
      reqPerSec
    };
  },

  actions: {
    changePage: function() {
      this.trackAction('Change page');
      this.set('paginating', true);
    },

    onMenuItemClick: function(loadBalancer, name) {
      if (name === 'View Droplets') {
        return this.transitionToRoute('networking.loadBalancers.show.droplets', loadBalancer);
      } else if (name === 'View graphs') {
        return this.transitionToRoute('networking.loadBalancers.show.graphs', loadBalancer);
      } else if (name === 'Edit settings') {
        return this.transitionToRoute('networking.loadBalancers.show.settings', loadBalancer);
      }
    },

    modelLoaded: function() {
      this.set('paginating', false);
    },

    onCreateComplete: function(loadBalancer) {
      loadBalancer.setProperties({
        isCreating: false,
        justCreated: true
      });
    },

    onCreateError: function(loadBalancer) {
      loadBalancer.set('isCreating', false);

      App.NotificationsManager.show(
        'We encountered a problem creating your Load Balancer. Please try again.',
        'alert'
      );
    }
  }
});
