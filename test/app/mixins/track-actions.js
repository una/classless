import Ember from 'ember';
import _ from 'lodash/lodash';

let AUTOCOMPLETE_ACTION_PREFIX = '_ac_';

export default Ember.Mixin.create({
  send: function(actionName, ...args) {
    //send the action
    this._super(actionName, ...args);

    //now track that action in segment
    let overrides = this.trackActionsOverrides;
    if(overrides && !_.isUndefined(overrides[actionName])) {
      actionName = overrides[actionName];
      if(_.isFunction(actionName)) {
        actionName = actionName(...args);
      }
    }
    //dont track autocomplete actions
    if(this.segment && actionName && actionName.indexOf(AUTOCOMPLETE_ACTION_PREFIX) !== 0) {
      this.segment.trackEvent(this.get('trackPageName') + ': User Action', {
        actionName: actionName
      });
    }
  }
});
