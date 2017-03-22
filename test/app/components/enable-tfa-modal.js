import Ember from 'ember';
import {PropTypes} from 'ember-prop-types';

/**
  Example Usage:

  ```
  {{#enable-tfa-modal
    title="Choose an authentication method"
    onHide=(action "hideEnable2FAModal")
    submitAction=(action "show2FAPrimaryActionModal")
    submitButtonText="Continue"
    disabled=false
  }}
    <p>Text to have after the title</p>
  {{/enable-tfa-modal}}`
 */
export default Ember.Component.extend({
  propTypes: {
    title: PropTypes.string.isRequired,
    onHide: PropTypes.func.isRequired,
    submitAction: PropTypes.func.isRequired,
    submitButtonText: PropTypes.string.isRequired,
    disabled: PropTypes.bool
  },
  selectedMethod: 'authenticator',

  availablePrimaryMethods: [
    {
      value: 'authenticator',
      label: 'Authenticator app (recommended)',
      description: 'Get codes from an app like Google Authenticator or Duo.',
      image: '/assets/images/two-factor-auth-authenticator.png',
      imageHeight: '77'
    },
    {
      value: 'sms',
      label: 'SMS',
      description: 'You’ll receive a unique code each time you log in.'
    }
  ],

  actions: {
    hide: function() {
      this.sendAction('onHide');
    },
    onSubmit: function() {
      this.sendAction('submitAction', this.get('selectedMethod'));
    },
    selectTab: function(tab) {
      this.set('selectedMethod', tab);
    }
  }
});
