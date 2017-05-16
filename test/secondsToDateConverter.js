var nb = process.argv[2];
if (nb == null)
  return "+ 00:00:00"

function addZero(nb) {
  if (Math.abs(nb < 10)) {
    return "0" + nb.toString();
  } else {
    return nb.toString();
  }
}
var neg;
(nb < 0) ? neg = true: neg = false;
nb = Math.abs(Number(nb));
var h = Math.floor(nb / 3600);
if (Number.isNaN(h))
  h = 0;
var m = Math.floor(Math.floor(nb % 3600) / 60);
if (Number.isNaN(m))
  m = 0;
var s = Math.floor(nb % 60);
if (Number.isNaN(s))
  s = 0;
console.log(((neg) ? "-" : "+") + " " + addZero(h) + ":" + addZero(m) + ":" + addZero(s));
process.exit(0);
