import BaseController from '../base';

export default BaseController.extend({
  trackPageName: 'Networking PTR Records',
  paginating: false,

  needsPagination: function () {
    return this.model.meta.pagination.pages > 1;
  }.property('model'),

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
