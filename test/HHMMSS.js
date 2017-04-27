if (process.argv[2] == undefined) {
  console.log("No arg");
  return;
}
function addZero(nb)
{
  if(Math.abs(nb<10))
  {
    return "0" + nb.toString();
  } else {
    return nb.toString();
  }
}
var nb = process.argv[2];
var neg;
(nb < 0) ? neg = true: neg = false;
nb = Math.abs(nb);
var h = Math.floor(nb / 3600);
var m = Math.floor(Math.floor(nb % 3600) / 60);
var s = Math.floor(nb % 60);

return ((neg) ? "-":"+") + " " + addZero(h) + ":" + addZero(m) + ":" + addZero(s);
