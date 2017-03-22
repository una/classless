export function handleEmberLink(e) {
  // TODO(selby): Remove this logic once https://github.com/ember-cli/ember-cli/issues/2633 is resolved.
  let target = e.target;
  if(target && target.getAttribute('href')) {
    let href = target.getAttribute('href');
    if (href.indexOf('#') === 0) {
      e.preventDefault();
      handleEmberLink.changeLocationHash(href);
    }
  }
}

handleEmberLink.changeLocationHash = function (hash) {
  window.location.hash = hash;
};

export default handleEmberLink;
