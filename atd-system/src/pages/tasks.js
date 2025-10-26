// タスクページ管理
class TasksPage {
    constructor() {
        this.taskManager = new TaskManager();
        this.modalManager = new ModalManager();
    }
    
    async initialize() {
        console.log('Initializing tasks page...');
        
        // タスクの読み込み
        await this.loadTasks();
        
        // イベントリスナーの設定
        this.setupEventListeners();
    }
    
    async loadTasks() {
        // モックデータ
        const tasks = [
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
                timer: { isRunning: true, elapsed: 5400 },
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
                timer: { isRunning: false, elapsed: 0 },
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
                timer: { isRunning: false, elapsed: 0 },
                createdAt: Date.now() - 259200000,
                updatedAt: Date.now()
            }
        ];
        
        this.renderTasks(tasks);
    }
    
    renderTasks(tasks) {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;
        
        const focusTasks = tasks.filter(task => task.isFocus);
        const otherTasks = tasks.filter(task => !task.isFocus);
        
        let html = '';
        
        // フォーカスタスク
        if (focusTasks.length > 0) {
            html += '<div class="focus-section"><h3>フォーカスタスク (3件)</h3>';
            focusTasks.forEach(task => {
                const taskCard = new TaskCard(task, { showActions: true, showTimer: true });
                html += taskCard.render();
            });
            html += '</div>';
        }
        
        // その他のタスク
        if (otherTasks.length > 0) {
            html += '<div class="other-tasks-section"><h3>その他のタスク</h3>';
            otherTasks.forEach(task => {
                const taskCard = new TaskCard(task, { showActions: true, showTimer: true });
                html += taskCard.render();
            });
            html += '</div>';
        }
        
        taskList.innerHTML = html;
        
        // ドラッグ&ドロップの設定
        this.setupDragAndDrop();
    }
    
    setupEventListeners() {
        // タスク追加ボタン
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => this.showAddTaskModal());
        }
        
        // マインドマップ細分化ボタン
        const mindmapBreakdownBtn = document.getElementById('mindmap-breakdown-btn');
        if (mindmapBreakdownBtn) {
            mindmapBreakdownBtn.addEventListener('click', () => this.showMindmapBreakdown());
        }
        
        // 今日のタスクボタン
        const todayTasksBtn = document.getElementById('today-tasks-btn');
        if (todayTasksBtn) {
            todayTasksBtn.addEventListener('click', () => this.showTodayTasks());
        }
        
        // フィルター
        const priorityFilter = document.getElementById('task-priority-filter');
        const statusFilter = document.getElementById('task-status-filter');
        
        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
    }
    
    setupDragAndDrop() {
        const taskCards = document.querySelectorAll('.task-card');
        taskCards.forEach(card => {
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
    
    showAddTaskModal() {
        // メインアプリのタスク追加モーダルを使用
        if (window.app && window.app.showAddTaskModal) {
            window.app.showAddTaskModal();
        }
    }
    
    showMindmapBreakdown() {
        // マインドマップページに遷移
        if (window.app) {
            window.app.navigateToPage('mindmap');
        }
    }
    
    showTodayTasks() {
        // メインアプリからタスクを取得
        if (!window.app || !window.app.tasks) {
            console.error('メインアプリまたはタスクが見つかりません');
            return;
        }
        
        // 今日のタスクをフィルタリング
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayTasks = window.app.tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate >= today && taskDate < tomorrow;
        });
        
        // 今日のタスクを表示
        this.renderTasks(todayTasks);
        
        // 通知
        window.app.showNotification(`📅 今日のタスク (${todayTasks.length}件)`, 'info');
    }
    
    applyFilters() {
        // フィルターの適用
        console.log('Applying filters...');
    }
    
    reorderTasks(draggedId, targetId) {
        console.log(`Reordering ${draggedId} to ${targetId}`);
        // 実際の並び替えロジックを実装
    }
    
    // ページの破棄
    destroy() {
        // クリーンアップ処理
    }
}

// グローバルに公開
window.TasksPage = TasksPage;
