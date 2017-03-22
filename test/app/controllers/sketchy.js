import App from '../app';
import {get, put, del} from '../utils/apiHelpers';
import {camelizeObject} from '../utils/normalizeObjects';
import _ from 'lodash/lodash';
import ENV from '../config/environment';
import BaseController from '../controllers/base';
import {MS_IN_SECONDS} from '../constants';


export default BaseController.extend({
  trackPageName: 'Sketchy',

  init: function() {
    this.getReq = get;
    this.putReq = put;
    this.delReq = del;
    this.set('loading', true);
    this.fetchData(false);
  },
  actions: {
    unauthenticate: function(identity) { this.unauthSocial(identity); },
    submitSketchyForm: function(e) { this.submitSketchyForm(e); },
    deactivate: function() { this.deactivate(); }
  },
  showSketchyForm: function() {
    return !(App.User.get('isOrganizationContext') && !App.User.get('isOwner'));
  }.property(),
  submitSketchyForm: function() {
    let model = this.get('model');
    let data = {account_verification: model};
    let uri = `/${ENV['api-namespace']}/users/verify`;
    return this.putReq(uri, data).then((resp) => {
      resp.json().then((json) => {
        if(this.segment) {
          this.segment.trackEvent('Sketchy Form Submission', {
            time: Math.round((new Date() - this.get('fetchTime')) / MS_IN_SECONDS) + ' s'
          });
        }

        let data = camelizeObject(json);
        window.location.href = `/support/tickets/${data.ticketId}`;
      });
    })
    .catch((err) => {
      this.errorHandler(err, 'Submission');
    });
  },
  unauthSocial: function(identity) {
    let uri = `/${ENV['api-namespace']}/social_identities/${this.get('componentData')[identity].id}`;
    return this.delReq(uri)
    .then(() => {
      let componentData = _.assign({}, this.get('componentData'));
      componentData[identity] = null;
      this.set('componentData', componentData);
      if(this.segment) {
        this.segment.trackEvent('Sketchy UnAuth Success', { identity: identity });
      }
    })
    .catch((resp) => {
      this.errorHandler('Sketchy', resp, identity + ' Unauth');
    });
  },
  fetchData: function(isOauth) {
    return App.User.verifySocialAccounts(isOauth).then((json) => {
      let data = camelizeObject(json);
      if (!data.isSketchy) {
        window.location.href = '/';
      }
      if (!this.isDestroyed) {
        this.set('componentData', _.extend(data, {
          canBeDeleted: App.User.get('canBeDeleted')
        }));
        this.set('loading', false);
      }
      this.set('fetchTime', new Date());

      if(this.segment) {
        this.segment.trackEvent('Sketchy Page Type', {
          how_many_accounts: data.shouldShowMultipleAccounts ? 'multiple' : 'single',
          account_activation_status: data.isUnactivatedSketchy ? 'unactivated' : 'activated'
        });
      }
    }).catch((resp) => {
      if (!this.isDestroyed) {
        this.set('loading', false);
      }
      this.errorHandler(resp, 'Fetch Data');
    });
  }
});
