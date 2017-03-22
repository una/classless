import App from '../../app';
import Ember from 'ember';
import ENV from '../../config/environment';
import {post} from '../../utils/apiHelpers';

export default Ember.Controller.extend({
  isReadOnly: function() {
    return App.User && App.User.get('isReadOnly');
  }.property('model'),

  apps: function () {
     return this.get('model').rejectBy('isInternal').rejectBy('revoked');
  }.property('model', 'model.@each.revoked'),

  internalApps: function () {
    return this.get('model').filterBy('isInternal').rejectBy('revoked');
  }.property('model', 'model.@each.revoked'),

  actions: {
    revoke: function(app) {
      this.set('revokeApp', app);
    },
    onModalHide: function(doDelete) {
      if(doDelete) {
        let app = this.get('revokeApp');
        app.set('isBeingRevoked', true);
        post('/' + ENV['api-namespace'] + '/applications/' + app.get('id') + '/revoke_access').then(() => {
          App.NotificationsManager.show('Access has been successfully revoked.', 'notice');
          app.set('revoked', true);
        }, function () {
          app.set('isBeingRevoked', false);
          App.NotificationsManager.show('Sorry! Something went wrong!', 'alert');
        });
      }
      this.set('revokeApp', null);
    }
  }
});
