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
        
        // フォーカスタスクの表示
        await this.updateFocusTasks();
        
        // チャートの初期化
        await this.initializeCharts();
        
        // チームKPIの更新
        await this.updateTeamKPI();
    }
    
    async updatePersonalKPI() {
        const completionRate = document.getElementById('personal-completion-rate');
        const tasksCompleted = document.getElementById('personal-tasks-completed');
        const streak = document.getElementById('personal-streak');
        
        // モックデータ
        const kpi = {
            completionRate: 85,
            tasksCompleted: 12,
            streak: 5
        };
        
        if (completionRate) completionRate.textContent = `${kpi.completionRate}%`;
        if (tasksCompleted) tasksCompleted.textContent = kpi.tasksCompleted;
        if (streak) streak.textContent = `${kpi.streak}日`;
    }
    
    async updateFocusTasks() {
        const focusTasks = document.getElementById('focus-tasks');
        if (!focusTasks) return;
        
        // モックデータ
        const tasks = [
            { title: 'プロジェクト企画書作成', timer: 5400 },
            { title: '会議資料準備', timer: 0 },
            { title: 'システム設計レビュー', timer: 0 }
        ];
        
        let html = '';
        tasks.forEach(task => {
            const hours = Math.floor(task.timer / 3600);
            const minutes = Math.floor((task.timer % 3600) / 60);
            const seconds = task.timer % 60;
            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            html += `
                <div class="focus-task">
                    <div class="task-title">${task.title}</div>
                    <div class="task-timer">${timeStr}</div>
                </div>
            `;
        });
        
        focusTasks.innerHTML = html;
    }
    
    async initializeCharts() {
        // 進捗チャート
        this.chartManager.initializeProgressChart('progress-chart', {
            title: 'タスク完了状況',
            data: [12, 3, 5],
            labels: ['完了', '進行中', '未着手'],
            colors: ['#4CAF50', '#FF9800', '#2196F3']
        });
        
        // 時間分析チャート
        this.chartManager.initializeTimeChart('time-chart', {
            title: '時間分析',
            data: [6, 8, 4, 7, 5, 2, 1],
            labels: ['月', '火', '水', '木', '金', '土', '日']
        });
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
