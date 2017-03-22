import BaseController from '../base';
import App from '../../app';

export default BaseController.extend({
  trackPageName: 'Referrals',
  isPaypalPayout: false,
  isReferralModalVisible: false,
  isSubmittingReferrals: false,
  isGmailAuthenticated: false,

  twitterUser: function() {
    return App.User.get('id') + ' - ' + App.User.get('email');
  }.property(),

  actions: {
    switchToCredits: function() {
      this.set('isSwitchingPayout', true);
      App.User.switchToCreditsPayout().then(() => {
        this.set('isPaypalPayout', false);
        App.NotificationsManager.show('Your payout preferences have been saved.', 'notice');
      }).catch((err) => {
        this.errorHandler(err, 'Saving payout preferences');
      }).finally(() => {
        this.set('isSwitchingPayout', false);
      });
    },
    showReferralModal: function() {
      this.set('isReferralModalVisible', true);
    },
    hideReferralModal: function() {
      this.set('isReferralModalVisible', false);
    },
    onSubmitReferrals: function(emails) {
      this.send('hideReferralModal');

      App.User.sendReferrals(emails).then((resp) => {
        resp.json().then((json) => {
          let numInvites = json.invites.length;
          let people = 'people were';

          if(numInvites === 1) {
            people = 'person was';
          }

          App.NotificationsManager.show(json.invites.length + ' ' + people + ' successfully invited to DigitalOcean.', 'notice');
          this.setProperties({
            referralLimit: json.send_limit_remaining
          });

          // show referrals that were not sent
          if(json.errors) {
            json.errors.forEach((error) => {
              if(error.email && error.messages.length) {
                App.NotificationsManager.show(error.email + ': ' + error.messages[0], 'alert');
              }
            });
          }
        });
      }).catch((err) => {
        this.errorHandler(err, 'Sending Referrals');
      });
    },
    authenticateGmail: function() {
      this.send('authenticate', 'google-proxy');
    }
  }
});