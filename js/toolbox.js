function createElement(type, props) {
  const element = document.createElement(type);

  props = props || {};
  for (let property in props) {
    if (property in element) element[property] = props[property];
  }

  if (props.parent) props.parent.appendChild(element);
  return element;
}

function lerp(a, b, t) {
  return a * (1-t) + b * t;
}

function clamp(x, lowerlimit, upperlimit) {
  lowerlimit = lowerlimit || 0;
  upperlimit = upperlimit || 1;

  if (x < lowerlimit) return lowerlimit;
  if (x > upperlimit) return upperlimit;
  return x;
}

function smoothstep(x, edge0, edge1) {
  edge0 = edge0 || 0;
  edge1 = edge1 || 1;

  x = clamp((x - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function smootherstep(x, edge0, edge1) {
  edge0 = edge0 || 0;
  edge1 = edge1 || 1;
  x = clamp((x - edge0) / (edge1 - edge0));
  return x * x * x * (3 * x * (2 * x - 5) + 10);
}

class Vector2 {
  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  add(vec2) {
    return new Vector2(
      this.x + vec2.x,
      this.y + vec2.y
    );
  }

  sub(vec2) {
    return new Vector2(
      this.x - vec2.x,
      this.y - vec2.y
    );
  }

  mul(value) {
    return new Vector2(
      this.x * value,
      this.y * value
    )
  }

  div(value) {
    return new Vector2(
      this.x / value,
      this.y / value
    );
  }

  sqrMagnitude() {
    return this.x * this.x + this.y * this.y
  }

  magnitude() {
    return Math.sqrt(this.sqrMagnitude());
  }

  distance(vec2) {
    return this.sub(vec2).magnitude();
  }

  sqrDistance(vec2) {
    return this.sub(vec2).sqrMagnitude();
  }

  normalized() {
    var magnitude = this.magnitude();
    return new Vector2(
      this.x / magnitude,
      this.y / magnitude
    );
  }

  angle() {
    return 360 - (Math.atan2(this.x, this.y) * Rad2Deg * Math.sign(this.x));
  }

  copy() {
    return new Vector2(this.x, this.y);
  }
}

const Rad2Deg = 180 / Math.PI;
const Deg2Rad = Math.PI / 180;

function colorInterpolate(colorA, colorB, intval) {
  const rgbA = colorA,
    rgbB = colorB;
  const colorVal = (prop) =>
    Math.round(rgbA[prop] * (1 - intval) + rgbB[prop] * intval);
  return {
    r: colorVal('r'),
    g: colorVal('g'),
    b: colorVal('b'),
  }
}
