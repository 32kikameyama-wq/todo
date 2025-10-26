#!/bin/bash

# 開発サーバー起動スクリプト

echo "========================================"
echo "ATD - ARS TODO Management System"
echo "開発サーバー起動中..."
echo "========================================"

# 仮想環境の有効化
if [ -d "venv" ]; then
    echo "仮想環境を有効化中..."
    source venv/bin/activate
else
    echo "エラー: 仮想環境が見つかりません"
    exit 1
fi

# サーバーの起動
echo ""
echo "サーバー起動オプション:"
echo "1) Flaskサーバー (API機能付き) - http://localhost:5000"
echo "2) Python HTTPサーバー - http://localhost:8000"
echo ""
read -p "選択してください (1 または 2): " choice

case $choice in
    1)
        echo "Flaskサーバーを起動しています..."
        python app.py
        ;;
    2)
        echo "Python HTTPサーバーを起動しています..."
        cd atd-system
        python3 -m http.server 8000
        ;;
    *)
        echo "無効な選択です"
        exit 1
        ;;
esac
