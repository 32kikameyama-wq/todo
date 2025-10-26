#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ATD - ARS TODO Management System
Webアプリケーションメインファイル
"""

from flask import Flask, render_template, send_from_directory, jsonify
from flask_cors import CORS
import os

# Flaskアプリケーションの初期化
app = Flask(__name__, 
            static_folder='atd-system/public',
            template_folder='atd-system')
CORS(app)

@app.route('/')
def index():
    """メインページのルーティング"""
    return send_from_directory('atd-system', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """静的ファイルの提供"""
    return send_from_directory('atd-system', filename)

@app.route('/api/health')
def health_check():
    """ヘルスチェック用APIエンドポイント"""
    return jsonify({
        'status': 'healthy',
        'message': 'ATDシステムは正常に稼働中です'
    })

@app.route('/api/version')
def version():
    """バージョン情報API"""
    return jsonify({
        'version': '2.0.0',
        'name': 'ATD - ARS TODO Management System'
    })

if __name__ == '__main__':
    # 開発サーバーの起動
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    print(f"""
    ========================================
    ATD - ARS TODO Management System
    ========================================
    サーバー起動中...
    URL: http://localhost:{port}
    開発モード: {'ON' if debug else 'OFF'}
    ========================================
    """)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        threaded=True
    )
