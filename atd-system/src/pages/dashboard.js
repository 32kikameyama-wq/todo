// ダッシュボードページ管理
class DashboardPage {
    constructor() {
        this.chartManager = new ChartManager();
        this.taskManager = new TaskManager();
        this.teamManager = new TeamManager();
    }
    
    async initialize() {
        console.log('Initializing dashboard page...');
        
        // 個人KPIの更新
        await this.updatePersonalKPI();
        
        // 今日のタスクの表示
        await this.updateTodayTasksDashboard();
        
        // チーム今日のタスクの表示
        await this.updateTeamTodayTasksDashboard();
        
        // チャートの初期化
        await this.initializeCharts();
        
        // チームKPIの更新
        await this.updateTeamKPI();
    }
    
    async updatePersonalKPI() {
        const completionRate = document.getElementById('personal-completion-rate');
        const tasksCompleted = document.getElementById('personal-tasks-completed');
        const streak = document.getElementById('personal-streak');
        
        // 実際のタスクデータから計算
        let kpi = {
            completionRate: 0,
            tasksCompleted: 0,
            streak: 0
        };
        
        if (window.app && window.app.personalTasks) {
            const tasks = window.app.personalTasks;
            const completedTasks = tasks.filter(t => t.status === 'completed');
            
            // 完了率を計算
            if (tasks.length > 0) {
                kpi.completionRate = Math.round((completedTasks.length / tasks.length) * 100);
            }
            
            // 完了タスク数
            kpi.tasksCompleted = completedTasks.length;
            
            // ストリーク計算
            kpi.streak = this.calculateStreak(completedTasks);
        }
        
        if (completionRate) completionRate.textContent = `${kpi.completionRate}%`;
        if (tasksCompleted) tasksCompleted.textContent = kpi.tasksCompleted;
        if (streak) streak.textContent = `${kpi.streak}日`;
    }
    
    calculateStreak(completedTasks) {
        if (!completedTasks || completedTasks.length === 0) return 0;
        
        // タスクを完了日時でソート（新しい順）
        const sorted = [...completedTasks].sort((a, b) => {
            const dateA = a.completedAt || a.updatedAt || a.createdAt;
            const dateB = b.completedAt || b.updatedAt || b.createdAt;
            return dateB - dateA;
        });
        
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        for (const task of sorted) {
            const taskDate = new Date(task.completedAt || task.updatedAt || task.createdAt);
            taskDate.setHours(0, 0, 0, 0);
            
            const daysDiff = Math.floor((currentDate - taskDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
                streak++;
            } else if (daysDiff > streak) {
                break;
            }
        }
        
        return streak;
    }
    
    async updateTodayTasksDashboard() {
        const todayTasksContainer = document.getElementById('today-tasks-dashboard');
        const todayTasksCount = document.getElementById('today-tasks-count-dash');
        if (!todayTasksContainer) {
            console.warn('⚠️ today-tasks-dashboard要素が見つかりません');
            return;
        }
        
        console.log('🔍 今日のタスクダッシュボード更新開始');
        console.log('window.app:', window.app);
        console.log('window.app.getTodayTasks:', window.app ? typeof window.app.getTodayTasks : 'N/A');
        
        // 今日のタスクを取得
        let tasks = [];
        if (window.app && typeof window.app.getTodayTasks === 'function') {
            tasks = window.app.getTodayTasks();
            console.log('📋 今日のタスクを取得:', tasks.length, '件');
        } else {
            console.warn('⚠️ window.app.getTodayTasksが利用できません');
        }
        
        // タスクをorderで並び替え（優先順位）
        tasks = tasks.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            return 0;
        });
        
        if (todayTasksCount) {
            todayTasksCount.textContent = tasks.length;
        }
        
        if (tasks.length === 0) {
            todayTasksContainer.innerHTML = '<div class="no-tasks">今日のタスクはありません</div>';
            return;
        }
        
        let html = '<ul class="today-tasks-list">';
        tasks.forEach((task, index) => {
            const hours = Math.floor(task.timer.elapsed / 3600);
            const minutes = Math.floor((task.timer.elapsed % 3600) / 60);
            const seconds = task.timer.elapsed % 60;
            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            html += `
                <li class="today-task-item" data-task-id="${task.id}">
                    <div class="task-checkbox-wrapper">
                        <input type="checkbox" class="task-check" ${task.status === 'completed' ? 'checked' : ''} 
                               onchange="app.toggleTaskCompletionDashboard('${task.id}')">
                        <span class="task-title">${task.title}</span>
                    </div>
                    <div class="task-actions-dash">
                        ${index > 0 ? `<button class="btn-move-up" onclick="app.moveTaskUpDashboard('${task.id}')" title="上に移動">↑</button>` : ''}
                        ${index < tasks.length - 1 ? `<button class="btn-move-down" onclick="app.moveTaskDownDashboard('${task.id}')" title="下に移動">↓</button>` : ''}
                        ${tasks.length === 1 ? '<span class="no-move-buttons"></span>' : ''}
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        
        todayTasksContainer.innerHTML = html;
    }
    
    async updateTeamTodayTasksDashboard() {
        const teamTodayTasksContainer = document.getElementById('team-today-tasks-dashboard');
        const teamTodayTasksCount = document.getElementById('team-today-tasks-count-dash');
        if (!teamTodayTasksContainer) {
            console.warn('⚠️ team-today-tasks-dashboard要素が見つかりません');
            return;
        }
        
        console.log('🔍 チーム今日のタスクダッシュボード更新開始');
        console.log('window.app:', window.app);
        console.log('window.app.getTodayTasks:', window.app ? typeof window.app.getTodayTasks : 'N/A');
        
        // チーム今日のタスクを取得
        let tasks = [];
        if (window.app && typeof window.app.getTodayTasks === 'function') {
            // チームモードに切り替えてタスクを取得
            const currentMode = window.app.currentViewMode;
            window.app.currentViewMode = 'team';
            tasks = window.app.getTodayTasks();
            window.app.currentViewMode = currentMode; // 元のモードに戻す
            console.log('📋 チーム今日のタスクを取得:', tasks.length, '件');
        } else {
            console.warn('⚠️ window.app.getTodayTasksが利用できません');
        }
        
        // タスクをorderで並び替え（優先順位）
        tasks = tasks.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            return 0;
        });
        
        if (teamTodayTasksCount) {
            teamTodayTasksCount.textContent = tasks.length;
        }
        
        if (tasks.length === 0) {
            teamTodayTasksContainer.innerHTML = '<div class="no-tasks">チームの今日のタスクはありません</div>';
            return;
        }
        
        let html = '<ul class="today-tasks-list">';
        tasks.forEach((task, index) => {
            const hours = Math.floor(task.timer.elapsed / 3600);
            const minutes = Math.floor((task.timer.elapsed % 3600) / 60);
            const seconds = task.timer.elapsed % 60;
            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            html += `
                <li class="today-task-item" data-task-id="${task.id}">
                    <div class="task-checkbox-wrapper">
                        <input type="checkbox" class="task-check" ${task.status === 'completed' ? 'checked' : ''} 
                               onchange="app.toggleTaskCompletionDashboard('${task.id}')">
                        <span class="task-title">${task.title}</span>
                    </div>
                    <div class="task-actions-dash">
                        ${index > 0 ? `<button class="btn-move-up" onclick="app.moveTaskUpDashboard('${task.id}')" title="上に移動">↑</button>` : ''}
                        ${index < tasks.length - 1 ? `<button class="btn-move-down" onclick="app.moveTaskDownDashboard('${task.id}')" title="下に移動">↓</button>` : ''}
                        ${tasks.length === 1 ? '<span class="no-move-buttons"></span>' : ''}
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        
        teamTodayTasksContainer.innerHTML = html;
    }
    
    async initializeCharts() {
        // チャート初期化は app.js で行うため、ここでは何もしない
        console.log('📊 ダッシュボードチャート初期化は app.js で実行されます');
    }
    
    async updateTeamKPI() {
        const teamCompletionRate = document.getElementById('team-completion-rate');
        const teamTasksCompleted = document.getElementById('team-tasks-completed');
        const teamAvgLeadTime = document.getElementById('team-avg-lead-time');
        
        // モックデータ
        const teamKPI = {
            completionRate: 78,
            tasksCompleted: 45,
            avgLeadTime: 2.3
        };
        
        if (teamCompletionRate) teamCompletionRate.textContent = `${teamKPI.completionRate}%`;
        if (teamTasksCompleted) teamTasksCompleted.textContent = teamKPI.tasksCompleted;
        if (teamAvgLeadTime) teamAvgLeadTime.textContent = `${teamKPI.avgLeadTime}日`;
    }
    
    // チャートの更新
    updateCharts(data) {
        this.chartManager.updateChart('progress-chart', data.progress);
        this.chartManager.updateChart('time-chart', data.time);
    }
    
    // ページの破棄
    destroy() {
        this.chartManager.destroyAllCharts();
    }
}

// グローバルに公開
window.DashboardPage = DashboardPage;

