import BaseController from '../../controllers/base';

export default BaseController.extend({
  actions: {
    unauthenticate: function(identity) {
      let identityId = this.get(`socialAccountData.${identity}.id`);
      this.send('unauthenticateSocialAccount', identityId);
    },
    authenticate: function(identity, provider) {
      this.send('authenticateSocialAccount', identity, provider);
    }
  }
});
