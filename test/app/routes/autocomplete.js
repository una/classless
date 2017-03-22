import Ember from 'ember';
import _ from 'lodash/lodash';

export default Ember.Route.extend({
  _ac_query: {},
  _ac_page: {},
  _ac_inFlight: {},
  _ac_initialData: {},
  _ac_metas: {},

  _ac_getParams: function (key, type) {
    if(!key) {
      key = Object.keys(this._ac_models)[0];
    }
    let params = {
      query: this._ac_query[key],
      page: this._ac_page[key],
      sort: 'created_at',
      sort_direction: 'desc'
    };

    if(type && this._ac_params[type]) {
      _.merge(params, this._ac_params[type]);
    }

    return params;
  },

  _ac_initKey: function(key) {
    this._ac_query[key] = '';
    this._ac_page[key] = 1;
  },

  _ac_copyModel: function(model) {
    let modelCopy = model.slice();
    modelCopy.meta = JSON.parse(JSON.stringify(model.meta || {}));

    return modelCopy;
  },

  _ac_updateModel: function (key, defaultData, isInitialLoad) {
    let modelTypes;
    if(key) {
      //only get model types for a given key
      modelTypes = this._ac_models.filter(function (obj) {
        return Object.keys(obj)[0] === key;
      })[0][key];
    } else {
      //get all unique model types on this page
      modelTypes = this._ac_models.reduce((types, newTypes) => {
        return Object.keys(newTypes).reduce(function(types, key) {
          return types.concat(newTypes[key]);
        }, types);
      }, []).filter((val, i, arr) => { //get unique
        return arr.indexOf(val) === i;
      });
    }

    return new Ember.RSVP.Promise((resolve, reject) => {
      let model = {};
      let count = modelTypes.length;
      let done = (err) => {
        if(err) {
          reject();
        }
        if(--count) {
          return;
        }

        let keys = [key];
        if(!key) {
          keys = this._ac_models.map(function (val) {
            return Object.keys(val)[0];
          });
        }
        keys.forEach((thisKey) => {
          let firstModel = model[thisKey][0];
          model[thisKey].forEach((thisModel, i) => {
            let nextModel;
            if(i !== model[thisKey].length - 1) {
              nextModel = model[thisKey][i + 1];
            }

            if(!firstModel.meta.pagination || !firstModel.meta.pagination.next_page) {
              let meta = firstModel.meta;
              firstModel = firstModel.concat(nextModel || []);
              firstModel.meta = nextModel ? nextModel.meta : meta;
            } else if (nextModel) {
              nextModel.meta.page = 0;
              thisModel.meta.nextMeta = nextModel.meta;
              thisModel.meta.nextMeta.pagination.next_page = thisModel.meta.nextMeta.pagination.current_page;
            }
            thisModel.meta.modelTypeCount = model[thisKey].length;
          });

          model[thisKey] = firstModel;

          if(isInitialLoad) {
            //make a copy of the initialData so we can reset later
            this._ac_initialData[thisKey] = this._ac_copyModel(firstModel);
          }
        });

        resolve(model);
      };

      let handleResult = (type, thisModel) => {
        this._ac_models.forEach((modelMeta) => {
          Object.keys(modelMeta).forEach((key) => {
            let index = modelMeta[key].indexOf(type);
            if(index > -1) {
              let modelArr = this._ac_copyModel(thisModel);
              modelArr.meta.type = type;
              model[key] = model[key] || [];
              model[key][index] = modelArr;
              this._ac_metas[type] = modelArr.meta;
            }
          });
        });

        done(!thisModel);
      };

      if(!count) {
        return done(true);
      }

      modelTypes.forEach((type) => {
        if(defaultData && defaultData[type]) {
          handleResult(type, defaultData[type]);
        } else {
          this.store.query(type, this._ac_getParams(key, type)).then((thisModel) => {
            handleResult(type, thisModel);
          }, () => {
            handleResult(type, Ember.A());
          });
        }
      });
    });
  },

  autoCompleteModel: function(model, defaultData, params) {
    this._ac_models = this.autoCompletes || [{autoComplete: ['droplet']}];
    this._ac_models.forEach((model) => {
      this._ac_initKey(Object.keys(model)[0]);
    });
    //deep copy the params as adapters will delete their properties
    this._ac_params = JSON.parse(JSON.stringify(params || {}));
    return new Ember.RSVP.Promise((resolve) => {
      this._ac_updateModel(null, defaultData, true).then(function (autoCompleteModel) {
        if(model.set) {
          model.set('_ac_model', autoCompleteModel);
        } else {
          model._ac_model = autoCompleteModel;
        }
        resolve(model);
      }, () => {
        let empty = {};
        Object.keys(this._ac_models).forEach(function(key) {
          empty[key] = [];
        });
        model.set('_ac_model', empty);
        resolve(model);
      });
    });
  },

  setupController: function(controller, model) {
    this._ac_controller = controller;
    controller.route = this;
    controller.set('model', model);
    controller.set('_ac_widgets', this._ac_models.map(function (obj) {
      return Object.keys(obj)[0];
    }));
  },

  _ac_doQuery: function (key) {
    let reqId = new Date();
    this._ac_inFlight[key] = reqId;

    this._ac_updateModel(key).then((model) => {
      if(this._ac_inFlight[key] !== reqId) {
        return;
      }
      this._ac_controller.set('model._ac_model.' + key, model[key]);
      this._ac_controller.send('_ac_modelLoaded', key);
    }, () => {
      this._ac_controller.set('model._ac_model.' + key, []);
      this._ac_controller.send('_ac_modelError', key);
    });
  },

  actions: {
    _ac_showMore: function (key) {
      let model = this._ac_controller.get('model._ac_model.' + key);

      let reqId = new Date();
      this._ac_inFlight[key] = reqId;

      this._ac_page[key] = this._ac_page[key] + 1;
      this.store.query(model.meta.type, this._ac_getParams(key, model.meta.type)).then((nextPageModel) => {
        if(this._ac_inFlight[key] !== reqId) {
          return;
        }
        let newModel = model.concat(nextPageModel.toArray());
        if(!nextPageModel.get('meta.pagination.next_page')) {
          let nextMeta = model.meta.nextMeta;
          if(nextMeta) {
            newModel.meta = nextMeta;
            this._ac_page[key] = nextMeta.page;
          } else {
            newModel.meta = { modelTypeCount: model.meta.modelTypeCount };
          }
        } else {
          newModel.meta = model.meta;
        }
        this._ac_controller.set('model._ac_model.' + key, newModel);
        this._ac_controller.send('_ac_modelLoaded', key);
      }, () => {
        if(this._ac_inFlight[key] !== reqId) {
          return;
        }
        this._ac_controller.send('_ac_appendPageError', key);
      });
    },

    _ac_search: function (key, searchVal) {
      this._ac_query[key] = searchVal;
      this._ac_page[key] = 1;

      this._ac_doQuery(key);
    },

    resetAutoComplete: function (key) {
      if(!key) {
        key = 'autoComplete';
      }
      this._ac_initKey(key);
      this.controller.set('model._ac_model.' + key, this._ac_copyModel(this._ac_initialData[key]));
    }
  }
});
