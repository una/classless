import BaseController from '../../base';
import App from '../../../app';
import Ember from 'ember';

export default BaseController.extend({
  radioValue: Ember.computed.alias('model.acl'),
  corsIsChecked: Ember.computed.alias('model.cors'),

  updateModel: function (key) {
    this.set('saving' + key, true);
    this.get('model')
      .save()
      .catch((err) => {
        this.errorHandler(err);
      })
      .finally(() => {
        this.set('saving' + key, false);
      });
  },

  actions: {
    aclChanged: function () {
      this.updateModel('Acl');
    },
    corsChanged: function () {
      this.updateModel('Cors');
    },
    regenerate: function () {
      this.set('showRegenModal', true);
    },
    onRegenHide: function (confirm) {
      if(confirm) {
        this.set('isRegenerating', true);
        this.get('model')
          .regenerateKey()
          .then(function () {
            App.NotificationsManager.show('Your secret key has been regenerated', 'notice');
          })
          .catch((err) => {
            this.errorHandler(err);
          })
          .finally(() => {
            this.set('isRegenerating', false);
          });
      }
      this.set('showRegenModal', false);
    }
  }
});
