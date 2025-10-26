// タスク管理ユーティリティ
class TaskManager {
    constructor() {
        this.tasks = [];
        this.storage = new StorageManager();
        this.currentUserId = null;
    }
    
    // 現在のユーザーIDを設定
    setCurrentUser(user) {
        console.log('👤 タスクマネージャーにユーザー設定:', user ? user.displayName : 'null');
        this.currentUserId = user ? user.uid : null;
        this.storage.setCurrentUser(user);
        
        if (this.currentUserId) {
            console.log(`✅ タスクマネージャー - ユーザーID設定完了: ${this.currentUserId}`);
        } else {
            console.warn('⚠️ タスクマネージャー - ユーザーIDが設定されませんでした');
        }
    }
    
    // タスクの追加
    async addTask(taskData) {
        if (!this.currentUserId) {
            console.error('❌ ユーザーがログインしていません');
            throw new Error('ユーザーがログインしていません');
        }
        
        console.log(`➕ 新規タスク追加 - ユーザーID: ${this.currentUserId}`);
        console.log(`➕ タスクデータ:`, taskData);
        
        const task = {
            id: this.generateTaskId(),
            userId: this.currentUserId, // ユーザーIDを追加
            title: taskData.title,
            description: taskData.description || '',
            priority: parseInt(taskData.priority) || 3,
            status: 'pending',
            isFocus: taskData.isFocus || false,
            dueDate: taskData.dueDate || null,
            estimatedTime: parseInt(taskData.estimatedTime) || 0,
            actualTime: 0,
            timer: {
                isRunning: false,
                startTime: null,
                elapsed: 0
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        console.log(`✅ 作成されたタスク:`, task);
        
        this.tasks.push(task);
        await this.storage.saveTask(task);
        
        console.log(`📋 タスク追加完了 - 総タスク数: ${this.tasks.length}件`);
        return task;
    }
    
    // タスクの更新
    async updateTask(taskId, updates) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates, updatedAt: Date.now() };
            await this.storage.saveTask(this.tasks[taskIndex]);
            return this.tasks[taskIndex];
        }
        return null;
    }
    
    // タスクの削除
    async deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
            this.tasks.splice(taskIndex, 1);
            // ストレージからも削除
            return true;
        }
        return false;
    }
    
    // タスクの取得
    getTask(taskId) {
        return this.tasks.find(t => t.id === taskId && t.userId === this.currentUserId);
    }
    
    // 全タスクの取得
    getAllTasks() {
        return this.tasks.filter(t => t.userId === this.currentUserId);
    }
    
    // フォーカスタスクの取得
    getFocusTasks() {
        return this.tasks.filter(t => t.isFocus);
    }
    
    // 今日のタスクの取得
    getTodayTasks() {
        const today = new Date().toISOString().split('T')[0];
        return this.tasks.filter(t => t.dueDate === today || !t.dueDate);
    }
    
    // タスクの並び替え
    async reorderTasks(draggedId, targetId) {
        const draggedIndex = this.tasks.findIndex(t => t.id === draggedId);
        const targetIndex = this.tasks.findIndex(t => t.id === targetId);
        
        if (draggedIndex >= 0 && targetIndex >= 0) {
            const draggedTask = this.tasks.splice(draggedIndex, 1)[0];
            this.tasks.splice(targetIndex, 0, draggedTask);
            
            // 順序を更新
            this.tasks.forEach((task, index) => {
                task.order = index + 1;
                this.storage.saveTask(task);
            });
        }
    }
    
    // タスクIDの生成
    generateTaskId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // タスクの完了率計算
    calculateCompletionRate() {
        if (this.tasks.length === 0) return 0;
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        return Math.round((completedTasks / this.tasks.length) * 100);
    }
    
    // ストリーク計算
    calculateStreak() {
        // 簡易的なストリーク計算
        const today = new Date();
        let streak = 0;
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayTasks = this.tasks.filter(t => {
                const taskDate = new Date(t.completedAt || t.createdAt).toISOString().split('T')[0];
                return taskDate === dateStr && t.status === 'completed' && t.userId === this.currentUserId;
            });
            
            if (dayTasks.length > 0) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    // タスクの読み込み
    async loadTasks() {
        try {
            console.log(`📋 タスク読み込み開始 - ユーザーID: ${this.currentUserId}`);
            
            if (!this.currentUserId) {
                console.warn('⚠️ ユーザーIDが設定されていないため、タスクを読み込めません');
                this.tasks = [];
                return;
            }
            
            const allTasks = await this.storage.getAllTasks();
            console.log(`📂 ストレージから取得したタスク数: ${allTasks.length}件`);
            
            // 現在のユーザーのタスクのみをフィルタリング
            this.tasks = allTasks.filter(task => {
                const isUserTask = task.userId === this.currentUserId;
                console.log(`🔍 タスクチェック: ${task.title} - userId: ${task.userId}, currentUserId: ${this.currentUserId}, match: ${isUserTask}`);
                return isUserTask;
            });
            
            console.log(`📋 ユーザー ${this.currentUserId} のタスクを読み込み: ${this.tasks.length}件`);
            
            // デバッグ: 読み込まれたタスクの詳細
            this.tasks.forEach((task, index) => {
                console.log(`📝 タスク${index + 1}: ${task.title} (ID: ${task.id}, userId: ${task.userId})`);
            });
            
        } catch (error) {
            console.error('❌ タスク読み込みエラー:', error);
            this.tasks = [];
        }
    }
}

// グローバルに公開
window.TaskManager = TaskManager;

