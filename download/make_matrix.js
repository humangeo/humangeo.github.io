
function make_matrix(matrix_name){

  var margin = {top: 80, right: 0, bottom: 10, left: 80}, width = 600, height = 600;

  var x = d3.scale.ordinal().rangeBands([0, width]),
      z = d3.scale.linear().domain([0.00, .01, .8]).range([.2, .5 ,1.0]).clamp(true),
      c = d3.scale.category10().domain(d3.range(10));

  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      // .style("margin-left", -margin.left + "px")
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.csv("/download/" + matrix_name, function(rows) {
    var master = {},
        matrix = [],
        nodes = [],
        nodes_map = {},
        n = rows.length,
        columns, 
        col_map, 
        m;


    rows.forEach(function(row, i){
      var code = row.code;
      delete row.code;
      columns = Object.keys(row);
      col_map = columns.reduce(function(o, v, i) {o[v] = i; return o; }, {});
      var m = columns.length;
      var total = 1.0 * columns.map(function(key){return +row[key];}).reduce(function(a, b) {return a + b;});
      nodes[i] = {"name":code, "count": total, "group":0, "index":i};
      matrix[i] = d3.range(m).map(function(j) { return {x: j, y: i, z: 0, c:2}; });
      columns.forEach(function(key){
        row[key] =(row[key]*1.0)/ total;
        matrix[i][col_map[key]].z = row[key];
        if(key==code)
          matrix[i][col_map[key]].c = 0;
      });

      master[code] = row;
      nodes_map[code] = i;

    });

    var columns = Object.keys(master["en"]);
    var col_map = columns.reduce(function(o, v, i) {o[v] = i; return o; }, {});
    var m = columns.length;



    // Precompute the orders.
    var orders = {
      name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
      count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
      group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
    };

    // The default sort order.
    x.domain(orders.name);

    svg.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);

    var row = svg.selectAll(".row")
        .data(matrix)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
        .each(row);

    row.append("line")
        .attr("x2", width);

    row.append("text")
        .attr("x", -6)
        .attr("y", x.rangeBand() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "end")
        .text(function(d, i) { return nodes[i].name; });

    var column = svg.selectAll(".column")
        .data(matrix)
      .enter().append("g")
        .attr("class", "column")
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

    column.append("line")
        .attr("x1", -width);

    column.append("text")
        .attr("x", 6)
        .attr("y", x.rangeBand() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "start")
        .text(function(d, i) { return nodes[i].name; });

    function row(row) {
      var cell = d3.select(this).selectAll(".cell")
          .data(row.filter(function(d) { return d.z; }))
        .enter().append("rect")
          .attr("class", "cell")
          .attr("x", function(d) { return x(d.x); })
          .attr("width", x.rangeBand())
          .attr("height", x.rangeBand())
          .style("fill-opacity", function(d) { return z(d.z); })
          .style("fill", function(d) { return c(d.c)}) // nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
          // .style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
          .on("mouseover", mouseover)
          .on("mouseout", mouseout);
    }

    function mouseover(p) {
      svg.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
      svg.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
    }

    function mouseout() {
      svg.selectAll("text").classed("active", false);
    }

    d3.select("#order").on("change."+matrix_name, function() {
      clearTimeout(timeout);
      order(this.value);
    });

    function order(value) {
      x.domain(orders[value]);

      var t = svg.transition().duration(2500);

      t.selectAll(".row")
          .delay(function(d, i) { return x(i) * 4; })
          .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
        .selectAll(".cell")
          .delay(function(d) { return x(d.x) * 4; })
          .attr("x", function(d) { return x(d.x); });

      t.selectAll(".column")
          .delay(function(d, i) { return x(i) * 4; })
          .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
    }

    var timeout = setTimeout(function() {
      order("count");
      d3.select("#order").property("selectedIndex", 1).node().focus();
    }, 5000);
  });
}

make_matrix("id_matrix.csv");
make_matrix("ld_matrix.csv");
