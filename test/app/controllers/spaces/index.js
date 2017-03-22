import BaseController from '../base';
import IndexPage from '../../mixins/controllers/index-page';
import _ from 'lodash';

export default BaseController.extend(IndexPage, {
  queryParams: ['sort', 'sort_direction', 'page'],
  sort: 'created_at',
  sort_direction: 'desc',
  page: 1,

  modelProperty: 'model',

  menuItems: [{
    name: 'Show Files',
    route: 'spaces.show'
  }, {
    name: 'Edit Access',
    route: 'spaces.show.access'
  }, {
    name: 'Delete',
    route: 'spaces.show.destroy'
  }],

  modelLoaded: function () {
    this.setProperties({
      sorting: false,
      paginating: false
    });
  }.observes('model'),

  actions: {
    onMenuItemClick: function(item, space) {
      this.transitionToRoute(_.find(this.menuItems, function (menuItem) {
        return menuItem.name === item;
      }).route, space.get('id'));
    },
    changePage: function() {
      this.set('paginating', true);
    }
  }
});
