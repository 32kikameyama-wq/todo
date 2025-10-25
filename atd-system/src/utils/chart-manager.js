// チャート管理ユーティリティ
class ChartManager {
    constructor() {
        this.charts = {};
    }
    
    // 進捗チャートの初期化
    initializeProgressChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels || ['完了', '進行中', '未着手'],
                datasets: [{
                    data: data.data || [12, 3, 5],
                    backgroundColor: data.colors || ['#4CAF50', '#FF9800', '#2196F3'],
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
                        text: data.title || 'タスク完了状況',
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
                    }
                }
            }
        });
        
        this.charts[canvasId] = chart;
        return chart;
    }
    
    // 時間分析チャートの初期化
    initializeTimeChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels || ['月', '火', '水', '木', '金', '土', '日'],
                datasets: [{
                    label: data.label || '作業時間 (時間)',
                    data: data.data || [6, 8, 4, 7, 5, 2, 1],
                    backgroundColor: data.color || '#008b8b',
                    borderColor: data.borderColor || '#006666',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: data.title || '時間分析',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '時間'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '曜日'
                        }
                    }
                }
            }
        });
        
        this.charts[canvasId] = chart;
        return chart;
    }
    
    // 線グラフの初期化
    initializeLineChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: data.datasets || [{
                    label: 'データ',
                    data: [],
                    borderColor: '#008b8b',
                    backgroundColor: 'rgba(0, 139, 139, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: data.title || 'トレンド分析'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        this.charts[canvasId] = chart;
        return chart;
    }
    
    // チャートの更新
    updateChart(canvasId, newData) {
        const chart = this.charts[canvasId];
        if (chart) {
            chart.data = newData;
            chart.update();
        }
    }
    
    // チャートの破棄
    destroyChart(canvasId) {
        const chart = this.charts[canvasId];
        if (chart) {
            chart.destroy();
            delete this.charts[canvasId];
        }
    }
    
    // 全チャートの破棄
    destroyAllCharts() {
        Object.keys(this.charts).forEach(canvasId => {
            this.destroyChart(canvasId);
        });
    }
}

// グローバルに公開
window.ChartManager = ChartManager;
