import DS from 'ember-data';

const ELLIPSIS_LENGTH = 3;
const MAX_SUMMARY_LENGTH = 100;

export default DS.Model.extend({
  title: DS.attr(),
  highlightTitle: DS.attr(),
  content: DS.attr(),
  url: DS.attr(),
  tags: DS.attr(),
  weight: DS.attr(),
  type: DS.attr(),
  pageNum: DS.attr(),

  summary: function () {
    let text = this.get('content');
    if (text.length > MAX_SUMMARY_LENGTH){
      text = text.substr(0, MAX_SUMMARY_LENGTH - ELLIPSIS_LENGTH) + "...";
    }
    return text;
  }.property('content'),

  isTutorial: function () {
    return this.get('type') === 'tutorial';
  }.property('type')
});
