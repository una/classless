import App from '../../../app';
import BaseController from '../../../controllers/base';

export default BaseController.extend({
  modalTitle: 'Deactivate account',
  trackPageName: 'Account Deactivate',

  deactivate: function() {
    let data = {
      purge_account: this.get('purgeData')
    };
    App.User.deactivate(data).then(() => {
      if (data.purge_account) {
        window.location.href = '/logout';
      } else {
        window.location.href = '/archived_account';
      }
    }).catch((err) => {
      this.errorHandler(err, 'Deactivate');
    });
  },

  actions: {
    setup: function() {
      this.set('purgeData', false);
    },
    onModalHide: function (save) {
      if (save) {
        this.deactivate();
      }
      this.transitionToRoute('settings.profile');
    },
    radioChange: function(value) {
      if (value === 'Yes') {
        this.set('purgeData', true);
      } else {
        this.set('purgeData', false);
      }
    }
  }
});
