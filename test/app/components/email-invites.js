import Ember from 'ember';
import _ from 'lodash/lodash';

const EMAIL_REGEX = /.+@.+\..+/i;

export default Ember.Component.extend({
  classNames: ['aurora-email-invites'],
  invites: [],
  isUnlimited: Ember.computed.equal('limit', Infinity),

  // we want to remove by index and not email because
  // there could be duplicate emails
  removeTokenByIndex: function(index) {
    let invites = this.get('invites').slice();

    if(index > -1) {
      invites.splice(index, 1);
      this.set('invites', invites);

      // set focus on input
      this.$('.js-input').focus();
    }
  },

  click: function() {
    // if email invite box is clicked and the active element is not this component
    // set the focus on the input field
    if(!Ember.$(document.activeElement).parents('.aurora-email-invites').length) {
      this.$('.js-input').focus();
    }
  },

  invitesObserver: function() {
    if(this.get('updateInvites')) {
      let emails = [];

      emails = _.filter(this.get('invites').slice(), {isValid: true}).map(function(invite) {
        return invite.email;
      });

      this.sendAction('updateInvites', emails);
    }
  }.observes('invites.length'),

  actions: {
    removeToken: function(email, index) {
      if(index >= 0) {
        this.removeTokenByIndex(index);
      }
    },
    clickToken: function(elt) {
      this.$('.token-input').removeClass('selected');
      elt.addClass('selected');

    },
    blurToken: function(elt) {
      elt.removeClass('selected');
    },
    focusToken: function(elt) {
      elt.addClass('selected');
    },
    addToken: function(email) {
      let invites = this.get('invites').slice();

      invites.push({
        email: email,
        isValid: EMAIL_REGEX.test(email)
      });

      this.set('invites', invites);
    },

    removePreviousToken: function() {
      let invites = this.get('invites');
      if(invites.length) {
        this.removeTokenByIndex(invites.length - 1);
      }
    }
  }
});

