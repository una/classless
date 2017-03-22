import Ember from 'ember';
import {PropTypes} from 'ember-prop-types';

/**
  Example Usage:

  ```
  {{added-tfa-backup-with-codes-modal
    title="Backup codes"
    renderAction=(action "selectBackupCodes")
    recoveryCodes=['abcdef', '123456']
    onHide=(action "hideAdded2FABackupViaCodesModal")
  }}
  ```
 */

export default Ember.Component.extend({
  propTypes: {
    title: PropTypes.string.isRequired,
    renderAction: PropTypes.func.isRequired,
    recoveryCodes: PropTypes.array.isRequired,
    onHide: PropTypes.func.isRequired
  },

  codesRetrieved: false,

  didInsertElement: function() {
    if(!this.get('canDownload')) {
      this.sendAction('renderAction');
    }
  },

  canDownload: function() {
    return this.get('text') && this.get('text').length > 0;
  }.property('text.length'),

  dataURI: function() {
    return `data:text/plain;charset=UTF-8,${encodeURIComponent(this.get('text'))}`;
  }.property('text'),

  text: function() {
    return (this.get('recoveryCodes') || []).join("\n");
  }.property('recoveryCodes'),

  actions: {
    hide: function() {
      this.sendAction('onHide');
    },
    copyCodes: function() {
      this.set('codesRetrieved', true);
    },
    downloadCodes: function() {
      this.set('codesRetrieved', true);
    }
  }
});
