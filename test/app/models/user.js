import Ember from 'ember';
import DS from 'ember-data';
import {get, del, post} from '../utils/apiHelpers';
import config from '../config/environment';
import PollModel from '../mixins/poll-model';
import { CONTEXT_ID_SUBSTRING_LENGTH } from '../constants';
import _ from 'lodash/lodash';

const apiNS = config['api-namespace'];
const MAX_TEAMS = 10;

function isOnboarded(user) {
  if (user) {
    let step = user.get('onboardingStep');
    return !!step && _.includes(['activated', 'engaged', 'established'], step);
  }
  return false;
}

export default DS.Model.extend(PollModel, {
  uuid: DS.attr(),
  balance: DS.attr(),
  email: DS.attr(),
  emailConfirmation: DS.attr(),
  currentPassword: DS.attr(),
  password: DS.attr(),
  passwordConfirmation: DS.attr(),
  name: DS.attr(),
  phoneNumber: DS.attr(),
  phone: DS.attr(), // used to update phone number record in cloud
  dropletLimit: DS.attr(),
  onboardingStep: DS.attr(),
  newsletterSubscribed: DS.attr(),
  inBadStanding: DS.attr(),
  status: DS.attr(),
  location: DS.attr(),
  canBeDeleted: DS.attr(),
  usageTotal: DS.attr(),
  internalIdentifier: DS.attr('number'),
  organizations: DS.hasMany('organization'),
  currentContextId: DS.attr(),
  avatar: DS.attr(),
  tfaEnabled: DS.attr(),
  twoFactorMethods: DS.attr(),
  credit: DS.attr(),
  isHold: DS.attr(),
  isTrial: DS.attr(),
  isVerified: DS.attr(),
  isOrganization: false,
  paymentMethod: DS.attr(),
  navMessage: DS.attr(),
  createdAt: DS.attr('date'),
  company: DS.attr(),

  shortId: Ember.computed('uuid', function() {
    return this.get('uuid').substring(0, CONTEXT_ID_SUBSTRING_LENGTH);
  }),

  shortCurrentContextId: Ember.computed('currentContextId', function() {
    return this.get('currentContextId').substring(0, CONTEXT_ID_SUBSTRING_LENGTH);
  }),

  navMessageToDisplay: function () {
    if (this.get('navMessage') === 'referee_credit') {
      return 'You have $10 in referral credit';
    }
  }.property('navMessage'),

  isInContextWithStatus: function(status) {
    return this.get('isUserContext') && this.get('status') === status || this.get('currentContext.status') === status;
  },

  isInBadStanding: function () {
    return this.get('isUserContext') && this.get('inBadStanding') || this.get('currentContext.inBadStanding');
  }.property('inBadStanding', 'currentContextId'),

  isInHoldContext: function () {
    return this.get('isUserContext') && this.get('isHold') || this.get('currentContext.isHold');
  }.property('isUserContext', 'isHold', 'currentContext.isHold'),

  isInVerifiedContext: function () {
    return this.get('isUserContext') && this.get('isVerified') || this.get('currentContext.isVerified');
  }.property('isUserContext', 'isVerified', 'currentContext.isVerified'),

  isInTrialContext: function () {
    return this.get('isUserContext') && this.get('isTrial') || this.get('currentContext.isTrial');
  }.property('isUserContext', 'isTrial', 'currentContext.isTrial'),

  isSketchy: function () {
    return this.isInContextWithStatus('sketchy');
  }.property('status', 'currentContextId'),

  isArchived: function () {
    return this.isInContextWithStatus('archived');
  }.property('status', 'currentContextId'),

  isAdminLocked: function () {
    return this.isInContextWithStatus('admin_locked');
  }.property('status', 'currentContextId'),

  isAbuse: function () {
    return this.isInContextWithStatus('abuse');
  }.property('status', 'currentContextId'),

  isSuspended: function () {
    return this.isInContextWithStatus('suspended');
  }.property('status', 'currentContextId'),

  hasValidPaymentMethod: function () {
    return _.contains(['free', 'cc', 'paypal'], this.get('paymentMethod'));
  }.property('paymentMethod'),

  isFree: Ember.computed.equal('paymentMethod', 'free'),

  deactivate: function (body) {
    body = body || {};
    return del(`/${apiNS}/users/${this.id}`, body);
  },

  isUserContext: function() {
    return this.get('uuid') === this.get('currentContextId');
  }.property('uuid', 'currentContextId'),

  isOrganizationContext: function() {
    return !this.get('isUserContext');
  }.property('uuid', 'currentContextId'),

  effectiveOnboardingStep: function () {
    let orgStep = this.get('currentContext.onboardingStep');
    if(orgStep) {
      return orgStep;
    }
    return this.get('onboardingStep');
  }.property('onboardingStep', 'currentContext').volatile(),

  effectiveRecipientEmail: function () {
    let orgEmail = this.get('currentContext.contactEmail');
    if(orgEmail) {
      return orgEmail;
    }
    return this.get('email');
  }.property('email', 'currentContext').volatile(),

  getStatistics: function () {
    return get(`/${apiNS}/users/${this.get('uuid')}/resource_statistics`).then((result) => {
      return result.json();
    });
  },

  // Determine if specifically the current user is onboarded (never an org context).
  isUserOnboarded: function () {
    return isOnboarded(this);
  }.property('onboardingStep').volatile(), //computed property gets incorrectly cached, volatile fixes it

  // Determine if specifically the current context (user or org) is onboarded.
  isContextOnboarded: function() {
    return (this.get('currentContext') ? isOnboarded(this.get('currentContext')) : this.get('isUserOnboarded'));
  }.property('effectiveOnboardingStep', 'onboardingStep', 'currentContext'),

  // Determine if either the current user OR the current context (org) is
  // onboarded.
  isOnboarded: function () {
    return isOnboarded(this) || isOnboarded(this.get('currentContext'));
  }.property('effectiveOnboardingStep', 'onboardingStep', 'currentContext'),

  switchContext: function(contextId) {
    return post(`/${apiNS}/session/switch_context`, { contextId: contextId });
  },

  currentContext: function () {
    return this.get('organizations').findBy('uuid', this.get('currentContextId'));
  }.property('currentContextId', 'organizations'),

  findContextId: function(text) {
    let beginsWithText = function(context, text) {
      return context.get('uuid').indexOf(text) === 0;
    };
    let matchedOrganization = this.get('organizations').find((org) =>
      beginsWithText(org, text)
    );
    if (matchedOrganization) {
      return matchedOrganization.get('uuid');
    } else if (beginsWithText(this, text)) {
      return this.get('uuid');
    }
  },

  isReadOnly: function () {
    return this.get('isBiller');
  }.property('isBiller'),

  canAccessBilling: function () {
    let role = _.isString(this.get('currentContext.role')) && this.get('currentContext.role').toLowerCase();
    return _.contains(['owner', 'biller'], role) || this.get('isUserContext');
  }.property('currentContextId'),

  isOwner: function () {
    return _.isString(this.get('currentContext.role')) && this.get('currentContext.role').toLowerCase() === 'owner';
  }.property('currentContextId'),

  isBiller: function () {
    return _.isString(this.get('currentContext.role')) && this.get('currentContext.role').toLowerCase() === 'biller';
  }.property('currentContextId'),

  verifySocialAccounts: function(isOauth) {
    return get(`/${apiNS}/users/verify/edit?oauth_response=${isOauth}`).then((result) => {
      return result.json();
    });
  },

  unauthenicateSocialAccount: function(identityId) {
    return del(`/${apiNS}/social_identities/${identityId}`);
  },

  tfaTypeName: {
    authenticator: 'App',
    sms: 'SMS',
    recovery_codes: 'Codes'
  },

  tfaPrimaryType: function() {
    let methods = this.get('twoFactorMethods');
    return _.findKey(methods, { is_primary: true });
  }.property('twoFactorMethods'),

  tfaBackupType: function() {
    let methods = this.get('twoFactorMethods');
    return _.findKey(methods, function(method) {
       return !method.is_primary;
    });
  }.property('twoFactorMethods'),

  toTfaMethod: function(type) {
    if (type === undefined) {
      return type;
    } else {
      return {
        name: this.tfaTypeName[type],
        data: this.get('twoFactorMethods')[type],
        type: type
      };
    }
  },

  tfaMethod: function() {
    let type = this.get('tfaPrimaryType');
    return this.toTfaMethod(type);
  }.property('twoFactorMethods'),

  tfaBackupMethod: function() {
    let type = this.get('tfaBackupType');
    return this.toTfaMethod(type);
  }.property('twoFactorMethods'),

  disable2FA: function() {
    return del(`/${apiNS}/two_factor_auth`);
  },

  disable2FABackup: function() {
    return del(`/${apiNS}/two_factor_auth/backup_methods`);
  },

  selectMethod: function(payload) {
    return post(`/${apiNS}/two_factor_auth/select_method`, payload);
  },

  generateRecoveryCodes: function() {
    return post(`/${apiNS}/two_factor_auth/recovery_codes`);
  },

  verifyAuthenticator: function(code) {
    return post(`/${apiNS}/two_factor_auth/authenticator_verify`, { password: code });
  },

  verifySMS: function(code) {
    return post(`/${apiNS}/two_factor_auth/phone_verify`, { pin: code });
  },

  hasEmptyBackupCodes: function() {
    let methods = this.get('twoFactorMethods');
    if (_.isObject(methods) && methods.hasOwnProperty('recovery_codes')) {
      return methods.recovery_codes.code_count === 0;
    }
    return false;
  }.property('twoFactorMethods'),

  canCreateTeams: function () {
    return this.get('organizations.length') < MAX_TEAMS && !this.get('isInBadStanding') && !this.get('isArchived') && this.get('isUserOnboarded');
  }.property('organizations'),

  fetchSocialContacts: function(provider) {
    return get(`/${apiNS}/social_contacts/${provider}`);
  },

  requestResourceLimitIncrease: function(params) {
    let userId = this.get('internalIdentifier');
    return post(`/${apiNS}/users/${userId}/request_resource_limit_increase`, params);
  },

  requestIncreaseDropletLimitAuto: function() {
    return post(`/${apiNS}/users/increase_droplet_limit_auto`);
  },

  fetchReferralStats: function() {
    return get(`/${apiNS}/referrals/stats`).then((result) => {
      return result.json();
    });
  },

  switchToCreditsPayout: function() {
    post(`/${apiNS}/users/${this.get('uuid')}/revoke_grandfathered_paypal_referrals`);
  },

  fetchReferralInvites: function() {
    return get(`/${apiNS}/referral_invites`).then((result) => {
      return result.json();
    });
  },

  sendReferrals: function(emails) {
    let invites = [];
    emails.forEach(function(email) {
      invites.push({
        email: email
      });
    });

    return post(`/${apiNS}/referral_invites`, {'invites': invites});
  },

  fetchResourceLimits: function() {
    return get(`/${apiNS}/users/${this.get('uuid')}/resource_limits`).then((result) => {
      return result.json();
    });
  },

  fetchBillingState: function() {
    return get(`/${apiNS}/billing/user_settings`).then((result) => {
      return result.json();
    });
  },

  sendCCPayment: function() {
    return post(`/${apiNS}/billing/pay_cc`);
  }
});
