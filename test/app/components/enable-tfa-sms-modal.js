import Ember from 'ember';
import {PropTypes} from 'ember-prop-types';

/**
  Example Usage:

  ```
  {{enable-tfa-sms-modal
    title="Verify your phone number"
    onHide=(action "hideEnable2FASMSModal")
    sendSMSCode=(action "send2FASMSCode")
    verifySMSCode=(action "confirm2FASMSCode")
  }}
  ```
 */
export default Ember.Component.extend({
  propTypes: {
    title: PropTypes.string.isRequired,
    onHide: PropTypes.func.isRequired,
    sendSMSCode: PropTypes.func.isRequired,
    verifySMSCode: PropTypes.func.isRequired
  },
  sendDisabled: false,
  verifyDisabled: false,
  SMSSent: false,
  code: '',

  sendSMSCodeText: function() {
    if(this.get('SMSSent')) {
      return "Resend";
    } else {
      return "Send";
    }
  }.property('SMSSent'),

  sendSMSCodeColorClass: function() {
    if(this.get('SMSSent')) {
      return "gray";
    } else {
      return "blue";
    }
  }.property('SMSSent'),

  disabledSMSSendSubmit: function() {
    let valid = this.get('value') &&
      this.get('value').match(/\d{3,}/) &&
      this.get('selectedCountryData');
    return !valid || this.get('sendDisabled');
  }.property('value', 'selectedCountryData', 'sendDisabled'),

  disabledCodeSubmit: function() {
    let valid = this.get('code') && this.get('code').match(/^[0-9a-zA-Z]{6}$/);
    return !valid || this.get('verifyDisabled');
  }.property('code', 'verifyDisabled'),

  actions: {
    hide: function() {
      this.sendAction('onHide');
    },
    sendSMSCode: function() {
      let countryCode = this.get('selectedCountryData').dialCode;
      this.set('sendDisabled', true);
      this.sendAction('sendSMSCode', countryCode, this.get('value'), (err) => {
        if (!err) {
          this.set('SMSSent', true);
        }
        this.set('sendDisabled', false);
      });
    },
    verifyCode: function() {
      this.set('verifyDisabled', true);
      this.sendAction('verifySMSCode', this.get('code'), (err) => {
        if (!err) {
          this.set('code', '');
        }
        this.set('verifyDisabled', false);
      });
    }
  }
});
