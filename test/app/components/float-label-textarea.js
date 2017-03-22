import FloatLabelInput from './float-label-input';
import Ember from 'ember';

Ember.TextArea.reopen({
  attributeBindings: ['pattern']
});

export default FloatLabelInput.extend({
  inputTag: 'textarea',
  didInsertElement: function () {
    let textarea = this.$('textarea')[0];
    if (textarea) {
      let pattern = textarea.getAttribute('pattern');
      if (pattern) {
        let regex = new RegExp(pattern, 'm');
        let oldValdity = textarea.checkValidity;
        textarea.checkValidity = function () {
          return oldValdity.call(textarea) && !!this.value.match(regex);
        };
      }
    }
  }
});


