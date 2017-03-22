import App from '../../../app';
import BaseController from '../../../controllers/base';

export default BaseController.extend({
  trackPageName: 'Team Invitations',
  invitesSent: 0,
  isGmailAuthenticated: false,

  handleInviteResponse: function(emails, resp) {
    try {
      resp = JSON.parse(resp._bodyText);
    } catch (e) {
      resp = { failures: {} };
    }

    let failCount = Object.keys(resp.failures).length;
    let successCount = emails.length - failCount;

    this.set('invitesSent', successCount);

    if (successCount > 0) {
      let message = `${successCount} new member invitations sent!`;
      App.NotificationsManager.show(message, 'notice');
    }

    if (failCount === 0) {
      return this.transitionToRoute('settings.team');
    }

    Object.keys(resp.failures).forEach((email) => {
      this.showInviteError(email, resp.failures[email]);
    });
  },

  showInviteError: function(email, errors) {
    let messages = {
      daily_invite_limit: 'has reached the daily invite limit',
      already_invited: 'has already been invited',
      team_archived: 'was invited to an archived team',
      member: 'is already a member',
      team_limit: 'cannot join any more teams right now',
      failed_send: 'cannot be invited'
    };

    errors.forEach((error) => {
      let text = `${email} ${messages[error]}.`;
      App.NotificationsManager.show(text, 'alert');
    });
  },

  actions: {
    onModalHide: function() {
      this.transitionToRoute('settings.team');
    },

    onSubmitInvites: function(emails) {
      this.get('model').sendInvitations(emails).then((resp) => {
        this.handleInviteResponse(emails, resp);
      }).catch((err) => {
        this.handleInviteResponse(emails, err);
      });
    },
    authenticateGmail: function() {
      this.send('authenticate', 'google-proxy');
    }
  }
});
