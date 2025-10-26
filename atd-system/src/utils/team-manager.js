// チーム管理ユーティリティ
class TeamManager {
    constructor() {
        this.currentTeam = null;
        this.teamMembers = [];
        this.storage = new StorageManager();
        this.realtimeListeners = [];
        this.permissions = {
            admin: ['read', 'write', 'delete', 'invite', 'manage'],
            member: ['read', 'write'],
            viewer: ['read']
        };
    }
    
    // チームの作成
    async createTeam(teamData) {
        const team = {
            id: this.generateTeamId(),
            name: teamData.name,
            description: teamData.description || '',
            adminIds: [teamData.creatorId],
            memberIds: [teamData.creatorId],
            settings: {
                allowGuestAccess: false,
                requireApproval: true,
                maxMembers: 50,
                notificationSettings: {
                    taskUpdates: true,
                    memberActivity: true,
                    deadlineReminders: true
                }
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        this.currentTeam = team;
        await this.storage.saveTeamData(team);
        
        // リアルタイムリスナーの設定
        this.setupRealtimeListeners(team.id);
        
        return team;
    }
    
    // リアルタイムリスナーの設定
    setupRealtimeListeners(teamId) {
        if (window.firebaseDB) {
            // チームデータの変更を監視
            const teamRef = window.firebaseDB.collection('teams').doc(teamId);
            const unsubscribe = teamRef.onSnapshot((doc) => {
                if (doc.exists) {
                    const teamData = doc.data();
                    this.currentTeam = teamData;
                    this.notifyListeners('team_updated', teamData);
                }
            });
            this.realtimeListeners.push(unsubscribe);
            
            // チームメンバーの変更を監視
            const membersRef = window.firebaseDB.collection('teams').doc(teamId).collection('members');
            const membersUnsubscribe = membersRef.onSnapshot((snapshot) => {
                const members = [];
                snapshot.forEach(doc => {
                    members.push(doc.data());
                });
                this.teamMembers = members;
                this.notifyListeners('members_updated', members);
            });
            this.realtimeListeners.push(membersUnsubscribe);
        }
    }
    
    // リスナーの通知
    notifyListeners(event, data) {
        this.realtimeListeners.forEach(callback => {
            if (typeof callback === 'function') {
                callback(event, data);
            }
        });
    }
    
    // リスナーの追加
    addRealtimeListener(callback) {
        this.realtimeListeners.push(callback);
    }
    
    // リスナーの削除
    removeRealtimeListener(callback) {
        const index = this.realtimeListeners.indexOf(callback);
        if (index > -1) {
            this.realtimeListeners.splice(index, 1);
        }
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
    
    // 権限チェック
    hasPermission(userId, action) {
        if (!this.currentTeam) return false;
        
        const member = this.teamMembers.find(m => m.id === userId);
        if (!member) return false;
        
        const userPermissions = this.permissions[member.role] || [];
        return userPermissions.includes(action);
    }
    
    // 管理者権限チェック
    isAdmin(userId) {
        return this.currentTeam && this.currentTeam.adminIds.includes(userId);
    }
    
    // メンバー招待
    async inviteMember(email, role = 'member') {
        if (!this.hasPermission(this.currentUser?.uid, 'invite')) {
            throw new Error('招待権限がありません');
        }
        
        const invitation = {
            id: this.generateInvitationId(),
            teamId: this.currentTeam.id,
            email: email,
            role: role,
            invitedBy: this.currentUser.uid,
            status: 'pending',
            createdAt: Date.now(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7日後
        };
        
        // 招待を保存
        if (window.firebaseDB) {
            await window.firebaseDB.collection('invitations').doc(invitation.id).set(invitation);
        }
        
        return invitation;
    }
    
    // 招待の承認
    async acceptInvitation(invitationId, userId) {
        const invitation = await this.getInvitation(invitationId);
        if (!invitation || invitation.status !== 'pending') {
            throw new Error('無効な招待です');
        }
        
        // メンバーを追加
        const member = await this.addMember({
            id: userId,
            email: invitation.email,
            role: invitation.role
        });
        
        // 招待を更新
        if (window.firebaseDB) {
            await window.firebaseDB.collection('invitations').doc(invitationId).update({
                status: 'accepted',
                acceptedAt: Date.now(),
                acceptedBy: userId
            });
        }
        
        return member;
    }
    
    // 招待の取得
    async getInvitation(invitationId) {
        if (window.firebaseDB) {
            const doc = await window.firebaseDB.collection('invitations').doc(invitationId).get();
            return doc.exists ? doc.data() : null;
        }
        return null;
    }
    
    // 招待IDの生成
    generateInvitationId() {
        return 'invite_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // チーム設定の更新
    async updateTeamSettings(settings) {
        if (!this.hasPermission(this.currentUser?.uid, 'manage')) {
            throw new Error('設定変更権限がありません');
        }
        
        this.currentTeam.settings = { ...this.currentTeam.settings, ...settings };
        this.currentTeam.updatedAt = Date.now();
        
        await this.storage.saveTeamData(this.currentTeam);
        return this.currentTeam;
    }
    
    // メンバーの役割変更
    async changeMemberRole(memberId, newRole) {
        if (!this.hasPermission(this.currentUser?.uid, 'manage')) {
            throw new Error('役割変更権限がありません');
        }
        
        const member = this.teamMembers.find(m => m.id === memberId);
        if (!member) {
            throw new Error('メンバーが見つかりません');
        }
        
        member.role = newRole;
        member.updatedAt = Date.now();
        
        // Firestoreに保存
        if (window.firebaseDB) {
            await window.firebaseDB.collection('teams').doc(this.currentTeam.id)
                .collection('members').doc(memberId).update(member);
        }
        
        return member;
    }
    
    // メンバーの削除
    async removeMember(memberId) {
        if (!this.hasPermission(this.currentUser?.uid, 'manage')) {
            throw new Error('メンバー削除権限がありません');
        }
        
        const member = this.teamMembers.find(m => m.id === memberId);
        if (!member) {
            throw new Error('メンバーが見つかりません');
        }
        
        // 管理者は削除できない
        if (this.isAdmin(memberId)) {
            throw new Error('管理者は削除できません');
        }
        
        // メンバーを削除
        this.teamMembers = this.teamMembers.filter(m => m.id !== memberId);
        this.currentTeam.memberIds = this.currentTeam.memberIds.filter(id => id !== memberId);
        
        // Firestoreから削除
        if (window.firebaseDB) {
            await window.firebaseDB.collection('teams').doc(this.currentTeam.id)
                .collection('members').doc(memberId).delete();
        }
        
        await this.storage.saveTeamData(this.currentTeam);
        return true;
    }
    
    // クリーンアップ
    destroy() {
        this.realtimeListeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.realtimeListeners = [];
    }
}

// グローバルに公開
window.TeamManager = TeamManager;
