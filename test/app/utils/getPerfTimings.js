export function getTimings() {
  if (!(window.performance && window.performance.timing)) {
    return;
  }

  let wpt = window.performance.timing;
  let start = wpt.navigationStart;
  let timings = {};

  for (let key in wpt) {
    let timing = wpt[key];
    // sometimes measurements are "0" and we don't want them
    if (!!timing && typeof timing === 'number') {
      timings[key] = timing - start;
    }
  }

  // From Steve Souders: http://www.stevesouders.com/blog/2014/08/21/resource-timing-practical-tips/
  timings.dns = wpt.domainLookupEnd - wpt.domainLookupStart;
  timings.tcp = wpt.connectEnd - wpt.connectStart;

  return timings;
}

export default getTimings;
