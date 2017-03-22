import Ember from 'ember';
import {camelizeObject} from '../utils/normalizeObjects';
import App from '../app';

export default Ember.Component.extend({
  classNames: ['invitation-form'],
  inviteTab: 'email',
  gmailContacts: [],
  emailInvites: [],
  gmailInvites: [],
  hasInvites: Ember.computed.notEmpty('invites'),
  invites: Ember.computed.uniq('emailInvites', 'gmailInvites'),
  hasFetchedGmailContacts: false,
  isSubmittingSkipInvites: false,
  isSubmittingInvites: false,
  maxInvites: Infinity,
  isGmailAuthenticated: false,

  setup: function() {
    Ember.run.scheduleOnce('afterRender', this, function() {
      this.fetchSocialAccountData(true);
    });
  }.on('didInsertElement'),

  fetchSocialAccountData: function(isOauth) {
    App.User.verifySocialAccounts(isOauth).then((json) => {
      this.set('socialAccountData', camelizeObject(json));
    }).catch((err) => {
      if(this.get('onErrorFetchingSocialAccountData')) {
        this.sendAction('onErrorFetchingSocialAccountData', err);
      }
    });
  },

  socialAccountDataObserver: function() {
    let data = this.get('socialAccountData');
    if(data && data.googleIdentity) {
      this.set('isGmailAuthenticated', true);
      this.fetchGmailContacts();
    }
  }.observes('socialAccountData'),

  fetchGmailContacts: function() {
    if(this.get('isGmailAuthenticated')) {
      this.set('isFetchingGmailContacts', true);
      App.User.fetchSocialContacts('gmail').then((resp) => {
        resp.json().then((json) => {
          this.setProperties({
            gmailContacts: json.contacts
          });
        });
      }).catch((err) => {
        if(this.get('onErrorFetchingGmailContacts')) {
          this.sendAction('onErrorFetchingGmailContacts', err);
        }
      }).finally(() => {
        this.setProperties({
          isFetchingGmailContacts: false,
          hasFetchedGmailContacts: true
        });
      });
    }
  }.observes('isGmailAuthenticated'),

  isSubmitDisabled: function() {
    return !this.get('hasInvites') || this.get('isSubmittingSkipInvites') || this.get('isSubmittingInvites');
  }.property('hasInvites', 'isSubmittingSkipInvites', 'isSubmittingInvites'),

  creditAmount: function() {
    return this.get('invites.length') * this.get('creditMultiplier');
  }.property('invites.length', 'creditMultiplier'),

  actions: {
    showTab: function(tabName) {
      this.set('inviteTab', tabName);
    },
    updateEmailInvites: function(emailInvites) {
      this.set('emailInvites', emailInvites);
    },
    updateGmailInvites: function(gmailInvites) {
      this.set('gmailInvites', gmailInvites);
    },
    authenticateGmail: function() {
      if(this.get('authenticateGmail')) {
        this.sendAction('authenticateGmail');
      }
    },
    onSubmit: function() {
      if(this.get('onSubmitInvites')) {
        this.sendAction('onSubmitInvites', this.get('invites').slice());
      }
    }
  }
});
