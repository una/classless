import Ember from 'ember';

export function slugify(str) {
  if(!str) {
    return str;
  }

  return str.trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]/gi, '-')   // replace non alphanumeric chars
            .replace(/-+/g, '-')            // replace 2 or more consecutive hyphens to 1
            .replace(/^-|-$/g, '');         // remove - from start or end of str
}

function templateSlugify(params) {
	let str = params[0];
	return slugify(str);
}

export default Ember.Helper.helper(templateSlugify);
