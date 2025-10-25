// タスク管理ユーティリティ
class TaskManager {
    constructor() {
        this.tasks = [];
        this.storage = new StorageManager();
    }
    
    // タスクの追加
    async addTask(taskData) {
        const task = {
            id: this.generateTaskId(),
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
        
        this.tasks.push(task);
        await this.storage.saveTask(task);
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
        return this.tasks.find(t => t.id === taskId);
    }
    
    // 全タスクの取得
    getAllTasks() {
        return this.tasks;
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
}

// グローバルに公開
window.TaskManager = TaskManager;
