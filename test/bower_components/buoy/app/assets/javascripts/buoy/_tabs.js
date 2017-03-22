 $(function() {
  var pane = $('.Tabs-pane');
  if(!pane.length) {
    return;
  }

  var tabs = $('[data-toggle="tab"]');
  var defaultTab = tabs.filter('[data-default]').first();
  var firstTab = tabs.first();
  var win = $(window);
  var hash = window.location.hash;

  function emitTabChangeEvent(tab) {
    var href = tab.attr('href') || '';
    //let bootstrap show the tab, then emit a tab change event
    window.setTimeout(win.trigger.bind(win, 'tab-change', href.replace(/^.*#/, '')), 0);
  }

  function getLinkFromHash(hash) {
    return hash.replace(/^#tab-/, '#actions-');
  }

  if(!defaultTab.length) {
    defaultTab = firstTab;
  }
  // XXX(nan) no idea why this is needed, but without it Revealer's are broken and hidden
  firstTab.tab('show');

  tabs.on('show.bs.tab', function (e) {
    emitTabChangeEvent($(this));
  });

  tabs.on('click', function(e) {
    var $this = $(this);

    if(!$this.closest('.Tabs-pane').length > 0) {
      history.pushState( null, null, $this.attr('href') );
    }
    e.preventDefault();
  });

  window.addEventListener('hashchange', function(e) {
    var hash = window.location.hash;
    if (hash.length) {
      tabs.filter('[href=' + getLinkFromHash(hash) + ']').tab('show');
    } else {
      defaultTab.tab('show');
    }
  }, false);

  var initialTab = defaultTab;
  if (hash.length) {
    hash = getLinkFromHash(hash);
    initialTab = tabs.filter(function(i, tab) {
      return tab.href.indexOf(hash) === tab.href.length - hash.length;
    });
    if(pane.closest('.collapse').length){
      $('.collapse').addClass('in').css('height','auto');
    }
  }

  initialTab.tab('show');
  emitTabChangeEvent(initialTab);
});
