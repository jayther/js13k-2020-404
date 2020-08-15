var JMath = {
  intersectRectRect: function (a, b) {
    return (
      a.left < b.right &&
      a.right > b.left &&
      a.top < b.bottom &&
      a.bottom > b.top
    );
  },
  angleFromVec: function (v) {
    return Math.atan2(v.y, v.x);
  }
};
