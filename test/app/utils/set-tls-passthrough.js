import Ember from 'ember';
import { TLS_PASSTHROUGH_VALUE } from '../constants';

function setTlsPassthrough(rules) {
  return rules.map((rule) => {
    if (rule.certificate_id === TLS_PASSTHROUGH_VALUE) {
      Ember.setProperties(rule, {
        certificate_id: '',
        tls_passthrough: true
      });
    }

    return rule;
  });
}

export default setTlsPassthrough;
