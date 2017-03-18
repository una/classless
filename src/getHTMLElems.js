function getAllElements() {
  var all = document.getElementsByTagName("*");
  var st = [];
  for (var i = 0, max = all.length; i < max; i++) {
    if (all[i].className !== '') {
        st.push('.' + all[i].className);
    }
    if (all[i].id !== '') {
        st.push('#' + all[i].id);
    }
  }
  var unique = st.filter(function (item, i, ar) { return ar.indexOf(item) === i; });

  console.log(st)
}
