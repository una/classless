import Ember from 'ember';
import _ from 'lodash/lodash';
import App from '../../../../app';
import BaseController from '../../../base';
import TypesHelper from '../../../../utils/types';
import {
  LB_DROPLET_STATUSES,
  COLLECTING_METRICS,
  COLLECTING_DROPLET_METRICS_TOOLTIP_TEXT
} from '../../../../constants';
import setTlsPassthrough from '../../../../utils/set-tls-passthrough';
import convertPortsToInt from '../../../../utils/convert-ports-to-int';

function lastPointForDroplet(droplet, dataMap) {
  const data = dataMap.find(function(e) {
    return e.name === "node-" + droplet.id;
  });
  const v = data ? data.values[data.values.length - 1] : {};
  return v.y ? v.y : 0;
}

const initialState = {
  tagSearchResults: [],
  dropletSearchResults: [],

  editTargetsModalIsVisible: false,
  isUpdatingTargets: false,
  tagDropletCount: null,
  isUpdatingTagDropletCount: false
};

export default BaseController.extend({
  collectingMetrics: COLLECTING_METRICS,
  collectingDropletMetricsTooltipText: COLLECTING_DROPLET_METRICS_TOOLTIP_TEXT,

  init: function() {
    this.setInitialState();
  },

  actionDropdownItems: function() {
    const items = [
      {
        name: 'View Droplet'
      }
    ];

    if (!this.get('hasTargetTag')) {
      items.push({
        name: 'Remove',
        isDisabled: this.get('actionsDisabled')
      });
    }

    return items;
  }.property('actionsDisabled', 'hasTargetTag'),

  loadBalancer: function() {
    return this.get('model.loadBalancer');
  }.property('model.loadBalancer'),

  tag: function() {
    return this.get('model.tag');
  }.property('model.tag'),

  targetDroplets: function() {
    return this.get('model.droplets');
  }.property('model.droplets'),

  hasTargetTag: function() {
    return this.get('loadBalancer.tag') !== '';
  }.property('loadBalancer.tag'),

  hasTargetDropletsAndNoTag: function() {
    return (this.get('targetDroplets.length') > 0) && !this.get('hasTargetTag');
  }.property('targetDroplets.[]'),

  hasNoTargets: function() {
    return (this.get('targetDroplets.length') === 0) && !this.get('hasTargetTag');
  }.property('targetDroplets.[]'),

  editTargetsText: function() {
    return this.get('hasTargetTag')
      ? 'Edit Tag'
      : 'Add Droplets';
  }.property('hasTargetTag'),

  editTargetsButtonDisabled: function() {
    return this.get('newTargets.length') === 0 || this.get('isUpdatingTargets');
  }.property('newTargets.[]', 'isUpdatingTargets'),

  newTargets: Ember.computed(function() {
    return this.get('tag')
      ? [this.get('tag')]
      : [];
  }),

  resetNewTargets: function() {
    this.set('newTargets', this.get('tag')
      ? [this.get('tag')]
      : []);
  },

  firstTargetIsTag: function() {
    return TypesHelper.isTag(this.get('newTargets.0'));
  }.property('newTargets.[]'),

  firstTargetIsDroplet: function() {
    return TypesHelper.isDroplet(this.get('newTargets.0'));
  }.property('newTargets.[]'),

  targetSearchResults: Ember.computed.union('tagSearchResults', 'dropletSearchResults'),

  queryTags: function(query) {
    this.store.query('tag', { query: query }).then((tags) => {
      this.set('tagSearchResults', tags);
    });
  },

  queryDroplets: function(query) {
    this.store.query('droplet', {
      query: query,
      region: this.get('loadBalancer.region')
    }).then((droplets) => {
      this.set('dropletSearchResults', droplets);
    });
  },

  targetDropletsWithStats: function() {
    return this.get('model.droplets').map((droplet) => {
      const backendUpDroplets = this.get('model.backendUp');

      // If the LB API has targetDroplets but the metrics response doesn't, we
      // assume that we're still waiting on metrics for this load balancer.
      const isCollectingMetrics = this.get('model.loadBalancer.backendDropletCount') > 0
        && backendUpDroplets && backendUpDroplets.length === 0;

      let status;

      if (isCollectingMetrics) {
        status = LB_DROPLET_STATUSES.collectingMetrics;
      } else if (lastPointForDroplet(droplet, backendUpDroplets) > 0) {
        status = LB_DROPLET_STATUSES.up
      } else {
        status = LB_DROPLET_STATUSES.down;
      }

      return Ember.Object.create({
        droplet: droplet,
        status: status,
        lastDowntime: isCollectingMetrics
          ? COLLECTING_METRICS
          : lastPointForDroplet(droplet, this.get('model.backendDowntime')),
        lastQueueSize: isCollectingMetrics
          ? COLLECTING_METRICS
          : lastPointForDroplet(droplet, this.get('model.backendQueueSize')),
        // Round to 2 decimal places at most
        lastHealthChecks: isCollectingMetrics
          ? COLLECTING_METRICS
          : Math.round(
            lastPointForDroplet(droplet, this.get('model.backendHealthChecks')) * 100 // eslint-disable-line no-magic-numbers
          ) / 100 // eslint-disable-line no-magic-numbers
      });
    });
  }.property('model.droplets', 'model.loadBalancer'),

  healthyDropletsCount: function() {
    const loadBalancer = this.get('loadBalancer');
    const backendUpDroplets = this.get('model.backendUp');

    // If the LB API has targetDroplets but the metrics response doesn't, we
    // assume that we're still waiting on metrics for this load balancer.
    const isCollectingMetrics = loadBalancer.get('backendDropletCount') > 0
      && backendUpDroplets && backendUpDroplets.length === 0;

    if (isCollectingMetrics) {
      return COLLECTING_METRICS;
    }

    return this.get('model.droplets').filter((droplet) => {
      return lastPointForDroplet(droplet, this.get('model.backendUp')) > 0;
    }).length;
  }.property('model.droplets'),

  unhealthyDropletsCount: function() {
    return this.get('model.droplets').filter((droplet) => {
      return lastPointForDroplet(droplet, this.get('model.backendUp')) === 0;
    }).length;
  }.property('model.droplets'),

  actionsDisabled: function() {
    return this.get('loadBalancer.state') !== 'ACTIVE';
  }.property('loadBalancer.state'),

  setInitialState: function() {
    this.setProperties(initialState);
  },

  updateLBTag: function() {
    this.updateLB(
      'Your Load Balancer’s tag has been updated.',
      'Updating Load Balancer tag'
    );
  },

  addDropletsToLB: function() {
    this.updateLB(
      'The target droplet has been added.',
      'Adding Load Balancer target droplet'
    );
  },

  removeDropletsFromLB: function() {
    this.updateLB(
      'The target droplet has been removed.',
      'Removing Load Balancer target droplet'
    );
  },

  getForwardingRules: function() {
    const rules = setTlsPassthrough(this.get('loadBalancer.forwardingRules'));

    return convertPortsToInt(rules);
  },

  updateLB: function(successText, errorAction) {
    const loadBalancer = this.get('loadBalancer');

    // This prevents a "Certificate not found" error for LBs with TLS
    // passthrough-enabled forwarding rules. It only occurs after editing
    // rules on the Settings tab and then attempting to edit droplets / tags
    // on the Droplets tab.
    loadBalancer.set('forwardingRules', this.getForwardingRules());

    loadBalancer.save()
      .then(() => {
        App.NotificationsManager.show(successText, 'notice');

        this.setProperties({
          editTargetsModalIsVisible: false,
          isUpdatingTargets: false,
          isRefreshing: true
        });

        this.send('refreshModel');
        this.resetNewTargets();
      })
      .catch((err) => {
        this.errorHandler(err, errorAction);
        this.set('isUpdatingTargets', false);
      });
  },

  actions: {
    menuItemClick: function(name, dropletId) {
      if (name === 'View Droplet') {
        return this.transitionToRoute('droplet.graphs', dropletId);
      } else if (name === 'Remove') {
        const targetDroplets = this.get('loadBalancer.targetDroplets');

        this.set('loadBalancer.targetDroplets', _.filter(
          targetDroplets, (droplet) => droplet.id !== dropletId)
        );

        this.removeDropletsFromLB();
      }
    },

    onAddTargets: function() {
      const loadBalancer = this.get('loadBalancer');

      this.set('isUpdatingTargets', true);

      if (this.get('firstTargetIsDroplet')) {
        this.get('newTargets').forEach((target) => {
          loadBalancer.get('targetDroplets').pushObject({
            id: parseInt(target.get('id'), 10),
            ip: target.get('ipAddress')
          });
        });

        this.set('loadBalancer.tag', '');

        this.addDropletsToLB();
      } else {
        const dropletCount = loadBalancer.get('backendDropletCount');

        loadBalancer.set('tag', this.get('newTargets.firstObject.name'));

        // targetDroplets needs to be empty for the tag update to work, because the
        // backend expects either a tag *or* an array of droplets:
        // https://github.internal.digitalocean.com/digitalocean/cthulhu/blob/24d3dd8aacb8ae9e2c7444d22c6ae5ea1fd2de84/docode/src/teams/high_avail/load-balancers/api/validate.go#L269
        // targetDroplets is then re-populated by the backend.
        loadBalancer.setProperties({
          targetDroplets: [],
          // This prevents the droplet count from appearing as 0 during the update.
          backendDropletCount: dropletCount
        });

        this.updateLBTag();
      }
    },

    onSelectDroplet: function(droplet) {
      this.set('selectedDroplet', droplet);
    },

    onUnselectDroplet: function() {
      this.set('selectedDroplet', null);
    },

    openEditTargetsModal: function() {
      this.resetNewTargets();
      this.set('editTargetsModalIsVisible', true);
    },

    closeEditTargetsModal: function() {
      this.set('editTargetsModalIsVisible', false);
    },

    queryTargets: function(query) {
      this.queryDroplets(query);

      if (this.get('firstTargetIsDroplet') || this.get('hasTargetDropletsAndNoTag')) {
        this.set('tagSearchResults', []);
      } else {
        this.queryTags(query);
      }
    },

    onSelectTargetTag: function(tag) {
      this.set('isUpdatingTagDropletCount', true);

      this.store.query('droplet', {
        tag_name: tag.get('name'),
        region: this.get('loadBalancer.region')
      }).then((droplets) => {
        this.set('tagDropletCount', droplets.get('length'));
        this.set('isUpdatingTagDropletCount', false);
      });
    },

    afterModelRefresh: function() {
      this.set('isRefreshing', false);
    },

    resetState: function() {
      this.resetNewTargets();
      this.setInitialState();
    }
  }
});
