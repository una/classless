import Ember from 'ember';

export default Ember.Component.extend({
  isShowingModal: false,

  dropletsAndTags: [],

  targetsMessage: '',
  buttonDisabled: function() {
    return this.get('dropletsAndTags.length') === 0;
  }.property('dropletsAndTags.[]'),

  actions: {
    onShowModal: function() {
      this.set('isShowingModal', true);
    },

    onHideModal: function() {
      if (this.get('isDestroyed') || this.get('isDestroying')) {
        return;
      }
      this.set('isShowingModal', false);
      this.set('dropletsAndTags', []);
    },

    onAdd: function() {
      this.set('isShowingModal', false);
      this.sendAction('onAddTargets', this.get('dropletsAndTags'));
    }
  }
});
