import Ember from 'ember';

export default Ember.Component.extend({
  tagName: '',
  isOpen: false,
  text: function () {
    let numBackups = this.get('numBackups');
    if(numBackups) {
      if(numBackups > 1) {
        return numBackups + ' Backups';
      }
      return '1 backup';
    }
    return 'backups';
  }.property('numBackups'),
  actions: {
    showMore: function (param) {
      this.isOpen = !this.isOpen;
      this.sendAction('action', param, this.isOpen);
    }
  }
});
