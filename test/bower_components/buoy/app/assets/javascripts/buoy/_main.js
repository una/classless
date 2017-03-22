$(function() {


  $(document.body).on('click', 'a', function(event) {
    // Prevent the page scrolling to top when clicking example buttons
    if (event.target.getAttribute('href') === '#') {
      event.preventDefault();
    }
  });


  // Automatically track click on elements with data-track values
  $('[data-track]').on('click', function() {
    var trackedEvent = $(this).attr('data-track') ? $(this).attr('data-track') : "";
    if (trackedEvent.length > 0 && window.analytics) {
      window.analytics.track(trackedEvent);
    }
  });

  //helper function to ensure that given $content is visible on screen
  var CONTENT_PADDING = 5;
  function scrollToContent($content) {
    if($content.length) {
      var dimensions = $content[0].getBoundingClientRect();
      //if the content fits on the screen
      if(dimensions.height + CONTENT_PADDING < window.innerHeight) {
        //scroll down if the bottom of the content is hidden
        var delta = Math.max(0, dimensions.bottom + CONTENT_PADDING - window.innerHeight);
        if(delta) {
          window.scrollBy(0, delta);
        }
      }
    }
  }

  $(".chosen").chosen({
    width: "100%",
    disable_search_threshold: 5
  }).on('chosen:showing_dropdown', function (e, $drop) {
    // chosen content takes time to render
    // and this is the only event we can subscribe to :(
    window.setTimeout(function () {
      scrollToContent($drop.chosen.dropdown);
    }, 300);
  });

  // when clicking into a validated field, remove validation msg
  $('.is-required').on('keyup', function() {
    var validationMsg = $(this).closest('.columns').find(".Input-message");
    validationMsg.addClass('Input-message--thanks').text('Thanks :]')
    $(this).removeClass('is-required');
  });

  // when clicking on validation copy, focus the input (which removes messaging)
  $(".Input-message").on("click", function(){
    var validationInput = $(this).parent().find("input");
    validationInput.focus();
  });

  $(".Ticket").on('click', function(){
    var $this = $(this);
    if($this.hasClass('is-collapsed')) {
      $this.removeClass('is-collapsed');
    } else {
      $this.addClass('is-collapsed')
    }
  });
  //reavealer - TODO add hash support to open revealer if hash matches existing tab
  $('body').on("click", "*[data-trigger='revealer']", function(){
    var $this = $(this);

    if($this.attr('data-revealerid')) {
      var curId = $this.attr('data-revealerid');
      var shelf = $('body').find('*[data-shelfid="' + curId + '"]');
      var shelfHeight = shelf.find('.shelf-inner').outerHeight(true);
    } else {
      var shelf = $this.next('.Revealer-shelf');
      var shelfHeight = shelf.find('.shelf-inner').outerHeight(true);
    }
    if(shelf.find('.shelf-inner').length != 0){
      $this.closest('.Revealer-header').toggleClass('is-open');
      shelf.toggleClass('is-open');
    }else {
      $this.closest('.Revealer-header').toggleClass('is-open legacy').next('.Revealer-shelf').toggleClass('is-open legacy');
    }
    if(shelf.hasClass('is-open')) {
      shelf.css('height', shelfHeight);
    } else {
      shelf.css('height', 0);
    }
  });

  //bootstrap dropdown stuff
  $('.Dropdown').on('show.bs.dropdown', function () {
    var Button = $(this).find('.Button');
    if(!Button.hasClass('Button--icon')) {
      Button.addClass('is-flipped');
    }
  });

  $('.Dropdown').on('shown.bs.dropdown', function () {
    scrollToContent($(this).find('.Dropdown-content'));
  });

  $('.Dropdown').on('hide.bs.dropdown', function () {
    var Button = $(this).find('.Button');
    if(!Button.hasClass('Button--icon')) {
      Button.removeClass('is-flipped');
    }
  });

  $('.Dropdown').on('click.bs.dropdown', function(e) {
    var $clicked = $(e.target);
    //if they click within dropdown body
    if($clicked.closest('.Dropdown-content').length) {
      var actionSelector = '[data-dropdown-action], a, button, input[type="submit"]';
      //if its an actionable item, close the dropdown unless the action contains data-dropdown-leave-open
      if($clicked.closest(actionSelector).length && !$clicked.closest('[data-dropdown-leave-open]').length) {
        $(this).removeClass('open');
      } else {
        //clicked on the dropdown body, leave it open
        e.stopPropagation();
      }
    }
  });

  $('ul').find('[data-toggle="tab"]').first().closest('li').removeClass('is-active');

  //bootstrap tooltips
  $('[data-toggle="tooltip"]').each(function () {
    var $this = $(this);
    $this.tooltip({
      container: $this.attr('data-container') || 'body'
    });
  });

  $('[data-toggle="tab"]').on('show.bs.tab', function (e) {
    var $this = $(this);
    var pageName = $this.text().trim();

    $(e.target.hash).find('[data-toggle="tab"]').first().tab('show');

    if ($this.attr('data-page') && window.analytics && pageName) {
      window.analytics.page(pageName);
    }
  });

  //highlight.js
  //hljs.initHighlightingOnLoad();

  $('pre code').each(function(i, block) {
    hljs.highlightBlock(block);
  });

  //Tables
  $.extend( $.fn.dataTable.defaults, {
    paging: false,
    info: false,
    language: {
      search: "_INPUT_",
      searchPlaceholder: "Search"
    }
  } );
  $('.table--sort').DataTable({
  });

  //alerts
  $('.Alert-close').on('click', function(){
    $(this).parent().parent('.Alert').slideUp(300);
  });
});
