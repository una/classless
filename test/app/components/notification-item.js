import Ember from 'ember';
import App from '../app';

const TIMEOUT_HALF_TIME = 2;

export default App.NotificationItemComponent = Ember.Component.extend({

  HIDE_DELAY: 4000,

  isHiding: false,

  tagName: 'li',
  classNames: [ 'item' ],
  classNameBindings: ['typeClass'],

  typeClass: function() {
    return this.get('item.type');
  }.property('item.type'),


  startHideTimer: function (halfTime) {
    this.hideTimeout = window.setTimeout(Ember.run.bind(this, this.hide), this.HIDE_DELAY / (halfTime ? TIMEOUT_HALF_TIME : 1));
  },

  show: function() {
    Ember.run.next(Ember.run.bind(this, function () {
      this.$().addClass('show');
      this.startHideTimer();
    }));
  }.on('didInsertElement'),

  hide: function () {
    let item = this.$();
    if(item) {
      item.removeClass('show').one('transitionend webkitTransitionEnd', Ember.run.bind(this, function () {
        item.off('transitionend webkitTransitionEnd');
        App.NotificationsManager.remove(this.get('item'));
      }));
    }
    this.isHiding = true;
  },

  mouseEnter: function(){
    window.clearTimeout(this.hideTimeout);
  },

  mouseLeave: function(){
    if(!this.isHiding) {
      this.startHideTimer(true);
    }
  },

  click: function () {
    this.hide();
    window.clearTimeout(this.hideTimeout);
  }

});
