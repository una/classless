/* globals ipaddr:false */
import Ember from 'ember';
import { allRuleTypes } from '../../utils/firewall-rules';

// Options for the protocol dropdown.
const protocols = ['TCP', 'UDP', 'ICMP'];

const MIN_PORT = 1;
const MAX_PORT = 65535;

function parseSinglePort(part) {
  if (!/^[1-9][0-9]+$/.test(part)) {
    return {valid: false};
  }
  const value = parseInt(part, 10);
  if (isNaN(value) || value < MIN_PORT || value > MAX_PORT) {
    return {valid: false};
  }
  return {valid: true, value: value};
}

function validPort(port) {
  if (port === null || port === undefined || port === '') {
    return {valid: false, error: 'Port is required'};
  }

  const parts = port.split('-');
  if (parts.length > 2) { // eslint-disable-line no-magic-numbers
    return {valid: false, error: 'Invalid port range'};
  }

  let from, to;
  if (parts.length === 1) { // eslint-disable-line no-magic-numbers
    const parsed = parseSinglePort(parts[0]);
    if (!parsed.valid) {
      return {valid: false, error: 'Invalid port number'};
    }
    from = parsed.value;
    to = from;
  } else {
    const parsedFrom = parseSinglePort(parts[0]);
    if (!parsedFrom.valid) {
      return {valid: false, error: 'Invalid starting port'};
    }
    from = parsedFrom.value;

    const parsedTo = parseSinglePort(parts[1]);
    if (!parsedTo.valid) {
      return {valid: false, error: 'Invalid ending port'};
    }
    to = parsedTo.value;
  }

  if (to < from) {
    return {valid: false, error: 'From > To'};
  }
  return {valid: true};
}

function validPeer(peer) {
  if (peer.match('/')) {
    try {
      ipaddr.parseCIDR(peer);
      return {valid: true};
    } catch (e) {
      return {valid: false, error: 'Invalid CIDR'};
    }
  }
  try {
    ipaddr.parse(peer)
    return {valid: true};
  } catch (e) {
    return {valid: false, error: 'Invalid address'};
  }
}

export default Ember.Component.extend({
  tagName: 'tr',
  classNames: ['rule'],
  classNameBindings: ['isSelected:rule-editing'],

  ruleTypes: allRuleTypes(),
  protocols: protocols,

  batchEditable: false,
  itemEditable: false,
  isEditing: false,
  deleteDisabled: false,

  portIsValid: true,
  peerIsValid: true,

  setUpValidation: function() {
    this.validatePort = this._validatePort.bind(this);
    this.setPortError = this._setPortError.bind(this);
    this.validatePeer = this._validatePeer.bind(this);
    this.setPeerError = this._setPeerError.bind(this);
  }.on('init'),

  menuItems: Ember.computed('deleteDisabled', function() {
    return [
      {name: 'Edit Rule'},
      {name: 'Delete Rule', isDisabled: this.get('deleteDisabled')}
    ];
  }),

  validationErrors: Ember.computed('portIsValid', 'peerIsValid', 'duplicateRules', function() {
    return !this.get('portIsValid') || !this.get('peerIsValid') || this.get('duplicateRules');
  }),

  isSelected: Ember.computed.and('itemEditable', 'isEditing'),

  showEdit: Ember.computed.or('batchEditable', 'isSelected'),

  showProtocolSelection: Ember.computed('showEdit', 'rule.type', function() {
    return this.get('showEdit') && this.get('rule.type') === 'Custom';
  }),

  showPortSelection: Ember.computed('showEdit', 'rule.type', 'rule.protocol', function() {
    return this.get('showEdit') && this.get('rule.type') === 'Custom' && this.get('rule.protocol') !== 'ICMP';
  }),

  showPort: Ember.computed('rule.protocol', function() {
    return this.get('rule.protocol') !== 'ICMP';
  }),

  showSave: Ember.computed.alias('isSelected'),

  portRange: Ember.computed('rule.port_range.from', 'rule.port_range.to', 'rule.port_range', 'rule', function() {
    const from = parseInt(this.get('rule.port_range.from'), 10);
    const to = parseInt(this.get('rule.port_range.to'), 10);
    if (isNaN(from) || isNaN(to)) {
      return '';
    } else if (from === to) {
      return `${from}`;
    } else {
      return `${from}-${to}`;
    }
  }),

  _validatePort: function(port) {
    const valid = validPort(port).valid;
    this.set('portIsValid', valid);
    return valid;
  },

  _setPortError: function(port) {
    return validPort(port).error;
  },

  _validatePeer: function(peer) {
    const valid = validPeer(peer).valid;
    this.set('peerIsValid', valid);
    return valid;
  },

  _setPeerError: function(peer) {
    return validPeer(peer).error;
  },

  actions: {
    menuItemClick: function(clicked) {
      if (!this.get('itemEditable')) {
        return;
      }

      if (clicked === 'Delete Rule' && this.get('onRuleRemove')) {
        this.get('onRuleRemove')();
      } else if (clicked === 'Edit Rule' && this.get('onEditStart')) {
        this.get('onEditStart')();
      }
    },

    onRuleSave: function() {
      if (this.get('onRuleSave')) {
        this.get('onRuleSave')();
      }
    }
  }
});
