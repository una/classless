import App from '../../../app';
import BaseController from '../../../controllers/base';

export default BaseController.extend({
  trackPageName: 'Droplet Auto Limit Increase',

  actions: {
    onModalHide: function() {
      this.transitionToRoute('settings.profile');
    },

    onSubmit: function() {
      this.set('isSubmitting', true);
      App.User.requestIncreaseDropletLimitAuto().then(() => {
        let message = 'Your Droplet limit has been increased!';
        App.NotificationsManager.show(message, 'notice');
        this.transitionToRoute('settings.profile');
      }).catch((err) => {
        this.errorHandler(err, 'Request Auto Increase');
      }).finally(() => {
        this.set('isSubmitting', false);
      });
    }
  }
});
