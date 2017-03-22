import Ember from 'ember';
import { ENTER_KEY } from '../constants';

export default Ember.Component.extend({
  classNames: 'searchInput',

  keyPress(e) {
    if(this.get('onEnter') && e.keyCode === ENTER_KEY) {
      this.sendAction('onEnter');
    }
  },

  actions: {
    onInput: function(val) {
      let onInput = this.get('onInput');
      if(onInput) {
        this.sendAction('onInput', val);
      }
    }
  }
});
