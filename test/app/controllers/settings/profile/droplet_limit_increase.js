import App from '../../../app';
import BaseController from '../../../controllers/base';

export default BaseController.extend({
  trackPageName: 'Droplet Limit Increase',

  resetProperties: function() {
    this.setProperties({
      name: '',
      location: '',
      reason: '',
      requestedLimit: '',
      publicProfile: ''
    });
  },

  actions: {
    onModalHide: function() {
      this.transitionToRoute('settings.profile');
    },

    onSubmit: function() {
      let params = {
        type: 'droplet',
        name: this.get('name'),
        location: this.get('location'),
        reason: this.get('reason'),
        requested_resource_limit: this.get('requestedLimit'),
        public_profile: this.get('publicProfile')
      };

      this.set('isSubmitting', true);
      App.User.requestResourceLimitIncrease(params).then(() => {
        let message = 'Your Droplet limit request has been submitted! Our support team will follow up on your request shortly.';
        App.NotificationsManager.show(message, 'notice');
        this.transitionToRoute('settings.profile');
      }).catch((err) => {
        this.errorHandler(err, 'Request Increase');
      }).finally(() => {
        this.set('isSubmitting', false);
      });
    }
  }
});
