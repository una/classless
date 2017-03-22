import Ember from 'ember';

export default Ember.Component.extend({
  helpQuery: '',

  keyUp(event) {
    if (event.target.tagName === 'INPUT') {
      this.set('typing', true);
      this.makeSuggestion();
    }
  },

  didInsertElement: function() {
    this.$().find('input').focus();
  },

  showSpinner: function () {
    return this.get('typing') || this.get('loading');
  }.property('typing', 'loading'),

  makeSuggestion() {
    this.sendAction('make-suggestion', this.helpQuery);
    Ember.run.next(() => {
      this.set('typing', false);
    });
  }

});
