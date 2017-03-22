/* globals moment: false */

import Ember from 'ember';

export function formatDate(params, namedArgs) {
  let date = new Date(params[0]),
    format = namedArgs.format,
    isUTC = namedArgs.isUTC;

  let momentInst = isUTC ? moment.utc(date) : moment(date);

  return momentInst.format(format);
}

export default Ember.Helper.helper(formatDate);
