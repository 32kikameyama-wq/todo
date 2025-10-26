# ATD - ARS TODO Management System

## 概要
ATD（ARS TODO）は、Chrome拡張機能とWebアプリケーションを組み合わせたタスク管理システムです。
個人とチームの生産性向上を目的とした包括的なタスク管理ソリューションを提供します。

## 主な機能

### 個人タスク管理
- フォーカス3件制限による優先度管理
- ドラッグ&ドロップによる優先順位変更
- タイマー機能による時間計測
- ストリーク（連続達成）の可視化
- マインドマップ連携によるタスク細分化

### チーム管理
- チームKPIダッシュボード
- メンバー別パフォーマンス分析
- タスク割り当てと進捗管理
- リアルタイム通知システム

### マインドマップ
- 目的→KPI→アクションの構造化
- ノードからタスクの自動生成
- 工程分解による階層管理

## 技術スタック
- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **UI フレームワーク**: カスタムCSS（AddNeSSスタイル）
- **データベース**: Firebase Firestore
- **認証**: Firebase Authentication
- **チャート**: Chart.js
- **アイコン**: Font Awesome

## カラーパレット
- **プライマリ**: #008b8b (Dark Cyan)
- **セカンダリ**: #f8f9fa (Light Gray)
- **アクセント**: #ff6b35 (Orange)

## セットアップ

### 1. プロジェクトのクローン
```bash
git clone <repository-url>
cd atd-system
```

### 2. ローカルサーバーの起動
```bash
# Python 3を使用
python3 -m http.server 8000

# または npm scriptsを使用
npm start
```

### 3. ブラウザでアクセス
```
http://localhost:8000
```

## Firebase設定

### 1. Firebase プロジェクトの作成
1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. Authentication と Firestore を有効化

### 2. 設定ファイルの更新
`config/firebase-config.js` を編集して、実際のFirebase設定を入力：

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

## 使用方法

### ログイン
- Googleアカウントでのログイン
- ゲストログイン（匿名）

### ダッシュボード
- 個人KPIの表示
- フォーカスタスクの管理
- 進捗グラフの確認

### タスク管理
- タスクの追加・編集・削除
- 優先度の設定
- タイマーによる時間計測
- ドラッグ&ドロップによる並び替え

### チーム管理
- チームの作成・参加
- メンバーの招待・管理
- チームKPIの確認
- タスクの割り当て

### マインドマップ
- ノードの追加・編集
- 目的→KPI→アクションの構造化
- タスクの自動生成

## 開発

### プロジェクト構造
```
atd-system/
├── index.html              # メインHTML
├── src/
│   ├── styles/            # CSSファイル
│   │   ├── main.css
│   │   ├── task.css
│   │   └── team.css
│   ├── components/        # コンポーネント
│   ├── pages/            # ページ別JS
│   └── utils/            # ユーティリティ
├── config/               # 設定ファイル
├── public/               # 静的ファイル
└── package.json
```

### カスタマイズ
- カラーテーマの変更: `src/styles/main.css` の `:root` セクション
- 機能の追加: `src/app.js` の `ATDApp` クラス
- スタイルの調整: 各CSSファイル

## ライセンス
MIT License

## 貢献
プルリクエストやイシューの報告を歓迎します。

## サポート
質問やサポートが必要な場合は、GitHubのIssuesページをご利用ください。

