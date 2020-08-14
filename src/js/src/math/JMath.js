var JMath = {
  intersectRectRect: function (a, b) {
    var ax = (a.right + a.left) / 2,
      ay = (a.bottom + a.top) / 2,
      aw = a.right - a.left,
      ah = a.bottom - a.top,
      bx = (b.right + b.left) / 2,
      by = (b.bottom + b.top) / 2,
      bw = b.right - b.left,
      bh = b.bottom - b.top;
    return (
      (Math.abs(ax - bx) * 2 < (aw + bw)) &&
      (Math.abs(ay - by) * 2 < (ah + bh))
    );
  }
};
