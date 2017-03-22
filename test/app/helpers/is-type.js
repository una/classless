import Ember from 'ember';
import TypesHelper from '../utils/types';

export default Ember.Helper.helper(function (opts) {
  return TypesHelper.getTypeStr(opts[0]).toUpperCase() === opts[1].toUpperCase();
});
