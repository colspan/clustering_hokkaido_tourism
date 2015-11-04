(function() {

  // 外部ファイル定義
  var csv_files = [];
  var json_files = [];
  var tourism_stat_files = [
    {file:"data/tourism_stat_2012.csv", label:'stat_2012'},
    {file:"data/cluster_result.csv", label:'cluster_external_2012'}
  ];
  csv_files = csv_files.concat(tourism_stat_files);
  var geodata_files = [{file:"data/hokkaido_topo.json", label:'geodata_topo'}];
  json_files = json_files.concat(geodata_files);
  var Clusters = [
    {index: 3, title:'孤高の都市 札幌'},
    {index:10, title:'孤高の都市 小樽'},
    {index: 8, title:'孤高の都市 旭川'},
    {index: 1, title:'孤高の都市 函館'},
    {index: 2, title:'あと一歩で孤高の都市 グループA'},
    {index: 6, title:'あと一歩で孤高の都市 グループB'},
    {index:11, title:'あと一歩で孤高の都市 グループC'},
    {index: 7, title:'スキーリゾート'},
    {index: 9, title:'北の国から'},
    {index: 5, title:'道の駅'},
    {index: 0, title:'観光地の狭間'},
    {index: 4, title:'秘境'}
  ];

  // UI初期化
  var g,
  width = 550,
  height = 500;
  var target_datatype = 'external';
  // 色マップ
  var colors = d3.scale.category20();
  var geodata;

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
  q.awaitAll(main);
  function main(error, data) {
    // 変数名解決
    var loaded={};
    for(var i=0;i<data.length;i++){
      loaded[q_labels[i]] = data[i];
    }
    // 初期化
    geodata = topojson.feature(loaded.geodata_topo, loaded.geodata_topo.objects.hokkaido)
    modify_data(loaded);
    generate_summary(loaded);
    generate_cluster_details(loaded);
  }

  function modify_data(loaded){
    // 札幌市を修正
    for(var i=0;i<geodata.features.length;i++){
      var commune;
      if(geodata.features[i].properties.N03_003 == '札幌市'){
        commune = geodata.features[i].properties.N03_003;
      }
      else{
        commune = geodata.features[i].properties.N03_004;
      }
      geodata.features[i].commune = commune;
    }
    // 市町村名→クラスタ番号取得
    var output_dic = {};
    var input = loaded.cluster_external_2012;
    for(var i=0;i<input.length;i++){
      output_dic[input[i].commune] = parseInt(input[i].cluster,10);
    }
    loaded['commune_to_cluster'] = output_dic;
  }

  // 描画
  function draw_heatmap(loaded, target_elem_id, target_cluster){
    var projection, path;

    // svg要素を作成し、データの受け皿となるg要素を追加している
    var map = d3.select(target_elem_id).append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('margin','0 auto')
    .style('display', 'block')
    .append('g');
    // 投影関数
    projection = d3.geo.mercator()
    .scale(4800)
    .center(d3.geo.centroid(geodata))  // データから中心点を計算
    .translate([width / 2, height / 2]);

    // Path Generator
    path = d3.geo.path().projection(projection);
    map.selectAll('path')
    .data(geodata.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr("fill", function(d){
      if(target_cluster === undefined){
        if( loaded.commune_to_cluster[d.commune] === undefined ) color = '#fff';
        else color = colors(loaded.commune_to_cluster[d.commune]);
        return color;
      }
      else{
        if( loaded.commune_to_cluster[d.commune] === target_cluster ) color = colors(loaded.commune_to_cluster[d.commune]);
        else color = '#fff';
        return color;
      }
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
  function get_elem_id(cluster_index){
    return 'cluster_'+target_datatype+'_'+cluster_index;
  }

  function generate_summary(loaded){
    draw_heatmap(loaded, '#heatmap');
    // 凡例描画
    d3.select('#legend').selectAll('a').data(Clusters)
    .enter()
    .append('a')
    .attr('class', 'list-group-item')
    .attr('href', function(d){return '#'+get_elem_id(d.index)+'_header'})
    .style('background-color', function(d){return colors(d.index)})
    .style('color','#fff')
    .text(function(d){return d.title});
  }
  function generate_cluster_details(loaded){
    //データ集計
    var root_elem_id = '#cluster_details';
    var root_elem = d3.select(root_elem_id);
    var nested_data = d3.nest()
    .key(function(d){ return d.datatype; })
    .key(function(d){ return loaded.commune_to_cluster[d.commune]; })
    .key(function(d){ return d.commune; })
    .map(loaded.stat_2012);
    var aggrigated_data = d3.nest()
    .key(function(d){ return d.datatype; })
    .key(function(d){ return loaded.commune_to_cluster[d.commune]; })
    .key(function(d){ return d.commune; })
    .rollup(function(values){ return d3.sum(values,function(d){return d.value*1000}) })
    .map(loaded.stat_2012);
    //クラスタごとにループ
    var target_data = nested_data[target_datatype];
    Clusters.forEach(function(cluster_def){
      var cluster_index = cluster_def.index;
      var cluster_title = cluster_def.title;
      var container_elem = root_elem.append('div');
      container_elem.attr('class', 'panel panel-default');
      var cluster_elem = container_elem.append('div');
      var elem_id = get_elem_id(cluster_index);
      cluster_elem.attr('id', elem_id);
      cluster_elem.attr('class', 'panel-body');
      var communes = target_data[cluster_index];
      // ヘッダ
      var title_elem = $('<div class="panel-heading" id="'+elem_id+'_header"><h2 class="panel-title">'+cluster_title+' <span class="label label-default" style="background-color:'+colors(cluster_index)+'">市町村数 : '+Object.keys(communes).length+'</span></h2></div>');
      $('#'+elem_id).before(title_elem);
      //ヒートマップ生成
      draw_heatmap(loaded, '#'+elem_id, cluster_index);
      //グラフ生成
      var plot_data = [];
      for(var commune in communes){
        var d = communes[commune];
        var values = [];
        for(var i in d){
          values.push(
            {
              x:parseInt(d[i].month.split('/')[1],10),
              y:parseFloat(d[i].value)*1000
            }
          );
        }
        plot_data.push({
          key:commune,
          values:values
        });
      }
      var chart = nv.models.lineChart().useInteractiveGuideline(true).showLegend(false);
      chart.xAxis
          .tickFormat(d3.format('d'));
      chart.yAxis
          .tickFormat(d3.format(',d'));
      var chart_elem = cluster_elem.append('svg')
          .attr('height','300px');
      chart_elem.datum(plot_data)
          .transition().duration(500)
          .call(chart);
      nv.utils.windowResize(chart.update);

      // 内訳表
      var comma_formatter = d3.format(",d");
      var target_columns = [
        /*{
          title: '振興局',
          field: 'commune',
          formatter: function(v,r,i){
            return _this.consts.PROMOTION_BUREAU_DIC[v];
          },
          sorter: function(a,b){
            var dic = _this.consts.PROMOTION_BUREAU_DIC;
            return dic[a].toString() > dic[b].toString() ? 1 : -1;
          },
          sortable :true
        },*/
        {
          field: 'commune',
          title: '市町村名'
        },
        {
          field: 'external',
          title: '道外',
          align: 'right',
          formatter: comma_formatter,
          sortable: true
        },
        {
          field: 'local',
          title: '道内',
          align: 'right',
          formatter: comma_formatter,
          sortable: true
        },
        {
          field: 'day_trip',
          title: '日帰り',
          align: 'right',
          formatter: comma_formatter,
          sortable: true
        },
        {
          field: 'stay',
          title: '宿泊(国内)',
          align: 'right',
          formatter: comma_formatter,
          sortable: true
        },
        {
          field: 'sum',
          title: '観光客合計',
          formatter: comma_formatter,
          align: 'right',
          sortable: true
        },
        {
          field: 'length_stay',
          title: '宿泊延日数(国内)',
          align: 'right',
          formatter: comma_formatter,
          sortable: true
        }
      ];
      var target_types = ['external','local','day_trip','stay','length_stay','sum'];

      var table_data = [];
      for(var commune in communes){
        var record = {};
        record.commune = commune;
        target_types.forEach(function(target_type){
          record[target_type] = aggrigated_data[target_type][cluster_index][commune];
        });
        table_data.push(record);
      }
      var data = table_data.sort(function(a, b) {
        return d3.descending(a[target_datatype], b[target_datatype]);
      });
      var table_elem = $('<table>');
      table_elem.appendTo($('#'+elem_id));
      table_elem.bootstrapTable({
        height: 350,
        striped: false,
        pagination: false,
        showColumns: true,
        minimumCountColumns: 2,
        columns: target_columns,
        data: data
      });
    });
  }
})();
