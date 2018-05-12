var gravitational_constant = 10;
var animationId;

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
  this.collided_planets = [];
}

Planet.prototype.draw = function(ctx) {
  ctx.beginPath();
  ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
  ctx.stroke();
};

Planet.prototype.updateAccel = function(ctx, planets) {
  // planets is an array containing all other planets
  this.accel = new Vector (0, 0);
  if (this.fixed === false) {
    for (var i = 0; i < planets.length; i++) {
      if (this.id != planets[i].id) {
        var distance_vector = planets[i].position.add(this.position.scale(-1));
        var accel_magnitude = gravitational_constant * planets[i].mass / Math.pow(distance_vector.magnitude(), 2);
        var accel_change = distance_vector.unitize().scale(accel_magnitude);
        this.accel = this.accel.add(accel_change);

        var xdiff = this.position.add(planets[i].position.scale(-1));
        if (xdiff.magnitude() <= this.radius + planets[i].radius && this.collided_planets.indexOf(planets[i].id) == -1) {
          // collisions with other planets
          var vdiff = this.velocity.add(planets[i].velocity.scale(-1));
          var m1 = this.mass;
          var m2 = planets[i].mass;
          var accel_change = xdiff.scale(-2 * m2 / (m1 + m2) * vdiff.dot(xdiff) / Math.pow (xdiff.magnitude(), 2));
          this.accel = this.accel.add(accel_change);
          this.collided_planets.push(planets[i].id);
        }
        else if (xdiff.magnitude() >= this.radius + planets[i].radius && this.collided_planets.indexOf(planets[i].id) != -1){
          var index = this.collided_planets.indexOf(planets[i].id);
          this.collided_planets.splice(index, 1);
        }
      }
    }
    if ((this.position.x < this.radius && this.velocity.x < 0) || (this.position.x > ctx.canvas.width - this.radius && this.velocity.x > 0)) {
      // collisions with left and right walls
      this.accel.x -= 2 * this.velocity.x;
    }
    if ((this.position.y < this.radius && this.velocity.y < 0) || (this.position.y > ctx.canvas.height - this.radius && this.velocity.y > 0)) {
      // collisions with top and bottom walls
      this.accel.y -= 2 * this.velocity.y;
    }
  }
}

Planet.prototype.updatePosition = function(planets) {
  if (this.fixed === false) {
    this.velocity = this.velocity.add(this.accel);
    this.position = this.position.add(this.velocity);
    this.position_shift = new Vector(0, 0);
    for (var i = 0; i < planets.length; i++) {
      // collision shifting
      var xdiff = this.position.add(planets[i].position.scale(-1));
      var distance = xdiff.magnitude() - (this.radius + planets[i].radius);
      if (this.id != planets[i].id && distance <= 0) {
        if (planets[i].fixed === true) {
          this.position_shift = this.position_shift.add(xdiff.unitize().scale(-distance));
        }
        else {
          this.position_shift = this.position_shift.add(xdiff.unitize().scale(-distance/2));
        }
      }
    }
    this.position = this.position.add(this.position_shift);
  }
}

function animate (ctx, planets) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (var i = 0; i < planets.length; i++) {
    planets[i].updateAccel(ctx,planets);
  }
  for (var i = 0; i < planets.length; i++) {
    planets[i].updatePosition(planets);
    planets[i].draw(ctx);
  }
  animationId = window.requestAnimationFrame(function() {animate(ctx, planets);});
}

function startAnimation (ctx, num_planets) {
  var planets = [];
  for (var i = 0; i < num_planets; i++) {
    var selector_prefix = "#planet" + i + "_";
    console.log($(selector_prefix + "enabled").is(":checked"));
    if ($(selector_prefix + "enabled").is(":checked")) {
      var mass = parseFloat($(selector_prefix + "mass").val());
      var radius = parseFloat($(selector_prefix + "radius").val());
      var position = new Vector (parseFloat($(selector_prefix + "x").val()), parseFloat($(selector_prefix + "y").val()));
      var velocity = new Vector (parseFloat($(selector_prefix + "vx").val()), parseFloat($(selector_prefix + "vy").val()));
      var fixed = $(selector_prefix + "fixed").is(":checked");
      planets.push(new Planet(i, mass, radius, position, velocity, fixed));
      console.log(planets);
    }
  }
  animationId = window.requestAnimationFrame(function() {animate(ctx, planets);});
  $("#stop_animation").click(function() {
    $("#stop_animation").hide();
    $("#start_animation").show();
    window.cancelAnimationFrame(animationId);
  });
}

$(function() {
  var num_planets = 5;
  var canvas = $("#canvas")[0];
  var ctx = canvas.getContext("2d");
  ctx.canvas.width = 1200;
  ctx.canvas.height = 700;

  $("#start_animation").click(function() {
    $("#start_animation").hide();
    $("#stop_animation").show();
    startAnimation(ctx, num_planets);
  });
});
