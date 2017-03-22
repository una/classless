import Ember from 'ember';

// This helper will test if the window's current path matches the passed path
// It will match partials as well
// Usage: {{#if (is-current-path 'droplets/new')}}<conditional html>{{/if}}
export function isCurrentPath(params) {
  let path = params[0];
  let currentPath = params[1];
  return currentPath.indexOf(path) === 1;
}

export default Ember.Helper.helper(isCurrentPath);
