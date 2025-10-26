// タスクカードコンポーネント
class TaskCard {
    constructor(task, options = {}) {
        this.task = task;
        this.options = {
            showActions: true,
            showTimer: true,
            showPriority: true,
            draggable: true,
            ...options
        };
    }
    
    render() {
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
        
        const formatTime = (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        
        return `
            <div class="task-card ${this.options.draggable ? 'draggable' : ''} priority-${this.task.priority} ${this.task.status === 'completed' ? 'completed' : ''}" 
                 data-task-id="${this.task.id}" 
                 ${this.options.draggable ? 'draggable="true"' : ''}>
                <div class="task-header">
                    <div class="task-title">${this.task.title}</div>
                    ${this.options.showPriority ? `<div class="task-priority">${priorityLabels[this.task.priority]}</div>` : ''}
                </div>
                <div class="task-description">${this.task.description}</div>
                <div class="task-meta">
                    <div class="task-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${this.task.dueDate || '期限なし'}</span>
                    </div>
                    <div class="task-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>見積: ${this.task.estimatedTime}分</span>
                    </div>
                    <div class="task-meta-item">
                        <i class="fas fa-chart-line"></i>
                        <span>実際: ${this.task.actualTime}分</span>
                    </div>
                </div>
                <div class="task-controls">
                    <label class="task-checkbox">
                        <input type="checkbox" ${this.task.status === 'completed' ? 'checked' : ''} 
                               onchange="app.toggleTaskCompletion('${this.task.id}')">
                        <span class="checkmark"></span>
                    </label>
                    ${this.options.showTimer ? `
                        <div class="task-timer">
                            <button class="timer-btn ${this.task.timer.isRunning ? 'active' : ''}" 
                                    onclick="app.toggleTimer('${this.task.id}')">
                                ⏱️ ${this.task.timer.isRunning ? 'ON' : 'OFF'}
                            </button>
                            <span class="timer-display">${formatTime(this.task.timer.elapsed)}</span>
                        </div>
                    ` : ''}
                    <div class="task-status task-status-${this.task.status}">${statusLabels[this.task.status]}</div>
                </div>
                ${this.options.showActions ? `
                    <div class="task-actions">
                        <button class="btn btn-sm btn-secondary" onclick="app.showTaskDetail('${this.task.id}')">詳細</button>
                        <button class="btn btn-sm btn-secondary" onclick="app.openMindmap('${this.task.id}')">マインドマップ</button>
                        <button class="btn btn-sm btn-primary" onclick="app.moveToToday('${this.task.id}')">📅 今日のタスク</button>
                        <button class="btn btn-sm btn-secondary" onclick="app.moveToTomorrow('${this.task.id}')">📅 明日のタスク</button>
                        <button class="btn btn-sm btn-info" onclick="app.moveToOther('${this.task.id}')">📋 その他のタスク</button>
                        <button class="btn btn-sm btn-secondary" onclick="app.moveTask('${this.task.id}', 'up')">↑</button>
                        <button class="btn btn-sm btn-secondary" onclick="app.moveTask('${this.task.id}', 'down')">↓</button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteTask('${this.task.id}')">🗑️ 削除</button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // ドラッグ&ドロップの設定
    setupDragAndDrop() {
        const card = document.querySelector(`[data-task-id="${this.task.id}"]`);
        if (!card || !this.options.draggable) return;
        
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', this.task.id);
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
            if (window.app && window.app.reorderTasks) {
                window.app.reorderTasks(draggedTaskId, this.task.id);
            }
        });
    }
}

// グローバルに公開
window.TaskCard = TaskCard;
