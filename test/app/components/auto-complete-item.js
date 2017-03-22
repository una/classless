import Ember from 'ember';

export default Ember.Component.extend({
  tagName: '',

  hover: function() {
    return this.get('index') === this.get('hoverIndex');
  }.property('index', 'hoverIndex'),

  isDisabled: function () {
    let indices = this.get('disabledIndicies') || [];
    let index = this.get('index');
    let item;
    for(let i=0; i < indices.length; i++) {
      item = indices[i];
      if(typeof item === 'number') {
        if(index === item) {
          return true;
        }
      } else if(index === item.index){
        this.set('disabledReason', item.reason);
        return true;
      }
    }
    this.set('disabledReason', null);
    return false;
  }.property('disabledIndicies')

});
