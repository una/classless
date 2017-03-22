import Ember from 'ember';
import IndexPage from '../../mixins/routes/index-page';
export default Ember.Route.extend(IndexPage, {
  titleToken: 'Spaces',
  queryParams: {
    sort: {
      refreshModel: true
    },
    sort_direction: {
      refreshModel: true
    },
    page: {
      refreshModel: true
    }
  },
  getModel: function (params) {
    return this.store.query('bucket', params);
  },
  setupController: function (controller, model) {
    this.isInitialLoad = false;
    controller.set('model', model);
  }
});
