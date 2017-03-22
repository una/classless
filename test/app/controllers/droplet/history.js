import BaseController from '../base';

export default BaseController.extend({
  trackPageName: 'Droplet Show History',
  queryParams: ['sort', 'sort_direction', 'page'],
  sort: 'created_at',
  sort_direction: 'desc',
  page: 1,

  needsPagination: function () {
    return this.get('history').meta.pagination.pages > 1;
  }.property('history'),

  doneSorting: function () {
    this.set('sorting', false);
  }.observes('history'),

  actions: {
    changePage: function() {
      this.trackAction('Change page');
      this.set('paginating', true);
    },
    modelLoaded: function () {
      this.set('paginating', false);
    }
  }
});
