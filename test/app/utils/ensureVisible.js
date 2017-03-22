import Ember from 'ember';
import _ from 'lodash/lodash';

const BOTTOM_OFFSET = 15;

export function ensureVisible($node, after, offset) {
  if(_.isUndefined(offset)) {
    offset = BOTTOM_OFFSET;
  }
  Ember.run.later(function () {
    window.scrollBy(0, Math.max(($node[0].getBoundingClientRect().bottom + offset) - window.innerHeight, 0));
    if(after) {
      after();
    }
  }, 0);
}
