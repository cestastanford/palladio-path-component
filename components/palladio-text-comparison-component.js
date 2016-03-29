// Text component module

angular.module('palladioTextComparisonView', ['palladio', 'palladio.services'])
  .run(['componentService', function(componentService) {
    var compileStringFunction = function (newScope, options) {
      var compileString = '<div data-palladio-text-view ></div>';
      return compileString;
    };

    componentService.register('character-text', compileStringFunction);
  }])
  .directive('palladioTextComparisonView', function (palladioService, dataService) {
    return {
      scope : true,
      template : '<div id="dual">' +
                 '<div id="textsComparison"></div>' +
                 '</div>',
      link : {
        pre : function(scope, element) {
          scope.data = {
            chinese: [],
            english: []
          };

        },

        post : function(scope, element, attrs) {
          // Anything that touches the DOM happens here.
          var fullData, filteredData;
          var xfilter = dataService.getDataSync().xfilter;
          if(xfilter === undefined) { return; }
          var dims = xfilter.dimension(function(d) { return true; });

          // Layout
          var width   = 380,
              height  = 200,
              margin  = 20;

          initialize();
          update();

          palladioService.onUpdate("text-component", update);

          // Main
          //-----------------------------------------------------
          function renderText(texts) {
            // Remove SVG if it already exists
            if(!d3.select(element[0]).select("svg").empty()) {
              d3.select(element[0]).select("svg").remove();
            }

            var svg = d3.select(element[0]).append("svg")
                  .attr("id", "texts")
                  .attr("width", width)
                  .attr("height", height);

            // create plot within svg
            var wrapper = svg.append("g")
              .attr("id", "wrapper")
              .attr("transform", "translate(" + padding + ", " + padding + ")");
          }

          function initialize() {
          
          }

          function update() {
            renderText(scope.data);
          }
        }
      }
    };
  });
