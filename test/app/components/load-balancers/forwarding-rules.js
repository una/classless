import Ember from 'ember';
import { PropTypes } from 'ember-prop-types';
import { HTTP_PORT, HTTPS_PORT } from '../../constants';
import ValidationForm from '../form-with-validation';

const PROTOCOLS = [
  'HTTP',
  'HTTPS',
  'TCP'
];

export default Ember.Component.extend({
  propTypes: {
    rules: PropTypes.array,
    isEditMode: PropTypes.bool,
    maxRules: PropTypes.number
  },

  rules: [],
  isEditMode: false,
  maxRules: null,

  protocols: PROTOCOLS,
  newRuleProtocol: '',

  didInsertElement: function() {
    this._super(...arguments);

    let parentView = this.get('parentView');

    while (parentView && !(parentView instanceof ValidationForm)) {
      parentView = parentView.get('parentView');
    }

    this.set('validationForm', parentView);
  },

  validateForm: function() {
    if (this.get('validationForm')) {
      Ember.run.next(() => {
        if (!this.get('isDestroyed') && !this.get('isDestroying')) {
          this.get('validationForm').send('validateForm');
        }
      });
    }
  },

  hasHttpsRules: function() {
    return this.get('rules').any((rule) =>
      rule.entry_protocol === 'HTTPS'
    );
  }.property('rules.@each.entry_protocol'),

  actions: {
    onRemove: function(index) {
      this.get('rules').removeAt(index);
      this.validateForm();
    },

    onValidateForm: function() {
      this.validateForm();
    },

    onAddCertificate: function(callback) {
      if (this.get('onAddCertificate')) {
        this.sendAction('onAddCertificate', callback);
      }
    },

    onNewRule: function(e) {
      const rules = this.get('rules');
      const entryProtocol = e.target.value;
      const ruleWithProtocolAlreadyExists = rules.any((rule) =>
        rule.entry_protocol === entryProtocol
      );

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

      rules.pushObject({
        entry_port: entryPort,
        entry_protocol: entryProtocol,
        target_port: targetPort,
        target_protocol: targetProtocol,
        certificate_id: ''
      });

      Ember.run.next(() => {
        this.$('.forwarding-rule:last .rule-entry-protocol .FloatLabelSelect-select').focus();

        if (!this.get('isDestroying') && !this.get('isDestroyed')) {
          this.set('newRuleProtocol', '');
        }
      });
    }
  }
});
