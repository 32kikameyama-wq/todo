// ATD System - Main Application
class ATDApp {
    constructor() {
        this.currentUser = null;
        this.currentTeam = null;
        this.tasks = [];
        this.teamMembers = [];
        this.isInitialized = false;
        this.currentViewMode = 'personal'; // 'personal' or 'team'
        this.notifications = [];
        this.notificationCheckInterval = null;
        
        this.init();
    }
    
    async init() {
        try {
            // ローディング画面を表示
            this.showLoadingScreen();
            
            // Firebase初期化を待つ
            await this.waitForFirebase();
            
            // 認証状態をチェック
            await this.checkAuthState();
            
            // アプリケーション初期化
            await this.initializeApp();
            
            this.isInitialized = true;
            console.log('ATD System initialized successfully');
            
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
            try {
                // Firebase認証が利用可能かチェック
                if (!window.firebaseAuth || !window.firebaseAuth.onAuthStateChanged) {
                    console.log('Firebase auth not available, showing login screen');
                    this.showLoginScreen();
                    resolve();
                    return;
                }
                
                const unsubscribe = window.firebaseAuth.onAuthStateChanged(async (user) => {
                    if (user) {
                        this.currentUser = user;
                        this.showMainApp();
                    } else {
                        this.showLoginScreen();
                    }
                    resolve();
                });
                
                // 5秒後にタイムアウト（モック版の場合は即座にログイン画面を表示）
                setTimeout(() => {
                    if (typeof unsubscribe === 'function') {
                        unsubscribe();
                    }
                    if (!this.currentUser) {
                        console.log('Auth timeout, showing login screen');
                        this.showLoginScreen();
                        resolve();
                    }
                }, 5000);
            } catch (error) {
                console.error('Auth state check error:', error);
                this.showLoginScreen();
                resolve();
            }
        });
    }
    
    showLoginScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        
        loadingScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
        
        this.setupLoginHandlers();
    }
    
    showMainApp() {
        const loadingScreen = document.getElementById('loading-screen');
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        
        loadingScreen.classList.add('hidden');
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        this.setupMainAppHandlers();
        this.loadUserData();
    }
    
    setupLoginHandlers() {
        const googleLoginBtn = document.getElementById('google-login-btn');
        const guestLoginBtn = document.getElementById('guest-login-btn');
        
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => this.handleGoogleLogin());
        }
        
        if (guestLoginBtn) {
            guestLoginBtn.addEventListener('click', () => this.handleGuestLogin());
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
        
        // ユーザーメニュー
        const userMenuBtn = document.getElementById('user-menu-btn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', () => this.showUserMenu());
        }
        
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
    
    async handleGoogleLogin() {
        try {
            const result = await window.firebaseAuth.signInWithPopup();
            this.currentUser = result.user;
            this.showMainApp();
        } catch (error) {
            console.error('Google login error:', error);
            this.showError('Googleログインに失敗しました。');
        }
    }
    
    async handleGuestLogin() {
        try {
            const result = await window.firebaseAuth.signInAnonymously();
            this.currentUser = result.user;
            this.showMainApp();
        } catch (error) {
            console.error('Guest login error:', error);
            this.showError('ゲストログインに失敗しました。');
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
            case 'add-task':
                await this.initializeAddTask();
                break;
        }
    }
    
    async initializeDashboard() {
        // ダッシュボードの初期化
        console.log('Initializing dashboard...');
        
        if (this.currentViewMode === 'personal') {
            // 個人ビューの初期化
            await this.updatePersonalKPI();
            await this.updateFocusTasks();
            await this.initializePersonalCharts();
        } else {
            // チームビューの初期化
            await this.updateTeamKPI();
            await this.updateTeamFocusTasks();
            await this.initializeTeamCharts();
        }
    }
    
    async initializeTasks() {
        // タスク管理の初期化
        console.log('Initializing tasks...');
        
        // タスクリストの読み込み
        await this.loadTasks();
        
        // タスク追加ボタンの設定
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => this.navigateToPage('add-task'));
        }
        
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
        // 保存ボタン
        const saveTaskBtn = document.getElementById('save-task-btn');
        if (saveTaskBtn) {
            saveTaskBtn.addEventListener('click', () => this.saveNewTask());
        }
        
        // キャンセルボタン
        const cancelTaskBtn = document.getElementById('cancel-task-btn');
        if (cancelTaskBtn) {
            cancelTaskBtn.addEventListener('click', () => this.navigateToPage('tasks'));
        }
        
        // マインドマップ細分化ボタン
        const mindmapSubdivisionBtn = document.getElementById('mindmap-subdivision-btn');
        if (mindmapSubdivisionBtn) {
            mindmapSubdivisionBtn.addEventListener('click', () => this.toggleMindmapSubdivision());
        }
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
        
        // マインドマップからサブタスクを取得
        const subtasks = this.extractSubtasksFromMindmap();
        
        // 新しいタスクを作成
        const newTask = {
            id: 'task_' + Date.now(),
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
            subtasks: subtasks,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // タスクリストに追加
        this.tasks.push(newTask);
        
        // ローカルストレージに保存
        this.saveTasksToStorage();
        
        // タスク管理ページに戻る
        this.navigateToPage('tasks');
        
        // 成功メッセージ
        alert('タスクが追加されました！');
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
    
    async loadUserData() {
        // ユーザーデータの読み込み
        if (this.currentUser) {
            const userName = document.getElementById('user-name');
            if (userName) {
                userName.textContent = this.currentUser.displayName || this.currentUser.email || 'ユーザー';
            }
        }
    }
    
    async loadTasks() {
        // まずローカルストレージから読み込みを試行
        const loadedFromStorage = this.loadTasksFromStorage();
        
        if (!loadedFromStorage) {
            // ローカルストレージにデータがない場合はモックデータを使用
            this.tasks = [
                {
                    id: 'task_1',
                    title: 'プロジェクト企画書作成',
                    description: '新プロジェクトの企画書を作成する',
                    priority: 1,
                    status: 'in_progress',
                    isFocus: true,
                    dueDate: '2024-01-20',
                    estimatedTime: 120,
                    actualTime: 90,
                    timer: { isRunning: false, elapsed: 5400, startTime: null, intervalId: null },
                    createdAt: Date.now() - 86400000,
                    updatedAt: Date.now()
                },
                {
                    id: 'task_2',
                    title: '会議資料準備',
                    description: '来週の会議で使用する資料を準備する',
                    priority: 2,
                    status: 'pending',
                    isFocus: true,
                    dueDate: '2024-01-18',
                    estimatedTime: 60,
                    actualTime: 0,
                    timer: { isRunning: false, elapsed: 0, startTime: null, intervalId: null },
                    createdAt: Date.now() - 172800000,
                    updatedAt: Date.now()
                },
                {
                    id: 'task_3',
                    title: 'システム設計レビュー',
                    description: '開発チームのシステム設計をレビューする',
                    priority: 3,
                    status: 'pending',
                    isFocus: true,
                    dueDate: '2024-01-22',
                    estimatedTime: 180,
                    actualTime: 0,
                    timer: { isRunning: false, elapsed: 0, startTime: null, intervalId: null },
                    createdAt: Date.now() - 259200000,
                    updatedAt: Date.now()
                }
            ];
            
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
        const taskList = document.getElementById('task-list');
        if (!taskList) return;
        
        const focusTasks = this.tasks.filter(task => task.isFocus);
        const otherTasks = this.tasks.filter(task => !task.isFocus);
        
        let html = '';
        
        // フォーカスタスク
        if (focusTasks.length > 0) {
            html += '<div class="focus-section"><h3>フォーカスタスク (3件)</h3>';
            focusTasks.forEach(task => {
                html += this.createTaskCardHTML(task, true);
            });
            html += '</div>';
        }
        
        // その他のタスク
        if (otherTasks.length > 0) {
            html += '<div class="other-tasks-section"><h3>その他のタスク</h3>';
            otherTasks.forEach(task => {
                html += this.createTaskCardHTML(task, false);
            });
            html += '</div>';
        }
        
        taskList.innerHTML = html;
        
        // イベントリスナーの設定
        this.setupTaskEventListeners();
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
        
        // 実際のタスクデータから計算
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        const actualCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const actualStreak = this.calculateStreak();
        
        if (completionRate) completionRate.textContent = `${actualCompletionRate}%`;
        if (tasksCompleted) tasksCompleted.textContent = completedTasks;
        if (streak) streak.textContent = `${actualStreak}日`;
        
        console.log(`個人KPI更新: 完了率=${actualCompletionRate}%, 完了タスク=${completedTasks}, ストリーク=${actualStreak}日`);
    }
    
    // ストリーク計算
    calculateStreak() {
        const today = new Date();
        let streak = 0;
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayTasks = this.tasks.filter(t => {
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
        
        const focusTaskList = this.tasks.filter(task => task.isFocus);
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
        
        // 実際のタスクデータから計算
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = this.tasks.filter(t => t.status === 'in_progress').length;
        const pendingTasks = this.tasks.filter(t => t.status === 'pending').length;
        
        this.progressChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['完了', '進行中', '未着手'],
                datasets: [{
                    data: [completedTasks, inProgressTasks, pendingTasks],
                    backgroundColor: ['#4CAF50', '#FF9800', '#2196F3']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'タスク完了状況'
                    }
                }
            }
        });
        
        console.log(`進捗チャート初期化: 完了=${completedTasks}, 進行中=${inProgressTasks}, 未着手=${pendingTasks}`);
    }
    
    // 進捗チャートの更新
    updateProgressChart() {
        if (!this.progressChart) return;
        
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = this.tasks.filter(t => t.status === 'in_progress').length;
        const pendingTasks = this.tasks.filter(t => t.status === 'pending').length;
        
        this.progressChart.data.datasets[0].data = [completedTasks, inProgressTasks, pendingTasks];
        this.progressChart.update();
        
        console.log(`進捗チャート更新: 完了=${completedTasks}, 進行中=${inProgressTasks}, 未着手=${pendingTasks}`);
    }
    
    initializeTimeChart() {
        const ctx = document.getElementById('time-chart');
        if (!ctx) return;
        
        // 過去7日間の作業時間を計算
        const timeData = this.calculateWeeklyTimeData();
        
        this.timeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['月', '火', '水', '木', '金', '土', '日'],
                datasets: [{
                    label: '作業時間 (時間)',
                    data: timeData,
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
        
        console.log(`時間チャート初期化: データ=${timeData}`);
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
            const dayTasks = this.tasks.filter(task => {
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
        const task = this.tasks.find(t => t.id === taskId);
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
        }
    }
    
    toggleTimer(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
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
        const task = this.tasks.find(t => t.id === taskId);
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
                task.timer.intervalId = setInterval(updateDisplay, 1000);
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
        this.tasks.forEach(task => {
            if (task.timer.isRunning) {
                this.updateTimerDisplay(task.id);
            }
        });
    }
    
    // タスクをローカルストレージに保存
    saveTasksToStorage() {
        try {
            localStorage.setItem('atd_tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('タスクの保存に失敗しました:', error);
        }
    }
    
    // ローカルストレージからタスクを読み込み
    loadTasksFromStorage() {
        try {
            const savedTasks = localStorage.getItem('atd_tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
                // タイマーの状態を復元
                this.tasks.forEach(task => {
                    if (task.timer.isRunning) {
                        task.timer.isRunning = false; // ページリロード時は停止状態に
                        task.timer.startTime = null;
                        task.timer.intervalId = null;
                    }
                });
                return true;
            }
        } catch (error) {
            console.error('タスクの読み込みに失敗しました:', error);
        }
        return false;
    }
    
    showTaskDetail(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
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
        const currentIndex = this.tasks.findIndex(t => t.id === taskId);
        
        if (currentIndex === -1) return;
        
        let newIndex;
        if (direction === 'up' && currentIndex > 0) {
            newIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < this.tasks.length - 1) {
            newIndex = currentIndex + 1;
        } else {
            return; // 移動できない
        }
        
        // タスクを移動
        const task = this.tasks.splice(currentIndex, 1)[0];
        this.tasks.splice(newIndex, 0, task);
        
        // ローカルストレージに保存
        this.saveTasksToStorage();
        
        // タスクリストを再描画
        this.renderTasks();
        
        console.log(`タスク移動完了: ${task.title} を ${direction} に移動`);
    }
    
    reorderTasks(draggedId, targetId) {
        const draggedIndex = this.tasks.findIndex(t => t.id === draggedId);
        const targetIndex = this.tasks.findIndex(t => t.id === targetId);
        
        if (draggedIndex >= 0 && targetIndex >= 0 && draggedIndex !== targetIndex) {
            // ドラッグされたタスクを配列から削除
            const draggedTask = this.tasks.splice(draggedIndex, 1)[0];
            
            // 新しい位置に挿入
            this.tasks.splice(targetIndex, 0, draggedTask);
            
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
        if (modalOverlay) modalOverlay.classList.add('hidden');
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
    logout() {
        if (confirm('ログアウトしますか？')) {
            // 通知システムを停止
            this.stopNotificationSystem();
            
            // データをクリア
            this.tasks = [];
            this.teamMembers = [];
            this.currentTeam = null;
            this.currentUser = null;
            
            // ログイン画面に戻る
            this.showLoginScreen();
            
            console.log('ログアウト完了');
        }
    }
    
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
        
        // フォーム送信処理を追加
        const form = document.getElementById('add-task-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddTask();
            });
        }
    }
    
    handleAddTask() {
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = parseInt(document.getElementById('task-priority').value);
        const dueDate = document.getElementById('task-due-date').value;
        
        if (!title.trim()) {
            alert('タスク名を入力してください。');
            return;
        }
        
        // 新しいタスクを作成
        const newTask = {
            id: 'task_' + Date.now(),
            title: title.trim(),
            description: description.trim(),
            priority: priority,
            status: 'pending',
            isFocus: false,
            dueDate: dueDate || new Date().toISOString().split('T')[0],
            estimatedTime: 60, // デフォルト60分
            actualTime: 0,
            timer: { isRunning: false, elapsed: 0 },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // タスクリストに追加
        this.tasks.push(newTask);
        
        // ローカルストレージに保存
        this.saveTasksToStorage();
        
        // タスクリストを再描画
        this.renderTasks();
        
        // モーダルを閉じる
        this.closeModal();
        
        // 成功メッセージ
        alert('タスクが追加されました！');
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
        
        // 5分ごとに通知をチェック
        this.notificationCheckInterval = setInterval(() => {
            this.checkTaskDeadlines();
            this.checkOverdueTasks();
        }, 5 * 60 * 1000); // 5分
        
        console.log('通知システム開始');
    }
    
    // 通知システムの停止
    stopNotificationSystem() {
        if (this.notificationCheckInterval) {
            clearInterval(this.notificationCheckInterval);
            this.notificationCheckInterval = null;
        }
        console.log('通知システム停止');
    }
    
    // タスク期限のチェック
    checkTaskDeadlines() {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // 今日期限のタスク
        const todayTasks = this.tasks.filter(task => 
            task.dueDate === today && task.status !== 'completed'
        );
        
        // 明日期限のタスク
        const tomorrowTasks = this.tasks.filter(task => 
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
        
        const overdueTasks = this.tasks.filter(task => 
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
            tasks: this.tasks,
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
                    this.tasks = importData.tasks || [];
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
            tasks: this.tasks,
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
                this.tasks = data.tasks || [];
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
        let filteredTasks = [...this.tasks];
        
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
    window.app = new ATDApp();
});
