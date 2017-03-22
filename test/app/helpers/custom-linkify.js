// Helper based off of https://github.com/johnotander/ember-linkify
import Ember from 'ember';

// url regex from https://github.com/kevva/url-regex/blob/master/index.js
const protocol = '(?:(?:[a-z]+:)?//)';
const auth = '(?:\\S+(?::\\S*)?@)?';
const ip = '(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(?:\\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])){3}';
const host = '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)';
const domain = '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*';
const tld = '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))\\.?';
const port = '(?::\\d{2,5})?';
const path = '(?:[/?#][^\.|\\s"]*)?';
const regex = `(?:${protocol}|www\\.)${auth}(?:localhost|${ip}|${host}${domain}${tld})${port}${path}`;
const URL_REGEX = new RegExp(regex, 'ig');

const MAX_LENGTH = 150;

export function customLinkify(arg) {
  let windowTarget = arg[1] || "_self";
  let textToLinkify = Ember.Handlebars.Utils.escapeExpression(arg[0]);

  textToLinkify = textToLinkify.replace(URL_REGEX, function (s) {
    let url;

    if(s.trim().match(/^www\./ig)) {
      url = '//' + s.trim();
    } else {
      url = s.trim();
    }

    s = s.trim().length > MAX_LENGTH ? s.trim().substr(0, MAX_LENGTH) + '&hellip;' : s.trim();
    return `<a href="${url}" target="${windowTarget}">${s}</a>`;
  });

  return Ember.String.htmlSafe(textToLinkify);
}

export default Ember.Helper.helper(customLinkify);
