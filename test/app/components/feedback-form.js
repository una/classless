import Ember from 'ember';
import ENV from '../config/environment';

export default Ember.Component.extend({
  formKeepUrl: ENV['form-keep']['FORM_KEEP_URL'],
  actions: {
    open: function() {
      this.set('active', true);
    },
    close: function() {
      this.set('active', false);
    },
    submit: function() {
      this.$('form').submit();
      this.set('active', false);
    }
  }
});
