import Ember from 'ember';

export default Ember.Component.extend({
  welcomeMessages: [
    'Good to go!',
    'Happy coding!',
    'You\'re Awesome!',
    'Let\'s get to work!',
    'Go change the world!'
  ],

  msg: function () {
    return this.welcomeMessages[Math.floor(Math.random() * this.welcomeMessages.length)];
  }.property()
});
