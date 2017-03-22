export default function isRailsRendered(path) {
  return /^(catch_all)|settings_sidebar/.test(path);
}