import Ember from 'ember';

function convertPortsToInt(rules) {
  return rules.map((rule) => {
    Ember.setProperties(rule, {
      entry_port: Number(rule.entry_port),
      target_port: Number(rule.target_port)
    });

    return rule;
  });
}

export default convertPortsToInt;
