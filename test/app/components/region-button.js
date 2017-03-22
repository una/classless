import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['aurora-region-button'],
  isLoaderVisible: false,

  actions: {
    click: function (el) {
      let action = this.get('action');

      if(action) {
        this.sendAction('action', el, this.get('actionParams'), this);
      }
    }
  }
});
