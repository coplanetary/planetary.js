  var originalPlanetaryjs = null;
  if (window) originalPlanetaryjs = window.planetaryjs;
  var plugins = [];

  var doDrawLoop = function(planet, canvas, hooks) {
    d3.timer(function() {
      planet.context.clearRect(0, 0, canvas.width, canvas.height)
      for (var i = 0; i < hooks.onDraw.length; i++) {
        hooks.onDraw[i]();
      }
    });
  };

  var startDraw = function(planet, canvas, localPlugins, hooks) {
    for (var i = 0; i < plugins.length; i++) {
      localPlugins.unshift(plugins[i]);
    }

    if (localPlugins.length == 0 && planetaryjs.plugins.earth) {
      planet.loadPlugin(planetaryjs.plugins.earth());
    }

    for (var i = 0; i < localPlugins.length; i++) {
      var plugin = localPlugins[i][0];
      var config = localPlugins[i][1];
      plugin(planet, config);
    }

    planet.canvas = canvas;
    planet.context = canvas.getContext('2d');

    if (hooks.onInit.length) {
      var completed = 0;
      var doNext = function(callback) {
        var next = hooks.onInit[completed];
        if (next.length) {
          next(function() {
            completed++;
            callback();
          });
        } else {
          next();
          completed++;
          setTimeout(callback, 0);
        }
      };
      var check = function() {
        if (completed >= hooks.onInit.length) doDrawLoop(planet, canvas, hooks);
        else doNext(check);
      }
      doNext(check);
    } else {
      doDrawLoop(planet, canvas, hooks);
    }
  };

  var planetaryjs = {
    plugins: {},

    noConflict: function() {
      window.planetaryjs = originalPlanetaryjs;
      return planetaryjs;
    },

    loadPlugin: function(plugin, defaultOptions) {
      plugins.push([plugin, defaultOptions || {}]);
    },

    planet: function() {
      var localPlugins = [];
      var hooks = {
        onInit: [],
        onDraw: []
      };

      var planet = {
        draw: function(canvas) {
          startDraw(planet, canvas, localPlugins, hooks);
        },

        onInit: function(fn) {
          hooks.onInit.push(fn);
        },

        onDraw: function(fn) {
          hooks.onDraw.push(fn);
        },

        loadPlugin: function(plugin, defaultOptions) {
          localPlugins.push([plugin, defaultOptions || {}]);
        },

        withSavedContext: function(fn) {
          if (!this.context) {
            throw new Error("No canvas to fetch context for")
          }

          this.context.save();
          fn(this.context);
          this.context.restore();
        }
      };

      planet.projection = d3.geo.orthographic()
        .clipAngle(90)
        .precision(0);
      planet.path = d3.geo.path().projection(planet.projection);

      return planet;
    }
  };