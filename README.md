# Clustering Hokkaido Tourism

## 概要

北海道各市町村の観光客統計データの1年分の月次推移を12次元ベクトルデータに見立てて、市町村をクラスタリングする。
統計データは[北海道観光入込客数調査報告書](http://www.pref.hokkaido.lg.jp/kz/kkd/irikomi.htm)の2012年度版(2012年4月〜2013年3月)より抜粋した。

## クラスタリング方法

`clustering.py`でクラスタリングする。
 * 入力 : `data/tourism_stat_2012.csv`
 * 出力 : `data/cluster_external_2012.csv`

## 可視化方法

サーバを立てた上で`index.html`を閲覧する。

## 参考文献
 * K-means : [scikit-learn による最も基本的なクラスタリング分析](http://qiita.com/ynakayama/items/1223b6844a1a044e2e3b)
 * 結果の可視化 : [GeoJSONを軽くするだけじゃない！　TopoJSONクライアント TIPS](http://shimz.me/blog/d3-js/4131)
