import DS from 'ember-data';
import config from '../config/environment';
import {get, post, put, del} from '../utils/apiHelpers';
import UserModel from './user';

export default UserModel.extend({
  uuid: DS.attr(),
  slug: DS.attr(),
  role: DS.attr(),
  avatarInitials: DS.attr(),
  avatarColor: DS.attr(),
  avatar: DS.attr(),
  members: DS.hasMany('member'),
  email: DS.attr(),
  convert: DS.attr('boolean'),
  contactEmail: DS.attr(),

  apiNS: function () {
    let id = this.get('internalIdentifier');
    return `/${config['api-namespace']}/teams/${id}`;
  }.property('internalIdentifier'),

  put: function (options) {
    return put(`${this.get('apiNS')}`, options);
  },

  deactivate: function () {
    return del(`${this.get('apiNS')}`);
  },

  validateSlug: function(slug) {
    return get(`/${config['api-namespace']}/teams/validate_slug?slug=${slug}`);
  },

  leave: function() {
    return del(`${this.get('apiNS')}/leave`);
  },

  sendInvitations: function(emails) {
    let params = { members: emails };
    return post(`${this.get('apiNS')}/invitations`, params);
  },

  create: function(invites, creditCard, bankAccountSelected, transferAmount, isFree) {
    let params = {
      name: this.get('name'),
      slug: this.get('slug'),
      email: this.get('email'),
      convert: this.get('convert'),
      members: invites
    };

    if(creditCard) {
      params.payment_profile_id = creditCard.get('id');
    }

    if(bankAccountSelected) {
      params.bank_account = true;
    }

    if(transferAmount) {
      params.transfer_amount = window.parseFloat(transferAmount);
    }

    if(isFree) {
      params.is_free = true;
    }

    return post(`/${config['api-namespace']}/teams`, params);
  },

  isOrganization: true

});
