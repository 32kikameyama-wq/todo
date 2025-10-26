// ATD System - Main Application
class ATDApp {
    constructor() {
        this.currentUser = null;
        this.currentTeam = null;
        this.personalTasks = []; // 個人のタスク
        this.teamTasks = []; // チームのタスク
        this.teamMembers = [];
        this.isInitialized = false;
        this.currentViewMode = 'personal'; // 'personal' or 'team'
        this.notifications = [];
        this.notificationCheckInterval = null;
        this.userData = {}; // ユーザーごとのデータを保存
        this.memberRegistrationPassword = ''; // メンバー登録パスワード
        this.registeredMembers = []; // 登録済みメンバー一覧
        this.adminPassword = '1234'; // 管理画面パスワード
        this.activeTimers = new Set(); // アクティブなタイマーを追跡
        this.activeIntervals = new Set(); // アクティブなインターバルを追跡
        this.storageLock = false; // localStorage操作のロック
        this.storageQueue = []; // localStorage操作のキュー
        
        // タスクマネージャーを初期化
        this.taskManager = new TaskManager();
        
        // ビューマネージャーを初期化
        this.viewManager = new ViewManager();
        
        this.init();
    }
    
    // アプリケーションの初期化
    init() {
        try {
            console.log('🚀 ATDアプリケーションを初期化中...');
            
            // 認証マネージャーを初期化
            this.authManager = new AuthManager();
            
            // 認証状態の監視を設定
            this.authManager.addAuthStateListener((user) => {
                this.onUserStateChange(user);
            });
            
            // 既存のセッションを復元
            this.restoreSession();
            
            // ビューマネージャーを初期化
            this.viewManager.initialize();
            
            // ビューの変更リスナーを設定
            this.viewManager.addListener((newView, previousView) => {
                this.onViewChange(newView, previousView);
            });
            
            // UIイベントリスナーを設定
            this.setupEventListeners();
            
            // ページ離脱時のクリーンアップを設定
            this.setupPageUnloadCleanup();
            
            // ローディング画面を非表示にしてログイン画面を表示
            this.hideLoadingScreen();
            
            console.log('✅ ATDアプリケーションの初期化完了');
        } catch (error) {
            console.error('❌ ATDアプリケーション初期化エラー:', error);
            this.showErrorScreen('アプリケーションの初期化に失敗しました: ' + error.message);
        }
    }
    
    // ローディング画面を非表示にする
    hideLoadingScreen() {
        try {
            const loadingScreen = document.getElementById('loading-screen');
            const loginScreen = document.getElementById('login-screen');
            
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
            
            if (loginScreen) {
                loginScreen.classList.remove('hidden');
            }
            
            console.log('✅ ローディング画面を非表示にしました');
        } catch (error) {
            console.error('❌ ローディング画面非表示エラー:', error);
        }
    }
    
    // エラー画面を表示
    showErrorScreen(message) {
        try {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.innerHTML = `
                    <div style="text-align: center; color: white;">
                        <h2>⚠️ エラーが発生しました</h2>
                        <p>${message}</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px; background: #ff6b35; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            ページを再読み込み
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ エラー画面表示エラー:', error);
        }
    }
    
    // ユーザー状態変更時の処理
    onUserStateChange(user) {
        console.log('👤 ユーザー状態変更:', user ? user.displayName : 'ログアウト');
        
        this.currentUser = user;
        
        if (user) {
            // ユーザーログイン時の処理
            this.onUserLogin(user);
        } else {
            // ユーザーログアウト時の処理
            this.onUserLogout();
        }
        
        // UIを更新
        this.updateUI();
    }
    
    // ビュー変更時の処理
    onViewChange(newView, previousView) {
        console.log(`🔄 ビュー変更: ${previousView} → ${newView}`);
        
        // 現在のビューモードを更新
        this.currentViewMode = newView;
        
        // ビューに応じたデータを再読み込み
        this.refreshCurrentView();
        
        // ページコンテンツを更新
        this.updatePageContent();
    }
    
    // 現在のビューを更新
    async refreshCurrentView() {
        console.log(`📊 ビュー更新: ${this.currentViewMode}`);
        
        // ダッシュボードページの場合
        if (document.getElementById('dashboard-page')?.classList.contains('active')) {
            if (window.dashboardPage) {
                await window.dashboardPage.updateView(this.currentViewMode);
            }
        }
        
        // タスクページの場合
        if (document.getElementById('tasks-page')?.classList.contains('active')) {
            this.updateTaskDisplay();
        }
        
        // チームページの場合
        if (document.getElementById('team-page')?.classList.contains('active')) {
            if (window.teamPage) {
                await window.teamPage.updateView(this.currentViewMode);
            }
        }
    }
    
    // ユーザーログイン時の処理
    onUserLogin(user) {
        console.log('🔐 ユーザーログイン処理:', user.displayName);
        console.log('🔐 ユーザーID:', user.uid);
        
        // 登録済みユーザー情報から最新のプロフィールを読み込む
        this.loadUserProfile(user);
        
        // タスクマネージャーにユーザー情報を設定
        this.taskManager.setCurrentUser(this.currentUser);
        
        // タスクを読み込み
        this.taskManager.loadTasks().then(() => {
            this.personalTasks = this.taskManager.getAllTasks();
            console.log(`📋 個人タスク読み込み完了: ${this.personalTasks.length}件`);
            
            // 各タスクのユーザーIDを確認
            this.personalTasks.forEach((task, index) => {
                console.log(`📝 個人タスク${index + 1}: ${task.title} (userId: ${task.userId})`);
            });
            
            // データ整合性チェックを実行
            this.checkDataIntegrity();
            
            this.updateTaskDisplay();
        });
        
        // メインアプリを表示
        this.showMainApp();
    }
    
    // ユーザープロフィールを読み込む（強化版）
    loadUserProfile(user) {
        try {
            console.log('🔍 プロフィール読み込み開始:', user.uid);
            
            // 登録済みメンバーリストから最新情報を取得
            const data = JSON.parse(localStorage.getItem('atd_registered_members') || '{"registeredMembers": []}');
            const members = data.registeredMembers || [];
            console.log('📋 登録済みメンバー数:', members.length);
            
            const userProfile = members.find(m => m.id === user.uid);
            console.log('👤 見つかったプロフィール:', userProfile);
            
            if (userProfile) {
                console.log('👤 保存されたプロフィールを読み込み:', userProfile.displayName || userProfile.name);
                
                // currentUserを更新（プロフィール情報を優先）
                this.currentUser = {
                    ...user,
                    displayName: userProfile.displayName || userProfile.name || user.displayName,
                    bio: userProfile.bio || '',
                    avatar: userProfile.avatar || '',
                    avatarPosition: userProfile.avatarPosition || { x: 50, y: 50, scale: 100 },
                    email: userProfile.email || user.email // メールアドレスも更新
                };
                
                console.log('✅ プロフィール情報で更新されたユーザー情報:', {
                    uid: this.currentUser.uid,
                    displayName: this.currentUser.displayName,
                    email: this.currentUser.email,
                    bio: this.currentUser.bio
                });
            } else {
                console.log('⚠️ プロフィール情報が見つからないため、デフォルト情報を使用');
                this.currentUser = user;
            }
            
            // UIを即座に更新
            this.updateUI();
            
        } catch (error) {
            console.error('❌ プロフィール読み込みエラー:', error);
            this.currentUser = user;
        }
    }
    
    // ユーザーログアウト時の処理
    onUserLogout() {
        console.log('🔐 ユーザーログアウト処理');
        
        // 通知システムを停止
        this.stopNotificationSystem();
        
        // 全てのタイマーとインターバルをクリア
        this.clearAllTimers();
        
        // データをクリア
        this.personalTasks = [];
        this.teamTasks = [];
        this.currentUser = null;
        
        // ログイン画面を表示
        this.showLoginScreen();
    }
    
    // セッションの復元
    restoreSession() {
        const session = localStorage.getItem('atd_current_session');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                const user = sessionData.user;
                
                console.log('🔄 セッションを復元:', user.displayName);
                
                // 登録済みメンバーリストから最新のプロフィール情報を読み込む
                this.loadUserProfile(user);
                
                // タスクマネージャーにユーザー情報を設定
                if (this.taskManager) {
                    this.taskManager.setCurrentUser(this.currentUser);
                }
                
                // プロフィール情報が正しく読み込まれたか確認
                console.log('✅ セッション復元完了:', {
                    uid: this.currentUser.uid,
                    displayName: this.currentUser.displayName,
                    email: this.currentUser.email,
                    bio: this.currentUser.bio,
                    profileLoaded: !!this.currentUser.displayName
                });
                
            } catch (error) {
                console.error('❌ セッション復元エラー:', error);
                localStorage.removeItem('atd_current_session');
            }
        }
    }
    
    // イベントリスナーを安全に追加するヘルパーメソッド
    safeAddEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ 要素が見つかりません: ${elementId}`);
            return false;
        }
        
        // 既存のイベントリスナーを削除
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        
        // 新しいイベントリスナーを追加
        newElement.addEventListener(event, handler);
        console.log(`✅ イベントリスナーを安全に追加: ${elementId}`);
        return true;
    }
    
    // 複数のイベントリスナーを一括で安全に追加
    safeAddMultipleEventListeners(eventConfigs) {
        eventConfigs.forEach(config => {
            this.safeAddEventListener(config.id, config.event, config.handler);
        });
    }
    
    // タイマー管理メソッド
    addTimer(timerId) {
        this.activeTimers.add(timerId);
        console.log(`⏰ タイマー追加: ${timerId}`);
    }
    
    removeTimer(timerId) {
        this.activeTimers.delete(timerId);
        console.log(`⏰ タイマー削除: ${timerId}`);
    }
    
    addInterval(intervalId) {
        this.activeIntervals.add(intervalId);
        console.log(`🔄 インターバル追加: ${intervalId}`);
    }
    
    removeInterval(intervalId) {
        this.activeIntervals.delete(intervalId);
        console.log(`🔄 インターバル削除: ${intervalId}`);
    }
    
    // 全てのタイマーとインターバルをクリア
    clearAllTimers() {
        console.log('🧹 全てのタイマーとインターバルをクリア中...');
        
        // タイマーをクリア
        this.activeTimers.forEach(timerId => {
            clearTimeout(timerId);
            console.log(`⏰ タイマークリア: ${timerId}`);
        });
        this.activeTimers.clear();
        
        // インターバルをクリア
        this.activeIntervals.forEach(intervalId => {
            clearInterval(intervalId);
            console.log(`🔄 インターバルクリア: ${intervalId}`);
        });
        this.activeIntervals.clear();
        
        // 通知システムのインターバルもクリア
        if (this.notificationCheckInterval) {
            clearInterval(this.notificationCheckInterval);
            this.notificationCheckInterval = null;
            console.log('🔔 通知システムインターバルクリア');
        }
        
        console.log('✅ 全てのタイマーとインターバルをクリア完了');
    }
    
    // 安全なlocalStorage操作
    async safeStorageOperation(operation) {
        return new Promise((resolve, reject) => {
            const executeOperation = async () => {
                if (this.storageLock) {
                    // ロックされている場合はキューに追加
                    this.storageQueue.push({ operation, resolve, reject });
                    return;
                }
                
                this.storageLock = true;
                
                try {
                    const result = await operation();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.storageLock = false;
                    
                    // キューに待機中の操作がある場合は実行
                    if (this.storageQueue.length > 0) {
                        const nextOperation = this.storageQueue.shift();
                        setTimeout(() => executeOperation.call(this), 0);
                    }
                }
            };
            
            executeOperation();
        });
    }
    
    // 安全なlocalStorage保存
    async safeSetItem(key, value) {
        return this.safeStorageOperation(async () => {
            localStorage.setItem(key, JSON.stringify(value));
            console.log(`💾 安全に保存: ${key}`);
        });
    }
    
    // 安全なlocalStorage読み込み
    async safeGetItem(key) {
        return this.safeStorageOperation(async () => {
            const data = localStorage.getItem(key);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        });
    }
    
    // DOM要素の安全な取得
    safeGetElementById(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`⚠️ DOM要素が見つかりません: #${id}`);
            return null;
        }
        return element;
    }
    
    // DOM要素の安全な取得（複数）
    safeGetElementsBySelector(selector) {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
            console.warn(`⚠️ DOM要素が見つかりません: ${selector}`);
            return [];
        }
        return elements;
    }
    
    // DOM要素の存在チェック
    elementExists(id) {
        return document.getElementById(id) !== null;
    }
    
    // DOM要素の安全な操作
    safeElementOperation(id, operation) {
        const element = this.safeGetElementById(id);
        if (element) {
            try {
                return operation(element);
            } catch (error) {
                console.error(`❌ DOM操作エラー (${id}):`, error);
                return null;
            }
        }
        return null;
    }
    
    // DOM要素の安全な更新
    safeUpdateElement(id, updateFunction) {
        const element = this.safeGetElementById(id);
        if (element) {
            try {
                updateFunction(element);
                return true;
            } catch (error) {
                console.error(`❌ DOM更新エラー (${id}):`, error);
                return false;
            }
        }
        return false;
    }
    
    // ページ離脱時のクリーンアップ
    setupPageUnloadCleanup() {
        window.addEventListener('beforeunload', () => {
            this.clearAllTimers();
            this.stopProfileAutoSave();
        });
        
        window.addEventListener('unload', () => {
            this.clearAllTimers();
            this.stopProfileAutoSave();
        });
    }
    
    // UIイベントリスナーの設定
    setupEventListeners() {
        console.log('🎯 UIイベントリスナーを設定中...');
        
        // ログインボタン
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            console.log('✅ ログインボタンが見つかりました');
            loginBtn.addEventListener('click', () => {
                console.log('🖱️ ログインボタンがクリックされました');
                this.showLoginModal();
            });
        } else {
            console.warn('⚠️ ログインボタンが見つかりません');
        }
        
        // 新規登録ボタン
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            console.log('✅ 新規登録ボタンが見つかりました');
            registerBtn.addEventListener('click', () => {
                console.log('🖱️ 新規登録ボタンがクリックされました');
                this.showRegisterModal();
            });
        } else {
            console.warn('⚠️ 新規登録ボタンが見つかりません');
        }
        
        // テストユーザー作成ボタン
        const createTestUserBtn = document.getElementById('create-test-user-btn');
        if (createTestUserBtn) {
            createTestUserBtn.addEventListener('click', () => this.createAndLoginTestUser());
        }
        
        // 新規登録フォーム
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // ログアウトボタン
        const logoutBtn = document.querySelector('[data-action="logout"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }
    
    // テストユーザーを作成してログイン
    async createAndLoginTestUser() {
        console.log('🧪 テストユーザーを作成中...');
        
        try {
            // テストユーザーを作成
            const testUser = {
                id: 'test_user_001',
                name: 'テストユーザー',
                email: 'test@example.com',
                password: 'test123',
                role: 'member',
                status: 'active',
                createdAt: new Date().toISOString(),
                createdBy: 'system',
                profile: {
                    avatar: '',
                    displayName: 'テストユーザー',
                    bio: '',
                    preferences: {
                        theme: 'light',
                        notifications: true,
                        language: 'ja'
                    }
                }
            };
            
            const data = {
                registeredMembers: [testUser],
                memberRegistrationPassword: '',
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('atd_registered_members', JSON.stringify(data));
            console.log('✅ テストユーザーを作成しました');
            
            // 自動ログイン
            const result = await this.authManager.signInAsUser('test@example.com', 'test123');
            console.log('✅ テストユーザーでログイン成功:', result.user.displayName);
            
            alert('テストユーザーを作成してログインしました！\nメール: test@example.com\nパスワード: test123');
        } catch (error) {
            console.error('❌ テストユーザー作成エラー:', error);
            alert('テストユーザーの作成に失敗しました: ' + error.message);
        }
    }
    
    // 新規登録モーダルを表示
    showRegisterModal() {
        console.log('🎯 showRegisterModal が呼び出されました');
        this.closeModal();
        const modal = document.getElementById('register-modal');
        console.log('🔍 新規登録モーダルを探しています:', modal);
        
        if (modal) {
            console.log('✅ 新規登録モーダルが見つかりました。表示します。');
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.style.zIndex = '1000';
        } else {
            console.error('❌ 新規登録モーダルが見つかりません！');
        }
    }
    
    // 新規登録処理
    async handleRegister(event) {
        event.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        
        try {
            const result = await this.authManager.registerUser({
                name, email, password, passwordConfirm
            });
            console.log('✅ 新規登録成功:', result.user.displayName);
            this.closeModal();
        } catch (error) {
            console.error('❌ 新規登録エラー:', error.message);
            alert('新規登録に失敗しました: ' + error.message);
        }
    }
    
    // ログアウト処理
    async handleLogout() {
        try {
            await this.authManager.signOut();
            console.log('✅ ログアウト成功');
        } catch (error) {
            console.error('❌ ログアウトエラー:', error.message);
        }
    }
    
    // モーダルを閉じる
    closeModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.add('hidden'));
    }
    
    // メインアプリを表示
    showMainApp() {
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        const loadingScreen = document.getElementById('loading-screen');
        
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (loginScreen) loginScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
    }
    
    // ログイン画面を表示
    showLoginScreen() {
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        const loadingScreen = document.getElementById('loading-screen');
        
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('hidden');
    }
    
    // UIを更新
    updateUI() {
        // DOM要素が存在しない場合は何もしない
        if (!this.elementExists('login-screen')) {
            console.warn('⚠️ DOM要素がまだ読み込まれていません。updateUIをスキップします。');
            return;
        }
        
        if (this.currentUser) {
            // ユーザー名を表示
            if (!this.safeUpdateElement('user-name', (element) => {
                element.textContent = this.currentUser.displayName;
            })) {
                console.warn('⚠️ user-name要素の更新に失敗');
            }
            
            // ユーザー表示名を更新
            if (!this.safeUpdateElement('user-display-name', (element) => {
                element.textContent = this.currentUser.displayName;
            })) {
                console.warn('⚠️ user-display-name要素の更新に失敗');
            }
            
            // ユーザーメールアドレスを更新
            if (!this.safeUpdateElement('user-display-email', (element) => {
                element.textContent = this.currentUser.email || '';
            })) {
                console.warn('⚠️ user-display-email要素の更新に失敗');
            }
            
            // プロフィール編集フォームの更新
            if (!this.safeUpdateElement('profile-name', (element) => {
                element.value = this.currentUser.displayName || '';
            })) {
                console.warn('⚠️ profile-name要素の更新に失敗');
            }
            
            if (!this.safeUpdateElement('profile-email', (element) => {
                element.value = this.currentUser.email || '';
            })) {
                console.warn('⚠️ profile-email要素の更新に失敗');
            }
            
            if (!this.safeUpdateElement('current-email', (element) => {
                element.value = this.currentUser.email || '';
            })) {
                console.warn('⚠️ current-email要素の更新に失敗');
            }
        }
    }
    
    // 現在のモードに応じたタスク配列を取得
    getCurrentTasks() {
        const tasks = this.currentViewMode === 'personal' ? this.personalTasks : this.teamTasks;
        console.log(`📋 ${this.currentViewMode}モードのタスクを取得:`, tasks.length, '件');
        return tasks;
    }
    
    // 現在のモードに応じたタスク配列を設定（強化版）
    setCurrentTasks(tasks) {
        if (this.currentViewMode === 'personal') {
            this.personalTasks = [...tasks]; // 新しい配列を作成
            console.log('📝 個人タスクを更新:', this.personalTasks.length, '件');
        } else {
            this.teamTasks = [...tasks]; // 新しい配列を作成
            console.log('📝 チームタスクを更新:', this.teamTasks.length, '件');
        }
        
        // データの整合性を確認
        this.validateTaskData();
    }
    
    // ユーザーデータを読み込み（強化版）
    loadUserData() {
        if (!this.currentUser) {
            console.warn('ユーザーがログインしていないため、データを読み込めません');
            return;
        }
        
        const userId = this.currentUser.uid;
        const userDataKey = `atd_user_${userId}`;
        
        try {
            const savedData = localStorage.getItem(userDataKey);
            if (savedData) {
                const userData = JSON.parse(savedData);
                console.log('📂 ユーザーデータを読み込み:', userData);
                
                // ユーザー固有のデータを復元
                this.personalTasks = userData.personalTasks || [];
                this.teamTasks = userData.teamTasks || [];
                this.userData = userData.userData || {};
                
                // ユーザー設定を復元
                if (userData.settings) {
                    this.applyUserSettings(userData.settings);
                }
                
                console.log(`✅ ユーザー ${this.currentUser.displayName} のデータを復元完了`);
            } else {
                console.log('📂 ユーザーデータが見つからないため、新規作成します');
                this.initializeUserData();
            }
        } catch (error) {
            console.error('❌ ユーザーデータ読み込みエラー:', error);
            this.initializeUserData();
        }
    }
    
    // ユーザーデータを初期化
    initializeUserData() {
        if (!this.currentUser) return;
        
        this.personalTasks = [];
        this.teamTasks = [];
        this.userData = {
            preferences: {
                theme: 'light',
                notifications: true,
                language: 'ja'
            },
            profile: {
                avatar: '',
                bio: '',
                displayName: this.currentUser.displayName
            }
        };
        
        this.saveUserData();
    }
    
    // ユーザーデータを保存
    saveUserData() {
        if (!this.currentUser) return;
        
        const userId = this.currentUser.uid;
        const userDataKey = `atd_user_${userId}`;
        
        const userData = {
            personalTasks: this.personalTasks,
            teamTasks: this.teamTasks,
            userData: this.userData,
            settings: this.getUserSettings(),
            lastUpdated: Date.now()
        };
        
        try {
            localStorage.setItem(userDataKey, JSON.stringify(userData));
            console.log(`💾 ユーザー ${this.currentUser.displayName} のデータを保存完了`);
        } catch (error) {
            console.error('❌ ユーザーデータ保存エラー:', error);
        }
    }
    
    // ユーザー設定を取得
    getUserSettings() {
        return {
            theme: this.userData.preferences?.theme || 'light',
            notifications: this.userData.preferences?.notifications || true,
            language: this.userData.preferences?.language || 'ja'
        };
    }
    
    // ユーザー設定を適用
    applyUserSettings(settings) {
        if (settings.theme) {
            document.body.className = `theme-${settings.theme}`;
        }
        
        // その他の設定を適用
        console.log('🎨 ユーザー設定を適用:', settings);
    }
    
    // データ整合性チェック
    checkDataIntegrity() {
        console.log('🔍 データ整合性チェック開始');
        
        if (!this.currentUser) {
            console.warn('⚠️ ユーザーがログインしていないため、整合性チェックをスキップ');
            return;
        }
        
        const userId = this.currentUser.uid;
        console.log(`👤 チェック対象ユーザー: ${userId}`);
        
        // ローカルストレージの全キーをチェック
        const allKeys = Object.keys(localStorage);
        const userKeys = allKeys.filter(key => key.includes(userId));
        const otherUserKeys = allKeys.filter(key => 
            key.startsWith('atd_user_') && !key.includes(userId)
        );
        
        console.log(`🔑 ユーザー関連キー: ${userKeys.length}件`);
        console.log(`🔑 他のユーザーキー: ${otherUserKeys.length}件`);
        
        // 他のユーザーのデータが混在していないかチェック
        if (otherUserKeys.length > 0) {
            console.log('⚠️ 他のユーザーのデータが検出されました:', otherUserKeys);
        }
        
        // 現在のユーザーのタスクデータをチェック
        const userTaskKey = `atd_user_${userId}_tasks`;
        const userTasks = JSON.parse(localStorage.getItem(userTaskKey) || '[]');
        
        console.log(`📋 ユーザータスク数: ${userTasks.length}件`);
        
        // 各タスクのユーザーIDを確認
        let hasMixedData = false;
        userTasks.forEach((task, index) => {
            if (task.userId !== userId) {
                console.error(`❌ データ混在検出! タスク${index + 1}: ${task.title} - 期待: ${userId}, 実際: ${task.userId}`);
                hasMixedData = true;
            }
        });
        
        // 混在データが検出された場合は自動クリーンアップ
        if (hasMixedData) {
            console.log('🧹 混在データが検出されたため、自動クリーンアップを実行します');
            this.cleanupMixedData();
        }
        
        console.log('✅ データ整合性チェック完了');
    }
    
    // データクリーンアップ（混在データの修正）
    cleanupMixedData() {
        console.log('🧹 データクリーンアップ開始');
        
        if (!this.currentUser) {
            console.warn('⚠️ ユーザーがログインしていないため、クリーンアップをスキップ');
            return;
        }
        
        const userId = this.currentUser.uid;
        const userTaskKey = `atd_user_${userId}_tasks`;
        
        try {
            const userTasks = JSON.parse(localStorage.getItem(userTaskKey) || '[]');
            const cleanTasks = userTasks.filter(task => task.userId === userId);
            
            if (userTasks.length !== cleanTasks.length) {
                console.log(`🧹 混在データを検出: ${userTasks.length}件 → ${cleanTasks.length}件に修正`);
                localStorage.setItem(userTaskKey, JSON.stringify(cleanTasks));
                
                // タスクマネージャーを再読み込み
                this.taskManager.loadTasks().then(() => {
                    this.personalTasks = this.taskManager.getAllTasks();
                    this.updateTaskDisplay();
                });
            } else {
                console.log('✅ データは既にクリーンです');
            }
        } catch (error) {
            console.error('❌ データクリーンアップエラー:', error);
        }
        
        console.log('✅ データクリーンアップ完了');
    }
    
    // グローバルにクリーンアップ機能を公開
    globalCleanupData() {
        console.log('🌍 グローバルデータクリーンアップ開始');
        this.cleanupMixedData();
    }
    
    // タスクデータの整合性を検証（強化版）
    validateTaskData() {
        let hasErrors = false;
        
        // 個人タスクの検証
        this.personalTasks = this.personalTasks.filter(task => {
            if (!task.id || !task.title) {
                console.warn('無効な個人タスクを削除:', task);
                hasErrors = true;
                return false;
            }
            
            // 必須フィールドのデフォルト値を設定
            if (!task.status) task.status = 'pending';
            if (!task.priority) task.priority = 3;
            if (!task.timer) task.timer = { isRunning: false, elapsed: 0 };
            if (!task.createdAt) task.createdAt = Date.now();
            if (!task.updatedAt) task.updatedAt = Date.now();
            if (task.order === undefined) task.order = 0; // 順序のデフォルト値
            
            return true;
        });
        
        // チームタスクの検証
        this.teamTasks = this.teamTasks.filter(task => {
            if (!task.id || !task.title) {
                console.warn('無効なチームタスクを削除:', task);
                hasErrors = true;
                return false;
            }
            
            // 必須フィールドのデフォルト値を設定
            if (!task.status) task.status = 'pending';
            if (!task.priority) task.priority = 3;
            if (!task.timer) task.timer = { isRunning: false, elapsed: 0 };
            if (!task.createdAt) task.createdAt = Date.now();
            if (!task.updatedAt) task.updatedAt = Date.now();
            if (task.order === undefined) task.order = 0; // 順序のデフォルト値
            
            return true;
        });
        
        // 重複タスクのチェック
        const allTasks = [...this.personalTasks, ...this.teamTasks];
        const taskIds = new Set();
        const duplicateTasks = [];
        
        allTasks.forEach(task => {
            if (taskIds.has(task.id)) {
                duplicateTasks.push(task);
                hasErrors = true;
            } else {
                taskIds.add(task.id);
            }
        });
        
        if (duplicateTasks.length > 0) {
            console.warn('重複タスクを削除:', duplicateTasks);
            // 重複タスクを削除
            this.personalTasks = this.personalTasks.filter(task => !duplicateTasks.includes(task));
            this.teamTasks = this.teamTasks.filter(task => !duplicateTasks.includes(task));
        }
        
        // チームメンバーの検証
        this.teamMembers = this.teamMembers.filter(member => {
            if (!member.id || !member.name) {
                console.warn('無効なチームメンバーを削除:', member);
                hasErrors = true;
                return false;
            }
            return true;
        });
        
        if (hasErrors) {
            console.log('🔧 データ整合性の問題を修正しました');
            this.saveUserData(); // 修正したデータを保存
        }
    }
    
    // バックアップから復元
    restoreFromBackup(userId) {
        try {
            const backupKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`atd_backup_${userId}_`)) {
                    backupKeys.push(key);
                }
            }
            
            if (backupKeys.length > 0) {
                // 最新のバックアップを使用
                backupKeys.sort().reverse();
                const latestBackup = localStorage.getItem(backupKeys[0]);
                
                if (latestBackup) {
                    const data = JSON.parse(latestBackup);
                    this.personalTasks = data.personalTasks || [];
                    this.teamTasks = data.teamTasks || [];
                    this.teamMembers = data.teamMembers || [];
                    
                    console.log('🔄 バックアップから復元しました');
                    this.showNotification('データをバックアップから復元しました', 'success');
                }
            }
        } catch (error) {
            console.error('バックアップ復元エラー:', error);
        }
    }
    
    // ユーザーデータを保存（強化版）
    saveUserData() {
        if (!this.currentUser) {
            console.warn('ユーザーがログインしていないため、データを保存できません');
            return;
        }
        
        try {
            const userId = this.currentUser.uid;
            
            // データの整合性をチェック
            const validPersonalTasks = Array.isArray(this.personalTasks) ? this.personalTasks : [];
            const validTeamTasks = Array.isArray(this.teamTasks) ? this.teamTasks : [];
            const validTeamMembers = Array.isArray(this.teamMembers) ? this.teamMembers : [];
            
            const userData = {
                personalTasks: validPersonalTasks,
                teamTasks: validTeamTasks,
                teamMembers: validTeamMembers,
                currentUser: { ...this.currentUser }, // 現在のユーザー情報をコピー
                currentTeam: this.currentTeam,
                lastSaved: Date.now(),
                version: '2.8.5' // データバージョン管理
            };
            
            // メインデータを保存
            this.userData[userId] = userData;
            const userDataKey = `atd_user_${userId}`;
            localStorage.setItem(userDataKey, JSON.stringify(userData));
            
            // 現在のユーザー情報も別途保存（ユーザー固有キー）
            localStorage.setItem(`atd_current_user_${userId}`, JSON.stringify(this.currentUser));
            
            // 最後のログイン時刻を更新（ユーザー固有キー）
            localStorage.setItem(`atd_last_login_${userId}`, Date.now().toString());
            
            // セッションIDを生成・保存
            if (!this.sessionId) {
                this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            localStorage.setItem(`atd_session_${userId}`, this.sessionId);
            
            // バックアップも作成（最新の5つまで保持）
            this.createDataBackup(userId, userData);
            
            console.log('✅ ユーザーデータを保存しました:', {
                userId: userId,
                personalTasks: validPersonalTasks.length,
                teamTasks: validTeamTasks.length,
                timestamp: new Date().toLocaleString()
            });
        } catch (error) {
            console.error('❌ データ保存エラー:', error);
            this.showNotification('データの保存に失敗しました', 'error');
        }
    }
    
    // データバックアップを作成
    createDataBackup(userId, userData) {
        try {
            const backupKey = `atd_backup_${userId}_${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify(userData));
            
            // 古いバックアップを削除（最新5つのみ保持）
            const backupKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`atd_backup_${userId}_`)) {
                    backupKeys.push(key);
                }
            }
            
            // 古いバックアップを削除
            if (backupKeys.length > 5) {
                backupKeys.sort().slice(0, backupKeys.length - 5).forEach(key => {
                    localStorage.removeItem(key);
                });
            }
        } catch (error) {
            console.warn('バックアップ作成エラー:', error);
        }
    }
    
    async init() {
        try {
            // ローディング画面を表示
            this.showLoadingScreen();
            
            // Firebase初期化を待つ
            await this.waitForFirebase();
            
            // ログイン画面をスキップして直接ダッシュボードを表示
            this.showMainApp();
            
            // イベントハンドラーを設定
            console.log('🔧 イベントハンドラーを設定中...');
            this.setupMainAppHandlers();
            
            this.isInitialized = true;
            console.log('🚀 ATD System v2.8.1 initialized successfully - ログイン画面スキップ版');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('システムの初期化に失敗しました。ページを再読み込みしてください。');
        }
    }
    
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        
        loadingScreen.classList.remove('hidden');
        loginScreen.classList.add('hidden');
        mainApp.classList.add('hidden');
    }
    
    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebaseAuth && window.firebaseDB) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            // 最大5秒待機
            setTimeout(() => {
                if (!window.firebaseAuth || !window.firebaseDB) {
                    console.log('Firebase not available, using mock');
                    resolve();
                }
            }, 5000);
            checkFirebase();
        });
    }
    
    async checkAuthState() {
        return new Promise((resolve) => {
            console.log('🔍 認証状態チェック開始');
            
            // すべてのユーザーセッションをチェック
            const allUsers = this.getAllActiveUsers();
            console.log('👥 アクティブなユーザーセッション:', allUsers);
            
            if (allUsers.length > 0) {
                // 最新のセッションを選択
                const latestUser = allUsers.reduce((latest, current) => {
                    return current.lastLogin > latest.lastLogin ? current : latest;
                });
                
                console.log('🔄 最新のセッションを選択:', latestUser);
                
                const now = Date.now();
                const threeDays = 3 * 24 * 60 * 60 * 1000; // 3日間（ミリ秒）
                
                // 3日以内のログインの場合、自動ログイン
                if (now - latestUser.lastLogin < threeDays) {
                    try {
                        // プロフィール情報を正しく読み込む
                        this.loadUserProfile(latestUser.user);
                        this.sessionId = latestUser.sessionId;
                        this.showMainApp();
                        console.log('✅ Auto-login successful:', latestUser.user.email);
                        resolve();
                        return;
                    } catch (error) {
                        console.error('❌ Auto-login failed:', error);
                    }
                }
            }
            
            // 自動ログインできない場合はログイン画面を表示
            this.showLoginScreen();
            resolve();
        });
    }
    
    // すべてのアクティブなユーザーセッションを取得
    getAllActiveUsers() {
        const users = [];
        
        try {
            // ローカルストレージのすべてのキーをチェック
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                
                // ユーザー固有のキーをチェック
                if (key && key.startsWith('atd_current_user_') && !key.includes('backup')) {
                    const userId = key.replace('atd_current_user_', '');
                    const userData = localStorage.getItem(key);
                    const lastLoginKey = `atd_last_login_${userId}`;
                    const sessionKey = `atd_session_${userId}`;
                    
                    if (userData) {
                        try {
                            const user = JSON.parse(userData);
                            const lastLogin = localStorage.getItem(lastLoginKey);
                            const sessionId = localStorage.getItem(sessionKey);
                            
                            if (user && user.uid && user.email && lastLogin) {
                                users.push({
                                    userId: userId,
                                    user: user,
                                    lastLogin: parseInt(lastLogin),
                                    sessionId: sessionId
                                });
                            }
                        } catch (error) {
                            console.error('❌ ユーザーデータのパースエラー:', error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ ユーザーセッション取得エラー:', error);
        }
        
        return users;
    }
    
    // デバッグ用: ローカルストレージリセットボタンを追加
    addDebugResetButton() {
        // 既存のボタンを削除
        const existingBtn = document.getElementById('debug-reset-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // リセットボタンを作成
        const resetBtn = document.createElement('button');
        resetBtn.id = 'debug-reset-btn';
        resetBtn.innerHTML = '🔧 デバッグ: ローカルストレージリセット';
        resetBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            background: #ff4444;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        resetBtn.onclick = () => {
            if (confirm('ローカルストレージを完全にリセットしますか？\nすべてのデータが削除されます。')) {
                this.resetAllLocalStorage();
                location.reload();
            }
        };
        
        // 追加: デバッグ情報表示ボタン
        const debugInfoBtn = document.createElement('button');
        debugInfoBtn.id = 'debug-info-btn';
        debugInfoBtn.innerHTML = '🔍 デバッグ情報';
        debugInfoBtn.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            z-index: 10000;
            background: #4444ff;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        debugInfoBtn.onclick = () => {
            this.showDebugInfo();
        };
        
        document.body.appendChild(debugInfoBtn);
        
        document.body.appendChild(resetBtn);
    }
    
    // ローカルストレージを完全にリセット
    resetAllLocalStorage() {
        console.log('🗑️ ローカルストレージを完全にリセット中...');
        
        // すべてのローカルストレージキーを取得
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('atd_')) {
                keysToRemove.push(key);
            }
        }
        
        // キーを削除
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log('🗑️ 削除:', key);
        });
        
        console.log('✅ ローカルストレージリセット完了');
        console.log('🔄 ページをリロードします...');
    }
    
    // デバッグ情報を表示
    showDebugInfo() {
        console.log('🔍 デバッグ情報を収集中...');
        
        // ローカルストレージの内容を確認
        const localStorageKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('atd_')) {
                localStorageKeys.push(key);
            }
        }
        
        // 登録済みメンバーを確認
        const registeredMembers = this.getRegisteredMembers();
        
        const debugInfo = {
            localStorageKeys: localStorageKeys,
            registeredMembersCount: registeredMembers.length,
            registeredMembers: registeredMembers,
            currentUser: this.currentUser,
            sessionId: this.sessionId,
            userData: this.userData,
            personalTasks: this.personalTasks ? this.personalTasks.length : 0,
            teamTasks: this.teamTasks ? this.teamTasks.length : 0
        };
        
        console.log('🔍 デバッグ情報:', debugInfo);
        
        // アラートで表示
        alert(`デバッグ情報:
        
ローカルストレージキー: ${localStorageKeys.length}個
登録済みメンバー: ${registeredMembers.length}人
現在のユーザー: ${this.currentUser ? this.currentUser.email : 'なし'}
セッションID: ${this.sessionId || 'なし'}
個人タスク: ${this.personalTasks ? this.personalTasks.length : 0}件
チームタスク: ${this.teamTasks ? this.teamTasks.length : 0}件

詳細はコンソールを確認してください。`);
    }
    
    // 登録済みメンバーを取得（デバッグ用）
    getRegisteredMembers() {
        try {
            const saved = localStorage.getItem('atd_registered_members');
            if (saved && saved !== 'null' && saved !== 'undefined') {
                const data = JSON.parse(saved);
                return data.registeredMembers || [];
            }
            return [];
        } catch (error) {
            console.error('❌ 登録済みメンバーの取得エラー:', error);
            return [];
        }
    }
    
    showLoginScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        
        // デバッグ用: ローカルストレージリセットボタンを追加
        this.addDebugResetButton();
        
        loadingScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
        
        this.setupLoginHandlers();
    }
    
    // ログイン画面を非表示
    hideLoginScreen() {
        const loginScreen = document.getElementById('login-screen');
        const loginModal = document.getElementById('login-modal');
        
        if (loginScreen) {
            loginScreen.classList.add('hidden');
        }
        if (loginModal) {
            loginModal.classList.add('hidden');
            // 強制的に非表示
            loginModal.style.display = 'none';
            loginModal.style.visibility = 'hidden';
            loginModal.style.opacity = '0';
        }
    }
    
    showMainApp() {
        const loadingScreen = document.getElementById('loading-screen');
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        
        loadingScreen.classList.add('hidden');
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        // デフォルトユーザーを設定（ログイン画面をスキップ）
        this.currentUser = {
            uid: 'default_user',
            email: 'user@example.com',
            displayName: 'ユーザー',
            isAnonymous: false
        };
        
        this.setupMainAppHandlers();
        // loadUserData()は呼ばない（デフォルトユーザーにはプロフィール情報がない）
        
        // ヘッダーのユーザー情報を更新
        this.updateHeaderUserInfo();
        
        // ダッシュボードを初期化（設定画面ではなく）
        this.navigateToPage('dashboard');
        this.initializeDashboard();
    }
    
    setupLoginHandlers() {
        const loginBtn = document.getElementById('login-btn');
        console.log('🔍 ログインボタンを探しています:', loginBtn);
        
        if (loginBtn) {
            console.log('✅ ログインボタンが見つかりました。イベントリスナーを設定します。');
            loginBtn.addEventListener('click', () => {
                console.log('🖱️ ログインボタンがクリックされました！');
                this.showLoginModal();
            });
        } else {
            console.error('❌ ログインボタンが見つかりません！');
        }
    }
    
    setupMainAppHandlers() {
        // ナビゲーション
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateToPage(page);
            });
        });
        
        // ビューモード切り替え
        const personalViewBtn = document.getElementById('personal-view-btn');
        const teamViewBtn = document.getElementById('team-view-btn');
        
        if (personalViewBtn) {
            personalViewBtn.addEventListener('click', () => this.switchViewMode('personal'));
        }
        
        if (teamViewBtn) {
            teamViewBtn.addEventListener('click', () => this.switchViewMode('team'));
        }
        
        // 設定画面のイベントハンドラー
        this.setupSettingsHandlers();
        
        // ユーザーメニュー
        this.setupUserMenuHandlers();
        
        // モーダル
        const modalClose = document.getElementById('modal-close');
        const modalOverlay = document.getElementById('modal-overlay');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }
        
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }
    }
    
    
    // ログインモーダルを表示
    showLoginModal() {
        console.log('🎯 showLoginModal が呼び出されました');
        const modal = document.getElementById('login-modal');
        console.log('🔍 ログインモーダルを探しています:', modal);
        
        if (modal) {
            console.log('✅ ログインモーダルが見つかりました。表示します。');
            modal.classList.remove('hidden');
            // 強制的に表示
            modal.style.display = 'block';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.style.zIndex = '1000';
            console.log('🎨 モーダルのスタイルを強制設定:', modal.style.display);
            this.setupLoginForm();
        } else {
            console.error('❌ ログインモーダルが見つかりません！');
        }
    }

    // ログインフォームの設定
    setupLoginForm() {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // モーダルの閉じるボタンのイベントリスナー
        const closeBtn = document.querySelector('#login-modal .modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideLoginScreen();
            });
        }
        
        // キャンセルボタンのイベントリスナー
        const cancelBtn = document.querySelector('#login-modal .btn-secondary');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideLoginScreen();
            });
        }
    }


    // ログイン処理
    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            if (!window.authManager) {
                window.authManager = new AuthManager();
            }
            
            // 登録済みユーザーとしてログイン
            const result = await window.authManager.signInAsUser(email, password);
            this.currentUser = result.user;
            
            // ログイン情報をローカルストレージに保存（ユーザー固有キー）
            const userId = result.user.uid;
            localStorage.setItem(`atd_current_user_${userId}`, JSON.stringify(result.user));
            localStorage.setItem(`atd_last_login_${userId}`, Date.now().toString());
            
            // セッションIDを生成・保存
            this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(`atd_session_${userId}`, this.sessionId);
            
            // グローバルな最後ログインユーザーIDを設定
            localStorage.setItem('atd_last_logged_in_user_id', userId);
            
            // プロフィール情報を正しく読み込む
            this.loadUserProfile(this.currentUser);
            
            // ログイン画面を非表示
            this.hideLoginScreen();
            
            // メインアプリを表示
            this.showMainApp();
            
            // ヘッダーのユーザー情報を更新
            this.updateHeaderUserInfo();
            
            // 通知を表示
            this.showNotification('ログインしました', 'success');
            console.log('Login successful:', result.user);
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('ログインに失敗しました: ' + error.message, 'error');
        }
    }
    
    // メンバー管理機能のイベントハンドラー
    setupMemberManagementHandlers() {
        // パスワード生成ボタン
        const generatePasswordBtn = document.getElementById('generate-password-btn');
        if (generatePasswordBtn) {
            generatePasswordBtn.addEventListener('click', () => {
                this.generateRegistrationPassword();
            });
        }
        
        // メンバー登録フォーム表示ボタン
        const showMemberRegistrationBtn = document.getElementById('show-member-registration-btn');
        console.log('🔍 メンバー登録ボタン要素:', showMemberRegistrationBtn);
        if (showMemberRegistrationBtn) {
            showMemberRegistrationBtn.addEventListener('click', () => {
                console.log('👆 メンバー登録ボタンがクリックされました');
                this.showMemberRegistrationModal();
            });
            console.log('✅ メンバー登録ボタンのイベントリスナーを設定しました');
        } else {
            console.error('❌ show-member-registration-btn要素が見つかりません');
        }
        
        // メンバー登録フォーム
        const memberRegistrationForm = document.getElementById('member-registration-form');
        if (memberRegistrationForm) {
            memberRegistrationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMemberRegistration();
            });
        }
        
        // アカウント設定フォーム
        const accountSettingsForm = document.getElementById('account-settings-form');
        if (accountSettingsForm) {
            accountSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAccountSettingsSave();
            });
        }
        
        // 初期化時に登録済みメンバーを読み込み・表示
        this.loadRegisteredMembersFromStorage();
        this.loadRegisteredMembers();
        
        
        // パスワードフィールドにデフォルト値を設定
        this.setDefaultPassword();
    }
    
    // 登録パスワード生成
    generateRegistrationPassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        const passwordInput = document.getElementById('member-registration-password');
        if (passwordInput) {
            passwordInput.value = password;
            this.memberRegistrationPassword = password;
            this.showNotification('登録パスワードを生成しました', 'success');
        }
    }
    
    // メンバー登録モーダル表示
    showMemberRegistrationModal() {
        console.log('👤 メンバー登録モーダル表示開始');
        const modal = document.getElementById('member-registration-modal');
        console.log('🔍 メンバー登録モーダル要素:', modal);
        
        if (modal) {
            // 他のモーダルを閉じる
            this.closeModal();
            
            // 少し待ってから新しいモーダルを表示
            setTimeout(() => {
                modal.classList.remove('hidden');
                modal.style.display = 'block';
                modal.style.visibility = 'visible';
                modal.style.opacity = '1';
                
                // フォームをリセット
                const form = document.getElementById('member-registration-form');
                if (form) {
                    form.reset();
                    console.log('✅ フォームをリセットしました');
                }
                
                console.log('✅ メンバー登録モーダルを表示しました');
            }, 100);
        } else {
            console.error('❌ member-registration-modal要素が見つかりません');
        }
    }
    
    // メンバー登録処理
    async handleMemberRegistration() {
        const memberName = document.getElementById('member-name').value;
        const memberEmail = document.getElementById('member-email').value;
        const memberPassword = document.getElementById('member-password').value;
        const memberPasswordConfirm = document.getElementById('member-password-confirm').value;
        
        console.log('👤 メンバー登録処理開始:', {
            memberName: memberName,
            memberEmail: memberEmail,
            memberPassword: memberPassword ? '***' : '',
            memberPasswordConfirm: memberPasswordConfirm ? '***' : ''
        });
        
        // バリデーション
        if (memberPassword !== memberPasswordConfirm) {
            console.log('❌ パスワードが一致しません');
            this.showNotification('パスワードが一致しません', 'error');
            return;
        }
        
        if (!memberName || !memberEmail || !memberPassword) {
            console.log('❌ 必須項目が入力されていません');
            this.showNotification('すべての項目を入力してください', 'error');
            return;
        }
        
        // メンバー登録
        try {
            console.log('📝 メンバー登録処理開始 - 入力データ詳細:', {
                memberName: {
                    value: memberName,
                    type: typeof memberName,
                    length: memberName ? memberName.length : 0,
                    trimmed: memberName ? memberName.trim() : ''
                },
                memberEmail: {
                    value: memberEmail,
                    type: typeof memberEmail,
                    length: memberEmail ? memberEmail.length : 0,
                    trimmed: memberEmail ? memberEmail.trim() : '',
                    lowercased: memberEmail ? memberEmail.trim().toLowerCase() : ''
                },
                memberPassword: {
                    value: memberPassword,
                    type: typeof memberPassword,
                    length: memberPassword ? memberPassword.length : 0,
                    trimmed: memberPassword ? memberPassword.trim() : ''
                },
                memberPasswordConfirm: {
                    value: memberPasswordConfirm,
                    type: typeof memberPasswordConfirm,
                    length: memberPasswordConfirm ? memberPasswordConfirm.length : 0,
                    trimmed: memberPasswordConfirm ? memberPasswordConfirm.trim() : ''
                }
            });
            
            const newMember = {
                id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: memberName.trim(),
                email: memberEmail.trim().toLowerCase(),
                password: memberPassword.trim(),
                role: 'member',
                status: 'active',
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser ? this.currentUser.uid : 'admin'
            };
            
            console.log('📝 作成されたメンバーオブジェクト:', newMember);
            
            // メンバーを配列に追加
            this.registeredMembers.push(newMember);
            console.log('📝 登録前のメンバー数:', this.registeredMembers.length - 1);
            console.log('📝 登録後のメンバー数:', this.registeredMembers.length);
            console.log('📝 新規メンバー詳細:', newMember);
            
            // ローカルストレージに永続保存
            console.log('💾 保存前の登録済みメンバー配列:', this.registeredMembers);
            this.saveRegisteredMembers();
            console.log('💾 メンバーデータを保存しました');
            
            // 保存後の確認
            const savedData = localStorage.getItem('atd_registered_members');
            console.log('💾 保存後のローカルストレージデータ:', savedData);
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    console.log('💾 保存後のパースされたデータ:', parsedData);
                    console.log('💾 保存後のメンバー数:', parsedData.registeredMembers ? parsedData.registeredMembers.length : 0);
                } catch (error) {
                    console.error('❌ 保存後のデータパースエラー:', error);
                }
            }
            
            // 管理パネルを閉じる
            this.closeModal();
            
            console.log('✅ メンバー登録成功:', newMember);
            this.showNotification('メンバーを登録しました', 'success');
            
            // 管理パネルのメンバー一覧を更新
            setTimeout(() => {
                this.loadRegisteredMembers();
            }, 100);
            
        } catch (error) {
            console.error('❌ メンバー登録エラー:', error);
            this.showNotification('メンバー登録に失敗しました', 'error');
        }
    }
    
    // 登録済みメンバーの読み込み
    loadRegisteredMembers() {
        const membersList = document.getElementById('registered-members-list');
        if (!membersList) return;
        
        if (this.registeredMembers.length === 0) {
            membersList.innerHTML = '<div class="no-members">登録済みメンバーはありません</div>';
            return;
        }
        
        let html = '';
        this.registeredMembers.forEach(member => {
            const avatarText = member.name.charAt(0).toUpperCase();
            const statusText = member.status === 'active' ? 'アクティブ' : '非アクティブ';
            const statusClass = member.status === 'active' ? 'status-active' : 'status-inactive';
            html += `
                <div class="member-item" data-member-id="${member.id}">
                    <div class="member-info">
                        <div class="member-avatar">${avatarText}</div>
                        <div class="member-details">
                            <div class="member-name">${member.name}</div>
                            <div class="member-email">${member.email}</div>
                            <div class="member-status ${statusClass}">
                                <i class="fas fa-circle"></i>
                                ${statusText}
                            </div>
                        </div>
                    </div>
                    <div class="member-actions">
                        <button class="btn btn-sm btn-primary" onclick="app.editMember('${member.id}')" title="編集">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.removeMember('${member.id}')" title="削除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        membersList.innerHTML = html;
    }
    
    // メンバー編集
    editMember(memberId) {
        const member = this.registeredMembers.find(m => m.id === memberId);
        if (!member) return;
        
        console.log('✏️ メンバー編集開始:', member);
        
        // 編集フォームに値を設定
        document.getElementById('edit-member-name').value = member.name;
        document.getElementById('edit-member-email').value = member.email;
        document.getElementById('edit-member-password').value = '';
        document.getElementById('edit-member-status').value = member.status;
        
        // 編集モーダルを表示
        const modal = document.getElementById('member-edit-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'block';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            
            // 現在編集中のメンバーIDを保存
            this.editingMemberId = memberId;
        }
    }
    
    // メンバー編集保存
    async handleMemberEdit() {
        const memberId = this.editingMemberId;
        if (!memberId) return;
        
        const member = this.registeredMembers.find(m => m.id === memberId);
        if (!member) return;
        
        const name = document.getElementById('edit-member-name').value;
        const email = document.getElementById('edit-member-email').value;
        const password = document.getElementById('edit-member-password').value;
        const status = document.getElementById('edit-member-status').value;
        
        console.log('💾 メンバー編集保存:', { name, email, status, hasPassword: !!password });
        
        // バリデーション
        if (!name || !email) {
            this.showNotification('表示名とメールアドレスは必須です', 'error');
            return;
        }
        
        try {
            // メンバー情報を更新
            member.name = name;
            member.email = email;
            member.status = status;
            member.updatedAt = new Date().toISOString();
            
            // パスワードが入力されている場合のみ更新
            if (password) {
                member.password = password;
            }
            
            this.saveRegisteredMembers();
            this.closeModal();
            this.loadRegisteredMembers();
            this.showNotification('メンバー情報を更新しました', 'success');
            
        } catch (error) {
            console.error('❌ メンバー編集エラー:', error);
            this.showNotification('メンバー情報の更新に失敗しました', 'error');
        }
    }
    
    // メンバー削除確認
    removeMember(memberId) {
        const member = this.registeredMembers.find(m => m.id === memberId);
        if (!member) return;
        
        console.log('🗑️ メンバー削除確認:', member);
        
        // 削除対象のメンバーIDを保存
        this.deletingMemberId = memberId;
        
        // 削除確認モーダルを表示
        const modal = document.getElementById('member-delete-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'block';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            
            // フォームをリセット
            document.getElementById('member-delete-form').reset();
        }
    }
    
    // メンバー削除実行
    async handleMemberDelete() {
        const memberId = this.deletingMemberId;
        if (!memberId) return;
        
        const password = document.getElementById('delete-password').value;
        console.log('🗑️ メンバー削除実行:', { memberId, password });
        
        // パスワード確認
        if (password !== this.adminPassword) {
            console.log('❌ 削除パスワードが正しくありません');
            this.showNotification('削除パスワードが正しくありません', 'error');
            return;
        }
        
        try {
            // メンバーを削除
            this.registeredMembers = this.registeredMembers.filter(m => m.id !== memberId);
            this.saveRegisteredMembers();
            this.closeModal();
            this.loadRegisteredMembers();
            this.showNotification('メンバーを削除しました', 'success');
            
        } catch (error) {
            console.error('❌ メンバー削除エラー:', error);
            this.showNotification('メンバー削除に失敗しました', 'error');
        }
    }
    
    // 登録済みメンバーの保存
    saveRegisteredMembers() {
        const data = {
            registeredMembers: this.registeredMembers,
            memberRegistrationPassword: this.memberRegistrationPassword,
            lastUpdated: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('atd_registered_members', JSON.stringify(data));
            console.log('💾 メンバーデータを永続保存しました:', data);
            console.log('💾 保存されたメンバー数:', this.registeredMembers.length);
            console.log('💾 保存されたメンバー一覧:', this.registeredMembers.map(m => ({
                id: m.id,
                name: m.name,
                email: m.email,
                status: m.status
            })));
        } catch (error) {
            console.error('❌ メンバーデータの保存に失敗:', error);
        }
    }
    
    // 登録済みメンバーの読み込み
    loadRegisteredMembersFromStorage() {
        const saved = localStorage.getItem('atd_registered_members');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.registeredMembers = data.registeredMembers || [];
                this.memberRegistrationPassword = data.memberRegistrationPassword || '';
            } catch (error) {
                console.error('登録済みメンバーデータの読み込みエラー:', error);
            }
        }
    }
    
    // デフォルトパスワード設定
    setDefaultPassword() {
        const passwordInput = document.getElementById('member-registration-password');
        if (passwordInput && !passwordInput.value) {
            passwordInput.value = this.memberRegistrationPassword;
        }
    }
    
    // 管理パネル内のイベントハンドラー
    setupAdminPanelHandlers() {
        console.log('🔧 管理パネル内イベントハンドラー設定開始');
        
        // メンバー登録フォーム表示ボタン
        const showMemberRegistrationBtn = document.getElementById('show-member-registration-btn');
        console.log('🔍 メンバー登録ボタン要素:', showMemberRegistrationBtn);
        if (showMemberRegistrationBtn) {
            // 既存のイベントリスナーを削除
            const newBtn = showMemberRegistrationBtn.cloneNode(true);
            showMemberRegistrationBtn.parentNode.replaceChild(newBtn, showMemberRegistrationBtn);
            
            // 新しいイベントリスナーを追加
            newBtn.addEventListener('click', () => {
                console.log('👆 メンバー登録ボタンがクリックされました');
                this.showMemberRegistrationModal();
            });
            console.log('✅ メンバー登録ボタンのイベントリスナーを再設定しました');
        } else {
            console.error('❌ show-member-registration-btn要素が見つかりません');
        }
    }
    
    // 管理画面のイベントハンドラー
    setupNewSettingsHandlers() {
        // 管理画面ログインフォーム
        const adminLoginForm = document.getElementById('admin-login-form');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }
        
        // メンバー編集フォーム
        const memberEditForm = document.getElementById('member-edit-form');
        if (memberEditForm) {
            memberEditForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMemberEdit();
            });
        }
        
        // メンバー削除ボタン（編集モーダル内）
        const deleteMemberBtn = document.getElementById('delete-member-btn');
        if (deleteMemberBtn) {
            deleteMemberBtn.addEventListener('click', () => {
                if (this.editingMemberId) {
                    this.removeMember(this.editingMemberId);
                    this.closeModal();
                }
            });
        }
        
        // メンバー削除確認フォーム
        const memberDeleteForm = document.getElementById('member-delete-form');
        if (memberDeleteForm) {
            memberDeleteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMemberDelete();
            });
        }
    }
    
    // アカウント設定表示
    showAccountSettings() {
        const modal = document.getElementById('account-settings-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // フォームをリセット
            document.getElementById('account-settings-form').reset();
        }
    }
    
    // 管理画面ログイン表示
    showAdminLogin() {
        console.log('🔐 管理画面ログイン表示を開始');
        const modal = document.getElementById('admin-login-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'block';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            // フォームをリセット
            document.getElementById('admin-login-form').reset();
            console.log('✅ 管理画面ログインモーダルを表示しました');
        } else {
            console.error('❌ admin-login-modal要素が見つかりません');
        }
    }
    
    // 管理画面ログイン処理
    handleAdminLogin() {
        const password = document.getElementById('admin-password').value;
        console.log('🔐 管理画面ログイン試行:', password);
        
        if (password === this.adminPassword) {
            console.log('✅ 管理パスワード認証成功');
            this.closeModal();
            this.showAdminPanel();
            this.showNotification('管理画面にログインしました', 'success');
        } else {
            console.log('❌ 管理パスワード認証失敗');
            this.showNotification('管理パスワードが正しくありません', 'error');
        }
    }
    
    // ユーザー登録フォーム表示
    showUserRegistrationForm() {
        console.log('👤 ユーザー登録フォーム表示を開始');
        const modal = document.getElementById('member-registration-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'block';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            // フォームをリセット
            document.getElementById('member-registration-form').reset();
            console.log('✅ ユーザー登録フォームを表示しました');
        } else {
            console.error('❌ member-registration-modal要素が見つかりません');
        }
    }
    
    // 管理画面表示
    showAdminPanel() {
        console.log('🔧 管理パネル表示開始');
        const modal = document.getElementById('admin-panel-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'block';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            
            // 登録済みメンバーを読み込み
            this.loadRegisteredMembers();
            
            // 管理パネル内のイベントハンドラーを再設定
            this.setupAdminPanelHandlers();
            
            console.log('✅ 管理パネルを表示しました');
        } else {
            console.error('❌ admin-panel-modal要素が見つかりません');
        }
    }
    
    // アカウント設定保存
    handleAccountSettingsSave() {
        const currentPassword = document.getElementById('current-password').value;
        const newEmail = document.getElementById('new-email').value;
        const newPassword = document.getElementById('new-password').value;
        
        // バリデーション
        if (!currentPassword) {
            this.showNotification('現在のパスワードを入力してください', 'error');
            return;
        }
        
        if (newEmail || newPassword) {
            this.showNotification('アカウント設定を保存しました', 'success');
            this.closeModal();
        } else {
            this.showNotification('変更する項目を入力してください', 'error');
        }
    }
    
    // 設定保存処理
    handleSettingsSave() {
        const currentPassword = document.getElementById('current-password').value;
        const newEmail = document.getElementById('new-email').value;
        const newPassword = document.getElementById('settings-new-password').value;
        
        // 現在のパスワードをチェック
        if (currentPassword !== 'Mizuki0418') {
            this.showNotification('現在のパスワードが正しくありません', 'error');
            return;
        }
        
        // 新しいメールアドレスを更新
        if (newEmail.trim()) {
            this.currentUser.email = newEmail.trim();
        }
        if (newPassword.trim()) {
            this.currentUser.password = newPassword.trim();
        }
        
        this.saveUserData();
        this.closeModal();
        this.showNotification('設定を保存しました', 'success');
    }
    
    // ログアウト確認ダイアログを表示
    showLogoutConfirmation() {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        if (modalTitle) modalTitle.textContent = 'ログアウト確認';
        if (modalBody) {
            modalBody.innerHTML = `
                <p>ログアウトしますか？</p>
                <div class="form-actions">
                    <button type="button" class="btn btn-danger" onclick="app.confirmLogout()">はい</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">キャンセル</button>
                </div>
            `;
        }
        if (modalOverlay) modalOverlay.classList.remove('hidden');
    }
    
    // ログアウト確認
    confirmLogout() {
        this.closeModal();
        this.logout();
    }
    
    // ログアウト処理
    logout() {
        console.log('🔓 ログアウト開始');
        
        if (this.currentUser && this.currentUser.uid) {
            const userId = this.currentUser.uid;
            console.log('👤 ログアウトするユーザー:', userId);
            
            // ユーザー固有のローカルストレージキーを削除
            localStorage.removeItem(`atd_current_user_${userId}`);
            localStorage.removeItem(`atd_last_login_${userId}`);
            localStorage.removeItem(`atd_session_${userId}`);
            localStorage.removeItem(`atd_user_${userId}`);
            
            // グローバルな最後ログインユーザーIDも削除
            localStorage.removeItem('atd_last_logged_in_user_id');
            
            console.log('🗑️ ユーザー固有データを削除:', {
                currentUser: `atd_current_user_${userId}`,
                lastLogin: `atd_last_login_${userId}`,
                session: `atd_session_${userId}`,
                userData: `atd_user_${userId}`
            });
        }
        
        // ユーザー情報をクリア
        this.currentUser = null;
        this.sessionId = null;
        this.personalTasks = [];
        this.teamTasks = [];
        this.teamMembers = [];
        
        // ログイン画面を表示
        this.showLoginScreen();
        
        // 通知を表示
        this.showNotification('ログアウトしました', 'info');
        console.log('✅ ログアウト完了');
    }
    
    // 設定画面のイベントハンドラー
    setupSettingsHandlers() {
        // 名前クリックでプロフィール編集を開く
        const userNameInput = document.getElementById('user-name');
        if (userNameInput) {
            userNameInput.addEventListener('click', () => {
                this.showProfileModal();
            });
        }
        
        // 表示名保存
        const saveNameBtn = document.getElementById('save-name-btn');
        if (saveNameBtn) {
            saveNameBtn.addEventListener('click', () => {
                const userName = document.getElementById('user-name').value;
                if (userName.trim()) {
                    this.currentUser.displayName = userName.trim();
                    this.saveUserData();
                    this.showNotification('表示名を保存しました', 'success');
                } else {
                    this.showNotification('表示名を入力してください', 'error');
                }
            });
        }
        
        // メンバー管理機能のイベントハンドラー
        this.setupMemberManagementHandlers();
        
        // 新しい設定画面のイベントハンドラー
        this.setupNewSettingsHandlers();
        
        // ログアウト
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('ログアウトしますか？')) {
                    this.logout();
                }
            });
        }
        
        // データエクスポート
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportUserData();
            });
        }
        
        // データリセット
        const resetBtn = document.getElementById('reset-data-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('すべてのデータが削除されます。本当によろしいですか？')) {
                    this.resetUserData();
                }
            });
        }
        
        // 最終ログイン時間を更新
        this.updateLastLoginTime();
    }
    
    // 最終ログイン時間を更新
    updateLastLoginTime() {
        const lastLoginElement = document.getElementById('last-login-time');
        if (lastLoginElement && this.currentUser) {
            const lastLogin = localStorage.getItem('atd_last_login');
            if (lastLogin) {
                const loginDate = new Date(parseInt(lastLogin));
                lastLoginElement.textContent = loginDate.toLocaleString('ja-JP');
            }
        }
    }
    
    // データエクスポート
    exportUserData() {
        try {
            const userData = {
                personalTasks: this.personalTasks,
                teamTasks: this.teamTasks,
                teamMembers: this.teamMembers,
                exportDate: new Date().toISOString(),
                version: '1.6.0'
            };
            
            const dataStr = JSON.stringify(userData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `atd-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification('データをエクスポートしました', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('エクスポートに失敗しました', 'error');
        }
    }
    
    // データリセット
    resetUserData() {
        try {
            // ローカルストレージからユーザーデータを削除
            if (this.currentUser) {
                const userId = this.currentUser.uid;
                const userDataKey = `atd_user_${userId}`;
                localStorage.removeItem(userDataKey);
            }
            
            // メモリ上のデータをクリア
            this.personalTasks = [];
            this.teamTasks = [];
            this.teamMembers = [];
            
            this.showNotification('データをリセットしました', 'success');
            
            // ページをリロード
            setTimeout(() => {
                location.reload();
            }, 1000);
        } catch (error) {
            console.error('Reset error:', error);
            this.showNotification('リセットに失敗しました', 'error');
        }
    }
    
    // 設定画面を表示
    showSettingsPage() {
        // 最終ログイン時間を更新
        this.updateLastLoginTime();
        
        // 現在の表示名を設定
        const userNameInput = document.getElementById('user-name');
        if (userNameInput && this.currentUser) {
            userNameInput.value = this.currentUser.displayName || '管理者';
        }
    }
    
    // ユーザーメニューのイベントハンドラー
    setupUserMenuHandlers() {
        console.log('🔧 ユーザーメニューハンドラーを設定中... (v2.6.0)');
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userMenu = document.getElementById('user-menu');
        console.log('🔍 ユーザーメニューボタン:', userMenuBtn);
        console.log('🔍 ユーザーメニュー:', userMenu);
        
        if (userMenuBtn && userMenu) {
            // 既存のイベントリスナーを削除（重複防止）
            const newUserMenuBtn = userMenuBtn.cloneNode(true);
            userMenuBtn.parentNode.replaceChild(newUserMenuBtn, userMenuBtn);
            
            // ユーザーメニューの表示/非表示
            newUserMenuBtn.addEventListener('click', (e) => {
                console.log('🖱️ ユーザーメニューボタンがクリックされました！');
                e.stopPropagation();
                
                // メニューの表示状態を切り替え
                if (userMenu.style.display === 'none' || userMenu.style.display === '') {
                    userMenu.style.display = 'block';
                    userMenu.style.opacity = '1';
                    userMenu.style.transform = 'translateY(0)';
                    console.log('📋 ユーザーメニューの状態: 表示');
                } else {
                    userMenu.style.display = 'none';
                    userMenu.style.opacity = '0';
                    userMenu.style.transform = 'translateY(-10px)';
                    console.log('📋 ユーザーメニューの状態: 非表示');
                }
            });
            
            // メニューアイテムのクリック（重複防止）
            const menuItems = document.querySelectorAll('.user-menu-item');
            menuItems.forEach(item => {
                // 既存のイベントリスナーを削除
                const newItem = item.cloneNode(true);
                item.parentNode.replaceChild(newItem, item);
                
                newItem.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    this.handleUserMenuAction(action);
                    userMenu.style.display = 'none';
                    userMenu.style.opacity = '0';
                    userMenu.style.transform = 'translateY(-10px)';
                    console.log('📋 メニューアイテムクリック: 非表示');
                });
            });
            
            // メニュー外をクリックしたら閉じる（重複防止）
            const existingHandler = document.userMenuClickHandler;
            if (existingHandler) {
                document.removeEventListener('click', existingHandler);
            }
            
            const clickHandler = (e) => {
                if (!newUserMenuBtn.contains(e.target) && !userMenu.contains(e.target)) {
                    userMenu.style.display = 'none';
                    userMenu.style.opacity = '0';
                    userMenu.style.transform = 'translateY(-10px)';
                    console.log('📋 メニュー外クリック: 非表示');
                }
            };
            
            document.userMenuClickHandler = clickHandler;
            document.addEventListener('click', clickHandler);
        }
        
        // プロフィール編集のイベントハンドラー
        this.setupProfileHandlers();
    }
    
    // ユーザーメニューのアクション処理
    handleUserMenuAction(action) {
        switch (action) {
            case 'settings':
                this.showSettingsModal();
                break;
            case 'profile':
                this.showProfileModal();
                break;
            case 'logout':
                this.showLogoutConfirmation();
                break;
        }
    }
    
    // 設定モーダルを表示
    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'block';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.style.zIndex = '1000';
            
            // 設定フォームのイベントハンドラーを設定
            this.setupSettingsModalHandlers();
        }
    }
    
    // 設定モーダルのイベントハンドラー
    setupSettingsModalHandlers() {
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSettingsSave();
            });
        }
    }
    
    // プロフィール編集モーダルを表示
    showProfileModal() {
        const modal = document.getElementById('profile-modal');
        
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'block';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.style.zIndex = '1000';
            
            // 現在の情報を設定
            this.loadProfileData();
        }
    }
    
    // プロフィールデータを読み込み（強化版）
    loadProfileData() {
        if (!this.currentUser) {
            console.warn('⚠️ ユーザーがログインしていないため、プロフィールデータを読み込めません');
            return;
        }
        
        console.log('🔍 プロフィールデータ読み込み開始:', {
            uid: this.currentUser.uid,
            displayName: this.currentUser.displayName,
            email: this.currentUser.email
        });
        
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileBio = document.getElementById('profile-bio');
        const avatarPreview = document.getElementById('avatar-preview-img');
        const avatarPlaceholder = document.querySelector('.avatar-preview-placeholder');
        
        // 名前フィールドを更新
        if (profileName) {
            profileName.value = this.currentUser.displayName || '';
            console.log('📝 プロフィール名を設定:', profileName.value);
        } else {
            console.warn('⚠️ profile-name要素が見つかりません');
        }
        
        // メールフィールドを更新
        if (profileEmail) {
            profileEmail.value = this.currentUser.email || '';
            console.log('📧 プロフィールメールを設定:', profileEmail.value);
        } else {
            console.warn('⚠️ profile-email要素が見つかりません');
        }
        
        // 自己紹介フィールドを更新
        if (profileBio) {
            profileBio.value = this.currentUser.bio || '';
            console.log('📄 プロフィール自己紹介を設定:', profileBio.value);
        }
        
        // アバター画像の設定
        if (this.currentUser.avatar) {
            avatarPreview.src = this.currentUser.avatar;
            avatarPreview.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
            
            // アバター位置の復元
            if (this.currentUser.avatarPosition) {
                const { x, y, scale } = this.currentUser.avatarPosition;
                avatarPreview.style.transform = `translate(${x - 50}%, ${y - 50}%) scale(${scale / 100})`;
                
                // スライダーの値も更新
                const xSlider = document.getElementById('avatar-x-slider');
                const ySlider = document.getElementById('avatar-y-slider');
                const scaleSlider = document.getElementById('avatar-scale-slider');
                const xValue = document.getElementById('avatar-x-value');
                const yValue = document.getElementById('avatar-y-value');
                const scaleValue = document.getElementById('avatar-scale-value');
                
                if (xSlider && ySlider && scaleSlider) {
                    xSlider.value = x;
                    ySlider.value = y;
                    scaleSlider.value = scale;
                    xValue.textContent = x + '%';
                        yValue.textContent = y + '%';
                        scaleValue.textContent = scale + '%';
                    }
                }
            } else {
                avatarPreview.style.display = 'none';
                avatarPlaceholder.style.display = 'block';
            }
        }
    }
    
    // プロフィール編集のイベントハンドラー
    setupProfileHandlers() {
        // アバターアップロード
        const avatarUploadBtn = document.getElementById('avatar-upload-btn');
        const avatarUpload = document.getElementById('avatar-upload');
        const avatarRemoveBtn = document.getElementById('avatar-remove-btn');
        const avatarResetBtn = document.getElementById('avatar-reset-btn');
        
        if (avatarUploadBtn && avatarUpload) {
            avatarUploadBtn.addEventListener('click', () => {
                avatarUpload.click();
            });
            
            avatarUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleAvatarUpload(file);
                }
            });
        }
        
        if (avatarRemoveBtn) {
            avatarRemoveBtn.addEventListener('click', () => {
                this.removeAvatar();
            });
        }
        
        if (avatarResetBtn) {
            avatarResetBtn.addEventListener('click', () => {
                this.resetAvatarPosition();
            });
        }
        
        // アバター位置調整スライダー
        this.setupAvatarPositionControls();
        
        // プロフィール保存
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }
    }
    
    // プロフィール保存（強化版）
    async saveProfile() {
        try {
            const nameInput = document.getElementById('profile-name');
            const bioInput = document.getElementById('profile-bio');
            const emailInput = document.getElementById('profile-email');
            
            if (!this.currentUser) {
                this.showNotification('ユーザー情報が見つかりません', 'error');
                return;
            }
            
            const newName = nameInput ? nameInput.value.trim() : '';
            const newBio = bioInput ? bioInput.value.trim() : '';
            const newEmail = emailInput ? emailInput.value.trim() : this.currentUser.email;
            
            // 名前の検証
            if (!newName) {
                this.showNotification('名前を入力してください', 'error');
                return;
            }
            
            if (newName.length > 50) {
                this.showNotification('名前は50文字以内で入力してください', 'error');
                return;
            }
            
            // メールアドレスの検証
            if (newEmail && !this.isValidEmail(newEmail)) {
                this.showNotification('有効なメールアドレスを入力してください', 'error');
                return;
            }
            
            console.log('💾 プロフィールを保存中...', {
                oldName: this.currentUser.displayName,
                newName: newName,
                bio: newBio,
                email: newEmail
            });
            
            // プロフィールデータを準備
            const profileData = {
                displayName: newName,
                bio: newBio,
                email: newEmail,
                avatar: this.currentUser.avatar || '',
                avatarPosition: this.currentUser.avatarPosition || { x: 50, y: 50, scale: 100 }
            };
            
            // AuthManagerを通じて永続保存
            if (this.authManager && typeof this.authManager.updateUserProfile === 'function') {
                await this.authManager.updateUserProfile(profileData);
                console.log('✅ AuthManager経由でプロフィール保存完了');
            } else {
                console.error('❌ AuthManagerまたはupdateUserProfileメソッドが見つかりません');
                throw new Error('プロフィール保存機能が利用できません');
            }
            
            // 現在のユーザー情報を更新
            this.currentUser.displayName = newName;
            this.currentUser.bio = newBio;
            this.currentUser.email = newEmail;
            
            // セッションストレージも更新
            const sessionData = {
                user: this.currentUser,
                timestamp: Date.now()
            };
            localStorage.setItem('atd_current_session', JSON.stringify(sessionData));
            
            // 追加でユーザーデータも保存
            this.saveUserData();
            
            // UIを更新
            this.updateUI();
            
            // 自動保存を開始
            this.startProfileAutoSave();
            
            // モーダルを閉じる
            this.closeModal();
            
            this.showNotification('プロフィールを保存しました（永続保存）', 'success');
            console.log('✅ プロフィール保存完了（永続保存）');
            
        } catch (error) {
            console.error('❌ プロフィール保存エラー:', error);
            this.showNotification('プロフィールの保存に失敗しました: ' + error.message, 'error');
        }
    }
    
    // メールアドレスの検証
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // プロフィールの自動保存を開始
    startProfileAutoSave() {
        if (this.profileAutoSaveInterval) {
            clearInterval(this.profileAutoSaveInterval);
        }
        
        this.profileAutoSaveInterval = setInterval(async () => {
            try {
                const nameInput = document.getElementById('profile-name');
                const bioInput = document.getElementById('profile-bio');
                const emailInput = document.getElementById('profile-email');
                
                if (nameInput && nameInput.value.trim()) {
                    const profileData = {
                        displayName: nameInput.value.trim(),
                        bio: bioInput ? bioInput.value.trim() : '',
                        email: emailInput ? emailInput.value.trim() : this.currentUser.email,
                        avatar: this.currentUser.avatar || '',
                        avatarPosition: this.currentUser.avatarPosition || { x: 50, y: 50, scale: 100 }
                    };
                    
                    await this.authManager.updateUserProfile(profileData);
                    console.log('🔄 プロフィール自動保存完了');
                }
            } catch (error) {
                console.error('❌ プロフィール自動保存エラー:', error);
            }
        }, 30000); // 30秒間隔
        
        console.log('🔄 プロフィール自動保存を開始しました');
    }
    
    // プロフィールの自動保存を停止
    stopProfileAutoSave() {
        if (this.profileAutoSaveInterval) {
            clearInterval(this.profileAutoSaveInterval);
            this.profileAutoSaveInterval = null;
            console.log('🔄 プロフィール自動保存を停止しました');
        }
    }
    
    // 通知表示
    showNotification(message, type = 'info') {
        // 既存の通知を削除
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // スタイルを設定
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // 閉じるボタンのイベント
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // 自動で閉じる（5秒後）
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    // プロフィール復元モーダルを表示
    async showProfileRestoreModal() {
        try {
            if (!this.currentUser) {
                this.showNotification('ユーザーがログインしていません', 'error');
                return;
            }
            
            // プロフィール履歴を取得
            const historyKey = `atd_profile_history_${this.currentUser.uid}`;
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            
            if (history.length === 0) {
                this.showNotification('復元可能な履歴がありません', 'info');
                return;
            }
            
            // 履歴リストを生成
            const historyList = document.getElementById('profile-history-list');
            historyList.innerHTML = '';
            
            history.reverse().forEach((record, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'profile-history-item';
                historyItem.innerHTML = `
                    <div class="history-item-content">
                        <div class="history-item-header">
                            <input type="radio" name="profile-version" value="${record.version}" id="version-${record.version}">
                            <label for="version-${record.version}">
                                <strong>バージョン ${record.version}</strong>
                                <span class="history-date">${new Date(record.timestamp).toLocaleString('ja-JP')}</span>
                            </label>
                        </div>
                        <div class="history-item-details">
                            <div class="history-detail">
                                <span class="detail-label">名前:</span>
                                <span class="detail-value">${record.changes.displayName || '未設定'}</span>
                            </div>
                            <div class="history-detail">
                                <span class="detail-label">メール:</span>
                                <span class="detail-value">${record.changes.email || '未設定'}</span>
                            </div>
                            <div class="history-detail">
                                <span class="detail-label">自己紹介:</span>
                                <span class="detail-value">${record.changes.bio || '未設定'}</span>
                            </div>
                        </div>
                    </div>
                `;
                historyList.appendChild(historyItem);
            });
            
            // 最新版を選択
            const firstRadio = historyList.querySelector('input[type="radio"]');
            if (firstRadio) {
                firstRadio.checked = true;
            }
            
            // モーダルを表示
            this.showModal('profile-restore-modal');
            
        } catch (error) {
            console.error('❌ プロフィール復元モーダル表示エラー:', error);
            this.showNotification('プロフィール履歴の読み込みに失敗しました', 'error');
        }
    }
    
    // 選択されたプロフィールを復元
    async restoreSelectedProfile() {
        try {
            const selectedVersion = document.querySelector('input[name="profile-version"]:checked');
            if (!selectedVersion) {
                this.showNotification('復元するバージョンを選択してください', 'error');
                return;
            }
            
            const version = parseInt(selectedVersion.value);
            
            // AuthManagerを通じて復元
            const result = await this.authManager.restoreProfile(this.currentUser.uid, version);
            
            if (result.success) {
                // 現在のユーザー情報を更新
                this.updateUserDisplay();
                
                // プロフィールモーダルを閉じる
                this.closeModal();
                
                this.showNotification(`プロフィールをバージョン ${version} に復元しました`, 'success');
                console.log('✅ プロフィール復元完了:', result);
            }
            
        } catch (error) {
            console.error('❌ プロフィール復元エラー:', error);
            this.showNotification('プロフィールの復元に失敗しました: ' + error.message, 'error');
        }
    }
    
    // アバターアップロード処理
    handleAvatarUpload(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const avatarPreview = document.getElementById('avatar-preview-img');
                const avatarPlaceholder = document.querySelector('.avatar-preview-placeholder');
                
                avatarPreview.src = e.target.result;
                avatarPreview.style.display = 'block';
                avatarPlaceholder.style.display = 'none';
                
                // 初期位置をリセット
                this.resetAvatarPosition();
                
                // ユーザー情報に保存
                this.currentUser.avatar = e.target.result;
                this.currentUser.avatarPosition = { x: 50, y: 50, scale: 100 };
            };
            reader.readAsDataURL(file);
        } else {
            this.showNotification('画像ファイルを選択してください', 'error');
        }
    }
    
    // アバター削除
    removeAvatar() {
        const avatarPreview = document.getElementById('avatar-preview-img');
        const avatarPlaceholder = document.querySelector('.avatar-preview-placeholder');
        
        avatarPreview.style.display = 'none';
        avatarPlaceholder.style.display = 'block';
        
        // ユーザー情報から削除
        delete this.currentUser.avatar;
        delete this.currentUser.avatarPosition;
    }
    
    // アバター位置調整コントロールの設定
    setupAvatarPositionControls() {
        const xSlider = document.getElementById('avatar-x-slider');
        const ySlider = document.getElementById('avatar-y-slider');
        const scaleSlider = document.getElementById('avatar-scale-slider');
        const xValue = document.getElementById('avatar-x-value');
        const yValue = document.getElementById('avatar-y-value');
        const scaleValue = document.getElementById('avatar-scale-value');
        const avatarPreview = document.getElementById('avatar-preview-img');
        
        if (xSlider && ySlider && scaleSlider) {
            // X位置スライダー
            xSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                xValue.textContent = value + '%';
                this.updateAvatarPosition('x', value);
            });
            
            // Y位置スライダー
            ySlider.addEventListener('input', (e) => {
                const value = e.target.value;
                yValue.textContent = value + '%';
                this.updateAvatarPosition('y', value);
            });
            
            // スケールスライダー
            scaleSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                scaleValue.textContent = value + '%';
                this.updateAvatarPosition('scale', value);
            });
        }
        
        // ドラッグ機能を追加
        if (avatarPreview) {
            this.setupAvatarDrag(avatarPreview);
        }
    }
    
    // アバターのドラッグ機能を設定
    setupAvatarDrag(avatarElement) {
        let isDragging = false;
        let startX, startY, startTransform;
        
        avatarElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            // 現在のtransform値を取得
            const currentTransform = avatarElement.style.transform;
            const match = currentTransform.match(/translate\(([^,]+),([^)]+)\)/);
            if (match) {
                startTransform = {
                    x: parseFloat(match[1]) || 0,
                    y: parseFloat(match[2]) || 0
                };
            } else {
                startTransform = { x: 0, y: 0 };
            }
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            // プレビューエリア内での相対位置を計算
            const previewContainer = document.querySelector('.avatar-preview');
            if (previewContainer) {
                const rect = previewContainer.getBoundingClientRect();
                const relativeX = ((startTransform.x + deltaX) / rect.width) * 100;
                const relativeY = ((startTransform.y + deltaY) / rect.height) * 100;
                
                // スライダーの値を更新
                const xSlider = document.getElementById('avatar-x-slider');
                const ySlider = document.getElementById('avatar-y-slider');
                const xValue = document.getElementById('avatar-x-value');
                const yValue = document.getElementById('avatar-y-value');
                
                if (xSlider && ySlider) {
                    const clampedX = Math.max(0, Math.min(100, relativeX));
                    const clampedY = Math.max(0, Math.min(100, relativeY));
                    
                    xSlider.value = clampedX;
                    ySlider.value = clampedY;
                    xValue.textContent = Math.round(clampedX) + '%';
                    yValue.textContent = Math.round(clampedY) + '%';
                    
                    this.updateAvatarPosition('x', clampedX);
                    this.updateAvatarPosition('y', clampedY);
                }
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
    
    // アバター位置の更新
    updateAvatarPosition(axis, value) {
        const avatarPreview = document.getElementById('avatar-preview-img');
        if (!avatarPreview || avatarPreview.style.display === 'none') return;
        
        if (!this.currentUser.avatarPosition) {
            this.currentUser.avatarPosition = { x: 50, y: 50, scale: 100 };
        }
        
        this.currentUser.avatarPosition[axis] = parseInt(value);
        
        const { x, y, scale } = this.currentUser.avatarPosition;
        
        // 画像の位置とサイズを更新
        avatarPreview.style.transform = `translate(${x - 50}%, ${y - 50}%) scale(${scale / 100})`;
    }
    
    // アバター位置のリセット
    resetAvatarPosition() {
        const xSlider = document.getElementById('avatar-x-slider');
        const ySlider = document.getElementById('avatar-y-slider');
        const scaleSlider = document.getElementById('avatar-scale-slider');
        const xValue = document.getElementById('avatar-x-value');
        const yValue = document.getElementById('avatar-y-value');
        const scaleValue = document.getElementById('avatar-scale-value');
        
        if (xSlider && ySlider && scaleSlider) {
            xSlider.value = 50;
            ySlider.value = 50;
            scaleSlider.value = 100;
            xValue.textContent = '50%';
            yValue.textContent = '50%';
            scaleValue.textContent = '100%';
            
            this.updateAvatarPosition('x', 50);
            this.updateAvatarPosition('y', 50);
            this.updateAvatarPosition('scale', 100);
        }
    }
    
    // ヘッダーのユーザー情報を更新
    updateHeaderUserInfo() {
        console.log('🔄 ヘッダー情報を更新中:', {
            displayName: this.currentUser?.displayName,
            email: this.currentUser?.email
        });
        
        const userNameSpan = document.getElementById('user-name');
        const userDisplayName = document.getElementById('user-display-name');
        const userAvatarImg = document.getElementById('user-avatar-img');
        const userAvatarPlaceholder = document.querySelector('.avatar-placeholder');
        
        if (userNameSpan) {
            userNameSpan.textContent = this.currentUser.displayName || '管理者';
            console.log('✅ ユーザー名スパンを更新:', userNameSpan.textContent);
        }
        
        if (userDisplayName) {
            userDisplayName.textContent = this.currentUser.displayName || '管理者';
            console.log('✅ ユーザー表示名を更新:', userDisplayName.textContent);
        }
        
        // 設定画面の表示名も更新
        const settingsUserName = document.getElementById('user-name');
        if (settingsUserName) {
            settingsUserName.value = this.currentUser.displayName || '管理者';
            console.log('✅ 設定画面のユーザー名を更新:', settingsUserName.value);
        }
        
        // アバター画像の更新
        if (this.currentUser.avatar) {
            userAvatarImg.src = this.currentUser.avatar;
            userAvatarImg.style.display = 'block';
            userAvatarPlaceholder.style.display = 'none';
        } else {
            userAvatarImg.style.display = 'none';
            userAvatarPlaceholder.style.display = 'block';
        }
    }
    
    
    switchViewMode(mode) {
        this.currentViewMode = mode;
        
        // ビューモードボタンの状態を更新
        const viewButtons = document.querySelectorAll('.view-mode-btn');
        viewButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
        
        // ダッシュボードビューの切り替え
        const personalDashboard = document.getElementById('personal-dashboard');
        const teamDashboard = document.getElementById('team-dashboard');
        
        if (personalDashboard && teamDashboard) {
            personalDashboard.classList.toggle('active', mode === 'personal');
            teamDashboard.classList.toggle('active', mode === 'team');
        }
        
        // チーム関連の要素の表示/非表示を切り替え
        this.toggleTeamElements(mode);
        
        // 現在のページがダッシュボードの場合は再初期化
        const currentPage = document.querySelector('.page.active');
        if (currentPage && currentPage.id === 'dashboard-page') {
            this.initializePage('dashboard');
        }
        
        // ダッシュボードの今日のタスクを更新
        if (window.dashboardPage) {
            if (mode === 'personal') {
                window.dashboardPage.updateTodayTasksDashboard();
            } else if (mode === 'team') {
                window.dashboardPage.updateTeamTodayTasksDashboard();
            }
        }
    }
    
    toggleTeamElements(mode) {
        // チーム関連の要素を表示/非表示
        const teamElements = document.querySelectorAll('[data-team-only]');
        const personalElements = document.querySelectorAll('[data-personal-only]');
        
        teamElements.forEach(element => {
            element.style.display = mode === 'team' ? 'block' : 'none';
        });
        
        personalElements.forEach(element => {
            element.style.display = mode === 'personal' ? 'block' : 'none';
        });
    }
    
    navigateToPage(page) {
        // ナビゲーションボタンの状態を更新
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === page) {
                btn.classList.add('active');
            }
        });
        
        // ページの表示を切り替え
        const pages = document.querySelectorAll('.page');
        pages.forEach(p => {
            p.classList.remove('active');
        });
        
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // ページ固有の初期化
        this.initializePage(page);
    }
    
    async initializePage(page) {
        switch (page) {
            case 'dashboard':
                await this.initializeDashboard();
                break;
            case 'tasks':
                await this.initializeTasks();
                break;
            case 'team':
                await this.initializeTeam();
                break;
            case 'mindmap':
                await this.initializeMindmap();
                break;
            case 'settings':
                this.showSettingsPage();
                break;
            case 'add-task':
                await this.initializeAddTask();
                break;
        }
    }
    
    async initializeDashboard() {
        // ダッシュボードの初期化
        console.log('Initializing dashboard...');
        
        // ダッシュボードページのインスタンスを作成（まだ存在しない場合）
        if (!window.dashboardPage) {
            console.log('📊 DashboardPageのインスタンスを作成');
            window.dashboardPage = new DashboardPage();
        }
        
        // ダッシュボードページを初期化
        await window.dashboardPage.initialize();
    }
    
    async initializeTasks() {
        // タスク管理の初期化
        console.log('Initializing tasks...');
        
        // タスクリストの読み込み
        await this.loadTasks();
        
        // タスク追加ボタンの設定（重複防止）
        this.safeAddEventListener('add-task-btn', 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.navigateToPage('add-task');
        });
        
        // マインドマップ細分化ボタンの設定
        const mindmapBreakdownBtn = document.getElementById('mindmap-breakdown-btn');
        if (mindmapBreakdownBtn) {
            mindmapBreakdownBtn.addEventListener('click', () => this.showMindmapBreakdown());
        }
        
        // フィルターの設定
        const priorityFilter = document.getElementById('task-priority-filter');
        const statusFilter = document.getElementById('task-status-filter');
        
        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
    }
    
    async initializeTeam() {
        // チーム管理の初期化
        console.log('Initializing team...');
        
        // チームデータの読み込み
        await this.loadTeamData();
        
        // チーム作成ボタンの設定
        const createTeamBtn = document.getElementById('create-team-btn');
        if (createTeamBtn) {
            createTeamBtn.addEventListener('click', () => this.showCreateTeamModal());
        }
        
        // メンバー招待ボタンの設定
        const inviteMemberBtn = document.getElementById('invite-member-btn');
        if (inviteMemberBtn) {
            inviteMemberBtn.addEventListener('click', () => this.showInviteMemberModal());
        }
    }
    
    async initializeMindmap() {
        // マインドマップの初期化
        console.log('Initializing mindmap...');
        
        // マインドマップページのインスタンスを作成
        if (!window.mindmapPage) {
            window.mindmapPage = new MindmapPage();
        }
        
        // マインドマップマネージャーのインスタンスを作成
        if (!window.mindmapManager) {
            window.mindmapManager = new MindmapManager();
        }
        
        // マインドマップの初期化
        await window.mindmapPage.initialize();
        
        // ノード追加ボタンの設定
        const addNodeBtn = document.getElementById('add-node-btn');
        if (addNodeBtn) {
            addNodeBtn.addEventListener('click', () => window.mindmapPage.showAddNodeModal());
        }
        
        // タスク生成ボタンの設定
        const generateTasksBtn = document.getElementById('generate-tasks-btn');
        if (generateTasksBtn) {
            generateTasksBtn.addEventListener('click', () => window.mindmapPage.generateTasksFromMindmap());
        }
    }
    
    async initializeAddTask() {
        // タスク追加ページの初期化
        console.log('Initializing add task page...');
        
        // 今日の日付を設定
        const today = new Date().toISOString().split('T')[0];
        const startDateInput = document.getElementById('task-start-date');
        const endDateInput = document.getElementById('task-end-date');
        
        if (startDateInput) startDateInput.value = today;
        if (endDateInput) endDateInput.value = today;
        
        // イベントリスナーの設定
        this.setupAddTaskEventListeners();
    }
    
    setupAddTaskEventListeners() {
        // 既存のイベントリスナーを削除してから新しいものを追加
        this.safeAddEventListener('save-task-btn', 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.saveNewTask();
        });
        
        // キャンセルボタン
        this.safeAddEventListener('cancel-task-btn', 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.navigateToPage('tasks');
        });
        
        // マインドマップ細分化ボタン
        this.safeAddEventListener('mindmap-subdivision-btn', 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMindmapSubdivision();
        });
    }
    
    toggleMindmapSubdivision() {
        const subdivision = document.getElementById('mindmap-subdivision');
        const btn = document.getElementById('mindmap-subdivision-btn');
        
        if (subdivision && btn) {
            subdivision.classList.toggle('hidden');
            if (subdivision.classList.contains('hidden')) {
                btn.innerHTML = '<i class="fas fa-project-diagram"></i> マインドマップで細分化';
            } else {
                btn.innerHTML = '<i class="fas fa-eye-slash"></i> マインドマップを隠す';
                this.initializeTaskMindmap();
            }
        }
    }
    
    initializeTaskMindmap() {
        // タスク用マインドマップの初期化
        const canvas = document.getElementById('task-mindmap-canvas');
        if (!canvas) return;
        
        // 簡単なマインドマップの実装
        canvas.innerHTML = `
            <div class="mindmap-node root-node">
                <div class="node-content">
                    <input type="text" placeholder="メインタスク" class="node-input" value="${document.getElementById('task-name').value || 'タスク名'}">
                    <button class="add-child-btn" onclick="app.addMindmapChild(this)">+</button>
                </div>
            </div>
        `;
    }
    
    addMindmapChild(parentBtn) {
        const parentNode = parentBtn.closest('.mindmap-node');
        const childNode = document.createElement('div');
        childNode.className = 'mindmap-node child-node';
        childNode.innerHTML = `
            <div class="node-content">
                <input type="text" placeholder="サブタスク" class="node-input">
                <button class="add-child-btn" onclick="app.addMindmapChild(this)">+</button>
                <button class="remove-node-btn" onclick="app.removeMindmapNode(this)">×</button>
            </div>
        `;
        parentNode.appendChild(childNode);
    }
    
    removeMindmapNode(btn) {
        const node = btn.closest('.mindmap-node');
        if (node && !node.classList.contains('root-node')) {
            node.remove();
        }
    }
    
    saveNewTask() {
        const taskName = document.getElementById('task-name').value;
        const urgency = document.getElementById('task-urgency').value;
        const startDate = document.getElementById('task-start-date').value;
        const endDate = document.getElementById('task-end-date').value;
        
        if (!taskName.trim()) {
            alert('タスク名を入力してください。');
            return;
        }
        
        // 重複チェック：同じタイトルのタスクが既に存在するかチェック
        const currentTasks = this.getCurrentTasks();
        const existingTask = currentTasks.find(task => 
            task.title.trim().toLowerCase() === taskName.trim().toLowerCase()
        );
        
        if (existingTask) {
            this.showNotification('同じ名前のタスクが既に存在します。', 'error');
            return;
        }
        
        // マインドマップからサブタスクを取得
        const subtasks = this.extractSubtasksFromMindmap();
        
        // よりユニークなIDを生成
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        
        // 順序を決定（現在のタスク数の最大値+1）
        const maxOrder = currentTasks.length > 0 
            ? Math.max(...currentTasks.map(t => t.order || 0))
            : 0;
        
        // 新しいタスクを作成
        const newTask = {
            id: `task_${timestamp}_${randomId}`,
            title: taskName.trim(),
            description: '',
            priority: urgency === 'high' ? 1 : urgency === 'medium' ? 2 : 3,
            status: 'pending',
            isFocus: false,
            dueDate: endDate,
            startDate: startDate,
            estimatedTime: 60,
            actualTime: 0,
            timer: { isRunning: false, elapsed: 0 },
            order: maxOrder + 1, // 順序を追加
            subtasks: subtasks,
            createdAt: timestamp,
            updatedAt: timestamp,
            userId: this.currentUser ? this.currentUser.uid : 'unknown',
            viewMode: this.currentViewMode // 個人/チームモードを記録
        };
        
        // タスクリストに追加
        // 現在のモードに応じたタスク配列に追加
        currentTasks.push(newTask);
        this.setCurrentTasks(currentTasks);
        
        // 即座にユーザーデータを保存（永続化）
        this.saveUserData();
        
        // 成功メッセージ
        this.showNotification('✅ タスクが追加されました！', 'success');
        
        // タスクリストを更新
        this.renderTasks();
        
        // タスク管理ページに戻る
        this.navigateToPage('tasks');
    }
    
    extractSubtasksFromMindmap() {
        const subtasks = [];
        const nodes = document.querySelectorAll('#task-mindmap-canvas .child-node .node-input');
        nodes.forEach(node => {
            if (node.value.trim()) {
                subtasks.push({
                    id: 'subtask_' + Date.now() + '_' + Math.random(),
                    title: node.value.trim(),
                    completed: false
                });
            }
        });
        return subtasks;
    }
    
    
    async loadTasks() {
        // まずローカルストレージから読み込みを試行
        const loadedFromStorage = this.loadTasksFromStorage();
        
        if (!loadedFromStorage) {
            // ローカルストレージにデータがない場合はモックデータを使用
            const today = new Date().toISOString().split('T')[0]; // 今日の日付
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            const dayAfterTomorrow = new Date();
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
            const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];
            
            this.personalTasks = [
                {
                    id: 'task_1',
                    title: 'プロジェクト企画書作成',
                    description: '新プロジェクトの企画書を作成する',
                    priority: 1,
                    status: 'in_progress',
                    isFocus: true,
                    dueDate: today, // 今日のタスク
                    estimatedTime: 120,
                    actualTime: 90,
                    timer: { isRunning: false, elapsed: 5400, startTime: null, intervalId: null },
                    createdAt: Date.now() - 86400000,
                    updatedAt: Date.now(),
                    userId: this.currentUser ? this.currentUser.uid : 'test-user'
                },
                {
                    id: 'task_2',
                    title: '会議資料準備',
                    description: '来週の会議で使用する資料を準備する',
                    priority: 2,
                    status: 'pending',
                    isFocus: true,
                    dueDate: tomorrowStr, // 明日のタスク
                    estimatedTime: 60,
                    actualTime: 0,
                    timer: { isRunning: false, elapsed: 0, startTime: null, intervalId: null },
                    createdAt: Date.now() - 172800000,
                    updatedAt: Date.now(),
                    userId: this.currentUser ? this.currentUser.uid : 'test-user'
                },
                {
                    id: 'task_3',
                    title: 'システム設計レビュー',
                    description: '開発チームのシステム設計をレビューする',
                    priority: 3,
                    status: 'pending',
                    isFocus: true,
                    dueDate: dayAfterTomorrowStr, // 明後日のタスク
                    estimatedTime: 180,
                    actualTime: 0,
                    timer: { isRunning: false, elapsed: 0, startTime: null, intervalId: null },
                    createdAt: Date.now() - 259200000,
                    updatedAt: Date.now(),
                    userId: this.currentUser ? this.currentUser.uid : 'test-user'
                }
            ];
            
            console.log('📝 モックデータを作成:', {
                today: today,
                tomorrow: tomorrowStr,
                dayAfterTomorrow: dayAfterTomorrowStr,
                tasks: this.personalTasks.length
            });
            
            // 初期データをローカルストレージに保存
            this.saveTasksToStorage();
        }
        
        this.renderTasks();
    }
    
    async loadTeamData() {
        // チームデータの読み込み（モックデータ）
        this.teamMembers = [
            {
                id: 'user_1',
                name: '田中太郎',
                role: '管理者',
                completionRate: 90,
                tasksCompleted: 15,
                lastActive: '2024-01-15'
            },
            {
                id: 'user_2',
                name: '佐藤花子',
                role: 'メンバー',
                completionRate: 85,
                tasksCompleted: 12,
                lastActive: '2024-01-14'
            },
            {
                id: 'user_3',
                name: '鈴木一郎',
                role: 'メンバー',
                completionRate: 78,
                tasksCompleted: 8,
                lastActive: '2024-01-13'
            }
        ];
        
        this.renderTeamMembers();
    }
    
    async loadMindmap() {
        // マインドマップの読み込み
        console.log('Loading mindmap...');
    }
    
    renderTasks() {
        // 現在のモードに応じたタスクを取得
        const currentTasks = this.getCurrentTasks();
        
        // 今日のタスクを取得
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        
        const todayTasks = currentTasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate >= today && taskDate < tomorrow;
        });
        
        const tomorrowTasks = currentTasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate >= tomorrow && taskDate < dayAfterTomorrow;
        });
        
        const otherTasks = currentTasks.filter(task => {
            if (!task.dueDate) return true;
            const taskDate = new Date(task.dueDate);
            return taskDate < today || taskDate >= dayAfterTomorrow;
        });
        
        // 今日のタスクを表示
        this.renderTaskSection('today-tasks-list', todayTasks);
        document.getElementById('today-tasks-count').textContent = `${todayTasks.length}件`;
        
        // 明日のタスクを表示
        this.renderTaskSection('tomorrow-tasks-list', tomorrowTasks);
        document.getElementById('tomorrow-tasks-count').textContent = `${tomorrowTasks.length}件`;
        
        // その他のタスクを表示
        this.renderTaskSection('task-list', otherTasks);
        document.getElementById('other-tasks-count').textContent = `${otherTasks.length}件`;
        
        // イベントリスナーの設定
        this.setupTaskEventListeners();
    }
    
    renderTaskSection(containerId, tasks) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let html = '';
        if (tasks.length === 0) {
            html = '<div class="empty-state"><i class="fas fa-inbox"></i><p>タスクがありません</p></div>';
        } else {
            tasks.forEach(task => {
                const taskCard = new TaskCard(task, { showActions: true, showTimer: true, showPriority: true });
                html += taskCard.render();
            });
        }
        
        container.innerHTML = html;
    }
    
    createTaskCardHTML(task, isFocus) {
        const priorityLabels = {
            1: '🔥 最高',
            2: '⚡ 高',
            3: '📝 中',
            4: '📌 低'
        };
        
        const statusLabels = {
            pending: '未着手',
            in_progress: '進行中',
            completed: '完了'
        };
        
        const statusColors = {
            pending: '#1976d2',
            in_progress: '#f57c00',
            completed: '#2e7d32'
        };
        
        const formatTime = (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        
        return `
            <div class="task-card ${isFocus ? 'focus-task' : ''} priority-${task.priority} ${task.status === 'completed' ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <div class="task-priority">${priorityLabels[task.priority]}</div>
                </div>
                <div class="task-description">${task.description}</div>
                <div class="task-meta">
                    <div class="task-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${task.dueDate}</span>
                    </div>
                    <div class="task-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>見積: ${task.estimatedTime}分</span>
                    </div>
                    <div class="task-meta-item">
                        <i class="fas fa-chart-line"></i>
                        <span>実際: ${task.actualTime}分</span>
                    </div>
                </div>
                <div class="task-controls">
                    <label class="task-checkbox">
                        <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''} onchange="app.toggleTaskCompletion('${task.id}')">
                        <span class="checkmark"></span>
                    </label>
                    <div class="task-timer">
                        <button class="timer-btn ${task.timer.isRunning ? 'active' : ''}" onclick="app.toggleTimer('${task.id}')">
                            ⏱️ ${task.timer.isRunning ? 'ON' : 'OFF'}
                        </button>
                        <span class="timer-display">${formatTime(task.timer.elapsed)}</span>
                    </div>
                    <div class="task-status task-status-${task.status}">${statusLabels[task.status]}</div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-secondary" onclick="app.showTaskDetail('${task.id}')">詳細</button>
                    <button class="btn btn-sm btn-secondary" onclick="app.openMindmap('${task.id}')">マインドマップ</button>
                    <button class="btn btn-sm btn-secondary" onclick="app.moveTask('${task.id}', 'up')">↑</button>
                    <button class="btn btn-sm btn-secondary" onclick="app.moveTask('${task.id}', 'down')">↓</button>
                </div>
            </div>
        `;
    }
    
    renderTeamMembers() {
        const membersList = document.getElementById('members-list');
        if (!membersList) return;
        
        let html = '';
        this.teamMembers.forEach(member => {
            html += `
                <div class="member-item">
                    <div class="member-avatar">${member.name.charAt(0)}</div>
                    <div class="member-info">
                        <div class="member-name">${member.name}</div>
                        <div class="member-role">${member.role}</div>
                    </div>
                    <div class="member-metrics">
                        <div class="member-completion">${member.completionRate}%</div>
                        <div class="member-tasks">${member.tasksCompleted}タスク</div>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${member.completionRate}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        membersList.innerHTML = html;
    }
    
    setupTaskEventListeners() {
        // タスクカードのドラッグ&ドロップ
        const taskCards = document.querySelectorAll('.task-card');
        taskCards.forEach(card => {
            card.draggable = true;
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.dataset.taskId);
                card.classList.add('dragging');
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
            
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                card.classList.add('drag-over');
            });
            
            card.addEventListener('dragleave', () => {
                card.classList.remove('drag-over');
            });
            
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                const draggedTaskId = e.dataTransfer.getData('text/plain');
                const targetTaskId = card.dataset.taskId;
                this.reorderTasks(draggedTaskId, targetTaskId);
            });
        });
    }
    
    async updatePersonalKPI() {
        // 個人KPIの更新（実際のデータに基づく）
        const completionRate = document.getElementById('personal-completion-rate');
        const tasksCompleted = document.getElementById('personal-tasks-completed');
        const streak = document.getElementById('personal-streak');
        
        // 現在のモードに応じたタスクデータから計算
        const currentTasks = this.getCurrentTasks();
        const totalTasks = currentTasks.length;
        const completedTasks = currentTasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = currentTasks.filter(t => t.status === 'in_progress').length;
        const pendingTasks = currentTasks.filter(t => t.status === 'pending').length;
        
        // 完了率の計算
        const actualCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // ストリークの計算
        const actualStreak = this.calculateStreak();
        
        // 今日のタスク数
        const todayTasks = this.getTodayTasks();
        const todayCompleted = todayTasks.filter(t => t.status === 'completed').length;
        
        // 今週のタスク数
        const weekTasks = this.getWeekTasks();
        const weekCompleted = weekTasks.filter(t => t.status === 'completed').length;
        
        // 平均作業時間
        const avgWorkTime = this.calculateAverageWorkTime();
        
        if (completionRate) completionRate.textContent = `${actualCompletionRate}%`;
        if (tasksCompleted) tasksCompleted.textContent = completedTasks;
        if (streak) streak.textContent = `${actualStreak}日`;
        
        console.log(`個人KPI更新: 完了率=${actualCompletionRate}%, 完了タスク=${completedTasks}, ストリーク=${actualStreak}日`);
        console.log(`詳細: 総タスク=${totalTasks}, 完了=${completedTasks}, 進行中=${inProgressTasks}, 未着手=${pendingTasks}`);
        console.log(`今日のタスク: ${todayTasks.length}件, 完了: ${todayCompleted}件`);
        console.log(`今週のタスク: ${weekTasks.length}件, 完了: ${weekCompleted}件`);
        console.log(`平均作業時間: ${avgWorkTime}分`);
    }
    
    // ストリーク計算
    calculateStreak() {
        const today = new Date();
        let streak = 0;
        const tasks = this.getCurrentTasks();
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayTasks = tasks.filter(t => {
                const taskDate = new Date(t.updatedAt).toISOString().split('T')[0];
                return taskDate === dateStr && t.status === 'completed';
            });
            
            if (dayTasks.length > 0) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    // 今日のタスク取得
    getTodayTasks() {
        const currentTasks = this.getCurrentTasks();
        const today = new Date().toISOString().split('T')[0]; // 今日の日付を "YYYY-MM-DD" 形式で取得
        
        console.log('🔍 今日のタスクを検索中...', {
            today: today,
            totalTasks: currentTasks.length,
            tasksWithDueDate: currentTasks.filter(t => t.dueDate).length
        });
        
        const todayTasks = currentTasks.filter(task => {
            if (!task.dueDate) {
                return false;
            }
            // 日付文字列を直接比較
            const taskDate = task.dueDate.split('T')[0]; // "YYYY-MM-DD" 形式に変換
            const isTodayTask = taskDate === today;
            
            if (isTodayTask) {
                console.log('✅ 今日のタスク:', {
                    title: task.title,
                    dueDate: task.dueDate,
                    taskDate: taskDate,
                    today: today
                });
            }
            
            return isTodayTask;
        });
        
        console.log(`📊 今日のタスク数: ${todayTasks.length}件`);
        return todayTasks;
    }
    
    // 今週のタスク取得
    getWeekTasks() {
        const currentTasks = this.getCurrentTasks();
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // 今週の月曜日
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // 今週の日曜日
        
        return currentTasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate >= weekStart && taskDate <= weekEnd;
        });
    }
    
    // 平均作業時間の計算
    calculateAverageWorkTime() {
        const currentTasks = this.getCurrentTasks();
        const tasksWithTime = currentTasks.filter(t => t.actualTime > 0);
        if (tasksWithTime.length === 0) return 0;
        
        const totalTime = tasksWithTime.reduce((sum, task) => sum + task.actualTime, 0);
        return Math.round(totalTime / tasksWithTime.length);
    }
    
    // 生産性スコアの計算
    calculateProductivityScore() {
        const tasks = this.getCurrentTasks();
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        const streak = this.calculateStreak();
        const avgWorkTime = this.calculateAverageWorkTime();
        
        // 生産性スコアの計算（0-100）
        const score = Math.min(100, Math.round(
            (completionRate * 0.4) + 
            (Math.min(streak, 30) * 2) + 
            (Math.min(avgWorkTime / 60, 8) * 5)
        ));
        
        return score;
    }
    
    // タスクの優先度分布
    getPriorityDistribution() {
        const tasks = this.getCurrentTasks();
        const distribution = {
            high: tasks.filter(t => t.priority === 1).length,
            medium: tasks.filter(t => t.priority === 2).length,
            low: tasks.filter(t => t.priority >= 3).length
        };
        return distribution;
    }
    
    // 期限切れタスクの取得
    getOverdueTasks() {
        const today = new Date().toISOString().split('T')[0];
        const tasks = this.getCurrentTasks();
        return tasks.filter(task => 
            task.dueDate && 
            task.dueDate < today && 
            task.status !== 'completed'
        );
    }
    
    async updateTeamKPI() {
        // チームKPIの更新
        const teamCompletionRate = document.getElementById('team-completion-rate');
        const teamTasksCompleted = document.getElementById('team-tasks-completed');
        const teamAvgLeadTime = document.getElementById('team-avg-lead-time');
        
        if (teamCompletionRate) teamCompletionRate.textContent = '78%';
        if (teamTasksCompleted) teamTasksCompleted.textContent = '45';
        if (teamAvgLeadTime) teamAvgLeadTime.textContent = '2.3日';
    }
    
    async updateFocusTasks() {
        // フォーカスタスクの更新
        const focusTasks = document.getElementById('focus-tasks');
        if (!focusTasks) return;
        
        const tasks = this.getCurrentTasks();
        const focusTaskList = tasks.filter(task => task.isFocus);
        let html = '';
        
        focusTaskList.forEach(task => {
            html += `
                <div class="focus-task">
                    <div class="task-title">${task.title}</div>
                    <div class="task-timer">${Math.floor(task.timer.elapsed / 3600)}:${Math.floor((task.timer.elapsed % 3600) / 60)}:${task.timer.elapsed % 60}</div>
                </div>
            `;
        });
        
        focusTasks.innerHTML = html;
    }
    
    async updateTeamFocusTasks() {
        // チームフォーカスタスクの更新
        const teamFocusTasks = document.getElementById('team-focus-tasks');
        if (!teamFocusTasks) return;
        
        // モックデータ
        const teamTasks = [
            { title: 'プロジェクト企画書作成', timer: 5400, assignee: '田中太郎' },
            { title: '会議資料準備', timer: 0, assignee: '佐藤花子' },
            { title: 'システム設計レビュー', timer: 0, assignee: '鈴木一郎' },
            { title: 'コードレビュー', timer: 1800, assignee: '田中太郎' },
            { title: 'テストケース作成', timer: 0, assignee: '佐藤花子' }
        ];
        
        let html = '';
        teamTasks.forEach(task => {
            const hours = Math.floor(task.timer / 3600);
            const minutes = Math.floor((task.timer % 3600) / 60);
            const seconds = task.timer % 60;
            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            html += `
                <div class="focus-task">
                    <div class="task-title">${task.title}</div>
                    <div class="task-assignee">担当: ${task.assignee}</div>
                    <div class="task-timer">${timeStr}</div>
                </div>
            `;
        });
        
        teamFocusTasks.innerHTML = html;
    }
    
    async initializePersonalCharts() {
        // 個人チャートの初期化
        this.initializeProgressChart();
        this.initializeTimeChart();
    }
    
    async initializeTeamCharts() {
        // チームチャートの初期化
        this.initializeTeamProgressChart();
        this.initializeTeamTimeChart();
    }
    
    async initializeCharts() {
        // チャートの初期化（後方互換性のため）
        if (this.currentViewMode === 'personal') {
            await this.initializePersonalCharts();
        } else {
            await this.initializeTeamCharts();
        }
    }
    
    initializeProgressChart() {
        const ctx = document.getElementById('progress-chart');
        if (!ctx) return;
        
        // 既存のチャートを破棄
        if (this.progressChart) {
            this.progressChart.destroy();
            this.progressChart = null;
        }
        
        // 実際のタスクデータから計算
        const tasks = this.getCurrentTasks();
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
        const pendingTasks = tasks.filter(t => t.status === 'pending').length;
        const totalTasks = tasks.length;
        
        // 完了率の計算
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        this.progressChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['完了', '進行中', '未着手'],
                datasets: [{
                    data: [completedTasks, inProgressTasks, pendingTasks],
                    backgroundColor: ['#4CAF50', '#FF9800', '#2196F3'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `タスク完了状況 (${completionRate}%)`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value}件 (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        console.log(`進捗チャート初期化: 完了=${completedTasks}, 進行中=${inProgressTasks}, 未着手=${pendingTasks}, 完了率=${completionRate}%`);
    }
    
    // 進捗チャートの更新
    updateProgressChart() {
        if (!this.progressChart) return;
        
        const tasks = this.getCurrentTasks();
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
        const pendingTasks = tasks.filter(t => t.status === 'pending').length;
        
        this.progressChart.data.datasets[0].data = [completedTasks, inProgressTasks, pendingTasks];
        this.progressChart.update();
        
        console.log(`進捗チャート更新: 完了=${completedTasks}, 進行中=${inProgressTasks}, 未着手=${pendingTasks}`);
    }
    
    initializeTimeChart() {
        const ctx = document.getElementById('time-chart');
        if (!ctx) return;
        
        // 既存のチャートを破棄
        if (this.timeChart) {
            this.timeChart.destroy();
            this.timeChart = null;
        }
        
        // 過去7日間の作業時間を計算
        const timeData = this.calculateWeeklyTimeData();
        const totalTime = timeData.reduce((sum, time) => sum + time, 0);
        const avgTime = timeData.length > 0 ? Math.round(totalTime / timeData.length * 10) / 10 : 0;
        
        this.timeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['月', '火', '水', '木', '金', '土', '日'],
                datasets: [{
                    label: '作業時間 (時間)',
                    data: timeData,
                    backgroundColor: timeData.map((time, index) => {
                        // 今日の場合は特別な色
                        const today = new Date().getDay();
                        const dayIndex = today === 0 ? 6 : today - 1;
                        return index === dayIndex ? '#2E7D32' : '#008b8b';
                    }),
                    borderColor: '#ffffff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `今週の作業時間 (平均: ${avgTime}時間)`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const minutes = Math.round(value * 60);
                                return `${context.label}: ${value}時間 (${minutes}分)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '時間',
                            font: {
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                return value + 'h';
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '曜日',
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
        
        console.log(`時間チャート初期化: データ=${timeData}, 合計=${totalTime}時間, 平均=${avgTime}時間`);
    }
    
    // 週間時間データの計算
    calculateWeeklyTimeData() {
        const timeData = [0, 0, 0, 0, 0, 0, 0]; // 月〜日
        const today = new Date();
        
        // 過去7日間のデータを計算
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayOfWeek = date.getDay(); // 0=日曜日, 1=月曜日, ...
            const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 月曜日を0に調整
            
            // その日のタスクの実際の作業時間を合計
            const dayTasks = this.getCurrentTasks().filter(task => {
                const taskDate = new Date(task.updatedAt);
                return taskDate.toDateString() === date.toDateString();
            });
            
            const dayTime = dayTasks.reduce((total, task) => {
                return total + (task.actualTime || 0);
            }, 0);
            
            timeData[dayIndex] = Math.round(dayTime / 60); // 分を時間に変換
        }
        
        return timeData;
    }
    
    // 時間チャートの更新
    updateTimeChart() {
        if (!this.timeChart) return;
        
        const timeData = this.calculateWeeklyTimeData();
        this.timeChart.data.datasets[0].data = timeData;
        this.timeChart.update();
        
        console.log(`時間チャート更新: データ=${timeData}`);
    }
    
    initializeTeamProgressChart() {
        const ctx = document.getElementById('team-progress-chart');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['完了', '進行中', '未着手'],
                datasets: [{
                    data: [25, 8, 12],
                    backgroundColor: ['#4CAF50', '#FF9800', '#2196F3']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'チームタスク完了状況'
                    }
                }
            }
        });
    }
    
    initializeTeamTimeChart() {
        const ctx = document.getElementById('team-time-chart');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['月', '火', '水', '木', '金', '土', '日'],
                datasets: [{
                    label: 'チーム作業時間 (時間)',
                    data: [24, 32, 16, 28, 20, 8, 4],
                    backgroundColor: '#008b8b'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '時間'
                        }
                    }
                }
            }
        });
    }
    
    // タスク操作メソッド
    toggleTaskCompletion(taskId) {
        const tasks = this.getCurrentTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.status = task.status === 'completed' ? 'pending' : 'completed';
            task.updatedAt = Date.now();
            
            // ローカルストレージに保存
            this.saveTasksToStorage();
            
            // チャートを更新
            this.updateProgressChart();
            this.updatePersonalKPI();
            
            console.log(`タスク完了状態変更: ${task.title} - ${task.status}`);
            this.renderTasks();
            
            // ダッシュボードの今日のタスクも更新
            if (window.dashboardPage) {
                window.dashboardPage.updateTodayTasksDashboard();
            }
        }
    }
    
    // ダッシュボード用のタスク完了切り替え
    toggleTaskCompletionDashboard(taskId) {
        this.toggleTaskCompletion(taskId);
    }
    
    // ダッシュボードでタスクを上に移動
    moveTaskUpDashboard(taskId) {
        const allTasks = this.getCurrentTasks();
        const today = new Date().toISOString().split('T')[0]; // 今日の日付を "YYYY-MM-DD" 形式で取得
        
        // 今日のタスクをフィルタリングしてソート
        const todayTasks = allTasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = task.dueDate.split('T')[0];
            return taskDate === today;
        }).sort((a, b) => (a.order || 0) - (b.order || 0));
        
        const currentIndex = todayTasks.findIndex(t => t.id === taskId);
        
        if (currentIndex > 0) {
            // 順序を入れ替え
            const currentTask = todayTasks[currentIndex];
            const prevTask = todayTasks[currentIndex - 1];
            
            // orderプロパティを交換
            const tempOrder = currentTask.order || 0;
            currentTask.order = prevTask.order || 0;
            prevTask.order = tempOrder;
            
            // タスクを更新して保存
            this.setCurrentTasks(allTasks);
            this.saveTasksToStorage();
            this.renderTasks();
            
            // ダッシュボードの今日のタスクを更新
            if (window.dashboardPage) {
                window.dashboardPage.updateTodayTasksDashboard();
            }
            
            console.log('タスクを上に移動:', taskId);
        }
    }
    
    // ダッシュボードでタスクを下に移動
    moveTaskDownDashboard(taskId) {
        const allTasks = this.getCurrentTasks();
        const today = new Date().toISOString().split('T')[0]; // 今日の日付を "YYYY-MM-DD" 形式で取得
        
        // 今日のタスクをフィルタリングしてソート
        const todayTasks = allTasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = task.dueDate.split('T')[0];
            return taskDate === today;
        }).sort((a, b) => (a.order || 0) - (b.order || 0));
        
        const currentIndex = todayTasks.findIndex(t => t.id === taskId);
        
        if (currentIndex < todayTasks.length - 1) {
            // 順序を入れ替え
            const currentTask = todayTasks[currentIndex];
            const nextTask = todayTasks[currentIndex + 1];
            
            // orderプロパティを交換
            const tempOrder = currentTask.order || 0;
            currentTask.order = nextTask.order || 0;
            nextTask.order = tempOrder;
            
            // タスクを更新して保存
            this.setCurrentTasks(allTasks);
            this.saveTasksToStorage();
            this.renderTasks();
            
            // ダッシュボードの今日のタスクを更新
            if (window.dashboardPage) {
                window.dashboardPage.updateTodayTasksDashboard();
            }
            
            console.log('タスクを下に移動:', taskId);
        }
    }
    
    toggleTimer(taskId) {
        const tasks = this.getCurrentTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            if (task.timer.isRunning) {
                // タイマーを停止
                task.timer.isRunning = false;
                task.timer.elapsed += Date.now() - task.timer.startTime;
                task.actualTime = Math.floor(task.timer.elapsed / 60); // 分に変換
                task.timer.startTime = null;
                
                // ローカルストレージに保存
                this.saveTasksToStorage();
                
                // 時間チャートを更新
                this.updateTimeChart();
                
                console.log(`タイマー停止: ${task.title} - 経過時間: ${Math.floor(task.timer.elapsed / 60)}分`);
            } else {
                // タイマーを開始
                task.timer.isRunning = true;
                task.timer.startTime = Date.now();
                
                console.log(`タイマー開始: ${task.title}`);
            }
            this.renderTasks();
            
            // タイマー表示の更新
            this.updateTimerDisplay(taskId);
        }
    }
    
    // タイマー表示の更新
    updateTimerDisplay(taskId) {
        const tasks = this.getCurrentTasks();
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const timerDisplay = document.querySelector(`[data-task-id="${taskId}"] .timer-display`);
        if (timerDisplay) {
            const updateDisplay = () => {
                if (task.timer.isRunning) {
                    const currentElapsed = task.timer.elapsed + (Date.now() - task.timer.startTime);
                    const hours = Math.floor(currentElapsed / 3600);
                    const minutes = Math.floor((currentElapsed % 3600) / 60);
                    const seconds = Math.floor(currentElapsed % 60);
                    timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            };
            
            // 既存のタイマーをクリア
            if (task.timer.intervalId) {
                clearInterval(task.timer.intervalId);
            }
            
            if (task.timer.isRunning) {
                updateDisplay();
                const intervalId = setInterval(updateDisplay, 1000);
                task.timer.intervalId = intervalId;
                this.addInterval(intervalId); // タイマー管理に追加
            } else {
                const hours = Math.floor(task.timer.elapsed / 3600);
                const minutes = Math.floor((task.timer.elapsed % 3600) / 60);
                const seconds = Math.floor(task.timer.elapsed % 60);
                timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    }
    
    // 全タイマーの更新
    updateAllTimers() {
        const tasks = this.getCurrentTasks();
        tasks.forEach(task => {
            if (task.timer.isRunning) {
                this.updateTimerDisplay(task.id);
            }
        });
    }
    
    // タスクをローカルストレージに保存
    saveTasksToStorage() {
        this.saveUserData();
    }
    
    // ローカルストレージからタスクを読み込み
    loadTasksFromStorage() {
        this.loadUserData();
        return true;
    }
    
    showTaskDetail(taskId) {
        const tasks = this.getCurrentTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            this.showModal('タスク詳細', `
                <div class="task-detail">
                    <h3>${task.title}</h3>
                    <p>${task.description}</p>
                    <div class="task-meta">
                        <p><strong>優先度:</strong> ${task.priority}</p>
                        <p><strong>ステータス:</strong> ${task.status}</p>
                        <p><strong>期限:</strong> ${task.dueDate}</p>
                        <p><strong>見積時間:</strong> ${task.estimatedTime}分</p>
                        <p><strong>実際時間:</strong> ${task.actualTime}分</p>
                    </div>
                </div>
            `);
        }
    }
    
    openMindmap(taskId) {
        this.navigateToPage('mindmap');
    }
    
    moveTask(taskId, direction) {
        const tasks = this.getCurrentTasks();
        const currentIndex = tasks.findIndex(t => t.id === taskId);
        
        if (currentIndex === -1) return;
        
        let newIndex;
        if (direction === 'up' && currentIndex > 0) {
            newIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < tasks.length - 1) {
            newIndex = currentIndex + 1;
        } else {
            return; // 移動できない
        }
        
        // タスクを移動
        const task = tasks.splice(currentIndex, 1)[0];
        tasks.splice(newIndex, 0, task);
        
        // 現在のタスク配列を更新
        this.setCurrentTasks(tasks);
        
        // ローカルストレージに保存
        this.saveTasksToStorage();
        
        // タスクリストを再描画
        this.renderTasks();
        
        console.log(`タスク移動完了: ${task.title} を ${direction} に移動`);
    }
    
    reorderTasks(draggedId, targetId) {
        const tasks = this.getCurrentTasks();
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const targetIndex = tasks.findIndex(t => t.id === targetId);
        
        if (draggedIndex >= 0 && targetIndex >= 0 && draggedIndex !== targetIndex) {
            // ドラッグされたタスクを配列から削除
            const draggedTask = tasks.splice(draggedIndex, 1)[0];
            
            // 新しい位置に挿入
            tasks.splice(targetIndex, 0, draggedTask);
            
            // 現在のタスク配列を更新
            this.setCurrentTasks(tasks);
            
            // ローカルストレージに保存
            this.saveTasksToStorage();
            
            // タスクリストを再描画
            this.renderTasks();
            
            console.log(`タスクの並び替え完了: ${draggedTask.title} を位置 ${targetIndex} に移動`);
        }
    }
    
    // モーダル操作
    showModal(title, content) {
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalOverlay = document.getElementById('modal-overlay');
        
        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = content;
        if (modalOverlay) modalOverlay.classList.remove('hidden');
    }
    
    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        const profileModal = document.getElementById('profile-modal');
        const loginModal = document.getElementById('login-modal');
        const settingsModal = document.getElementById('settings-modal');
        const memberRegistrationModal = document.getElementById('member-registration-modal');
        const accountSettingsModal = document.getElementById('account-settings-modal');
        const adminLoginModal = document.getElementById('admin-login-modal');
        const adminPanelModal = document.getElementById('admin-panel-modal');
        const memberEditModal = document.getElementById('member-edit-modal');
        const memberDeleteModal = document.getElementById('member-delete-modal');
        
        if (modalOverlay) modalOverlay.classList.add('hidden');
        
        // プロフィールモーダルを閉じる
        if (profileModal) {
            profileModal.classList.add('hidden');
            profileModal.style.display = 'none';
            profileModal.style.visibility = 'hidden';
            profileModal.style.opacity = '0';
        }
        
        // ログインモーダルを閉じる
        if (loginModal) {
            loginModal.classList.add('hidden');
            loginModal.style.display = 'none';
            loginModal.style.visibility = 'hidden';
            loginModal.style.opacity = '0';
        }
        
        // 設定モーダルを閉じる
        if (settingsModal) {
            settingsModal.classList.add('hidden');
            settingsModal.style.display = 'none';
            settingsModal.style.visibility = 'hidden';
            settingsModal.style.opacity = '0';
        }
        
        // メンバー登録モーダルを閉じる
        if (memberRegistrationModal) {
            memberRegistrationModal.classList.add('hidden');
            memberRegistrationModal.style.display = 'none';
            memberRegistrationModal.style.visibility = 'hidden';
            memberRegistrationModal.style.opacity = '0';
        }
        
        // アカウント設定モーダルを閉じる
        if (accountSettingsModal) {
            accountSettingsModal.classList.add('hidden');
            accountSettingsModal.style.display = 'none';
            accountSettingsModal.style.visibility = 'hidden';
            accountSettingsModal.style.opacity = '0';
        }
        
        // 管理画面ログインモーダルを閉じる
        if (adminLoginModal) {
            adminLoginModal.classList.add('hidden');
            adminLoginModal.style.display = 'none';
            adminLoginModal.style.visibility = 'hidden';
            adminLoginModal.style.opacity = '0';
        }
        
        // 管理画面モーダルを閉じる
        if (adminPanelModal) {
            adminPanelModal.classList.add('hidden');
            adminPanelModal.style.display = 'none';
            adminPanelModal.style.visibility = 'hidden';
            adminPanelModal.style.opacity = '0';
        }
        
        // メンバー編集モーダルを閉じる
        if (memberEditModal) {
            memberEditModal.classList.add('hidden');
            memberEditModal.style.display = 'none';
            memberEditModal.style.visibility = 'hidden';
            memberEditModal.style.opacity = '0';
        }
        
        // メンバー削除確認モーダルを閉じる
        if (memberDeleteModal) {
            memberDeleteModal.classList.add('hidden');
            memberDeleteModal.style.display = 'none';
            memberDeleteModal.style.visibility = 'hidden';
            memberDeleteModal.style.opacity = '0';
        }
        
        // 編集中のメンバーIDと削除対象IDをクリア
        this.editingMemberId = null;
        this.deletingMemberId = null;
        
        console.log('🔒 全てのモーダルを閉じました');
    }
    
    showError(message) {
        alert(message);
    }
    
    showUserMenu() {
        const modalContent = `
            <div class="user-menu">
                <div class="menu-section">
                    <h4>データ管理</h4>
                    <button class="btn btn-secondary" onclick="app.exportData()">
                        <i class="fas fa-download"></i> データエクスポート
                    </button>
                    <button class="btn btn-secondary" onclick="app.showImportDialog()">
                        <i class="fas fa-upload"></i> データインポート
                    </button>
                    <button class="btn btn-secondary" onclick="app.createBackup()">
                        <i class="fas fa-save"></i> バックアップ作成
                    </button>
                    <button class="btn btn-secondary" onclick="app.restoreFromBackup()">
                        <i class="fas fa-undo"></i> バックアップ復元
                    </button>
                </div>
                <div class="menu-section">
                    <h4>設定</h4>
                    <button class="btn btn-secondary" onclick="app.showSettings()">
                        <i class="fas fa-cog"></i> 設定
                    </button>
                    <button class="btn btn-secondary" onclick="app.showAbout()">
                        <i class="fas fa-info-circle"></i> アプリについて
                    </button>
                </div>
                <div class="menu-section">
                    <button class="btn btn-danger" onclick="app.logout()">
                        <i class="fas fa-sign-out-alt"></i> ログアウト
                    </button>
                </div>
            </div>
        `;
        
        this.showModal('ユーザーメニュー', modalContent);
    }
    
    // インポートダイアログの表示
    showImportDialog() {
        const modalContent = `
            <div class="import-dialog">
                <p>JSONファイルを選択してください</p>
                <input type="file" id="import-file" accept=".json" onchange="app.importData(this)">
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">キャンセル</button>
                </div>
            </div>
        `;
        
        this.showModal('データインポート', modalContent);
    }
    
    // 設定画面の表示
    showSettings() {
        const modalContent = `
            <div class="settings-dialog">
                <div class="form-group">
                    <label for="notification-interval">通知チェック間隔（分）</label>
                    <input type="number" id="notification-interval" value="5" min="1" max="60">
                </div>
                <div class="form-group">
                    <label for="auto-backup">自動バックアップ</label>
                    <input type="checkbox" id="auto-backup" checked>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-primary" onclick="app.saveSettings()">保存</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">キャンセル</button>
                </div>
            </div>
        `;
        
        this.showModal('設定', modalContent);
    }
    
    // 設定の保存
    saveSettings() {
        const interval = document.getElementById('notification-interval').value;
        const autoBackup = document.getElementById('auto-backup').checked;
        
        // 設定をローカルストレージに保存
        localStorage.setItem('atd_settings', JSON.stringify({
            notificationInterval: parseInt(interval),
            autoBackup: autoBackup
        }));
        
        // 通知システムを再起動
        this.stopNotificationSystem();
        this.startNotificationSystem();
        
        this.closeModal();
        this.showNotification('設定が保存されました', 'info');
    }
    
    // アプリについて
    showAbout() {
        const modalContent = `
            <div class="about-dialog">
                <h3>ATD - ARS TODO Management System</h3>
                <p>バージョン: 1.0.0</p>
                <p>開発者: ATD Team</p>
                <p>ライセンス: MIT</p>
                <p>このアプリケーションは、タスク管理とチーム協働を支援するためのツールです。</p>
            </div>
        `;
        
        this.showModal('アプリについて', modalContent);
    }
    
    // ログアウト
    
    showAddTaskModal() {
        this.showModal('タスク追加', `
            <form id="add-task-form">
                <div class="form-group">
                    <label for="task-title">タスク名</label>
                    <input type="text" id="task-title" required>
                </div>
                <div class="form-group">
                    <label for="task-description">詳細</label>
                    <textarea id="task-description"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="task-priority">優先度</label>
                        <select id="task-priority">
                            <option value="1">🔥 最高</option>
                            <option value="2">⚡ 高</option>
                            <option value="3">📝 中</option>
                            <option value="4">📌 低</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="task-due-date">期限</label>
                        <input type="date" id="task-due-date">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">追加</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">キャンセル</button>
                </div>
            </form>
        `);
        
        // フォーム送信処理を追加（重複防止）
        this.safeAddEventListener('add-task-form', 'submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleAddTask();
        });
    }
    
    handleAddTask() {
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = parseInt(document.getElementById('task-priority').value);
        const dueDate = document.getElementById('task-due-date').value;
        
        if (!title.trim()) {
            this.showNotification('タスク名を入力してください。', 'error');
            return;
        }
        
        // 重複チェック：同じタイトルのタスクが既に存在するかチェック
        const currentTasks = this.getCurrentTasks();
        const existingTask = currentTasks.find(task => 
            task.title.trim().toLowerCase() === title.trim().toLowerCase()
        );
        
        if (existingTask) {
            this.showNotification('同じ名前のタスクが既に存在します。', 'error');
            return;
        }
        
        // 新しいタスクを作成（よりユニークなID生成）
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        
        // 順序を決定（現在のタスク数の最大値+1）
        const maxOrder = currentTasks.length > 0 
            ? Math.max(...currentTasks.map(t => t.order || 0))
            : 0;
        
        const newTask = {
            id: `task_${timestamp}_${randomId}`,
            title: title.trim(),
            description: description.trim(),
            priority: priority,
            status: 'pending',
            isFocus: false,
            dueDate: dueDate || new Date().toISOString().split('T')[0],
            estimatedTime: 60, // デフォルト60分
            actualTime: 0,
            timer: { isRunning: false, elapsed: 0 },
            order: maxOrder + 1, // 順序を追加
            createdAt: timestamp,
            updatedAt: timestamp,
            userId: this.currentUser ? this.currentUser.uid : 'unknown',
            viewMode: this.currentViewMode // 個人/チームモードを記録
        };
        
        // 現在のモードに応じたタスク配列に追加
        currentTasks.push(newTask);
        this.setCurrentTasks(currentTasks);
        
        // 即座にユーザーデータを保存（永続化）
        this.saveUserData();
        
        // 追加の保存確認（デバッグ用）
        console.log('タスク追加後のデータ:', {
            personalTasks: this.personalTasks.length,
            teamTasks: this.teamTasks.length,
            currentMode: this.currentViewMode,
            newTask: newTask
        });
        
        // タスクリストを再描画
        this.renderTasks();
        
        // 成功メッセージ
        this.showNotification('✅ タスクが追加されました！', 'success');
        
        // フォームをクリア
        document.getElementById('task-title').value = '';
        document.getElementById('task-description').value = '';
        document.getElementById('task-priority').value = '2';
        document.getElementById('task-due-date').value = '';
        
        // モーダルを閉じる
        this.closeModal();
    }
    
    showMindmapBreakdown() {
        this.navigateToPage('mindmap');
    }
    
    showCreateTeamModal() {
        this.showModal('チーム作成', `
            <form id="create-team-form">
                <div class="form-group">
                    <label for="team-name">チーム名</label>
                    <input type="text" id="team-name" required>
                </div>
                <div class="form-group">
                    <label for="team-description">説明</label>
                    <textarea id="team-description"></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">作成</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">キャンセル</button>
                </div>
            </form>
        `);
    }
    
    showInviteMemberModal() {
        this.showModal('メンバー招待', `
            <form id="invite-member-form">
                <div class="form-group">
                    <label for="invite-email">メールアドレス</label>
                    <input type="email" id="invite-email" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">招待</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">キャンセル</button>
                </div>
            </form>
        `);
    }
    
    addMindmapNode() {
        console.log('Adding mindmap node');
        // マインドマップページに遷移してノード追加
        this.navigateToPage('mindmap');
    }
    
    generateTasksFromMindmap() {
        console.log('Generating tasks from mindmap');
        // マインドマップからタスクを生成
        if (window.mindmapPage && window.mindmapPage.generateTasksFromMindmap) {
            window.mindmapPage.generateTasksFromMindmap();
        }
    }
    
    // 通知システムの開始
    startNotificationSystem() {
        // 既存のインターバルをクリア
        if (this.notificationCheckInterval) {
            clearInterval(this.notificationCheckInterval);
        }
        
        // 通知権限のリクエスト
        this.requestNotificationPermission();
        
        // 5分ごとに通知をチェック
        this.notificationCheckInterval = setInterval(() => {
            this.checkTaskDeadlines();
            this.checkOverdueTasks();
            this.checkProductivityGoals();
            this.checkTeamUpdates();
        }, 5 * 60 * 1000); // 5分
        
        this.addInterval(this.notificationCheckInterval); // タイマー管理に追加
        
        // 毎日朝9時に日次レポートを送信
        this.scheduleDailyReport();
        
        console.log('通知システム開始');
    }
    
    // 通知権限のリクエスト
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('通知権限が許可されました');
            }
        }
    }
    
    // 日次レポートのスケジュール
    scheduleDailyReport() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0); // 明日の朝9時
        
        const timeUntilReport = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.sendDailyReport();
            // 24時間後に再スケジュール
            this.scheduleDailyReport();
        }, timeUntilReport);
    }
    
    // 日次レポートの送信
    sendDailyReport() {
        const today = new Date().toLocaleDateString('ja-JP');
        const tasks = this.getCurrentTasks();
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const totalTasks = tasks.length;
        const streak = this.calculateStreak();
        
        const message = `📊 ${today}の日次レポート\n` +
                      `✅ 完了タスク: ${completedTasks}/${totalTasks}\n` +
                      `🔥 連続達成: ${streak}日\n` +
                      `💪 今日も頑張りましょう！`;
        
        this.showNotification(message, 'info');
        this.showBrowserNotification('ATD 日次レポート', message);
    }
    
    // 生産性目標のチェック
    checkProductivityGoals() {
        const productivityScore = this.calculateProductivityScore();
        const todayTasks = this.getTodayTasks();
        const completedToday = todayTasks.filter(t => t.status === 'completed').length;
        
        // 生産性スコアが低い場合の通知
        if (productivityScore < 50) {
            this.showNotification('📈 生産性スコアが低めです。タスクの優先度を見直してみませんか？', 'warning');
        }
        
        // 今日のタスク完了率が低い場合
        if (todayTasks.length > 0 && completedToday / todayTasks.length < 0.3) {
            this.showNotification('⏰ 今日のタスク進捗が遅れています。集中時間を設けてみませんか？', 'warning');
        }
        
        // 生産性スコアが高い場合の褒め通知
        if (productivityScore > 80) {
            this.showNotification('🎉 素晴らしい生産性です！この調子で頑張りましょう！', 'success');
        }
    }
    
    // チーム更新のチェック
    checkTeamUpdates() {
        // チームメンバーの活動状況をチェック
        const teamMembers = this.teamMembers || [];
        const activeMembers = teamMembers.filter(member => {
            const lastActive = new Date(member.lastActive);
            const today = new Date();
            const diffDays = (today - lastActive) / (1000 * 60 * 60 * 24);
            return diffDays <= 1; // 1日以内に活動
        });
        
        if (teamMembers.length > 0 && activeMembers.length / teamMembers.length < 0.5) {
            this.showNotification('👥 チームメンバーの活動が少ないようです。連絡を取ってみませんか？', 'info');
        }
    }
    
    // 通知システムの停止
    stopNotificationSystem() {
        console.log('🔔 通知システム停止中...');
        
        if (this.notificationCheckInterval) {
            clearInterval(this.notificationCheckInterval);
            this.removeInterval(this.notificationCheckInterval); // タイマー管理から削除
            this.notificationCheckInterval = null;
            console.log('✅ 通知システムインターバルクリア');
        }
        
        // 全てのアクティブな通知をクリア
        this.clearAllNotifications();
        
        console.log('✅ 通知システム停止完了');
    }
    
    // 全ての通知をクリア
    clearAllNotifications() {
        // DOM通知をクリア
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.remove();
            }
        });
        
        // ブラウザ通知をクリア
        if ('Notification' in window && Notification.permission === 'granted') {
            // ブラウザ通知は自動的にクリアされるが、明示的にクリア
            console.log('🔔 ブラウザ通知をクリア');
        }
        
        // 通知配列をクリア
        this.notifications = [];
        
        console.log('✅ 全ての通知をクリア完了');
    }
    
    // タスク期限のチェック
    checkTaskDeadlines() {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const tasks = this.getCurrentTasks();
        
        // 今日期限のタスク
        const todayTasks = tasks.filter(task => 
            task.dueDate === today && task.status !== 'completed'
        );
        
        // 明日期限のタスク
        const tomorrowTasks = tasks.filter(task => 
            task.dueDate === tomorrow && task.status !== 'completed'
        );
        
        todayTasks.forEach(task => {
            this.showNotification(`⚠️ 今日期限: ${task.title}`, 'warning');
        });
        
        tomorrowTasks.forEach(task => {
            this.showNotification(`📅 明日期限: ${task.title}`, 'info');
        });
    }
    
    // 期限切れタスクのチェック
    checkOverdueTasks() {
        const today = new Date().toISOString().split('T')[0];
        const tasks = this.getCurrentTasks();
        
        const overdueTasks = tasks.filter(task => 
            task.dueDate && task.dueDate < today && task.status !== 'completed'
        );
        
        overdueTasks.forEach(task => {
            this.showNotification(`🚨 期限切れ: ${task.title}`, 'error');
        });
    }
    
    // 通知の表示
    showNotification(message, type = 'info') {
        // 重複通知を避ける
        if (this.notifications.includes(message)) return;
        
        this.notifications.push(message);
        
        // 通知要素を作成
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="app.closeNotification(this)">×</button>
            </div>
        `;
        
        // 通知コンテナを取得または作成
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // 自動で消える（5秒後）
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
            this.notifications = this.notifications.filter(n => n !== message);
        }, 5000);
        
        console.log(`通知表示: ${message} (${type})`);
    }
    
    // ブラウザ通知の表示
    showBrowserNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'atd-notification',
                requireInteraction: false,
                silent: false
            });
            
            // 通知をクリックした時の処理
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            // 5秒後に自動で閉じる
            setTimeout(() => {
                notification.close();
            }, 5000);
        }
    }
    
    // 通知を閉じる
    closeNotification(button) {
        const notification = button.closest('.notification');
        const message = notification.querySelector('.notification-message').textContent;
        
        notification.remove();
        this.notifications = this.notifications.filter(n => n !== message);
    }
    
    // データのエクスポート
    exportData() {
        const exportData = {
            personalTasks: this.personalTasks,
            teamTasks: this.teamTasks,
            teamMembers: this.teamMembers,
            currentTeam: this.currentTeam,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `atd-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        console.log('データエクスポート完了');
        this.showNotification('データのエクスポートが完了しました', 'info');
    }
    
    // タスクを削除
    deleteTask(taskId) {
        if (confirm('このタスクを削除しますか？')) {
            // 現在のモードに応じたタスク配列から削除
            const currentTasks = this.getCurrentTasks();
            const filteredTasks = currentTasks.filter(task => task.id !== taskId);
            this.setCurrentTasks(filteredTasks);
            
            // ローカルストレージに保存
            this.saveTasksToStorage();
            
            // タスクリストを再描画
            this.renderTasks();
            
            // 成功通知
            this.showNotification('🗑️ タスクが削除されました', 'info');
            
            console.log('タスク削除完了:', taskId);
        }
    }
    
    // タスクを今日のタスクに移動
    moveToToday(taskId) {
        const currentTasks = this.getCurrentTasks();
        const task = currentTasks.find(t => t.id === taskId);
        if (task) {
            // 今日の日付に設定
            const today = new Date();
            today.setHours(23, 59, 59, 999); // 今日の終了時刻
            task.dueDate = today.toISOString();
            
            // ローカルストレージに保存
            this.saveTasksToStorage();
            
            // タスクリストを再描画
            this.renderTasks();
            
            // 成功通知
            this.showNotification('📅 タスクを今日のタスクに移動しました', 'success');
            
            console.log('タスクを今日に移動:', taskId);
        }
    }
    
    // タスクを明日のタスクに移動
    moveToTomorrow(taskId) {
        const currentTasks = this.getCurrentTasks();
        const task = currentTasks.find(t => t.id === taskId);
        if (task) {
            // 明日の日付に設定
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(23, 59, 59, 999); // 明日の終了時刻
            task.dueDate = tomorrow.toISOString();
            
            // ローカルストレージに保存
            this.saveTasksToStorage();
            
            // タスクリストを再描画
            this.renderTasks();
            
            // 成功通知
            this.showNotification('📅 タスクを明日のタスクに移動しました', 'success');
            
            console.log('タスクを明日に移動:', taskId);
        }
    }
    
    // タスクをその他のタスクに移動
    moveToOther(taskId) {
        const currentTasks = this.getCurrentTasks();
        const task = currentTasks.find(t => t.id === taskId);
        if (task) {
            // その他のタスクに移動する場合は、dueDateを削除または遠い未来の日付に設定
            const farFuture = new Date();
            farFuture.setFullYear(farFuture.getFullYear() + 10); // 10年後の日付
            task.dueDate = farFuture.toISOString();
            
            // ローカルストレージに保存
            this.saveTasksToStorage();
            
            // タスクリストを再描画
            this.renderTasks();
            
            // 成功通知
            this.showNotification('📋 タスクをその他のタスクに移動しました', 'success');
            
            console.log('タスクをその他のタスクに移動:', taskId);
        }
    }
    
    // データのインポート
    importData(fileInput) {
        const file = fileInput.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // データの検証
                if (!importData.tasks || !Array.isArray(importData.tasks)) {
                    throw new Error('無効なデータ形式です');
                }
                
                // 確認ダイアログ
                if (confirm('現在のデータを上書きしますか？')) {
                    this.personalTasks = importData.personalTasks || importData.tasks || [];
                    this.teamTasks = importData.teamTasks || [];
                    this.teamMembers = importData.teamMembers || [];
                    this.currentTeam = importData.currentTeam || null;
                    
                    // ローカルストレージに保存
                    this.saveTasksToStorage();
                    
                    // 画面を更新
                    this.renderTasks();
                    this.updatePersonalKPI();
                    this.updateProgressChart();
                    
                    console.log('データインポート完了');
                    this.showNotification('データのインポートが完了しました', 'info');
                }
            } catch (error) {
                console.error('インポートエラー:', error);
                this.showNotification('データのインポートに失敗しました', 'error');
            }
        };
        
        reader.readAsText(file);
    }
    
    // データのバックアップ
    createBackup() {
        const backupData = {
            personalTasks: this.personalTasks,
            teamTasks: this.teamTasks,
            teamMembers: this.teamMembers,
            currentTeam: this.currentTeam,
            backupDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        try {
            localStorage.setItem('atd_backup', JSON.stringify(backupData));
            console.log('バックアップ作成完了');
            this.showNotification('バックアップが作成されました', 'info');
        } catch (error) {
            console.error('バックアップエラー:', error);
            this.showNotification('バックアップの作成に失敗しました', 'error');
        }
    }
    
    // バックアップからの復元
    restoreFromBackup() {
        try {
            const backupData = localStorage.getItem('atd_backup');
            if (!backupData) {
                this.showNotification('バックアップが見つかりません', 'warning');
                return;
            }
            
            const data = JSON.parse(backupData);
            
            if (confirm('バックアップから復元しますか？現在のデータは上書きされます。')) {
                this.personalTasks = data.personalTasks || data.tasks || [];
                this.teamTasks = data.teamTasks || [];
                this.teamMembers = data.teamMembers || [];
                this.currentTeam = data.currentTeam || null;
                
                // ローカルストレージに保存
                this.saveTasksToStorage();
                
                // 画面を更新
                this.renderTasks();
                this.updatePersonalKPI();
                this.updateProgressChart();
                
                console.log('バックアップ復元完了');
                this.showNotification('バックアップから復元しました', 'info');
            }
        } catch (error) {
            console.error('復元エラー:', error);
            this.showNotification('バックアップの復元に失敗しました', 'error');
        }
    }
    
    // マインドマップノードの追加
    addMindmapChild(parentId) {
        const modalContent = `
            <form id="add-child-node-form">
                <div class="form-group">
                    <label for="child-node-title">子ノード名</label>
                    <input type="text" id="child-node-title" required>
                </div>
                <div class="form-group">
                    <label for="child-node-description">説明</label>
                    <textarea id="child-node-description"></textarea>
                </div>
                <div class="form-group">
                    <label for="child-node-type">タイプ</label>
                    <select id="child-node-type">
                        <option value="action">アクション</option>
                        <option value="task">タスク</option>
                        <option value="kpi">KPI</option>
                        <option value="objective">目的</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">追加</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">キャンセル</button>
                </div>
            </form>
        `;
        
        this.showModal('子ノード追加', modalContent);
        
        // フォーム送信の処理
        const form = document.getElementById('add-child-node-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddChildNode(parentId, form);
            });
        }
    }
    
    async handleAddChildNode(parentId, form) {
        const nodeData = {
            title: document.getElementById('child-node-title').value,
            description: document.getElementById('child-node-description').value,
            type: document.getElementById('child-node-type').value,
            parentId: parentId,
            position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 150 }
        };
        
        try {
            // マインドマップマネージャーにノードを追加
            if (window.mindmapManager) {
                const newNode = window.mindmapManager.addNode(nodeData);
                console.log('子ノード追加完了:', newNode);
                
                // マインドマップを再描画
                if (window.mindmapPage) {
                    window.mindmapPage.renderMindmap();
                }
            }
            
            this.closeModal();
        } catch (error) {
            console.error('子ノード追加エラー:', error);
            alert('子ノードの追加に失敗しました。');
        }
    }
    
    // タスクフィルター機能
    applyFilters() {
        const priorityFilter = document.getElementById('task-priority-filter');
        const statusFilter = document.getElementById('task-status-filter');
        
        if (!priorityFilter || !statusFilter) return;
        
        const selectedPriority = priorityFilter.value;
        const selectedStatus = statusFilter.value;
        
        // フィルター条件に基づいてタスクを表示
        this.renderFilteredTasks(selectedPriority, selectedStatus);
        
        console.log(`フィルター適用: 優先度=${selectedPriority}, ステータス=${selectedStatus}`);
    }
    
    renderFilteredTasks(priorityFilter, statusFilter) {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;
        
        // フィルター条件に基づいてタスクをフィルタリング
        let filteredTasks = [...this.getCurrentTasks()];
        
        if (priorityFilter) {
            filteredTasks = filteredTasks.filter(task => task.priority.toString() === priorityFilter);
        }
        
        if (statusFilter) {
            filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
        }
        
        const focusTasks = filteredTasks.filter(task => task.isFocus);
        const otherTasks = filteredTasks.filter(task => !task.isFocus);
        
        let html = '';
        
        // フィルター結果の表示
        if (filteredTasks.length === 0) {
            html = '<div class="no-tasks-message"><p>条件に一致するタスクがありません。</p></div>';
        } else {
            // フォーカスタスク
            if (focusTasks.length > 0) {
                html += `<div class="focus-section"><h3>フォーカスタスク (${focusTasks.length}件)</h3>`;
                focusTasks.forEach(task => {
                    html += this.createTaskCardHTML(task, true);
                });
                html += '</div>';
            }
            
            // その他のタスク
            if (otherTasks.length > 0) {
                html += `<div class="other-tasks-section"><h3>その他のタスク (${otherTasks.length}件)</h3>`;
                otherTasks.forEach(task => {
                    html += this.createTaskCardHTML(task, false);
                });
                html += '</div>';
            }
        }
        
        taskList.innerHTML = html;
        
        // イベントリスナーの設定
        this.setupTaskEventListeners();
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 ATD System v1.6.0 - シンプルログイン版を初期化中...');
    console.log('✨ 新機能: シンプルログイン、ユーザーデータ分離、個人・チーム分離');
    console.log('📄 DOMContentLoaded イベントが発火しました');
    
    // ログインボタンの存在確認
    const loginBtn = document.getElementById('login-btn');
    console.log('🔍 ログインボタンの存在確認:', loginBtn);
    
    // 直接イベントリスナーをテスト
    if (loginBtn) {
        console.log('🧪 直接イベントリスナーをテストします');
        loginBtn.addEventListener('click', () => {
            console.log('🎯 直接イベントリスナーが動作しました！');
            alert('ログインボタンがクリックされました！');
        });
    }
    
    window.app = new ATDApp();
    
    // デバッグ用のグローバル関数を公開
    window.cleanupData = () => {
        if (window.app) {
            window.app.globalCleanupData();
        } else {
            console.error('❌ ATDアプリが初期化されていません');
        }
    };

    window.checkDataIntegrity = () => {
        if (window.app) {
            window.app.checkDataIntegrity();
        } else {
            console.error('❌ ATDアプリが初期化されていません');
        }
    };
});
