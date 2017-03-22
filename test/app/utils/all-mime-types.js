import { MIME_TYPES } from '../constants';

export default function allMimeTypes() {
  let types = [];
  Object.keys(MIME_TYPES).forEach(function (type) {
    types = types.concat(MIME_TYPES[type].map(function (subtype) {
      return (type + '/' + subtype).toLowerCase();
    }));
  });
  return types.sort(function (a, b) {
    return a.localeCompare(b);
  });
}
