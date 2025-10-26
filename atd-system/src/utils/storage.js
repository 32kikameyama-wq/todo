// ストレージ管理ユーティリティ
class StorageManager {
    constructor() {
        this.db = null;
        this.currentUser = null;
        this.initializeFirestore();
    }
    
    async initializeFirestore() {
        try {
            // Firebase Firestoreが利用可能かチェック
            if (window.firebaseDB) {
                this.db = window.firebaseDB;
                console.log('Storage manager initialized with Firestore');
            } else {
                console.log('Storage manager initialized in mock mode');
            }
        } catch (error) {
            console.error('Firestore initialization error:', error);
        }
    }
    
    // 現在のユーザーを設定
    setCurrentUser(user) {
        this.currentUser = user;
    }
    
    // ユーザー固有のストレージキーを取得
    getUserStorageKey(dataType) {
        if (!this.currentUser || !this.currentUser.uid) {
            console.warn('⚠️ ユーザーが未ログインまたはUIDが無効です');
            return `atd_${dataType}`; // ユーザーが未ログインの場合は従来のキー
        }
        const userKey = `atd_user_${this.currentUser.uid}_${dataType}`;
        console.log(`🔑 ユーザーストレージキー生成: ${userKey}`);
        return userKey;
    }
    
    // ユーザー固有のコレクション名を取得
    getUserCollection(collectionName) {
        if (!this.currentUser) return collectionName;
        return `users/${this.currentUser.uid}/${collectionName}`;
    }
    
    // タスクの保存
    async saveTask(task) {
        try {
            if (this.db && this.currentUser) {
                // Firestoreに保存
                const userTasksRef = this.db.collection(this.getUserCollection('tasks'));
                await userTasksRef.doc(task.id).set({
                    ...task,
                    userId: this.currentUser.uid,
                    updatedAt: Date.now()
                });
                console.log('Task saved to Firestore:', task.id);
            } else {
                // ローカルストレージに保存
                this.saveTaskLocal(task);
                console.log('Task saved to local storage:', task.id);
            }
        } catch (error) {
            console.error('Save task error:', error);
            // エラー時はローカルストレージに保存
            this.saveTaskLocal(task);
        }
    }
    
    // タスクの取得
    async getTask(taskId) {
        try {
            if (this.db && this.currentUser) {
                const userTasksRef = this.db.collection(this.getUserCollection('tasks'));
                const taskDoc = await userTasksRef.doc(taskId).get();
                return taskDoc.exists ? taskDoc.data() : null;
            } else {
                return this.getTaskLocal(taskId);
            }
        } catch (error) {
            console.error('Get task error:', error);
            return this.getTaskLocal(taskId);
        }
    }
    
    // 全タスクの取得
    async getAllTasks() {
        try {
            if (this.db && this.currentUser) {
                const userTasksRef = this.db.collection(this.getUserCollection('tasks'));
                const tasksSnapshot = await userTasksRef.get();
                return tasksSnapshot.docs.map(doc => doc.data());
            } else {
                return this.getAllTasksLocal();
            }
        } catch (error) {
            console.error('Get all tasks error:', error);
            return this.getAllTasksLocal();
        }
    }
    
    // タスクの削除
    async deleteTask(taskId) {
        try {
            if (this.db && this.currentUser) {
                const userTasksRef = this.db.collection(this.getUserCollection('tasks'));
                await userTasksRef.doc(taskId).delete();
                console.log('Task deleted from Firestore:', taskId);
            } else {
                this.deleteTaskLocal(taskId);
                console.log('Task deleted from local storage:', taskId);
            }
        } catch (error) {
            console.error('Delete task error:', error);
            this.deleteTaskLocal(taskId);
        }
    }
    
    // チームデータの保存
    async saveTeamData(teamData) {
        try {
            if (this.db && this.currentUser) {
                const teamsRef = this.db.collection('teams');
                await teamsRef.doc(teamData.id).set({
                    ...teamData,
                    updatedAt: Date.now()
                });
                console.log('Team data saved to Firestore:', teamData.id);
            } else {
                this.saveTeamDataLocal(teamData);
                console.log('Team data saved to local storage:', teamData.id);
            }
        } catch (error) {
            console.error('Save team data error:', error);
            this.saveTeamDataLocal(teamData);
        }
    }
    
    // チームデータの取得
    async getTeamData(teamId) {
        try {
            if (this.db && this.currentUser) {
                const teamsRef = this.db.collection('teams');
                const teamDoc = await teamsRef.doc(teamId).get();
                return teamDoc.exists ? teamDoc.data() : null;
            } else {
                return this.getTeamDataLocal(teamId);
            }
        } catch (error) {
            console.error('Get team data error:', error);
            return this.getTeamDataLocal(teamId);
        }
    }
    
    // ローカルストレージのフォールバック
    saveTaskLocal(task) {
        try {
            const userKey = this.getUserStorageKey('tasks');
            console.log(`💾 タスク保存 - キー: ${userKey}, タスクID: ${task.id}, ユーザーID: ${task.userId}`);
            
            const tasks = JSON.parse(localStorage.getItem(userKey) || '[]');
            const index = tasks.findIndex(t => t.id === task.id);
            if (index >= 0) {
                tasks[index] = task;
                console.log(`📝 タスク更新: ${task.title}`);
            } else {
                tasks.push(task);
                console.log(`➕ 新規タスク追加: ${task.title}`);
            }
            localStorage.setItem(userKey, JSON.stringify(tasks));
            
            // デバッグ: 保存後のタスク数を確認
            const savedTasks = JSON.parse(localStorage.getItem(userKey) || '[]');
            console.log(`✅ 保存完了 - 総タスク数: ${savedTasks.length}件`);
        } catch (error) {
            console.error('❌ ローカルストレージ保存エラー:', error);
        }
    }
    
    getTaskLocal(taskId) {
        try {
            const userKey = this.getUserStorageKey('tasks');
            const tasks = JSON.parse(localStorage.getItem(userKey) || '[]');
            return tasks.find(t => t.id === taskId) || null;
        } catch (error) {
            console.error('Local storage error:', error);
            return null;
        }
    }
    
    getAllTasksLocal() {
        try {
            const userKey = this.getUserStorageKey('tasks');
            console.log(`📂 タスク読み込み - キー: ${userKey}`);
            
            const tasks = JSON.parse(localStorage.getItem(userKey) || '[]');
            console.log(`📋 読み込まれたタスク数: ${tasks.length}件`);
            
            // デバッグ: 各タスクのユーザーIDを確認
            tasks.forEach((task, index) => {
                console.log(`📝 タスク${index + 1}: ID=${task.id}, userId=${task.userId}, title=${task.title}`);
            });
            
            return tasks;
        } catch (error) {
            console.error('❌ ローカルストレージエラー:', error);
            return [];
        }
    }
    
    deleteTaskLocal(taskId) {
        try {
            const userKey = this.getUserStorageKey('tasks');
            const tasks = JSON.parse(localStorage.getItem(userKey) || '[]');
            const filteredTasks = tasks.filter(t => t.id !== taskId);
            localStorage.setItem(userKey, JSON.stringify(filteredTasks));
        } catch (error) {
            console.error('Local storage error:', error);
        }
    }
    
    saveTeamDataLocal(teamData) {
        try {
            const teams = JSON.parse(localStorage.getItem('atd_teams') || '[]');
            const index = teams.findIndex(t => t.id === teamData.id);
            if (index >= 0) {
                teams[index] = teamData;
            } else {
                teams.push(teamData);
            }
            localStorage.setItem('atd_teams', JSON.stringify(teams));
        } catch (error) {
            console.error('Local storage error:', error);
        }
    }
    
    getTeamDataLocal(teamId) {
        try {
            const teams = JSON.parse(localStorage.getItem('atd_teams') || '[]');
            return teams.find(t => t.id === teamId) || null;
        } catch (error) {
            console.error('Local storage error:', error);
            return null;
        }
    }
}

// グローバルに公開
window.StorageManager = StorageManager;
