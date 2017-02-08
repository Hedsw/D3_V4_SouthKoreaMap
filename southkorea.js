var width = 800;
    height = 600;

var svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class","graph-svg-component");

var projection = d3.geoMercator()
      .center([128, 36])
      .scale(5000)
      .translate([width/2, height/2]);

var path = d3.geoPath()
      .projection(projection);

d3.queue()
  .defer(d3.json,"d3/skorea-provinces-topo.json")
  .defer(d3.csv,"Province.csv")
  .await(ready)

var config = {"color1":"#b3c6ff","color2":"#3366ff","stateDataColumn":"name","valueDataColumn":"더불어민주당"}
//#FF69B4 -> hotpink | 	#3366ff -> 진한 파랑 |  #b3c6ff->좀더 연한 파랑
var COLOR_COUNTS = 9;
var SCALE = 0.7;

function Interpolate(start, end, steps, count) {
    var s = start,
        e = end,
        final = s + (((e - s) / steps) * count);
    return Math.floor(final);
}

function Color(_r, _g, _b) {
    var r, g, b;
    var setColors = function(_r, _g, _b) {
        r = _r;
        g = _g;
        b = _b;
    };

    setColors(_r, _g, _b);
    this.getColors = function() {
        var colors = {
            r: r,
            g: g,
            b: b
        };
        return colors;
    };
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
  } : null;
}

function valueFormat(d) {
  if (d > 1000000000) {
    return Math.round(d / 1000000000 * 10) / 10 + "B";
  } else if (d > 1000000) {
    return Math.round(d / 1000000 * 10) / 10 + "M";
  } else if (d > 1000) {
    return Math.round(d / 1000 * 10) / 10 + "K";
  } else {
    return d;
  }
}

var COLOR_FIRST = config.color1, COLOR_LAST = config.color2;

var rgb = hexToRgb(COLOR_FIRST);
var valueById = d3.map();

var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);

rgb = hexToRgb(COLOR_LAST);
var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);

var MAP_STATE = config.stateDataColumn;
var MAP_VALUE = config.valueDataColumn;

var startColors = COLOR_START.getColors(),
    endColors = COLOR_END.getColors();

var colors = [];

for (var i = 0; i < COLOR_COUNTS; i++) {
  var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
  var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
  var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
  colors.push(new Color(r, g, b));
}

var quantize = d3.scaleQuantize()
  .domain([0, 1.0])
  .range(d3.range(COLOR_COUNTS).map(function(i) { return i }));

function ready (error, kor, province) {

  name_id_map = {};
  id_name_map = {};

  for (var i = 0; i < province.length; i++) {
     name_id_map[province[i].name] = province[i].id;
     id_name_map[province[i].id] = province[i].name;
  }
  province.forEach(function(d) {
    var id = name_id_map[d[MAP_STATE]];
    valueById.set(id, +d[MAP_VALUE]);
  });

//valueById <-- 이 값이 전혀 들어가지가 않음.. 내 생각엔 159-162 사이에 저 문구가 문제가 생겨서 안들어 가는것 같음..
// 저거 문제를 해결하고, 173라인 fill부터 해결 하고, 클릭시에 뭐 변하는거 하자.
  quantize.domain([d3.min(province, function(d){ return +d[MAP_VALUE]}),
    d3.max(province, function(d){ return +d[MAP_VALUE] })]);

  var korea = topojson.feature(kor, kor.objects['skorea-provinces-geo']).features
    svg.selectAll('.Province')
      .data(korea)
      .enter()
      .append("path")
      .style("fill", function(d) {
        if (valueById.get(d.properties.ID_1)) {

          var i = quantize(valueById.get(d.properties.ID_1));
          var color = colors[i].getColors();
          return "rgb(" + color.r + "," + color.g +
              "," + color.b + ")";
        } else {
          console.log("이거 되?");
          return "rgb(#0066ff,#99ccff,#123456)";
        }
      })
      .attr('d', path)
      .on('mouseover', function(d,i){
        //아래에서 값 받아 올때는 이렇게 아래에서 받아야 함..
        //데이터를 넣고 싶으면 아래 처럼 하면 넣을 수 있어

    //    console.log(province[i].name);
    //    console.log(province[i].국민의당);
    //    마우스 올라갔을 때 변경

        var html = "";
        html += "<div class =\"tooltip_key\">";
        html += "<span class=\"tooltip_key\">";
        html += province[i].name;
        html += "</span>";
        html += "<span class=\"tooltip_value\">";
        html += "<p>국민의당 - "
        html += (province[i].국민의당 ? valueFormat(province[i].국민의당) : "");
        html += "%</p>";
        html += "<p>더불어민주당 - "
        html += (province[i].더불어민주당 ? valueFormat(province[i].더불어민주당) : "");
        html += "%</p>";
        html += "<p>바른정당 - "
        html += (province[i].바른정당 ? valueFormat(province[i].바른정당) : "");
        html += "%</p>";
        html += "<p>새누리당 - "
        html += (province[i].새누리당 ? valueFormat(province[i].새누리당) : "");
        html += "%</p>";
        html += "<p>정의당 - "
        html += (province[i].정의당 ? valueFormat(province[i].정의당) : "");
        html += "%</p>";
        html += "</span>";
        html += "</div>";

         $("#tooltip-container").html(html);
         $(this).attr("fill-opacity", "0.8");
         $("#tooltip-container").show();

          var coordinates = d3.mouse(this);
          var map_width = svg.node().getBoundingClientRect().width;
          if (d3.event.layerX < map_width / 2) {
            d3.select("#tooltip-container")
              .style("top", (d3.event.layerY + 15) + "px")
              .style("left", (d3.event.layerX + 15) + "px");
          } else {
            var tooltip_width = $("#tooltip-container").width();
            d3.select("#tooltip-container")
              .style("top", (d3.event.layerY + 15) + "px")
              .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
          }
      })

      .on('mouseout', function(d){
        //마우스 내려갔을 때 변경
        $(this).attr("fill-opacity", "1.0");
        $("#tooltip-container").hide();
      })

      svg.selectAll("province-circle")
          .data(province)
          .enter().append("circle")
          .attr("r", 2)
          .attr("cx", function(d){
            var lonlat = projection([d.lon, d.lat])
          //  console.log(lonlat);
            return lonlat[0];
          })
          .attr("cy", function(d){
            var lonlat = projection([d.lon, d.lat])
        //    console.log(lonlat);
            return lonlat[1];
          })

          svg.selectAll(".province-label")
              .data(province)
              .enter().append("text")
              .attr("class","province-label")
              .attr("x", function(d) {
                var lonlat = projection([d.lon, d.lat])
                return lonlat[0];
              })
              .attr("y", function(d) {
                var lonlat = projection([d.lon, d.lat])
                return lonlat[1];
              })
              .text(function(d) {
                return d.name
              })
              .attr("dx", 5)
              .attr("dy", 2)

}//end ready
