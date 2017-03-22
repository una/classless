// Source: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
// Set the name of the hidden property and the change event for visibility
let hidden, visibilityChange;
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

function isPageVisibilitySupported() {
  return !(typeof document.addEventListener === "undefined" || typeof document[hidden] === "undefined");
}

function setupPageVisibilityListeners(callback) {
  if(callback) {
    document.addEventListener(visibilityChange, () => {
      callback.call(this, document[hidden]);
    }, false);
  }
}

export { isPageVisibilitySupported, setupPageVisibilityListeners };