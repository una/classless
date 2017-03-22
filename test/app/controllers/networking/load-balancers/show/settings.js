import Ember from 'ember';
import BaseController from '../../../base';
import App from '../../../../app';
import convertPortsToInt from '../../../../utils/convert-ports-to-int';
import getCertificateOptions from '../../../../utils/get-certificate-options';
import setTlsPassthrough from '../../../../utils/set-tls-passthrough';
import { TLS_PASSTHROUGH_VALUE } from '../../../../constants';

const initialState = {
  isEditingSection: null,
  isSavingSection: null,
  showConfirmDestroyModal: false,
  isDestroyingLoadBalancer: false,
  certificateModalVisible: false
};

export default BaseController.extend({
  init: function() {
    this.boundErrorHandler = this.errorHandler.bind(this);

    this.setInitialState();
  },

  setInitialState: function() {
    this.setProperties(initialState);
  },

  loadBalancer: function() {
    return this.get('model.loadBalancer');
  }.property('model.loadBalancer'),

  loadBalancers: function() {
    return this.get('model.loadBalancers');
  }.property('model.loadBalancers'),

  certificateOptions: Ember.computed('model.certificates', function() {
    return getCertificateOptions(this.get('model.certificates'));
  }),

  editDisabled: function() {
    return this.get('loadBalancer.state') !== 'ACTIVE';
  }.property('loadBalancer.state'),

  destroyDisabled: function() {
    return this.get('loadBalancer.state') === 'NEW' || this.get('isDestroyingLoadBalancer');
  }.property('loadBalancer.state'),

  forwardingRules: function() {
    return this.get('loadBalancer.forwardingRules').map((rule) => {
      if (rule.tls_passthrough) {
        Ember.set(rule, 'certificate_id', TLS_PASSTHROUGH_VALUE);
      }

      return rule;
    });
  }.property('loadBalancer.forwardingRules'),

  getStickySessionsConfig: function() {
    const type = this.get('loadBalancer.stickySessions.type');
    const cookieTtl = this.get('loadBalancer.stickySessions.cookie_ttl');
    const cookieName = this.get('loadBalancer.stickySessions.cookie_name');

    if (type === 'COOKIES') {
      return {
        type: type,
        cookie_name: cookieName,
        cookie_ttl: parseInt(cookieTtl, 10)
      };
    } else {
      return {
        type: type
      };
    }
  },

  getForwardingRules: function() {
    const rules = setTlsPassthrough(this.get('forwardingRules'));

    return convertPortsToInt(rules);
  },

  actions: {
    destroyLoadBalancer: function() {
      this.set('showConfirmDestroyModal', true);
    },

    onConfirmDestroy: function(result) {
      this.set('showConfirmDestroyModal', false);

      if (result) {
        this.set('isDestroyingLoadBalancer', true);

        this.get('loadBalancer').destroyRecord().then(() => {
          App.NotificationsManager.show('Your Load Balancer has been deleted.', 'notice');
          this.transitionToRoute('networking.loadBalancers');
        }).catch((err) => {
          this.errorHandler(err, 'Destroy Load Balancer');
        }).finally(() => {
          this.set('isDestroyingLoadBalancer', false);
        });
      }
    },

    onForwardingRulesChange: function(rules) {
      this.set('forwardingRules', rules);
    },

    onAlgorithmSelect: function(algorithm) {
      this.set('loadBalancer.algorithm', algorithm);
    },

    onEdit: function(section) {
      if (section) {
        // See comment in onCancel.
        this.set('previousStateForSection', Ember.copy(this.get(`loadBalancer.${section}`)));
      }

      this.setProperties({
        isEditingSection: section,
        isSavingSection: null
      });
    },

    onCancel: function(section) {
      this.get('loadBalancer').rollbackAttributes();

      if (section) {
        // rollbackAttributes works for simple fields, but for properties with nested
        // data (e.g. forwardingRules and healthCheck), we need to manually roll back
        // to the deeply-cloned object that we set in onEdit.
        // TODO: Represent these nested properties correctly in ember-data (e.g. via
        // ember-data-model-fragments), so we can use rollbackAttributes here,
        // benefit from proper serialization, model validation, etc.
        this.set(`loadBalancer.${section}`, this.get('previousStateForSection'));
      }

      this.set('isEditingSection', null);
    },

    onAddCertificate: function(callback) {
      this.set('certificateSaveCallback', callback);
      this.set('certificateModalVisible', true);
    },

    closeCertificateModal: function() {
      this.set('certificateModalVisible', false);
    },

    onSave: function(section) {
      this.set('isSavingSection', section);

      const loadBalancer = this.get('loadBalancer');

      const toNumber = [
        'healthCheck.port',
        'healthCheck.check_interval',
        'healthCheck.response_timeout',
        'healthCheck.unhealthy_threshold',
        'healthCheck.healthy_threshold'
      ];

      toNumber.forEach(function(entry) {
        loadBalancer.set(entry, parseInt(loadBalancer.get(entry), 10));
      });

      loadBalancer.set('stickySessions', this.getStickySessionsConfig());
      loadBalancer.set('forwardingRules', this.getForwardingRules());

      if (loadBalancer.get('healthCheck.protocol') === 'TCP') {
        loadBalancer.set('healthCheck.path', '');
      }

      // For tagged LBs, targetDroplets needs to be empty for the update request
      // to work, because the backend expects either a tag *or* an array of droplets:
      // https://github.internal.digitalocean.com/digitalocean/cthulhu/blob/24d3dd8aacb8ae9e2c7444d22c6ae5ea1fd2de84/docode/src/teams/high_avail/load-balancers/api/validate.go#L269
      // targetDroplets is then re-populated by the backend.
      if (loadBalancer.get('tag') !== '') {
        const dropletCount = loadBalancer.get('backendDropletCount');

        loadBalancer.setProperties({
          targetDroplets: [],
          // This prevents the droplet count from appearing as 0 during the update.
          backendDropletCount: dropletCount
        });
      }

      loadBalancer.save()
        .then(() => {
          App.NotificationsManager.show(
            'Your Load Balancer has been updated.',
            'notice'
          );

          this.setProperties({
            isEditingSection: null,
            isSavingSection: null
          });
        })
        .catch(() => {
          App.NotificationsManager.show(
            'Sorry! We encountered an error saving your Load Balancer.',
            'alert'
          );

          this.set('isSavingSection', null);
        });
    },

    resetState: function() {
      this.setInitialState();
      this.get('loadBalancer').rollbackAttributes();
    },

    validateForm: function(isValid) {
      this.set('currentFormIsValid', isValid);
    }
  }
});
