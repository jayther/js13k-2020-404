
function squiggles(y, amplitude, iterations, width, thickness) {
  var i, points = [], step = width / (iterations - 1);
  for (i = 0; i < iterations; i += 1) {
    points.push({ x: i * step, y: y + amplitude - thickness / 2 });
    amplitude *= -1;
  }
  amplitude *= -1;
  for (i = iterations - 1; i >= 0; i -= 1) {
    points.push({ x: i * step, y: y + amplitude + thickness / 2});
    amplitude *= -1;
  }
  return points;
}

var hallwayTile = (function () {
  var c = new CachedContainer({ w: 70, h: 70 });
  
  c.addChild(new DisplayRect({
    w: 70, h: 70,
    color: '#c99869'
  }));

  c.addChild(new DisplayPath({
    path: squiggles(25, 5, 7, 70, 16),
    color: '#c58f5c'
  }));

  c.addChild(new DisplayPath({
    path: squiggles(55, 5, 7, 70, 16),
    color: '#c58f5c'
  }));

  return c;
}());

var wallTile = (function () {
  var c = new CachedContainer({ w: 70, h: 70 });
  
  c.addChild(new DisplayRect({
    w: 70, h: 70,
    color: '#838796'
  }));

  c.addChild(new DisplayPath({
    path: squiggles(25, 5, 7, 70, 24),
    color: '#7e8291'
  }));

  c.addChild(new DisplayPath({
    path: squiggles(55, 5, 7, 70, 16),
    color: '#7e8291'
  }));

  return c;
}());

var roomTile = (function () {
  var c = new CachedContainer({ w: 70, h: 70 });
  
  c.addChild(new DisplayRect({
    w: 70, h: 70,
    color: '#acc0c1'
  }));

  c.addChild(new DisplayPath({
    path: squiggles(25, 5, 7, 70, 16),
    color: '#bbcbcc'
  }));

  c.addChild(new DisplayPath({
    path: squiggles(55, 5, 7, 70, 16),
    color: '#bbcbcc'
  }));

  return c;
}());

Resources.loadedImgs.hallwayTile = hallwayTile.canvas;
Resources.loadedImgs.wallTile = wallTile.canvas;
Resources.loadedImgs.roomTile = roomTile.canvas;
