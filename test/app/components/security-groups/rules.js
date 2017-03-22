import Ember from 'ember';
import _ from 'lodash/lodash';
import {
  allPresets,
  typeOfRule,
  rulesForPreset,
  ruleForType,
  ruleKey
} from '../../utils/firewall-rules';
import { MAX_FIREWALL_RULES } from 'aurora/constants';

function splitPorts(value) {
  const ports = value.split('-');
  let from, to;
  if (ports.length === 2) { // eslint-disable-line no-magic-numbers
    from = parseInt(ports[0], 10);
    to = parseInt(ports[1], 10);
  } else {
    from = parseInt(ports[0], 10);
    to = from;
  }
  return {from: from, to: to};
}

export default Ember.Component.extend({
  tagName: '',

  batchEditable: false,
  itemEditable: false,
  isEditing: null,

  presets: allPresets(),

  duplicateRules: Ember.computed(
    'rules',
    'rules.[]',
    'rules.@each.port_range',
    'rules.@each.peer',
    'rules.@each.type',
    'rules.@each.protocol',
    function() {
      const rules = this.get('rules');
      const keys = _.map(rules, ruleKey);
      const dupes = _.map(keys, (key, i) => keys.indexOf(key) !== i);
      return _.some(dupes);
    }
  ),

  hasMaxRules: false,
  maxRules: MAX_FIREWALL_RULES,

  validityChange: Ember.observer('duplicateRules', function() {
    const valid = !this.get('duplicateRules');
    if (this.get('onValidityChange')) {
      this.get('onValidityChange')(this.get('type'), valid);
    }
  }),

  peerColumnHeader: function() {
    if (this.get('type') === 'inbound') {
      return 'Source';
    } else {
      return 'Destination';
    }
  }.property('type'),

  matchType: function() {
    this.get('rules').forEach((rule) => {
      const matchingType = typeOfRule(rule);
      if (matchingType && matchingType !== rule.type) {
        Ember.set(rule, 'type', matchingType);
      }
    });
  }.observes('rules', 'rules.[]').on('init'),

  actions: {
    onEditStart: function(index) {
      this.set('isEditing', index);
    },

    onRuleSave: function(type, index) {
      if (this.get('onRuleSave')) {
        this.get('onRuleSave')(type, index);
        this.set('isEditing', null);
      }
    },

    onRuleAdd: function(target) {
      if (!this.get('onRuleAdd')) {
        return;
      }
      this.get('onRuleAdd')(this.get('type'), rulesForPreset(target.value));
      target.value = '';
      this.set('isEditing', this.get('rules.length') - 1);
    },

    onRuleRemove: function(type, index) {
      if (!this.get('onRuleRemove')) {
        return;
      }
      if (this.get('batchEditable') || this.get('itemEditable')) {
        this.get('onRuleRemove')(type, index);
      }
    },

    onChangeType: function(index, target) {
      if (!this.get('onRuleChange')) {
        return;
      }
      const rule = this.get('rules')[index];
      const newRule = _.extend(ruleForType(target.value), {peer: rule.peer});
      this.get('onRuleChange')(this.get('type'), index, newRule);
    },

    onChangeProtocol: function(index, target) {
      if (!this.get('onRuleChange')) {
        return;
      }
      const rule = this.get('rules')[index];
      this.get('onRuleChange')(this.get('type'), index, {
        type: rule.type,
        protocol: target.value,
        port_range: target.value === 'ICMP' ? {} : rule.port_range,
        peer: rule.peer
      });
    },

    onChangePortRange: function(index, value, isValid) {
      if (!isValid || !this.get('onRuleChange')) {
        return;
      }

      const rule = this.get('rules')[index];
      const {from: from, to: to} = splitPorts(value);
      this.get('onRuleChange')(this.get('type'), index, {
        type: rule.type,
        protocol: rule.protocol,
        port_range: {from: from, to: to},
        peer: rule.peer
      });
    },

    onChangePeer: function(index, value, isValid) {
      if (!isValid || !this.get('onRuleChange')) {
        return;
      }
      const rule = this.get('rules')[index];
      this.get('onRuleChange')(this.get('type'), index, {
        type: rule.type,
        protocol: rule.protocol,
        port_range: rule.port_range,
        peer: value
      });
    }
  }
});
