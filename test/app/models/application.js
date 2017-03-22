import DS from 'ember-data';
import ENV from '../config/environment';

export default DS.Model.extend({
  uid: DS.attr(),
  name: DS.attr(),
  url: DS.attr(),
  redirectUri: DS.attr(),
  description: DS.attr(),
  secret: DS.attr(),
  isInternal: DS.attr(),
  authorized: DS.attr(),
  updatedAt: DS.attr(),
  createdAt: DS.attr(),

  authorizationUrl: function() {
    return ENV['api-host'] + '/v1/oauth/authorize?client_id=' + this.get('uid') + '&redirect_uri=' + this.get('redirectUri') + '&response_type=code';
  }.property('uid', 'redirectUri')
});
