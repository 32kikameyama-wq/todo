// ビューマネージャー - 個人/チームビューの切り替えを管理
class ViewManager {
    constructor() {
        this.currentView = 'personal'; // 'personal' or 'team'
        this.listeners = [];
    }
    
    // ビューの切り替え
    switchView(viewType) {
        if (!['personal', 'team'].includes(viewType)) {
            console.error('無効なビュータイプ:', viewType);
            return;
        }
        
        const previousView = this.currentView;
        this.currentView = viewType;
        
        console.log(`🔄 ビュー切り替え: ${previousView} → ${viewType}`);
        
        // UIの更新
        this.updateUI();
        
        // リスナーに通知
        this.notifyListeners(viewType, previousView);
        
        return viewType;
    }
    
    // 現在のビューを取得
    getCurrentView() {
        return this.currentView;
    }
    
    // 個人ビューかどうか
    isPersonalView() {
        return this.currentView === 'personal';
    }
    
    // チームビューかどうか
    isTeamView() {
        return this.currentView === 'team';
    }
    
    // UIの更新
    updateUI() {
        // タブの更新
        this.updateTabs();
        
        // ビューコンテンツの表示切り替え
        this.updateViewContent();
        
        // ナビゲーションメニューの更新
        this.updateNavigation();
    }
    
    // タブの更新
    updateTabs() {
        const personalTab = document.getElementById('personal-view-btn');
        const teamTab = document.getElementById('team-view-btn');
        
        if (personalTab && teamTab) {
            if (this.currentView === 'personal') {
                personalTab.classList.add('active');
                teamTab.classList.remove('active');
            } else {
                personalTab.classList.remove('active');
                teamTab.classList.add('active');
            }
        }
    }
    
    // ビューコンテンツの表示切り替え
    updateViewContent() {
        const personalView = document.getElementById('personal-dashboard');
        const teamView = document.getElementById('team-dashboard');
        
        if (personalView && teamView) {
            if (this.currentView === 'personal') {
                personalView.classList.remove('hidden');
                teamView.classList.add('hidden');
            } else {
                personalView.classList.add('hidden');
                teamView.classList.remove('hidden');
            }
        }
        
        // ページコンテンツの切り替え（ページ単位の場合）
        this.updatePageContent();
    }
    
    // ページコンテンツの切り替え
    updatePageContent() {
        // 各ページのビュー切り替え対応要素を更新
        const viewElements = document.querySelectorAll('[data-view]');
        viewElements.forEach(element => {
            const elementView = element.getAttribute('data-view');
            if (elementView === this.currentView) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        });
    }
    
    // ナビゲーションメニューの更新
    updateNavigation() {
        // チーム専用メニューの表示/非表示
        const teamOnlyMenus = document.querySelectorAll('[data-team-only]');
        teamOnlyMenus.forEach(menu => {
            if (this.currentView === 'team') {
                menu.style.display = '';
            } else {
                menu.style.display = 'none';
            }
        });
    }
    
    // リスナーの追加
    addListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }
    
    // リスナーの削除
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    
    // リスナーに通知
    notifyListeners(newView, previousView) {
        this.listeners.forEach(callback => {
            try {
                callback(newView, previousView);
            } catch (error) {
                console.error('ビュー変更リスナーエラー:', error);
            }
        });
    }
    
    // 初期化
    initialize() {
        console.log('🎨 ビューマネージャーを初期化中...');
        
        // タブのイベントリスナーを設定
        this.setupTabListeners();
        
        // 初期ビューの設定
        this.switchView(this.currentView);
        
        console.log('✅ ビューマネージャーの初期化完了');
    }
    
    // タブのイベントリスナーを設定
    setupTabListeners() {
        const personalBtn = document.getElementById('personal-view-btn');
        const teamBtn = document.getElementById('team-view-btn');
        
        if (personalBtn) {
            personalBtn.addEventListener('click', () => {
                this.switchView('personal');
            });
        }
        
        if (teamBtn) {
            teamBtn.addEventListener('click', () => {
                this.switchView('team');
            });
        }
    }
    
    // データの取得（現在のビューに応じて）
    getDataForCurrentView(data) {
        if (this.currentView === 'personal') {
            return data.personal || [];
        } else {
            return data.team || [];
        }
    }
    
    // KPIの更新（ビューに応じて）
    async updateKPI() {
        if (this.currentView === 'personal') {
            return await this.updatePersonalKPI();
        } else {
            return await this.updateTeamKPI();
        }
    }
    
    // 個人KPIの更新
    async updatePersonalKPI() {
        // 個人用のKPI更新ロジック
        console.log('📊 個人KPIを更新中...');
    }
    
    // チームKPIの更新
    async updateTeamKPI() {
        // チーム用のKPI更新ロジック
        console.log('📊 チームKPIを更新中...');
    }
}
