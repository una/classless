import App from '../../../app';
import Ember from 'ember';
import SecurityGroupsBaseController from '../security-groups-base';
import {
  MAX_FIREWALL_RULES,
  MAX_FIREWALL_TAGS,
  MAX_FIREWALL_DROPLETS
} from 'aurora/constants';

export default SecurityGroupsBaseController.extend({
  trackPageName: 'Show Firewall',

  init() {
    this._super(...arguments);
    this.set('dropletsAndTags', []);
  },

  existingTargets: function() {
    return this.model.get('targets').toArray().concat(this.model.get('tags').toArray());
  }.property('model.targets.[]', 'model.tags.[]'),

  saveUpdate: function() {
    this.set('dropletsAndTags', []);
    this.model.save().then(() => {
      App.NotificationsManager.show(
        'Firewall updated successfully.',
        'notice');
    }).catch(() => {
      App.NotificationsManager.show(
        'Sorry! We encountered an error updating this Firewall.',
        'alert');
      this.model.rollbackAttributes();
    });
  },

  totalNumDroplets: Ember.computed('dropletsAndTags.[]', 'model.targets.length', function() {
    const { droplets } = this.dropletsAndTagsForUpdate(this.get('dropletsAndTags'));
    return droplets.length + this.get('model.targets.length');
  }),
  totalNumTags: Ember.computed('dropletsAndTags.[]', 'model.tags.length', function() {
    const { tags } = this.dropletsAndTagsForUpdate(this.get('dropletsAndTags'));
    return tags.length + this.get('model.tags.length');
  }),

  hasMaxDroplets: Ember.computed.gte('totalNumDroplets', MAX_FIREWALL_DROPLETS),
  hasMaxTags: Ember.computed.gte('totalNumTags', MAX_FIREWALL_TAGS),
  hasMaxRules: Ember.computed('model.inbound.length', 'model.inbound.length', function() {
    return this.get('model.inbound.length') + this.get('model.outbound.length') >= MAX_FIREWALL_RULES;
  }),

  hasNoDropletsOrTags: Ember.computed('model.targets.length', 'model.tags.length', function() {
    const dropletsLength = this.get('model.targets.length');
    const tagsLength = this.get('model.tags.length');
    return dropletsLength === 0 && tagsLength === 0;
  }),

  deleteDisabled: Ember.computed('model.inbound.length', 'model.outbound.length', function() {
    return this.get('model.inbound.length') + this.get('model.outbound.length') === 1;
  }),

  actions: {
    addTargets: function(dropletsAndTags) {
      const {droplets, tags} = this.dropletsAndTagsForUpdate(dropletsAndTags);
      this.model.get('targets').pushObjects(droplets);
      this.model.get('tags').pushObjects(tags);
      this.saveUpdate();
    },

    dropletMenuItemClick: function(clicked, index) {
      if (clicked === 'Delete') {
        this.model.get('targets').removeAt(index);
        this.saveUpdate();
      }
    },

    tagMenuItemClick: function(clicked, index) {
      if (clicked === 'Delete') {
        this.model.get('tags').removeAt(index);
        this.saveUpdate();
      }
    },

    onRuleAdd: function(type, newRules) {
      const rules = this.model.get(type);
      rules.pushObjects(newRules);
    },

    onRuleChange: function(type, index, newRule) {
      const rule = this.model.get(type).objectAt(index);
      Ember.setProperties(rule, newRule);
    },

    onRuleRemove: function(type, index) {
      const rules = this.model.get(type);
      rules.removeAt(index);
      this.saveUpdate();
    },

    onRuleSave: function() {
      this.saveUpdate();
    }
  }
});
