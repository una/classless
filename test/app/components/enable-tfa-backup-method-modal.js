import {PropTypes} from 'ember-prop-types';
import ModalWindow from './modal-window';

/**
  Example Usage:

  ```
  {{enable-tfa-backup-method-modal
    primaryMethod="authenticator"
    title="You've enabled two-factor authentication"
    titleImage="/assets/images/lock-animation.gif"
    titleImageAlt="Account secured"
    onHide=(action "onHide")
    submitAction=(action "selectBackupMethod")
  }}
  ```
 */
export default ModalWindow.extend({
  propTypes: {
    primaryMethod: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    onHide: PropTypes.func.isRequired,
    submitAction: PropTypes.func.isRequired,
    titleImage: PropTypes.string,
    titleImageAlt: PropTypes.string
  },
  selectedMethod: "recovery_codes",
  backupMethods: [
    {
      label: "Backup codes (recommended)",
      value: "recovery_codes",
      description: "Generate a set of 20 unique codes to keep on hand.",
      image: '/assets/images/backup-codes.png',
      imageHeight: '47'
    },
    {
      label: "Authenticator app",
      value: "authenticator",
      description: "Get codes from an app like Google Authenticator or Duo."
    },
    {
      label: "SMS",
      value: "sms",
      description: "You’ll receive a unique code each time you log in."
    }
  ],
  availableBackupMethods: function() {
    let availableMethods = [];
    let currentMethod, i;
    let backupMethods = this.get('backupMethods');
    for (i = 0; i < backupMethods.length; i++) {
      currentMethod = backupMethods[i];
      if(currentMethod.value !== this.get('primaryMethod')) {
        availableMethods.push(currentMethod);
      }
    }
    return availableMethods;
  }.property('primaryMethod'),

  actions: {
    hide: function() {
      this.sendAction('onHide');
    },
    onSubmit: function() {
      this.sendAction('onHide');
      this.sendAction('submitAction', this.get('selectedMethod'));
    },
    selectTab: function(tab) {
      this.set('selectedMethod', tab);
    }
  }
});
