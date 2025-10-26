# 開発環境セットアップガイド

このドキュメントでは、ATDシステムの開発環境を整える方法を説明します。

## 必要な環境

- **Python 3.9以上**
- **Node.js 16以上** (オプション)
- **git**

## セットアップ手順

### 1. 仮想環境の作成と有効化

```bash
# 仮想環境の作成
python3 -m venv venv

# 仮想環境の有効化
# macOS/Linux:
source venv/bin/activate

# Windows:
# venv\Scripts\activate
```

### 2. 依存パッケージのインストール

```bash
# Pythonパッケージのインストール
pip install -r requirements.txt

# Node.jsパッケージのインストール（オプション）
cd atd-system
npm install
```

### 3. サーバーの起動

#### Python HTTPサーバー（シンプル）

```bash
# atd-systemディレクトリで実行
cd atd-system
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` にアクセス

#### Flaskサーバー（API機能付き）

```bash
# プロジェクトルートで実行
python app.py
```

ブラウザで `http://localhost:5001` にアクセス

### 4. サンプルコードの実行

```bash
# サンプルHTML/CSS/JavaScript
# ブラウザで examples/html_example.html を開く
```

## 開発ツール

### コードフォーマッター

```bash
# Pythonコードのフォーマット
black .

# JavaScriptコードのフォーマット
# Prettierを使用（インストール済みの場合）
npx prettier --write .
```

### リンター

```bash
# Pythonコードのチェック
flake8 .
pylint .

# JavaScriptコードのチェック
# ESLintを使用（インストール済みの場合）
npx eslint .
```

## プロジェクト構造

```
プロジェクトルート/
├── atd-system/           # メインアプリケーション
│   ├── index.html        # メインHTML
│   ├── src/              # ソースコード
│   │   ├── styles/       # CSSファイル
│   │   ├── components/   # コンポーネント
│   │   ├── pages/        # ページ別JS
│   │   └── utils/        # ユーティリティ
│   ├── config/           # 設定ファイル
│   └── public/           # 静的ファイル
├── api/                  # Python API
│   ├── __init__.py
│   └── routes.py
├── examples/             # サンプルコード
│   ├── html_example.html
│   ├── example.css
│   └── example.js
├── venv/                 # Python仮想環境
├── app.py                # Flaskアプリ
├── requirements.txt      # Python依存関係
├── .gitignore            # Git除外設定
└── DEV_SETUP.md          # このファイル
```

## 使用可能な技術スタック

### フロントエンド
- **HTML5**: マークアップ
- **CSS3**: スタイリング（カスタム、レスポンシブ対応）
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
- **Prettier**: JavaScriptコードフォーマッター（オプション）
- **ESLint**: JavaScriptリンター（オプション）

## APIエンドポイント

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

### チーム管理（実装予定）
```
GET /api/teams          # チーム一覧取得
```

### 統計情報（実装予定）
```
GET /api/stats          # 統計情報取得
```

## トラブルシューティング

### ポートが既に使用されている場合

```bash
# 別のポートで起動
python3 -m http.server 8080
# または
PORT=8080 python app.py

### ポート5000が使用中の場合（macOS）

macOSではポート5000がAirPlay Receiverで使用されています。以下の方法で解決できます：

1. **システム設定でAirPlayを無効化**:
   - システム設定 > 一般 > AirDropとHandoff
   - AirPlay Receiverをオフにする

2. **または別のポートを使用**:
   - デフォルトでポート5001を使用するように変更済み
```

### 仮想環境が認識されない

```bash
# 仮想環境を再作成
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Firebase設定エラー

`atd-system/config/firebase-config.js` に正しいFirebase設定を入力してください。

## 次のステップ

1. サンプルコードを試す: `examples/html_example.html` を開く
2. メインアプリケーションを使う: `http://localhost:8000` にアクセス
3. APIを試す: `http://localhost:5000/api/health` にアクセス

## 参考リソース

- [Python公式ドキュメント](https://docs.python.org/ja/)
- [Flask公式ドキュメント](https://flask.palletsprojects.com/)
- [JavaScript MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript)
- [HTML/CSS MDN](https://developer.mozilla.org/ja/docs/Web)
