import Ember from 'ember';
import App from '../../app';

export default Ember.Controller.extend({
  queryParams: ['sort', 'sort_direction', 'page'],
  sort: 'created_at',
  sort_direction: 'desc',
  page: 1,

  menuItems: [{
    name: 'Edit'
  }, {
    name: 'Delete'
  }],

  isReadOnly: function() {
    return App.User && App.User.get('isReadOnly');
  }.property('model'),

  resetProperties: function () {
    this.setProperties({
      paginating: false,
      sorting: false
    });
  },

  addToken: function () {
    this.get('newTokens').unshift(this.get('newToken'));
  }.observes('newToken'),

  emptyState: function() {
    return this.get('filteredModel').length === 0;
  }.property('filteredModel'),

  cleanupNewTokens: function () {
    this.set('newTokens', []);
  }.observes('model'),

  filteredModel: function () {
    return this.get('newTokens').filter(function (model) {
      return !model.get('isDeleted') || model.get('isDirty') || model.get('isSaving');
    }).concat(this.get('model').toArray());
  }.property('newToken.isSaving', 'newTokens.@each.isSaving', 'content.[]', 'deleteToken'),

  needsPagination: function () {
    let model = this.get('model');
    return model.meta && model.meta.pagination && model.meta.pagination.pages > 1;
  }.property('model'),

  actions: {
    onModalHide: function(doDelete) {
      if(doDelete) {
        this.get('deleteToken').destroyRecord();
      }
      this.set('deleteToken', null);
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
     menuItemClick: function (clickedKey, token) {
      if(clickedKey === 'Edit') {
        this.transitionToRoute('api.tokens.show', token);
      } else if (clickedKey === 'Delete') {
        this.set('deleteToken', token);
      }
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
