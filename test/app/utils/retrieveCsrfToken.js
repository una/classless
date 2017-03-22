export default function() {
  let el = document.querySelector('meta[name="csrf-token"]');
  if (el) {
    return el.content;
  }
}
