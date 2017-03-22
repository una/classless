import _ from 'lodash/lodash';
import Ember from 'ember';
import App from '../../../app';
import BaseController from '../../base';
import convertPortsToInt from '../../../utils/convert-ports-to-int';
import TypesHelper from '../../../utils/types';
import getCertificateOptions from '../../../utils/get-certificate-options';
import setTlsPassthrough from '../../../utils/set-tls-passthrough';

const initialState = {
  name: null,
  selectedRegion: null,

  selectedAlgorithm: 'ROUND_ROBIN',

  // forwardingRules and targets need to be computed properties to ensure
  // that they're properly reset when calling resetState. See:
  // https://github.com/emberjs/ember.js/issues/10255#issuecomment-70770145
  forwardingRules: Ember.computed(function() {
    return [{
      entry_port: 80,
      entry_protocol: 'HTTP',
      target_port: 80,
      target_protocol: 'HTTP',
      certificate_id: ''
    }];
  }),

  targets: Ember.computed(function() {
    return [];
  }),

  tagSearchResults: [],
  dropletSearchResults: [],
  tagDropletCount: null,
  isUpdatingTagDropletCount: false,

  healthCheckProtocol: 'HTTP',
  healthCheckPort: 80,
  healthCheckPath: '/',

  checkInterval: 10,
  responseTimeout: 5,
  unhealthyThreshold: 3,
  healthyThreshold: 5,

  stickySessionsType: 'NONE',
  stickyCookieTTL: 300,
  stickyCookieName: 'DO-LB',

  redirectHttpToHttps: false,

  certificate: {
    name: null,
    leafCertificate: null,
    privateKey: null,
    certificateChain: null
  },

  certificateModalVisible: false,
  advancedSettingsVisible: false
};

export default BaseController.extend({
  loadBalancersCreationDisabled: App.featureEnabled('loadBalancersCreationBlocked'),
  trackPageName: 'Create Load Balancer',

  isSubmittingLoadBalancer: false,

  init: function() {
    this.boundErrorHandler = this.errorHandler.bind(this);

    this.setInitialState();
  },

  targetDroplets: Ember.computed.filter('targets', (target) => (
    TypesHelper.isDroplet(target)
  )),

  targetTags: Ember.computed.filter('targets', (target) => (
    TypesHelper.isTag(target)
  )),

  regions: function() {
    return _.chain(this.get('model.regions'))
      .map((region) => ({
        value: region.slug,
        label: region.slug && region.slug.toUpperCase()
      }))
      .sortBy('value')
      .value();
  }.property('model.regions'),

  certificateOptions: Ember.computed('model.certificates', function() {
    return getCertificateOptions(this.get('model.certificates'));
  }),

  regionSelectorIsDisabled: function() {
    return _.some(this.get('targets'), (target) => (
      TypesHelper.isDroplet(target)
    ));
  }.property('targets.[]'),

  forwardingRulesValid: function() {
    return this.get('forwardingRules.length') > 0;
  }.property('forwardingRules.[]'),

  submitButtonIsDisabled: Ember.computed('loadBalancersCreationDisabled', 'forwardingRulesValid', function() {
    return this.get('loadBalancersCreationDisabled') || !this.get('forwardingRulesValid')
  }),

  firstTargetIsTag: function() {
    return TypesHelper.isTag(this.get('targets.0'));
  }.property('targets.[]'),

  firstTargetIsDroplet: function() {
    return TypesHelper.isDroplet(this.get('targets.0'));
  }.property('targets.[]'),

  getStickySessionsConfig: function() {
    const type = this.get('stickySessionsType');
    const cookieTtl = this.get('stickyCookieTTL');
    const cookieName = this.get('stickyCookieName');

    if (type === 'COOKIES') {
      return {
        type: type,
        cookieName: cookieName,
        cookieTtl: parseInt(cookieTtl, 10)
      };
    } else {
      return {
        type: type
      };
    }
  },

  getHealthCheckConfig: function() {
    const protocol = this.get('healthCheckProtocol');

    return {
      protocol: protocol,
      port: parseInt(this.get('healthCheckPort'), 10),
      path: protocol === 'TCP' ? '' : this.get('healthCheckPath'),
      checkInterval: parseInt(this.get('checkInterval'), 10),
      responseTimeout: parseInt(this.get('responseTimeout'), 10),
      unhealthyThreshold: parseInt(this.get('unhealthyThreshold'), 10),
      healthyThreshold: parseInt(this.get('healthyThreshold'), 10)
    };
  },

  getForwardingRules: function() {
    const rules = setTlsPassthrough(this.get('forwardingRules'));

    return convertPortsToInt(rules);
  },

  setInitialState: function() {
    this.setProperties(initialState);
  },

  queryTags: function(query) {
    this.store.query('tag', { query: query }).then((tags) => {
      this.set('tagSearchResults', tags);
    });
  },

  queryDroplets: function(query) {
    this.store.query('droplet', {
      query: query,
      region: this.get('selectedRegion')
    }).then((droplets) => {
      this.set('dropletSearchResults', droplets);
    });
  },

  targetSearchResults: Ember.computed.union('tagSearchResults', 'dropletSearchResults'),

  updateTagDropletCount: function(tag) {
    const tagName = tag
      ? tag.get('name')
      : this.get('targetTags.firstObject.name');

    if (!tagName) {
      return;
    }

    this.set('isUpdatingTagDropletCount', true);

    this.store.query('droplet', {
      tag_name: tagName,
      region: this.get('selectedRegion')
    }).then((droplets) => {
      this.set('tagDropletCount', droplets.get('length'));
      this.set('isUpdatingTagDropletCount', false);
    });
  },

  actions: {
    onForwardingRulesChange: function(rules) {
      this.set('forwardingRules', rules);
    },

    onAlgorithmSelect: function(algorithm) {
      this.set('selectedAlgorithm', algorithm);
    },

    toggleAdvancedSettings: function() {
      this.set('advancedSettingsVisible', !this.get('advancedSettingsVisible'));

      Ember.run.next(() => {
        if (this.get('advancedSettingsVisible')) {
          Ember.$('.lb-advanced-expanded input').first().focus();
        } else {
          Ember.$('.lb-advanced-collapsed .lb-advanced-edit').focus();
        }
      });
    },

    onAddCertificate: function(callback) {
      this.set('certificateSaveCallback', callback);
      this.set('certificateModalVisible', true);
    },

    closeCertificateModal: function() {
      this.set('certificateModalVisible', false);
    },

    queryTargets: function(query) {
      this.queryDroplets(query);

      if (this.get('firstTargetIsDroplet')) {
        this.set('tagSearchResults', []);
      } else {
        this.queryTags(query);
      }
    },

    onSelectTargetDroplet: function(droplet) {
      this.set('selectedRegion', droplet.get('region.slug'));
    },

    onSelectTargetTag: function(tag) {
      this.updateTagDropletCount(tag);
    },

    onRegionChange: function() {
      this.updateTagDropletCount();
    },

    resetState: function() {
      this.setInitialState();
    },

    createLoadBalancer: function() {
      const newLB = this.store.createRecord('load-balancer-to-create', {
        name: this.get('name'),
        region: this.get('selectedRegion')
      });

      // TODO: These should be represented by an actual model at some point.
      // For now, we just serialize them manually in models/load-balancer.
      const additionalOptions = {
        algorithm: this.get('selectedAlgorithm'),
        forwardingRules: this.getForwardingRules(),
        healthCheck: this.getHealthCheckConfig(),
        targetDroplets: this.get('targetDroplets').map((droplet) => ({ id: parseInt(droplet.id, 10) })),
        // Load balancers currently only allow one tag at a time, but target-selector
        // returns an array, so we just grab the `firstObject` here.
        tag: this.get('targetTags.firstObject.name'),
        stickySessions: this.getStickySessionsConfig(),
        redirectHttpToHttps: this.get('redirectHttpToHttps')
      };

      this.set('isSubmittingLoadBalancer', true);

      newLB.save(additionalOptions)
        .then(() => {
          App.NotificationsManager.show(
            `Awesome! Your Load Balancer has been created.
             Its name is “${newLB.get('name')}”.`,
            'notice'
          );

          this.transitionToRoute('networking.loadBalancers');
        })
        .catch((err) => {
          this.errorHandler(err, 'Creating Load Balancer');
          this.store.unloadRecord(newLB);
        })
        .finally(() => {
          this.set('isSubmittingLoadBalancer', false);
        });
    }
  }
});
