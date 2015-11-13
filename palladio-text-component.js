// Text side-by-side module

angular.module('palladioTextView', ['palladio', 'palladio.services'])
  .run(['componentService', function(componentService) {
    var compileStringFunction = function (newScope, options) {

      var compileString = '<div data-palladio-text-view ></div>';

      return compileString;
    };

    componentService.register('character-path', compileStringFunction);
  }])
  .directive('palladioTextView', function (palladioService, dataService) {
    return {
      scope : {

      },
      template : '<div id="main">' +
                   '<div id="text-comparison"></div>' +
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

          var dummyDim = xfilter.dimension(function(d) { return true; });

          var width   = 350,
              height  = 200,
              margin  = {top: 10, left: 10, bottom: 10, right: 10},
              padding = 5;

          initialize();
          update();

          palladioService.onUpdate("text-component", update);

          // Main
          //-----------------------------------------------------
          function chineseText(data) {

            var chinese_text_area = d3.selectAll(".chinese-text-area")
                .attr("width", width)
                .attr("height", height);

            chinese_text_area
              .data(data)
              .enter().append('text');

          }

          function englishText(data) {

            var english_text_area = d3.selectAll(".english-text-area")
                .attr("width", width)
                .attr("height", height);

            english_text_area
              .data(data)
              .enter().append('text');

          }

          function chineseTextSelection() {

          }

          function englishTextSelection() {

          }

          function initialize() {

          }

          function update() {
            chineseTextSelection();
            englishTextSelection();
          }
        }
      }
    };
  });
