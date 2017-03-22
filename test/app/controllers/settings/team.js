import BaseController from '../base';
import App from '../../app';
import Ember from 'ember';
import {DEBOUNCE_AMOUNT} from '../../constants';

const REDIRECT_TO_HOME_DELAY_MS = 1500;

export default BaseController.extend({
  trackPageName: 'Team Settings',
  sort: null,
  sort_direction: null,
  sorting: false,
  page: 1,
  modelLoading: false,

  needsPagination: function() {
    return this.model.members.meta.pagination.pages > 1;
  }.property('model'),

  teamDropletText: function() {
    let dropletLimit = this.get('model.team.dropletLimit');
    let plural = dropletLimit > 1 ? 's' : '';
    return `${dropletLimit} Droplet${plural}`;
  }.property('model.team.dropletLimit'),

  changePage: function() {
    this.trackAction('Change page');
    this.set('paginating', true);
  },

  notice: function(message) {
    App.NotificationsManager.show(message, 'notice');
  },

  setQuery: function() {
    this.set('query', this.get('toQuery'));
  },

  updateToQuery: function () {
    Ember.run.debounce(this, this.setQuery, DEBOUNCE_AMOUNT);
  }.observes('toQuery'),

  reloadLocationWithTimeout: function() {
    Ember.run.later(function() {
      // Reload and redirect to "home" page.
      window.location.href = '/';
    }, REDIRECT_TO_HOME_DELAY_MS);
  },

  _displayError: function(error) {
    error = error ? error.trim() : '';
    //If the error is on a role change for the owner, don't display an error message
    if (error.indexOf('owner change') !== -1) {
      App.NotificationsManager.show(error, 'notice');
      return;
    }
    this.showError.apply(this, arguments);
  },

  actions: {
    resendInvite: function(member) {
      member.resendInvite().then(() => {
        this.notice(`Invite resent to ${member.get('email')}.`);
      }).catch((err) => {
        this.errorHandler(err, 'Resend Invitation');
      });
    },

    changePage: function() {
      this.trackAction('Change page');
      this.set('paginating', true);
    },

    onLeaveModalClose: function(doLeave) {
      this.set('showLeaveModal', false);

      if (doLeave) {
        let name = this.get('model.team.name');
        this.get('model.team').leave().then(() => {
          this.notice(`You have left ${name}.`);
          this.reloadLocationWithTimeout();
        }).catch((err) => {
          this.errorHandler(err, 'Leave Team');
        });
      }
    },

    leaveTeam: function() {
      this.set('showLeaveModal', true);
    },

    onRemoveMemberModalClose: function(doRemove) {
      this.set('showRemoveMemberModal', false);

      if (doRemove) {
        let member = this.get('memberToRemove');
        member.destroyRecord().then(() => {
          this.notice(`${member.get('name')} has been removed from the team.`);
          this.model.members.removeObject(member);
        }).catch((err) => {
          this.errorHandler(err, 'Remove Member');
        });
      }
    },

    removeMember: function(member) {
      this.set('showRemoveMemberModal', true);
      this.set('memberToRemove', member);
    },

    changeRole: function(member, role) {
      let previousRole = member.get('role');
      member.set('role', role);
      member.save().then(() => {
        this.notice(`${member.get('name')} now has the ${role} role.`);
      }).catch((err) => {
        member.set('role', previousRole);
        this.errorHandler(err, 'Remove Member', null, this._displayError.bind(this));
      });
    },

    cancelInvite: function(member) {
      member.cancelInvite().then(() => {
        let name = member.get('displayName');
        this.notice(`${name} has been uninvited.`);
        this.model.members.removeObject(member);
      }).catch((err) => {
        this.errorHandler(err, 'Remove Member');
      });
    },

    reloadMembers: function() {
      this.setProperties({
        sort: 'created_at',
        sort_direction: 'desc',
        page: 1
      });
    }
  }
});
