import DS from 'ember-data';
import { del, get } from '../utils/apiHelpers';
import ENV from '../config/environment';

export default DS.Model.extend({
  organization: DS.belongsTo('organization'),
  email: DS.attr(),
  name: DS.attr(),
  twoFactorAuthEnabled: DS.attr(),
  role: DS.attr(),
  status: DS.attr(),
  avatar: DS.attr(),
  internalIdentifier: DS.attr('number'),
  organizationId: DS.attr(),

  displayName: function() {
    return this.get('name') || this.get('email');
  }.property('email', 'name'),

  isPending: function () {
    return this.get('status') === 'Pending';
  }.property('status'),

  isMember: function () {
    return this.get('role') === 'Member';
  }.property('role'),

  isBiller: function () {
    return this.get('role') === 'Biller';
  }.property('role'),

  isOwner: function () {
    return this.get('role') === 'Owner';
  }.property('role'),

  invitationsRoot: function() {
    let teamId = this.get('organization.id');
    return `/${ENV['api-namespace']}/teams/${teamId}/invitations`;
  },

  resendInvite: function() {
    let encodedEmail = encodeURIComponent(this.get('email'));
    let path = `${this.invitationsRoot()}/resend?email=${encodedEmail}`;
    return get(path);
  },

  cancelInvite: function() {
    let encodedEmail = encodeURIComponent(this.get('email'));
    let path = `${this.invitationsRoot()}/cancel?email=${encodedEmail}`;
    return del(path);
  }
});
