import BaseController from '../../controllers/base';
import retrieveCsrfToken from '../../utils/retrieveCsrfToken';

export default BaseController.extend({
  contextId: null,

  setup: function() {
    this.csrfToken = retrieveCsrfToken();
  }.on('init'),

  scopes: function() {
    let scopes = this.get('model.preAuth.scopes');
    if (scopes && scopes.length) {
      return scopes.join(' ').toLowerCase();
    }
    return 'read';
  }.property('model.preAuth.scopes'),

  submitDisabled: function() {
    return this.get('contextId') === null;
  }.property('contextId'),

  authorizations: function() {
    return [this.contextId] + this.preAuthorizations();
  }.property('contextId'),

  setAuthorization: function(account) {
    let val = account.get('id');
    if (this.get('contextId') === val && this.canUncheckContext()) {
      this.set('contextId', null);
    } else {
      this.set('contextId', val);
    }
  },

  preAuthorizations: function() {
    return this.get('model').preAuth.authorizations;
  },

  canUncheckContext: function() {
    return this.preAuthorizations().length > 0;
  },

  actions: {
    clickContext: function(account) {
      this.setAuthorization(account);
    }
  }
});
