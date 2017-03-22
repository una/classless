import App from '../../../app';
import BaseController from '../../../controllers/base';

const DEFAULT_REQUEST_LIMIT = 5;

export default BaseController.extend({
  trackPageName: 'Networking Increase Floating IPs Limit',
  requestedLimit: DEFAULT_REQUEST_LIMIT,

  resetProperties: function() {
    this.setProperties({
      reason: '',
      requestedLimit: DEFAULT_REQUEST_LIMIT
    });
  },

  actions: {
    onSubmit: function() {
      let params = {
        type: 'floating_ip',
        name: App.User.get('name'),
        location: App.User.get('location'),
        reason: this.get('reason'),
        requested_resource_limit: this.get('requestedLimit')
      };

      this.set('isSubmitting', true);
      App.User.requestResourceLimitIncrease(params).then(() => {
        let message = 'Your floating IP limit request has been submitted! Our support team will follow up on your request shortly.';
        App.NotificationsManager.show(message, 'notice');
        this.send('onModalHide');
      }).catch((err) => {
        this.errorHandler(err, 'Request Floating IP Increase');
      }).finally(() => {
        this.set('isSubmitting', false);
      });
    },

    onModalHide: function() {
      this.transitionToRoute('networking.floatingIp');
    }
  }
});