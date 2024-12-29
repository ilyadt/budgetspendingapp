
// https://stackoverflow.com/a/2998822/15347300
function pad(num, size) {
  var s = "00" + num;
  return s.substring(s.length-size);
}

export function dateFormat(d) {
  return pad(d.getDate(), 2)  + "." + pad(d.getMonth()+1, 2) + "." + d.getFullYear();
}

export function dateFormatFromString(dStr) {
  let d = new Date(dStr);

  return dateFormat(d);
}

export function dateISO(d) {
  return d.toISOString().split('T')[0];
}

export function dateISOFromString(dStr) {
  let d = new Date(dStr);

  return dateISO(d);
}
