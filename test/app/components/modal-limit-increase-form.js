import Ember from 'ember';
import App from '../app';

/**
 * PROPTYPES
 * limitType - {string} - model type
 * limitCount - {Number} - current limit number for type
 * bodyMessage - {string} - modal body copy
 * modalTitle - {string} - modal title copy
 * errorMessage - {string} - notification alert copy when failed request
 * successMessage - {string} - nofication notice copy when successful request
 * size - {string} - class to define modal size
 * onSubmit - {function} - callback method on submission
 * hideLimitAlert - {bool} - option to include form without alert
 *
 * TYPE = VOLUME by default
 */

export default Ember.Component.extend({
  showResourceLimitForm: false,
  submittedSuccess: false,
  limitType: 'volume',
  modalTitle: 'Increase Volume Limit',
  bodyMessage: 'To request an increase to the number of volumes on your account, please complete the form below.',
  errorMessage: 'Sorry! Something went wrong.',
  successMessage: 'Your limit increase request has been submitted! Our support team will follow up shortly on your request.',
  size: 'small',

  alertBody: function() {
    return `To add more than ${this.limitCount} ${this.limitType}s to your account, you can submit a request ticket.`;
  }.property('limitCount', 'limitType'),

  resetProperties: function() {
    this.setProperties({
      reason: '',
      requestedLimit: ''
    });
  },
  modalHide: function() {
    this.set('showResourceLimitForm', false);
    this.resetProperties();
  },

  actions: {
    onSubmit: function() {
      let data = {
        type: this.get('limitType').underscore(),
        reason: this.get('reason'),
        requested_resource_limit: this.get('requestedLimit')
      };
      this.set('isSubmitting', true);
      App.User.requestResourceLimitIncrease(data).then(() => {
        App.NotificationsManager.show(this.get('successMessage'), 'notice');
        this.set('submittedSuccess', true);
        if(this.get('onSubmit')){
          this.sendAction('onSubmit');
        }
      }).catch(() => {
        App.NotificationsManager.show(this.get('errorMessage'), 'alert');
        this.modalHide();
      }).finally(() => {
        this.set('isSubmitting', false);
        this.modalHide();
      });
    },
    onModalHide: function () {
      this.modalHide();
    },
    showModal: function () {
      this.set('showResourceLimitForm', true);
    }
  }
});
