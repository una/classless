import Ember from 'ember';
import {PropTypes} from 'ember-prop-types';

/**
  Example Usage:

  ```
  {{enable-tfa-authenticator-modal
    title="Connect your app"
    renderAction=(action "selectAuthenticator")
    onHide=(action "hideEnable2FAAuthenticatorModal")
    confirmCode=(action "confirm2FAAuthenticatorCode")
    qrCode={ secret: '', qrcode: {modules: [], module_count: 0}}
  }}
  ```
 */
export default Ember.Component.extend({
  propTypes: {
    title: PropTypes.string.isRequired,
    renderAction: PropTypes.func.isRequired,
    onHide: PropTypes.func.isRequired,
    confirmCode: PropTypes.func.isRequired,
    qrCode: PropTypes.object.isRequired
  },
  showManualEntry: false,
  code: '',
  qrCodeSquareSize: 3,
  loading: false,
  didInsertElement: function() {
    this.sendAction('renderAction');
  },

  disabledSubmit: function() {
    return !this.get('code').match(/^[0-9]{6}$/);
  }.property('code'),

  username: function() {
    let match = this.get('qrCode.qrcode.data').match(/otpauth:\/\/[^:]+:([^\?]*)\?/);
    if(match) {
      return match[1];
    } else {
      return '';
    }
  }.property('qrCode.qrcode.data'),

  manualCode: function() {
    return this.get('qrCode').secret;
  }.property('qrCode'),

  hasQrCode: function() {
    return (this.get('qrCode.qrcode.module_count') || 0) > 0;
  }.property('qrCode'),

  didRender: function() {
    let canvas = this.$('#qrcode-canvas')[0];
    if ( canvas && !this.get('qrCodeRendered')) {
      let ctx = canvas.getContext('2d');
      let qrCode = this.get('qrCode').qrcode || {};
      let row, col;
      let lines = qrCode.module_count || 0;
      let size = this.get('qrCodeSquareSize');
      for(row = 0; row < lines; row++) {
        for(col = 0; col < lines; col++) {
          if(qrCode.modules[col][row]) {
            ctx.fillStyle = '#000000';
          } else {
            ctx.fillStyle = '#FFFFFF';
          }
          ctx.fillRect(row * size, col * size, size, size);
        }
      }
      this.set('qrCodeRendered', true);
    }
  },

  actions: {
    hide: function() {
      this.sendAction('onHide');
    },
    onSubmit: function() {
      this.set('loading', true);
      this.sendAction('confirmCode', this.get('code'), () => {
        this.set('loading', false);
        this.set('code', '');
      });
    },
    showManualInstructions: function() {
      this.set('showManualEntry', true);
    }
  }
});
