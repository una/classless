import Ember from 'ember';
import DropdownMenu from '../components/dropdown-menu';

export default DropdownMenu.extend({
  isChangingRole: false,

  isMe: function() {
    return this.get('user.internalIdentifier') === this.get('member.internalIdentifier');
  }.property('user', 'member'),

  displayMemberOptions: function() {
    return this.get('isMe') && !this.get('user.isOwner');
  }.property('user', 'member'),

  displayOwnerOptions: function() {
    return this.get('user.isOwner');
  }.property('user', 'member'),

  resizeDropdown: function() {
    Ember.run.next(() => {
      let height = this.$().find('.menu-dropdownView.active').height();
      this.$().find('.menu-dropdown').height(height);
    });
  }.observes('isChangingRole', 'isOpen'),

  actions: {
    resendInvite: function() {
      this.clickAway();
      this.sendAction('resendInvite', this.get('member'));
    },
    leaveTeam: function() {
      this.clickAway();
      this.sendAction('leaveTeam');
    },
    showRoleView: function() {
      this.set('isChangingRole', true);
    },
    changeRole: function(role) {
      this.clickAway();
      this.sendAction('changeRole', this.get('member'), role);
    },
    backToMenu: function() {
      this.set('isChangingRole', false);
    },
    removeMember: function() {
      this.clickAway();
      this.sendAction('removeMember', this.get('member'));
    },
    cancelInvite: function() {
      this.clickAway();
      this.sendAction('cancelInvite', this.get('member'));
    }
  }
});
