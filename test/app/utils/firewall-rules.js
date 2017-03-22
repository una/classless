import _ from 'lodash/lodash';

const DEFAULT_IPV4_PEER = '0.0.0.0/0';

const ruleTypes = [
  {
    type: 'SSH',
    protocol: 'TCP',
    port_range: {from: 22, to: 22}
  },
  {
    type: 'HTTP',
    protocol: 'TCP',
    port_range: {from: 80, to: 80}
  },
  {
    type: 'HTTPS',
    protocol: 'TCP',
    port_range: {from: 443, to: 443}
  },
  {
    type: 'MySQL',
    protocol: 'TCP',
    port_range: {from: 3306, to: 3306}
  },
  {
    type: 'DNS TCP',
    protocol: 'TCP',
    port_range: {from: 53, to: 53}
  },
  {
    type: 'DNS UDP',
    protocol: 'UDP',
    port_range: {from: 53, to: 53}
  },
  {
    type: 'All ICMP',
    protocol: 'ICMP',
    port_range: {}
  },
  {
    type: 'Custom',
    protocol: 'TCP',
    port_range: {from: 8000, to: 8000}
  }
];

const ruleTypeMap = _.indexBy(ruleTypes, 'type');

const presets = [
  {label: 'SSH', rules: ['SSH']},
  {label: 'HTTP', rules: ['HTTP']},
  {label: 'HTTPS', rules: ['HTTPS']},
  {label: 'MySQL', rules: ['MySQL']},
  {label: 'DNS TCP', rules: ['DNS TCP']},
  {label: 'DNS UDP', rules: ['DNS UDP']},
  {label: 'ICMP', rules: ['All ICMP']},
  {label: 'Custom', rules: ['Custom']}
];

const presetMap = _.indexBy(presets, 'label');

export function allRuleTypes() {
  return _.map(ruleTypes, 'type');
}

export function allPresets() {
  return _.map(presets, 'label');
}

export function ruleForType(ruleType) {
  return _.extend(_.cloneDeep(ruleTypeMap[ruleType]), {peer: DEFAULT_IPV4_PEER});
}

export function rulesForPreset(preset) {
  const rules = _.map((presetMap[preset] || {}).rules, ruleForType);
  return _.filter(rules, (rule) => rule !== null && rule !== undefined);
}

export function typeOfRule(rule) {
  let result = _.find(ruleTypes, (ruleType) =>
    rule.protocol === ruleType.protocol &&
    rule.port_range &&
    rule.port_range.to === ruleType.port_range.to &&
    rule.port_range.from === ruleType.port_range.from);
  return result ? result.type : 'Custom';
}

export function ruleKey(rule) {
  return `${rule.protocol},${rule.port_range.from},${rule.port_range.to},${rule.peer}`;
}
