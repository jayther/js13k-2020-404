var JMath = {
  clamp: function (v, min, max) {
    return v < min ? min : v > max ? max : v;
  },
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
  },
  lengthFromVec: function (v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },
  rotateVec: function (v, a) {
    var rotX = Math.cos(a);
    var rotY = Math.sin(a);
    // matrix mult
    return {
      x: v.x * rotX - v.y * rotY,
      y: v.x * rotY + v.y * rotX
    };
  },
  rotateRectAroundPoint: function (rect, point, angle) {
    if (angle === 0) {
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom
      };
    }
    var w = rect.right - rect.left,
      h = rect.bottom - rect.top,
      newLeftTop, t, rad = angle / 360 * Math.PI * 2;
    
    if (angle === 90 || angle === 270) {
      t = w;
      w = h;
      h = t;
    }
    
    if (angle === 90) {
      newLeftTop = { x: rect.left, y: rect.bottom };
    } else if (angle === 180) {
      newLeftTop = { x: rect.right, y: rect.bottom };
    } else {
      newLeftTop = { x: rect.right, y: rect.top };
    }
    newLeftTop.x -= point.x;
    newLeftTop.y -= point.y;
    newLeftTop = JMath.rotateVec(newLeftTop, rad);
    return {
      left: point.x + newLeftTop.x,
      top: point.y + newLeftTop.y,
      right: point.x + newLeftTop.x + w,
      bottom: point.y + newLeftTop.y + h
    };
  }
};
