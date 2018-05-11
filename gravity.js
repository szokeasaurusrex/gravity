var gravitational_constant = 10;

function Vector(x, y) {
  this.x = x;
  this.y = y;
}

Vector.prototype.magnitude = function() {
  return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
};

Vector.prototype.angle = function() {
  var refangle = Math.atan(- this.y / this.x);
  if (this.x < 0) {
    return -refangle;
  }
  else {
    return Math.PI + refangle;
  }
};

Vector.prototype.add = function(vector2) {
  // If sign == 1, then add, if sign == -1, subtract
  var x = this.x + vector2.x;
  var y = this.y + vector2.y;
  var resultant = new Vector(x, y);
  return resultant;
};

Vector.prototype.scale = function(scalar) {
  // scales vector (scalar multiplication)
  var x = scalar * this.x;
  var y = scalar * this.y;
  var new_vector = new Vector(x, y);
  return new_vector;
};

Vector.prototype.dot = function(vector2) {
  return this.x * vector2.x + this.y * vector2.y;
};

Vector.prototype.setByMagnitudeDirection = function (magnitude, direction) {
  this.x = magnitude * Math.cos(direction);
  this.y = - magnitude * Math.sin(direction);
}

Vector.prototype.unitize = function () {
  // returns vector with same direction with magnitude equal to one
  return this.scale(1 / this.magnitude());
}

function Planet(id, mass, radius, position, velocity, fixed) {
  // mass and radius are scalars, position and velocity are vectors
  this.id = id;
  this.mass = mass;
  this.radius = radius;
  this.position = position;
  this.velocity = velocity;
  this.fixed = fixed;
}

Planet.prototype.draw = function(ctx) {
  ctx.beginPath();
  ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
  ctx.stroke();
};

Planet.prototype.updateAccel = function(planets) {
  // planets is an array containing all other planets
  this.accel = new Vector (0, 0);
  if (this.fixed === false) {
    for (var i = 0; i < planets.length; i++) {
      if (this.id != planets[i].id) {
        var distance_vector = planets[i].position.add(this.position.scale(-1));
        var accel_magnitude = gravitational_constant * planets[i].mass / Math.pow(distance_vector.magnitude(), 2);
        var accel_change = distance_vector.unitize().scale(accel_magnitude);
        this.accel = this.accel.add(accel_change);
        console.log(this.accel);
      }
    }
    // TODO add acceleration change for collisions
  }
}

Planet.prototype.updatePosition = function() {
  if (this.fixed === false) {
    this.velocity = this.velocity.add(this.accel);
    this.position = this.position.add(this.velocity);
  }
}

function animate (ctx, planets) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (var i = 0; i < planets.length; i++) {
    planets[i].updateAccel(planets);
  }
  for (var i = 0; i < planets.length; i++) {
    planets[i].updatePosition();
    planets[i].draw(ctx);
  }
  window.requestAnimationFrame(function() {animate(ctx, planets);});
}

$(function() {
  var canvas = $("#canvas")[0];
  var ctx = canvas.getContext("2d");
  ctx.canvas.width = 1200;
  ctx.canvas.height = 700;
  var earth = new Planet(0, 500, 20, new Vector(500,350), new Vector(0, 0), true);
  var moon = new Planet(1, 10, 5, new Vector(500, 500), new Vector(6, 0), true);
  window.requestAnimationFrame(function() {animate(ctx, [earth, moon]);});
});
