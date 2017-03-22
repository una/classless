import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'span',
  inputId: 'check-' + (new Date()).getTime(),

  change: function() {
    if(this.get('checkboxChange')) {
      this.sendAction('checkboxChange');
    }
  }
});
