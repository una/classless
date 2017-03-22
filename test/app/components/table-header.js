import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'th',
  classNames: ['aurora-th'],
  classNameBindings: ['col', 'colClass', 'active', 'sortable'],

  click: function () {
    if(this.get('sortable')) {
      this.sendAction('action', this.get('col'));
    }
  },

  active: function () {
    return this.get('sortCol') === this.get('col');
  }.property('sortCol', 'col'),

  showSpinner: function () {
    return this.get('isLoading') && this.get('active');
  }.property('sortCol', 'isLoading', 'col'),

  sortable: function () {
    return this.get('noSorting') !== true;
  }.property('noSorting'),

  sortArrowClass: function () {
    if(this.get('showSpinner') || !this.get('sortable')) {
      return '';
    }
    if(this.get('active')) {
      return this.get('sortDir') === 'desc' ? 'Icon--arrowFilterUp Icon--activeFilter' : 'Icon--arrowFilterDown Icon--activeFilter';
    }
    return 'Icon--arrowFilterDown Icon--inactiveFilter';
  }.property('sortCol', 'isLoading', 'col', 'sortDir')

});
