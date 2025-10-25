// チーム管理ユーティリティ
class TeamManager {
    constructor() {
        this.currentTeam = null;
        this.teamMembers = [];
        this.storage = new StorageManager();
    }
    
    // チームの作成
    async createTeam(teamData) {
        const team = {
            id: this.generateTeamId(),
            name: teamData.name,
            description: teamData.description || '',
            adminIds: [teamData.creatorId],
            memberIds: [teamData.creatorId],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        this.currentTeam = team;
        await this.storage.saveTeam(team);
        return team;
    }
    
    // チームの取得
    getCurrentTeam() {
        return this.currentTeam;
    }
    
    // メンバーの追加
    async addMember(memberData) {
        const member = {
            id: this.generateMemberId(),
            name: memberData.name,
            email: memberData.email,
            role: memberData.role || 'member',
            joinedAt: Date.now(),
            lastActive: Date.now()
        };
        
        this.teamMembers.push(member);
        if (this.currentTeam) {
            this.currentTeam.memberIds.push(member.id);
            await this.storage.saveTeam(this.currentTeam);
        }
        return member;
    }
    
    // メンバーの取得
    getTeamMembers() {
        return this.teamMembers;
    }
    
    // チームKPIの計算
    calculateTeamKPI() {
        if (!this.currentTeam || this.teamMembers.length === 0) {
            return {
                totalTasks: 0,
                completedTasks: 0,
                completionRate: 0,
                averageLeadTime: 0,
                totalTimeSpent: 0
            };
        }
        
        // 簡易的なKPI計算
        const totalTasks = this.teamMembers.reduce((sum, member) => sum + (member.tasksCompleted || 0), 0);
        const completedTasks = Math.floor(totalTasks * 0.8); // 仮の完了率80%
        
        return {
            totalTasks,
            completedTasks,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            averageLeadTime: 2.3, // 仮の平均リードタイム
            totalTimeSpent: totalTasks * 2 // 仮の総作業時間
        };
    }
    
    // メンバー別パフォーマンス
    getMemberPerformance() {
        return this.teamMembers.map(member => ({
            id: member.id,
            name: member.name,
            role: member.role,
            completionRate: member.completionRate || Math.floor(Math.random() * 30) + 70,
            tasksCompleted: member.tasksCompleted || Math.floor(Math.random() * 20) + 5,
            lastActive: member.lastActive
        }));
    }
    
    // チームIDの生成
    generateTeamId() {
        return 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // メンバーIDの生成
    generateMemberId() {
        return 'member_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// グローバルに公開
window.TeamManager = TeamManager;
