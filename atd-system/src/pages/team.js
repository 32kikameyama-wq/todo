// チームページ管理
class TeamPage {
    constructor() {
        this.teamManager = new TeamManager();
        this.modalManager = new ModalManager();
    }
    
    async initialize() {
        console.log('Initializing team page...');
        
        // チームデータの読み込み
        await this.loadTeamData();
        
        // イベントリスナーの設定
        this.setupEventListeners();
    }
    
    async loadTeamData() {
        // モックデータ
        const teamMembers = [
            {
                id: 'user_1',
                name: '田中太郎',
                role: '管理者',
                completionRate: 90,
                tasksCompleted: 15,
                lastActive: Date.now() - 86400000
            },
            {
                id: 'user_2',
                name: '佐藤花子',
                role: 'メンバー',
                completionRate: 85,
                tasksCompleted: 12,
                lastActive: Date.now() - 172800000
            },
            {
                id: 'user_3',
                name: '鈴木一郎',
                role: 'メンバー',
                completionRate: 78,
                tasksCompleted: 8,
                lastActive: Date.now() - 259200000
            }
        ];
        
        this.renderTeamMembers(teamMembers);
        this.updateTeamKPI();
    }
    
    renderTeamMembers(members) {
        const membersList = document.getElementById('members-list');
        if (!membersList) return;
        
        let html = '';
        members.forEach(member => {
            const memberCard = new MemberCard(member, { 
                showMetrics: true, 
                showActions: true, 
                showProgress: true 
            });
            html += memberCard.render();
        });
        
        membersList.innerHTML = html;
    }
    
    updateTeamKPI() {
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
    
    setupEventListeners() {
        // チーム作成ボタン
        const createTeamBtn = document.getElementById('create-team-btn');
        if (createTeamBtn) {
            createTeamBtn.addEventListener('click', () => this.showCreateTeamModal());
        }
        
        // メンバー招待ボタン
        const inviteMemberBtn = document.getElementById('invite-member-btn');
        if (inviteMemberBtn) {
            inviteMemberBtn.addEventListener('click', () => this.showInviteMemberModal());
        }
    }
    
    showCreateTeamModal() {
        const modalContent = `
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
        `;
        
        this.modalManager.show('チーム作成', modalContent);
        
        // フォーム送信の処理
        const form = document.getElementById('create-team-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateTeam(form);
            });
        }
    }
    
    async handleCreateTeam(form) {
        const teamData = {
            name: document.getElementById('team-name').value,
            description: document.getElementById('team-description').value,
            creatorId: 'current_user_id' // 実際のユーザーID
        };
        
        try {
            await this.teamManager.createTeam(teamData);
            this.modalManager.close();
            await this.loadTeamData(); // チームデータを再読み込み
        } catch (error) {
            console.error('Create team error:', error);
            alert('チームの作成に失敗しました。');
        }
    }
    
    showInviteMemberModal() {
        const modalContent = `
            <form id="invite-member-form">
                <div class="form-group">
                    <label for="invite-email">メールアドレス</label>
                    <input type="email" id="invite-email" required>
                </div>
                <div class="form-group">
                    <label for="invite-role">ロール</label>
                    <select id="invite-role">
                        <option value="member">メンバー</option>
                        <option value="admin">管理者</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">招待</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">キャンセル</button>
                </div>
            </form>
        `;
        
        this.modalManager.show('メンバー招待', modalContent);
        
        // フォーム送信の処理
        const form = document.getElementById('invite-member-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleInviteMember(form);
            });
        }
    }
    
    async handleInviteMember(form) {
        const memberData = {
            email: document.getElementById('invite-email').value,
            role: document.getElementById('invite-role').value
        };
        
        try {
            await this.teamManager.addMember(memberData);
            this.modalManager.close();
            await this.loadTeamData(); // チームデータを再読み込み
        } catch (error) {
            console.error('Invite member error:', error);
            alert('メンバーの招待に失敗しました。');
        }
    }
    
    // ページの破棄
    destroy() {
        // クリーンアップ処理
    }
}

// グローバルに公開
window.TeamPage = TeamPage;
