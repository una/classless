import Ember from 'ember';
import App from '../app';
import _ from 'lodash/lodash';

export default Ember.Service.extend({
  isCurrentContext: function(context) {
    return context.id === App.User.get('currentContextId');
  },
  switchContext: function(context, redirectTo) {
    return this.switchUserContext(context.get('internalIdentifier') || context.id, redirectTo);
  },
  _redirectLocation: function(redirectTo) {
    // TODO(Selby): Swap user via Ember for smoother transition
    // instead of reloading page.
    // window.currentUser = json.user;
    if (_.isString(redirectTo)) {
      redirectTo = redirectTo[0] === '/' ? redirectTo : `/${redirectTo}`;
      window.location.replace(redirectTo);
    } else {
      window.location.replace('/');
    }
  },
  switchUserContext: function(contextId, redirectTo) {
    return App.User.switchContext(contextId).then((result) => {
      result.json().then(() => {
        this._redirectLocation(redirectTo);
      });
    });
  }
});
