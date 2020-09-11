function KB(press, release) {
  var keys = {};
  var kb = {};
  kb.downHandler = function (e) {
    var k = e.keyCode;
    if (!has(keys, k)) {
      keys[k] = false;
    }
    if (!keys[k]) {
      press(k);
    }
    keys[k] = true;
    e.preventDefault();
  };
  kb.upHandler = function (e) {
    var k = e.keyCode;
    if (!has(keys, k)) {
      keys[k] = false;
    }
    if (keys[k]) {
      release(k);
    }
    keys[k] = false;
    e.preventDefault();
  };
  kb.destroy = function () {
    window.removeEventListener('keydown', kb.downHandler, false);
    window.removeEventListener('keyup', kb.upHandler, false);
  };
  window.addEventListener('keydown', kb.downHandler, false);
  window.addEventListener('keyup', kb.upHandler, false);
  
  return kb;
}

KB.keys = {
  a: 65,
  w: 87,
  s: 83,
  d: 68,
  z: 90,
  q: 81,
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  space: 32,
  enter: 13
};
