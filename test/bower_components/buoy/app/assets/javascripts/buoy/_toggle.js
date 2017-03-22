document.addEventListener("DOMContentLoaded", function(event) {

  var Toggles = document.getElementsByClassName('Toggle');

  for (var i = 0; i < Toggles.length; i++) {
    Toggles[i].addEventListener('click', function() {
      this.classList.toggle('is-on');
    });
  }

});
