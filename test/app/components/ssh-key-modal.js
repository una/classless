import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['ssh-key-modal'],
  actions : {
    onSubmit: function () {
      this.attrs.submitAction({
        name: this.get('keyName'),
        key: this.get('keyValue'),
        checked: true
      });
    }
  }
});
