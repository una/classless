export function autocompletifyRegionList(regions) {
  return regions.map((region) => {
    region.type = 'static';
    region.set('name', region.get('slug').toUpperCase());
    return region;
  })
  .sort((ra, rb) => {
    if (ra.get('name') > rb.get('name')) {
      return 1;
    } else if (ra.get('name') < rb.get('name')) {
      return -1;
    }
    return 0;
  })
  .filter((r) => {
    return r.get('dropletCount') > 0;
  });
}
