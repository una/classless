import Ember from 'ember';
import IndexPage from '../../../mixins/routes/index-page';

export default Ember.Route.extend(IndexPage, {
  queryParams: {
    sort: {
      refreshModel: true
    },
    sort_direction: {
      refreshModel: true
    },
    path: {
      refreshModel: true
    }
  },

  getModel: function (params) {
    let parentModel = this.modelFor('spaces.show');
    params.titleToken = parentModel.bucket.get('name');

    this.lastReqTime = new Date();
    this.params = params;

    return this.store.query('object', params);
  },

  setupController: function (controller, model) {
    controller.send('onLoad', model);

    if(this.isInitialLoad) {
      let pathArray = this.params.path ? this.params.path.split('/') : [];
      let query = pathArray.length ? pathArray.pop() : '';
      let path = pathArray.length ? pathArray.join('/') + '/' : '';
      controller.send('onSetup', path, query);
    }

    this.isInitialLoad = false;
    this.controller = controller;
  },

  onDeactivate: function () {
    this.controller.send('onTeardown');
  }.on('deactivate'),

  actions: {
    getMoreFiles: function (marker) {
      this.params.marker = marker;

      this.getModel(this.params).then((model) => {
        if(reqTime !== this.lastReqTime) {
          return;
        }
        let newModel = this.controller.get('model').toArray().concat(model.toArray());
        let dirs = this.controller.get('model.meta.dirs').concat(model.get('meta.dirs'));

        newModel.meta = {
          dirs: dirs,
          marker: model.get('meta.marker')
        };

        this.controller.set('model', newModel);
      });
      let reqTime = this.lastReqTime;

    }
  }

});
