import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['aurora-news-modal'],

  setQueue: function() {
    this.set('queue', this.get('news'));
    this.next();
  }.observes('news'),

  next: function() {
    let q = this.get('queue');
    this.set('newsItem', q && q.length ? q.shift() : null);
  },

  actions: {
    onModalHide: function() {
      this.get('newsItem').acknowledge().then(() => {
        this.set('newsItem', null);
        Ember.run.next(this.next.bind(this));
      }).catch((err) => {
        if(this.get('onError')) {
          this.sendAction('onError', err);
        }
      });
    }
  }
});
