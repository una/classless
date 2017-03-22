import Ember from 'ember';
import _ from 'lodash/lodash';

export default Ember.Route.extend({
  model: function() {
    let preAuth = window.preAuth || { error: 'Something went wrong. Please refresh the page.' };
    let rsvp;

    if (preAuth.error) {
      rsvp = { error: preAuth.error };
    } else {
      let englishScopes = preAuth.scopes;
      englishScopes[0] = _.capitalize(englishScopes[0]);

      rsvp = {
        preAuth: preAuth,
        scopes: englishScopes,
        application: preAuth.application,
        user: this.modelFor('application')
      };
    }

    return Ember.RSVP.hash(rsvp);
  }
});
