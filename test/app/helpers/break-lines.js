import Ember from 'ember';

export function breakLines(text) {
  // This is some handlebars/ember weirdness with passing arguments to helpers.
  // If a helper is called on result of other helper (@see ticket-reply.hbs)
  // first argument to helper is an Array
  if (text[0] && text[0] instanceof Ember.Handlebars.SafeString) {
    text = text.toString();
  } else {
    text = Ember.Handlebars.Utils.escapeExpression(text);
  }
  text = text.replace(/\n/gm, '<br>');

  return Ember.String.htmlSafe(text);
}

export default Ember.Helper.helper(breakLines);