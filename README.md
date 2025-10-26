# ATD - ARS TODO Management System

## 📋 概要

ATD（ARS TODO）は、個人とチームの生産性向上を目的としたタスク管理システムです。
Chrome拡張機能とWebアプリケーションを組み合わせた包括的なソリューションを提供します。

## ✨ 主な機能

### 個人タスク管理
- ✅ フォーカス3件制限による優先度管理
- 🎯 ドラッグ&ドロップによる優先順位変更
- ⏱️ タイマー機能による時間計測
- 🔥 ストリーク（連続達成）の可視化
- 🗺️ マインドマップ連携によるタスク細分化

### チーム管理
- 👥 チームKPIダッシュボード
- 📊 メンバー別パフォーマンス分析
- 📝 タスク割り当てと進捗管理
- 🔔 リアルタイム通知システム

### マインドマップ
- 🎯 目的→KPI→アクションの構造化
- ✨ ノードからタスクの自動生成
- 📐 工程分解による階層管理

## 🚀 クイックスタート

### 1. 前提条件

- Python 3.9以上
- git

### 2. インストール

```bash
# リポジトリのクローン
git clone https://github.com/32kikameyama-wq/todo.git
cd todo

# 仮想環境の作成と有効化
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

# 依存パッケージのインストール
pip install -r requirements.txt
```

### 3. サーバーの起動

#### 方法1: 起動スクリプトを使用（推奨）

```bash
./start_server.sh
```

#### 方法2: 直接起動

```bash
# Flaskサーバー（API機能付き）
python app.py

# または Python HTTPサーバー（シンプル）
cd atd-system
python3 -m http.server 8000
```

### 4. アプリケーションにアクセス

- **Flaskサーバー**: http://localhost:5000
- **HTTPサーバー**: http://localhost:8000

## 📂 プロジェクト構造

```
├── atd-system/              # メインアプリケーション
│   ├── index.html           # メインHTML
│   ├── src/                 # ソースコード
│   │   ├── styles/          # CSSファイル
│   │   ├── components/      # コンポーネント
│   │   ├── pages/           # ページ別JS
│   │   └── utils/           # ユーティリティ
│   ├── config/              # 設定ファイル
│   └── public/              # 静的ファイル
├── api/                     # Python API
│   ├── __init__.py
│   └── routes.py
├── examples/                # サンプルコード
│   ├── html_example.html
│   ├── example.css
│   └── example.js
├── app.py                   # Flaskアプリ
├── requirements.txt         # Python依存関係
├── start_server.sh          # サーバー起動スクリプト
└── README.md                # このファイル
```

## 🛠️ 技術スタック

### フロントエンド
- **HTML5**: マークアップ
- **CSS3**: スタイリング（レスポンシブ対応）
- **JavaScript (ES6+)**: インタラクティブ機能
- **Chart.js**: グラフ表示
- **Font Awesome**: アイコン

### バックエンド
- **Python 3.9+**: サーバーサイド
- **Flask**: Webフレームワーク
- **Flask-CORS**: CORS対応
- **Firebase**: 認証・データベース

### 開発ツール
- **Black**: Pythonコードフォーマッター
- **Flake8**: Pythonリンター
- **Pylint**: Pythonコード解析

## 📚 詳細なセットアップ

詳細な開発環境セットアップについては、[DEV_SETUP.md](DEV_SETUP.md) をご覧ください。

## 🔌 API エンドポイント

### ヘルスチェック
```
GET /api/health
```

### バージョン情報
```
GET /api/version
```

### タスク管理（実装予定）
```
GET    /api/tasks       # タスク一覧取得
POST   /api/tasks       # タスク作成
PUT    /api/tasks/:id   # タスク更新
DELETE /api/tasks/:id   # タスク削除
```

## 🎨 カラーパレット

- **プライマリ**: #008b8b (Dark Cyan)
- **セカンダリ**: #f8f9fa (Light Gray)
- **アクセント**: #ff6b35 (Orange)

## 📝 ライセンス

MIT License

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します。

## 📞 サポート

質問やサポートが必要な場合は、GitHubのIssuesページをご利用ください。

## 🔗 関連リンク

- [GitHub リポジトリ](https://github.com/32kikameyama-wq/todo)
- [開発環境セットアップ](DEV_SETUP.md)
- [Firebase Console](https://console.firebase.google.com/)
