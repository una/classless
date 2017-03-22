import Ember from 'ember';
import App from '../../app';

export default Ember.Controller.extend({
  queryParams: ['sort', 'sort_direction', 'page'],
  sort: 'created_at',
  sort_direction: 'desc',
  page: 1,

  listItems: {
    'Edit': 'api.applications.show',
    'View': 'api.applications.details',
    'Delete': null
  },

  isReadOnly: function() {
    return App.User && App.User.get('isReadOnly');
  }.property('model'),

  resetProperties: function () {
    this.setProperties({
      paginating: false,
      sorting: false
    });
  },

  addApp: function () {
    this.get('newApplications').unshift(this.get('newApplication'));
  }.observes('newApplication'),

  emptyState: function() {
    return this.get('filteredModel').length === 0;
  }.property('filteredModel'),

  cleanupNewApps: function () {
    this.set('newApplications', []);
  }.observes('model'),

  filteredModel: function () {
    return this.get('newApplications').filter(function (model) {
      return !model.get('isDeleted') || model.get('isDirty') || model.get('isSaving');
    }).concat(this.get('model').toArray());
  }.property('newApplication.isSaving', 'newApplications.@each.isSaving', 'content.[]', 'deleteApplication'),

  menuItems: function () {
    return Object.keys(this.listItems).map(function (key) {
      return { name: key };
    });
  }.property(),

  needsPagination: function () {
    let model = this.get('model');
    return model.meta && model.meta.pagination && model.meta.pagination.pages > 1;
  }.property('model'),

  actions: {
    deleteApplication: function(token) {
      this.set('deleteApplication', token);
    },
    onModalHide: function(doDelete) {
      if(doDelete) {
        this.get('deleteApplication').destroyRecord();
      }
      this.set('deleteApplication', null);
    },
    menuItemClick: function (clickedKey, application) {
      if(clickedKey === 'Delete') {
        this.set('deleteApplication', application);
      } else {
        this.transitionToRoute(this.listItems[clickedKey], application);
      }
    },
    sort: function (row) {
      let direction = this.get('sort') === row && this.get('sort_direction') === 'asc' ? 'desc' : 'asc';
      this.setProperties({
        sort: row,
        page: 1,
        sort_direction: direction,
        sorting: true
      });
    },
    changePage: function() {
      this.set('paginating', true);
    },
    modelLoaded: function () {
      this.resetProperties();
    },
    modelError: function () {
      this.resetProperties();
    }
  }
});
