import Ember from 'ember';
import BaseController from '../controllers/base';
import {DEBOUNCE_AMOUNT} from '../constants';


export default BaseController.extend({

  _ac_resetState: function (key, newState) {
    let props = ['Searching', 'Paginating'];
    let propsObj = {};
    props.forEach(function (prop) {
      propsObj['_ac_' + key + prop] = false;
    });

    if(newState) {
      Object.keys(newState).forEach(function (prop) {
        propsObj['_ac_' + key + prop] = newState[prop];
      });
    }

    this.setProperties(propsObj);
  },

  _ac_initController: function () {
    this.get('_ac_widgets').forEach((key) => {
      this._ac_resetState(key, { Typing: false });
      Ember.defineProperty(this, key + 'Items', function() {
        return this.get('model._ac_model.' + key);
      }.property('model._ac_model.' + key));

      Ember.defineProperty(this, key + 'IsShowingMore', function() {
        return this.get('_ac_' + key + 'Paginating');
      }.property('_ac_' + key + 'Paginating'));

      Ember.defineProperty(this, key + 'IsSearching', function () {
        return this.get('_ac_' + key + 'Typing') || this.get('_ac_' + key + 'Searching');
      }.property('_ac_' + key + 'Typing', '_ac_' + key + 'Searching'));

    });
  }.observes('_ac_widgets'),

  _ac_doSearch: function (key, searchStr, noSpinner) {
    this.route.actions['_ac_search'].call(this.route, key, searchStr);
    this.set('_ac_' + key + 'Searching', !noSpinner);
    this.set('_ac_' + key + 'Typing', false);
  },

  actions: {
    _ac_modelLoaded: function (key) {
      this._ac_resetState(key, {
        Error: false
      });
    },
    _ac_modelError: function (key) {
      this._ac_resetState(key, {
        Error: true
      });
    },
    _ac_appendPageError: function (key) {
      this._ac_resetState(key);
    },
    _ac_onShowMoreScroll: function(key) {
      if(!this.get('_ac_' + key + 'Paginating') && this.get('model._ac_model.' + key + '.meta.pagination.next_page')) {
        this.set('_ac_' + key + 'Paginating', true);
        this.set('_ac_' + key + 'Searching', false);
        this.route.actions['_ac_showMore'].call(this.route, key);
      }
    },
    _ac_onInput: function(val, key, noSpinner) {
      this.set('_ac_' + key + 'Typing', !noSpinner);
      this.set('_ac_' + key + 'Paginating', false);
      Ember.run.debounce(this, this._ac_doSearch, key, val, noSpinner, DEBOUNCE_AMOUNT);
    }
  }
});
