import Ember from 'ember';
import App from '../app';
import BaseController from '../controllers/base';

export default BaseController.extend({
  tokensController: Ember.inject.controller('api.tokens'),
  modalTitle: 'Deactivate account',
  trackPageName: 'Sketchy Deactivate',

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
    })
    .catch((resp) => {
      this.errorHandler(resp, 'Deactivate');
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
      this.transitionToRoute('sketchy');
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
