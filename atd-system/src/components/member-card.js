// メンバーカードコンポーネント
class MemberCard {
    constructor(member, options = {}) {
        this.member = member;
        this.options = {
            showMetrics: true,
            showActions: true,
            showProgress: true,
            ...options
        };
    }
    
    render() {
        const getInitials = (name) => {
            return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase();
        };
        
        const formatDate = (timestamp) => {
            if (!timestamp) return '不明';
            const date = new Date(timestamp);
            return date.toLocaleDateString('ja-JP');
        };
        
        return `
            <div class="member-item" data-member-id="${this.member.id}">
                <div class="member-avatar">${getInitials(this.member.name)}</div>
                <div class="member-info">
                    <div class="member-name">${this.member.name}</div>
                    <div class="member-role">${this.member.role}</div>
                    <div class="member-last-active">最終活動: ${formatDate(this.member.lastActive)}</div>
                </div>
                ${this.options.showMetrics ? `
                    <div class="member-metrics">
                        <div class="member-completion">${this.member.completionRate || 0}%</div>
                        <div class="member-tasks">${this.member.tasksCompleted || 0}タスク</div>
                        ${this.options.showProgress ? `
                            <div class="progress-bar">
                                <div class="progress" style="width: ${this.member.completionRate || 0}%"></div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                ${this.options.showActions ? `
                    <div class="member-actions">
                        <button class="btn btn-sm btn-secondary" onclick="app.viewMemberProfile('${this.member.id}')">
                            プロフィール
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="app.assignTaskToMember('${this.member.id}')">
                            タスク割当
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // メンバーの更新
    update(updates) {
        this.member = { ...this.member, ...updates };
        return this.render();
    }
    
    // メトリクスの更新
    updateMetrics(metrics) {
        this.member.completionRate = metrics.completionRate;
        this.member.tasksCompleted = metrics.tasksCompleted;
        this.member.lastActive = metrics.lastActive;
        return this.render();
    }
}

// グローバルに公開
window.MemberCard = MemberCard;
