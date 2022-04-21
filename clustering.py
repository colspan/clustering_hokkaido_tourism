#!/usr/bin/python
# -*- coding: utf-8 -*-

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans


# 自治体名一覧
## http://www.pref.hokkaido.lg.jp/kz/kkd/irikomi.htm より作成
commune_list = list(pd.read_csv("data/commune_list.csv")["commune"])

# 統計データ
## http://www.pref.hokkaido.lg.jp/kz/kkd/irikomi.htm より抜粋
tourism_stat = pd.read_csv("data/tourism_stat_2012.csv")

# 各月の合計値を抽出
## データの種類
## "入込総数":'sum',
## "内道外客":'external',
## "内道内客":'local',
## "内日帰客":'day_trip',
## "内宿泊客":'stay',
## "宿泊客延数":'length_stay'
clustering_target = "external"
stat_sum_raw = tourism_stat[tourism_stat["datatype"].isin([clustering_target])]

# 各自治体のデータを抽出
stat_sum_list = []
for commune in commune_list:
    stat_sum_list.append(
        list(stat_sum_raw[stat_sum_raw["commune"].isin([commune])]["value"])
    )

# KMeans
features = np.array(stat_sum_list)

# K-means クラスタリングをおこなう
kmeans_model = KMeans(n_clusters=12, random_state=10).fit(features)

# 分類先となったラベルを取得する
labels = kmeans_model.labels_

with open("data/cluster_result.csv", "w") as out_file:
    out_file.write("cluster,commune\n")
    for commune, label in zip(commune_list, labels):
        out_file.write(",".join([str(label), str(commune), "\n"]))
