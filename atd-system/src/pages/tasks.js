// タスクページ管理
class TasksPage {
    constructor() {
        this.taskManager = new TaskManager();
        this.currentFilter = {
            status: '',
            priority: ''
        };
    }
    
    async initialize() {
        console.log('Initializing tasks page...');
        
        // イベントリスナーを設定
        this.setupEventListeners();
        
        // タスク一覧を表示
        await this.updateTaskDisplay();
        
        // ビュー変更リスナーを追加
        if (window.app && window.app.viewManager) {
            window.app.viewManager.addListener((newView, previousView) => {
                this.updateTaskDisplay();
            });
        }
    }
    
    // イベントリスナーの設定
    setupEventListeners() {
        // タスク追加ボタン
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.showAddTaskModal();
            });
        }
        
        // フィルター
        const priorityFilter = document.getElementById('task-priority-filter');
        const statusFilter = document.getElementById('task-status-filter');
        
        if (priorityFilter) {
            priorityFilter.addEventListener('change', (e) => {
                this.currentFilter.priority = e.target.value;
                this.updateTaskDisplay();
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilter.status = e.target.value;
                this.updateTaskDisplay();
            });
        }
    }
    
    // タスク追加モーダルを表示
    showAddTaskModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-plus"></i> タスク追加</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="new-task-form" class="addness-form">
                        <div class="addness-form-group">
                            <label class="addness-form-label">タスク名</label>
                            <input type="text" class="addness-form-input" id="new-task-title" placeholder="タスク名を入力" required>
                        </div>
                        
                        <div class="addness-form-group">
                            <label class="addness-form-label">説明</label>
                            <textarea class="addness-form-input addness-form-textarea" id="new-task-description" placeholder="詳細を入力"></textarea>
                        </div>
                        
                        <div class="addness-form-group">
                            <label class="addness-form-label">優先度</label>
                            <select class="addness-form-input" id="new-task-priority">
                                <option value="4">📌 低</option>
                                <option value="3" selected>📝 中</option>
                                <option value="2">⚡ 高</option>
                                <option value="1">🔥 最高</option>
                            </select>
                        </div>
                        
                        <div class="addness-form-group">
                            <label class="addness-form-label">期限</label>
                            <input type="date" class="addness-form-input" id="new-task-due-date">
                        </div>
                        
                        <div class="addness-form-group">
                            <label class="addness-form-label">カテゴリ</label>
                            <select class="addness-form-input" id="new-task-category">
                                <option value="other">その他タスク</option>
                                <option value="today">今日のタスク</option>
                                <option value="tomorrow">明日のタスク</option>
                            </select>
                        </div>
                        
                        <div style="display: flex; gap: 1rem;">
                            <button type="submit" class="addness-btn addness-btn-primary" style="flex: 1;">
                                <i class="fas fa-save"></i> 保存
                            </button>
                            <button type="button" class="addness-btn addness-btn-secondary" style="flex: 1;" onclick="this.closest('.modal').remove()">
                                <i class="fas fa-times"></i> キャンセル
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // フォーム送信
        const form = modal.querySelector('#new-task-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddTask(modal);
        });
        
        // 背景クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // タスク追加処理
    async handleAddTask(modal) {
        const title = document.getElementById('new-task-title').value;
        const description = document.getElementById('new-task-description').value;
        const priority = parseInt(document.getElementById('new-task-priority').value);
        const dueDate = document.getElementById('new-task-due-date').value;
        const category = document.getElementById('new-task-category').value;
        
        const task = {
            title,
            description,
            priority,
            dueDate: dueDate || null,
            category,
            status: 'pending',
            isFocus: category === 'today',
            createdBy: window.app?.currentUser?.uid || 'unknown',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // タスクマネージャーに追加
        if (window.app && window.app.taskManager) {
            await window.app.taskManager.addTask(task);
            await window.app.taskManager.saveTasks();
            
            // ローカルデータも更新
            window.app.personalTasks = window.app.taskManager.getAllTasks();
            
            // 画面を更新
            await this.updateTaskDisplay();
            
            // モーダルを閉じる
            modal.remove();
            
            console.log('✅ タスクを追加しました:', task);
        }
    }
    
    // タスク表示の更新
    async updateTaskDisplay() {
        console.log('🔄 タスク表示を更新中...');
        
        if (!window.app || !window.app.personalTasks) {
            console.log('⚠️ タスクデータが見つかりません');
            return;
        }
        
        const tasks = window.app.personalTasks;
        
        // フィルター適用
        let filteredTasks = tasks.filter(task => {
            if (this.currentFilter.status && task.status !== this.currentFilter.status) {
                return false;
            }
            if (this.currentFilter.priority && task.priority !== this.currentFilter.priority) {
                return false;
            }
            return true;
        });
        
        // 今日のタスク
        const todayTasks = this.getTodayTasks(filteredTasks);
        this.renderTasks('today-tasks-list', todayTasks);
        document.getElementById('today-tasks-count').textContent = `${todayTasks.length}件`;
        
        // 明日のタスク
        const tomorrowTasks = this.getTomorrowTasks(filteredTasks);
        this.renderTasks('tomorrow-tasks-list', tomorrowTasks);
        document.getElementById('tomorrow-tasks-count').textContent = `${tomorrowTasks.length}件`;
        
        // その他のタスク
        const otherTasks = this.getOtherTasks(filteredTasks);
        this.renderTasks('task-list', otherTasks);
        document.getElementById('other-tasks-count').textContent = `${otherTasks.length}件`;
    }
    
    // 今日のタスクを取得
    getTodayTasks(tasks) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return tasks.filter(task => {
            if (task.category === 'today') return true;
            
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate.getTime() === today.getTime();
            }
            
            return false;
        });
    }
    
    // 明日のタスクを取得
    getTomorrowTasks(tasks) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        return tasks.filter(task => {
            if (task.category === 'tomorrow') return true;
            
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate.getTime() === tomorrow.getTime();
            }
            
            return false;
        });
    }
    
    // その他のタスクを取得
    getOtherTasks(tasks) {
        return tasks.filter(task => {
            if (task.category === 'today' || task.category === 'tomorrow') {
                return false;
            }
            
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                if (dueDate.getTime() === today.getTime() || dueDate.getTime() === tomorrow.getTime()) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    // タスクをレンダリング
    renderTasks(containerId, tasks) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (tasks.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--addness-text-secondary);">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>タスクがありません</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = tasks.map(task => this.createTaskCard(task)).join('');
        
        // イベントリスナーを追加
        this.attachTaskListeners(tasks);
    }
    
    // タスクカードを作成
    createTaskCard(task) {
        const priorityEmoji = {
            1: '🔥',
            2: '⚡',
            3: '📝',
            4: '📌'
        }[task.priority] || '📝';
        
        const priorityClass = {
            1: 'priority-high',
            2: 'priority-medium',
            3: 'priority-medium',
            4: 'priority-low'
        }[task.priority] || 'priority-medium';
        
        const statusBadge = {
            pending: '<span class="addness-task-badge status-pending">未着手</span>',
            in_progress: '<span class="addness-task-badge status-progress">進行中</span>',
            completed: '<span class="addness-task-badge status-completed">完了</span>'
        }[task.status] || '<span class="addness-task-badge status-pending">未着手</span>';
        
        const dueDateText = task.dueDate ? new Date(task.dueDate).toLocaleDateString('ja-JP') : '';
        
        return `
            <div class="addness-task-card ${priorityClass}" data-task-id="${task.id}">
                <div class="addness-task-title">
                    ${priorityEmoji} ${task.title}
                </div>
                ${task.description ? `<div style="color: var(--addness-text-secondary); margin: 0.5rem 0;">${task.description}</div>` : ''}
                <div class="addness-task-meta">
                    ${dueDateText ? `<span><i class="fas fa-calendar"></i> ${dueDateText}</span>` : ''}
                    ${statusBadge}
                    <span><i class="fas fa-user"></i> ${window.app?.currentUser?.displayName || 'ユーザー'}</span>
                </div>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                    <button class="move-to-today-btn addness-btn addness-btn-secondary" style="flex: 1; padding: 0.5rem;">
                        <i class="fas fa-calendar-day"></i> 今日
                    </button>
                    <button class="move-to-tomorrow-btn addness-btn addness-btn-secondary" style="flex: 1; padding: 0.5rem;">
                        <i class="fas fa-calendar-plus"></i> 明日
                    </button>
                    <button class="delete-task-btn addness-btn" style="background: var(--addness-danger); color: white; padding: 0.5rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    // タスクのイベントリスナーを追加
    attachTaskListeners(tasks) {
        tasks.forEach(task => {
            const taskCard = document.querySelector(`[data-task-id="${task.id}"]`);
            if (!taskCard) return;
            
            // 今日に移動
            const moveToTodayBtn = taskCard.querySelector('.move-to-today-btn');
            if (moveToTodayBtn) {
                moveToTodayBtn.addEventListener('click', async () => {
                    await this.moveTaskToCategory(task.id, 'today');
                });
            }
            
            // 明日に移動
            const moveToTomorrowBtn = taskCard.querySelector('.move-to-tomorrow-btn');
            if (moveToTomorrowBtn) {
                moveToTomorrowBtn.addEventListener('click', async () => {
                    await this.moveTaskToCategory(task.id, 'tomorrow');
                });
            }
            
            // 削除
            const deleteBtn = taskCard.querySelector('.delete-task-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    if (confirm('このタスクを削除しますか？')) {
                        await this.deleteTask(task.id);
                    }
                });
            }
        });
    }
    
    // タスクをカテゴリに移動
    async moveTaskToCategory(taskId, category) {
        if (!window.app || !window.app.taskManager) return;
        
        const task = window.app.personalTasks.find(t => t.id === taskId);
        if (!task) return;
        
        task.category = category;
        task.updatedAt = Date.now();
        
        await window.app.taskManager.saveTasks();
        window.app.personalTasks = window.app.taskManager.getAllTasks();
        
        await this.updateTaskDisplay();
        
        console.log(`✅ タスクを${category}に移動しました`);
    }
    
    // タスクを削除
    async deleteTask(taskId) {
        if (!window.app || !window.app.taskManager) return;
        
        await window.app.taskManager.deleteTask(taskId);
        window.app.personalTasks = window.app.taskManager.getAllTasks();
        
        await this.updateTaskDisplay();
        
        console.log('✅ タスクを削除しました');
    }
}

// グローバルに公開
window.TasksPage = TasksPage;
