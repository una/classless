import DS from 'ember-data';
import {post} from '../utils/apiHelpers';
import config from '../config/environment';
import Ember from 'ember';

const NEWS_LEVEL = 3;
const apiNS = config['api-namespace'];

export default DS.Model.extend({
  subject: DS.attr(),
  createdAt: DS.attr(),
  updatedAt: DS.attr(),
  acknowledged: DS.attr(),
  body: DS.attr(),
  formattedBody: DS.attr(),
  blurb: DS.attr(),
  level: DS.attr(),
  isShowing: DS.attr('boolean', {default: false}),
  isNewsNotification: function () {
    let level = this.get('level');
    if (level === NEWS_LEVEL) {
      return true;
    }
    return false;
  }.property('level'),

  acknowledge: function () {
    return post(`/${apiNS}/notifications/${this.get('id')}/acknowledge`);
  },

  formattedBodyTopImage: function() {
    let html = this.get('formattedBody');
    if(html.indexOf('<img') !== -1) {
      let $html = Ember.$('<div />', {html: html});
      // move image element outside parent p element
      let $img = $html.find('img').detach();
      $html.prepend($img);

      return $html.html();
    }
    return html;
  }.property('formattedBody')
});
