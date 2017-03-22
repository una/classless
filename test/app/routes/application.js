import Ember from 'ember';
import App from '../app';
import _ from 'lodash/lodash';
import {STATUS_CODE_UNAUTHORIZED, STATUS_CODE_FORBIDDEN} from '../constants';

export default Ember.Route.extend({
  queryParams: {
    i: {
      replace: true
    }
  },

  title: function(subsequentTitle) {
    let titleStr = 'DigitalOcean';
    if (!_.isArray(subsequentTitle) || _.isEmpty(subsequentTitle)) {
      subsequentTitle = ['Control Panel'];
    }
    return titleStr + ' - ' + subsequentTitle[0];
  },

  _setUserContext: function(user, params) {
    if (params && params.i) {
      let contextId = user.findContextId(params.i);
      if (contextId) {
        user.set('currentContextId', contextId);
      }
    }

    this.get('logger').callRaven('setUserContext', {
      email: user.get('email'),
      id: user.get('uuid')
    });

    this.get('logger').enableGlobalErrorCatching();

    return App.User = user;
  },

  model: function(params) {
    let currentUser = window.currentUser;

    if (currentUser && _.isNumber(currentUser.id)) {
      this.store.push(this.store.normalize('user', currentUser));
      return this._setUserContext(this.store.peekRecord('user', currentUser.uuid), params);
    }

    return this.store.findAll('user').then((model) => {
      return this._setUserContext(model.get('firstObject'), params);
    });
  },

  identifyUser: function() {
    if(App.User && this.segment && !this.get('identifiedUser')) {
      this.set('identifiedUser', true);
      this.segment.identifyUser(App.User.get('uuid'));
    }
  },

  hardRedirectToUrl: function(url) {
    if(url) {
      window.location.href = url;
    }
  },

  actions: {
    error: function(error) {
      if(error && [STATUS_CODE_UNAUTHORIZED, STATUS_CODE_FORBIDDEN].indexOf(parseInt(error.status, 10)) !== -1) {
        this.hardRedirectToUrl('/login');
      }
      return true;
    },
    loading: function () {
      return true;
    },
    willTransition: function(transition) {
      if(this.controllerFor('application').get('newVersionAvailable')) {
        let url;

        try {
          url = this.router.generate(transition.targetName);
        } catch(e) {
          return true;
        }

        // undefined exists if there is a dynamic segment in the route
        if(url && url.indexOf('undefined') === -1) {
          transition.abort();
          this.hardRedirectToUrl(url);
        }
      }
    }
  }
});