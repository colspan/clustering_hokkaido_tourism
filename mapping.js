(function() {

  // 外部ファイル定義
  var csv_files = [];
  var json_files = [];
  var tourism_stat_files = [
    {file:"data/cluster_result.csv", label:'cluster_external_2012'}
  ];
  csv_files = csv_files.concat(tourism_stat_files);
  var geodata_files = [{file:"data/hokkaido_topo.json", label:'geodata_topo'}];
  json_files = json_files.concat(geodata_files);

  // 変数初期化
  // 最大値変数初期化
  // UI初期化
  var g,
  width = 550,
  height = 500;

  // 読み込み実行
  var q = queue();
  var q_labels = [];
  json_files.forEach(function(d){
    q.defer(d3.json,d.file);
    q_labels.push(d.label);
  });
  csv_files.forEach(function(d){
    q.defer(d3.csv,d.file);
    q_labels.push(d.label);
  });
  q.awaitAll(ready);
  function ready(error, data) {
    // 変数名解決
    var loaded={};
    for(var i=0;i<data.length;i++){
      loaded[q_labels[i]] = data[i];
    }
    // 初期化
    var geodata = topojson.feature(loaded.geodata_topo, loaded.geodata_topo.objects.hokkaido)
    tourism_stat_files.forEach(function(d){
      append_tourism_stat(geodata.features,loaded[d.label],d.label);
    });
    visualize(geodata);
  }

  // 描画
  function visualize(json){
    var projection, path;
    var colors = d3.scale.category20();

    // svg要素を作成し、データの受け皿となるg要素を追加している
    var map = d3.select('#map').append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g');

    // 投影関数
    projection = d3.geo.mercator()
    .scale(4800)
    .center(d3.geo.centroid(json))  // データから中心点を計算
    .translate([width / 2, height / 2]);

    // Path Generator
    path = d3.geo.path().projection(projection);
    map.selectAll('path')
    .data(json.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr("fill", function(d){
      if( d.cluster_external_2012 === undefined ) color = '#000';
      else color = colors(d.cluster_external_2012);
      return color;
    })
    .attr("stroke","hsl(80,100%,0%)" )
    .attr("stroke-width","0.3")
    .on('mouseover', function(d){
      // do nothing
    })
    .on('click', function(d) {
      // do nothing
    });
  }
  function append_tourism_stat(target,input,key_name){
    var i;
    var output_dic = {};
    for(i=0;i<input.length;i++){
      output_dic[input[i].commune] = parseInt(input[i].cluster,10);
    }

    // join
    for(i=0;i<target.length;i++){
      var commune;
      if(target[i].properties.N03_003 == '札幌市'){
        commune = target[i].properties.N03_003;
      }
      else{
        commune = target[i].properties.N03_004;
      }
      target[i][key_name] = output_dic[commune];
    }
  }

})();
