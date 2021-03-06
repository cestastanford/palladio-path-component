// Path component module
// Most code based on http://bl.ocks.org/hepplerj/e5d3d5787f348cc3b032

angular.module('palladioPathView', ['palladio', 'palladio.services'])
	.run(['componentService', function(componentService) {
		var compileStringFunction = function (newScope, options) {

			var compileString = '<div data-palladio-path-view ></div>';

			return compileString;
		};

		componentService.register('character-path', compileStringFunction);
	}])
	.directive('palladioPathView', function (palladioService, dataService) {
		return {
			scope : {

			},
			template : '<div id="main">' +
								 '<div id="chart"></div>' +
								 '</div>',
			link : {
				pre : function(scope, element) {
					scope.data = {
						nodes: [],
						links: []
					};

				},

				post : function(scope, element, attrs) {
					// Anything that touches the DOM happens here.
					var fullData, filteredData;
					var xfilter = dataService.getDataSync().xfilter;
					if(xfilter === undefined) { return; }
					var dummyDim = xfilter.dimension(function(d) { return true; });

					// Layout
					var width   = 960,
					    height  = 200,
					    margin  = 20,
					    pad     = margin / 2,
					    padding = 10,
					    radius  = 6,
					    yfixed  = pad + radius;
					var color = d3.scale.ordinal().range(["#9BDFA1", "#746862", "#DA6761", "#A75F3A", "#53A73A"]); //d3.scale.category20();

					// Legend variables
					var legend_x = 0,
					    legend_y = 5,
					    legend_width = 175,
					    legend_height = 620,
					    legend_margin = 20,
					    key_y = 40,
					    key_x = 16,
					    mapped_y = legend_y + legend_height - 90;

					// Tooltip
					var tooltip = d3.select("body").append("div")
					  .classed("tooltip", true)
					  .classed("hidden", true);

					// Text selection
					var text_opts = {
						"selectText": {
							"field": "selectText",
							"label": "Select Text"
						},
					  "tangPoem": {
					    "field": "tangPoem",
					    "label": "Wang Wei, 'Parting'"
					  },
					  "poem2": {
					    "field": "madmanPoem",
					    "label": "Lu Xun, 'Diary of a Madman'"
					  }
					};

					initialize();
					update();

					palladioService.onUpdate("path-component", update);

					// Main
					//-----------------------------------------------------
					function arcDiagram(graph) {
					  var radius = d3.scale.sqrt()
					    .domain([0, 20])
					    .range([0, 15]);

			      // Remove SVG if it already exists (this is a very inefficient way to handle updates...)
					  if(!d3.select(element[0]).select("svg").empty()) {
					    d3.select(element[0]).select("svg").remove();
					  }

					  var svg = d3.select(element[0]).append("svg")
						      .attr("id", "arc")
						      .attr("width", width)
						      .attr("height", height);

					  // create plot within svg
					  var wrapper = svg.append("g")
					    .attr("id", "wrapper")
					    .attr("transform", "translate(" + padding + ", " + padding + ")");

					  // count the paths, used for sizing links
					  graph.links.forEach(function(d,i) {
					    var pathCount = 0;
					    for (var j = 0; j < i; j++) {
					      var otherPath = graph.links[j];
					      if (otherPath.source === d.source && otherPath.target === d.target) {
					        pathCount++;
					      }
					    }
					    d.pathCount = pathCount;
					  });

					  // fix graph links to map to objects
					  graph.links.forEach(function(d,i) {
					    d.source = isNaN(d.source) ? d.source : graph.nodes[d.source];
					    d.target = isNaN(d.target) ? d.target : graph.nodes[d.target];
					    d.sessions = ("Session" + d.session + "Trial" + d.trial + "Seg" + d.segment);
					  });

					  linearLayout(graph.nodes);
					  drawLinks(graph.links);
					  drawNodes(graph.nodes);
					}

					// layout nodes linearly
					function linearLayout(nodes) {
					  nodes.sort(function(a,b) {
					    return a.uniq - b.uniq;
					  });

					  var xscale = d3.scale.linear()
					    .domain([0, nodes.length - 1])
					    .range([radius, width - margin - radius]);

					  nodes.forEach(function(d, i) {
					    d.x = xscale(i);
					    d.y = yfixed;
					  });
					}

					function drawNodes(nodes) {

					  var gnodes = d3.select(element[0]).select('svg').select('#wrapper').selectAll("g.node")
					    .data(nodes);

					  var nodeEnter = gnodes.enter()
					    .append('g')
					    .attr("class","gnode");

					  nodeEnter.append("circle")
					    .attr("class", "node")
					    .attr("id", function(d, i) { return d.name; })
					    .attr("cx", function(d, i) { return d.x; })
					    .attr("cy", function(d, i) { return d.y; })
					    .attr("r", 14)
					    .attr("stroke-width","2.5px")
					    .attr("fill","#ffffff")
					    .style("stroke", function(d, i) { return color(d.tokenType); });

					  nodeEnter.append("text")
					    .style("text-anchor", "middle")
					    .attr("dx", function(d) { return d.x; })
					    .attr("dy", function(d) { return d.y + 5; })
					    .text(function(d) {
					      // hide text in selection nodes
					      if (d.tokenType === "selection") { return null; }
					      else { return d.token; }
					    })
					    .style("font","12px sans-serif");

					}

					function drawLinks(links) {
					  var radians = d3.scale.linear()
					    .range([Math.PI / 2, 3 * Math.PI / 2]);

					  var arc = d3.svg.line.radial()
					    .interpolate("basis")
					    .tension(0)
					    .angle(function(d) { return radians(d); });

					  d3.select(element[0]).select('svg').select('#wrapper').selectAll(".link")
					    .data(links)
					  .enter().append("path")
					    .attr("class", "link")
					    .classed("highlighted", false)
					    .attr("id", function(d) { return d.sessions; })
					    .attr("transform", function(d,i) {
					      var xshift = d.source.x + (d.target.x - d.source.x) / 2;
					      var yshift = yfixed;
					      return "translate(" + xshift + ", " + yshift + ")";
					    })
					    .attr("d", function(d,i) {
					      var xdist = Math.abs(d.source.x - d.target.x);
					      arc.radius(xdist / 2);
					      var points = d3.range(0, Math.ceil(xdist / 3));
					      radians.domain([0, points.length - 1]);
					      return arc(points);
					    })
					    .attr("fill","none")
					    .attr("stroke","#888888")
					    .attr("stroke-weight","1px")
					    .attr("stroke-opacity","0.5")
					    .style("stroke-width", function(d) { return (2 + d.pathCount); });
					}
					
					function classedOverState() {
						d3.selectAll("#segment")
						.on("mouseover", function(d, i) {
							d3.select(this)
								.classed("hover-on", true)
								.classed("hover-off", false);
						})
						.on("mouseout", function(d, i) {
						d3.selectAll("#segment")
								.classed("hover-off", true)
								.classed("hover-on", false);
						});
					}

					// Field selector
					function create_field_selector() {
						var fieldSelector = d3.select("#field-selector")
						      // .on("change", fieldSelected);

						for (var key in text_opts) {
						  fieldSelector.append("option")
						  .attr("value", key)
						  .text(text_opts[key].label);
						}
					}

					function update_selection_view() {
						// Remove SVG if it already exists (this is a very inefficient way to handle updates...)
					  if(!d3.select(element[0]).select("svg").empty()) {
					    d3.select(element[0]).select("svg").remove();
					  }
					}

					function shallowCopy(obj) {
						var copy = {};
						for (var attr in obj) {
							if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
						}
						return copy;
					}

					// Objects must have same properties
					// ignores the 'uniq' property, which is special in our case, and 'generate' property.
					function shallowCompare(obj1, obj2) {
						for (var attr in obj1) {
							if(obj1[attr] !== obj2[attr] && attr !== 'uniq'  && attr !== 'generated') {
								if(attr === 'uniq') console.log(attr + ":" + obj1[attr] + ":" + obj2[attr]);
								return false;
							}
						}
						return true;
					}

					function shallowContains(arr, obj) {
						return arr.filter(shallowCompare.bind(null, obj)).length > 0 ? true : false;
					}

					function buildNodesAndLinks() {

						fullData = dataService.getDataSync().data;
						filteredData = dummyDim.top(Infinity);

						var m = d3.map();
						var mFiltered = d3.map();

						fullData.forEach(function(d) {
							// Turn uniq into a number
							d.uniq = +d.uniq;
						});

						filteredData.forEach(function(d) {
							// Turn uniq into a number
							d.uniq = +d.uniq;
						});

						// First split up the data by trial/session in a map.
						var copy = {};
						fullData.forEach(function(d) {
							copy = shallowCopy(d);
							copy.occur = 0;
							if(m.has([d.trial, d.session])) {
								while(shallowContains(m.get([d.trial, d.session]), copy)) {
									copy.occur++;
								}
								m.get([d.trial, d.session]).push(copy);
							} else {
								m.set([d.trial, d.session], [copy]);
							}
						});

						filteredData.forEach(function(d) {
							if(mFiltered.has([d.trial, d.session])) {
								mFiltered.get([d.trial, d.session]).push(d);
							} else {
								mFiltered.set([d.trial, d.session], [d]);
							}
						});

						// Sort by uniq, convert to character/token combinations, add to graph
						var graph = new Graph();
						m.keys().forEach(function(d) {
							var sequence = [];
							var i = 0;

							m.get(d)
								.sort(function(a,b) { return a.uniq - b.uniq; })
								.forEach(function(d) {
									sequence.push(d.chinese + "," + d.token + "," + d.token_type + "," + d.occur);
								});

							graph.add(sequence);
						});

						// Generate the node ordering using topological sort.
						// !! This won't work if there are any cycles or miscategorized selection keystrokes.
						// Array of node strings for index lookup purposes
						var stringNodeArray = graph.sort();
						// Array of objects for rendering.
						var nodeArray = graph.sort()
							.map(function(d, i) {
								return {
									chinese: d.split(",")[0],
									token: d.split(",")[1],
									tokenType: d.split(",")[2],
									uniq: i
								};
							});

						scope.data.nodes = nodeArray;

						// Now go through all the trials and create our links.
						var linkArray = [];
						mFiltered.keys().forEach(function(d) {
							// Current trial
							var current = m.get(d);
							// Iterate through each keystroke in the current trial
							for(var i=0; i < current.length - 1; i++) {
								// We are not at the end (there is no link at the end)
								linkArray.push({
									source: stringNodeArray.indexOf(current[i].chinese + "," + current[i].token + "," + current[i].token_type + "," + current[i].occur),
									target: stringNodeArray.indexOf(current[i+1].chinese + "," + current[i+1].token + "," + current[i+1].token_type + "," + current[i+1].occur),
									session: +current[i].session,
									trial: +current[i].trial,
									segment: 1
								});
							}
						});

						scope.data.links = linkArray;
					}

					function initialize() {
						create_field_selector();
						classedOverState();
					}

					function update() {
						buildNodesAndLinks();
						arcDiagram(scope.data);
					}
				}
			}
		};
	});
