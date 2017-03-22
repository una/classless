import Ember from 'ember';
import validatePortRange from '../../utils/validatePortRange';
import {
  PORT_RANGE,
  HTTP_PORT,
  HTTPS_PORT,
  TLS_PASSTHROUGH_VALUE,
  ADD_CERTIFICATE_VALUE
} from '../../constants';

const HTTPX_PROTOCOLS = ['HTTP', 'HTTPS'];

/* eslint-disable no-magic-numbers */
// 50053 is used by the HA agent
// 50054 is used by haproxy monitor
const PROHIBITED_ENTRY_PORTS = [50053, 50054];
/* eslint-enable no-magic-numbers */

export default Ember.Component.extend({
  tagName: 'tr',
  classNames: 'forwarding-rule',

  targetProtocolIsDisabled: false,

  init: function() {
    this._super(...arguments);

    this.validateEntryPort = this._validateEntryPort.bind(this);
    this.setEntryPortErrorMessage = this._setEntryPortErrorMessage.bind(this);
  },

  validatePortRange: validatePortRange,

  targetProtocols: function() {
    return this.get('protocols');
  }.property('protocols'),

  setPortRangeErrorMessage: function(port) {
    return port > PORT_RANGE[1]
      ? `Must be ≤ ${PORT_RANGE[1]}`
      : `Must be ≥ ${PORT_RANGE[0]}`;
  },

  certificateIsDisabled: function() {
    return this.get('rule.entry_protocol') !== 'HTTPS';
  }.property('rule.entry_protocol'),

  _validateEntryPort: function(port) {
    port = Number(port);
    const existingRules = this.get('allRules');

    const dupe = existingRules.filter((rule) =>
      Number(rule.entry_port) === port
    ).length > 1;

    const prohibited = PROHIBITED_ENTRY_PORTS.indexOf(port) !== -1;

    this.set('entryPortDupeError', dupe ? 'Must be unique' : null);
    this.set('entryPortProhibitedError', prohibited ? `Can't use 50053 or 50054` : null);

    return validatePortRange(port) && !dupe && !prohibited;
  },

  _setEntryPortErrorMessage: function(port) {
    const dupe = this.get('entryPortDupeError');
    if (dupe) {
      return dupe;
    }

    const prohibited = this.get('entryPortProhibitedError');
    if (prohibited) {
      return prohibited;
    }

    if (!validatePortRange(port)) {
      return this.setPortRangeErrorMessage(port);
    }

    return null;
  },

  validateForm: function() {
    if (this.get('onValidateForm')) {
      this.sendAction('onValidateForm');
    }
  },

  actions: {
    onRemove: function() {
      if (this.get('onRemove')) {
        this.sendAction('onRemove');
      }
    },

    onFocusOut: function() {
      this.validateForm();
    },

    onCertificateChange: function(e) {
      if (e.target.value === ADD_CERTIFICATE_VALUE && this.get('onAddCertificate')) {
        this.set('rule.tls_passthrough', false);

        // This callback gets sent up all the way to the load-balancers/new.js
        // controller, where it's eventually called when a new certificate is
        // successfully saved from the "new certificate" modal.
        const callback = (id) => {
          this.set('rule.certificate_id', id);

          Ember.run.next(() => {
            this.$('.rule-certificate .FloatLabelSelect-select').focus();
          });
        };

        this.sendAction('onAddCertificate', callback);

        // Set the dropdown to "Passthrough" to ensure that the "add certificate"
        // option can be selected again if the user closes the create cert modal
        // without saving. This also prevents the dropdown from being erroneously
        // marked as invalid after successfully adding a certificate.
        Ember.run.later(() => {
          this.set('rule.certificate_id', TLS_PASSTHROUGH_VALUE);
        }, 300); // eslint-disable-line no-magic-numbers
      } else if (e.target.value === TLS_PASSTHROUGH_VALUE) {
        this.setProperties({
          'rule.target_protocol': 'HTTPS',
          'rule.target_port': 443
        });
      } else {
        this.set('rule.tls_passthrough', false);
      }
    },

    onEntryProtocolChange: function(e) {
      const entryProtocol = e.target.value;
      const ruleWithProtocolAlreadyExists = this.get('allRules').filter((rule) =>
        rule.entry_protocol === entryProtocol
      ).length > 1;

      let entryPort = null;
      let targetProtocol = entryProtocol;

      if (!ruleWithProtocolAlreadyExists) {
        entryPort = (entryProtocol === 'HTTPS') ? HTTPS_PORT : HTTP_PORT;
      }

      let targetPort = entryPort;

      if (entryProtocol === 'HTTPS') {
        targetProtocol = 'HTTP';
        targetPort = 80;
      }

      this.setProperties({
        'rule.entry_protocol': entryProtocol,
        'rule.target_protocol': targetProtocol,
        'rule.entry_port': entryPort,
        'rule.target_port': targetPort
      });

      if (entryProtocol === 'TCP') {
        this.set('targetProtocolIsDisabled', true);
        this.set('targetProtocols', this.get('protocols'));
      } else {
        this.set('targetProtocolIsDisabled', false);
        this.set('targetProtocols', HTTPX_PROTOCOLS);
      }

      if (entryProtocol !== 'HTTPS') {
        this.set('rule.certificate_id', '');
        this.set('rule.tls_passthrough', false);
      }
    }
  }
});
