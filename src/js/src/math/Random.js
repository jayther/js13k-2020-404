
var Random = null;
Random = {
  range: function (min, max) {
    return min + Math.random() * (max - min);
  },
  rangeInt: function (min, max) {
    return Math.floor(Random.range(min, max));
  },
  pick: function (array) {
    return array[Random.rangeInt(0, array.length)];
  },
  pickAndRemove: function (array) {
    var i = Random.rangeInt(0, array.length);
    var item = array[i];
    array.splice(i, 1);
    return item;
  },
  flagPick: function (flags) {
    var pool = [], i = 0;
    while (flags > 0) {
      if (flags & 1) {
        pool.push(1 << i);
      }
      flags >>= 1;
      i += 1;
    }
    if (pool.length > 0) {
      return Random.pick(pool);
    }
    return 0;
  }
};
