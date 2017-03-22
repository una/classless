import App from '../../../app';
import Ember from 'ember';
import SecurityGroupsBaseController from '../security-groups-base';
import { ruleForType } from '../../../utils/firewall-rules';

import {
  MAX_FIREWALL_RULES,
  MAX_FIREWALL_TAGS,
  MAX_FIREWALL_DROPLETS
} from 'aurora/constants';

const defaultRules = {
  inbound: ['SSH'],
  outbound: ['DNS TCP', 'DNS UDP', 'HTTP', 'HTTPS', 'All ICMP']
};

export default SecurityGroupsBaseController.extend({
  trackPageName: 'Create Firewall',

  isSubmittingSecurityGroup: false,

  validNameRegex: /^[a-zA-Z0-9]([a-z0-9A-Z\.\-]*[a-z0-9A-Z\.]|[a-z0-9A-Z\.]*)$/,

  init: function() {
    this._super(...arguments);
    this.setInitialState();
    this.validateName = this._validateName.bind(this);
    this.setNameErrorMessage = this._setNameErrorMessage.bind(this);
  },

  hasMaxDroplets: Ember.computed('dropletsAndTags.[]', function() {
    const { droplets } = this.dropletsAndTagsForUpdate(this.get('dropletsAndTags'));
    return droplets.length >= MAX_FIREWALL_DROPLETS;
  }),

  hasMaxTags: Ember.computed('dropletsAndTags.[]', function() {
    const { tags } = this.dropletsAndTagsForUpdate(this.get('dropletsAndTags'));
    return tags.length >= MAX_FIREWALL_TAGS;
  }),

  setInitialState: function() {
    this.set('name', null);
    this.set('inbound', defaultRules.inbound.map(ruleForType));
    this.set('outbound', defaultRules.outbound.map(ruleForType));

    this.set('dropletsAndTags', []);
    this.set('valid', {inbound: true, outbound: true});
  },

  // Determine whether the name is a duplicate or contains invalid characters.
  // Checking for blank is already handled by `required=true`, and max length
  // by `maxlength`.
  _validateName: function(name) {
    if (!name.match(this.get('validNameRegex'))) {
      this.set('nameError', 'Can only contain alphanumeric characters, dashes, and periods');
      return false;
    }

    const sgs = this.get('model.securityGroups') || [];
    const dupe = sgs.find((sg) =>
      name && sg.get('name') === name && !sg.get('isDeleted'));

    this.set('nameError', dupe ? 'Name must be unique' : null);
    return !dupe;
  },

  _setNameErrorMessage: function() {
    return this.get('nameError');
  },

  noRules: Ember.computed('inbound.length', 'outbound.length', function() {
    return this.get('inbound.length') === 0 && this.get('outbound.length') === 0;
  }),

  maxRules: MAX_FIREWALL_RULES,
  hasMaxRules: Ember.computed('inbound.length', 'outbound.length', function() {
    return this.get('inbound.length') + this.get('outbound.length') >= MAX_FIREWALL_RULES;
  }),

  disabledSubmit: Ember.computed('valid.inbound', 'valid.outbound', 'noRules', function() {
    return !this.get('valid.inbound') || !this.get('valid.outbound') || this.get('noRules');
  }),

  actions: {
    resetState: function() {
      this.setInitialState();
    },

    onValidityChange: function(type, valid) {
      this.set(`valid.${type}`, valid);
    },

    onRuleAdd: function(type, newRules) {
      const rules = this.get(type);
      rules.pushObjects(newRules);
    },

    onRuleChange: function(type, index, newRule) {
      const rule = this.get(type).objectAt(index);
      Ember.setProperties(rule, newRule);
    },

    onRuleRemove: function(type, index) {
      const rules = this.get(type);
      rules.removeAt(index);
    },

    createSecurityGroup: function() {
      const {droplets, tags} = this.dropletsAndTagsForUpdate(this.get('dropletsAndTags'));
      let newSG = this.store.createRecord('security-group', {
        name: this.get('name'),
        inbound: this.get('inbound'),
        outbound: this.get('outbound'),
        targets: droplets,
        tags: tags
      });

      this.set('isSubmittingSecurityGroup', true);

      newSG.save().then(() => {
        App.NotificationsManager.show(
          'Firewall created successfully.',
          'notice');
        this.transitionToRoute('networking.securityGroups');
      }).catch(() => {
        App.NotificationsManager.show(
          'Sorry! We encountered an error creating your Firewall.',
          'alert');

        this.store.unloadRecord(newSG);
      }).finally(() => {
        this.set('isSubmittingSecurityGroup', false);
      });
    }
  }
});
