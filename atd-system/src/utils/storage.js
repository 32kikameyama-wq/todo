// ストレージ管理ユーティリティ
class StorageManager {
    constructor() {
        this.db = null;
        this.initializeFirestore();
    }
    
    async initializeFirestore() {
        try {
            const { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } = await import('firebase/firestore');
            this.db = getFirestore();
        } catch (error) {
            console.error('Firestore initialization error:', error);
        }
    }
    
    // タスクの保存
    async saveTask(task) {
        if (!this.db) return;
        try {
            const { doc, setDoc } = await import('firebase/firestore');
            await setDoc(doc(this.db, 'tasks', task.id), task);
        } catch (error) {
            console.error('Save task error:', error);
        }
    }
    
    // タスクの取得
    async getTask(taskId) {
        if (!this.db) return null;
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const taskDoc = await getDoc(doc(this.db, 'tasks', taskId));
            return taskDoc.exists() ? taskDoc.data() : null;
        } catch (error) {
            console.error('Get task error:', error);
            return null;
        }
    }
    
    // 全タスクの取得
    async getAllTasks() {
        if (!this.db) return [];
        try {
            const { collection, getDocs } = await import('firebase/firestore');
            const tasksSnapshot = await getDocs(collection(this.db, 'tasks'));
            return tasksSnapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('Get all tasks error:', error);
            return [];
        }
    }
    
    // ローカルストレージのフォールバック
    saveTaskLocal(task) {
        try {
            const tasks = JSON.parse(localStorage.getItem('atd_tasks') || '[]');
            const index = tasks.findIndex(t => t.id === task.id);
            if (index >= 0) {
                tasks[index] = task;
            } else {
                tasks.push(task);
            }
            localStorage.setItem('atd_tasks', JSON.stringify(tasks));
        } catch (error) {
            console.error('Local storage error:', error);
        }
    }
    
    getTaskLocal(taskId) {
        try {
            const tasks = JSON.parse(localStorage.getItem('atd_tasks') || '[]');
            return tasks.find(t => t.id === taskId) || null;
        } catch (error) {
            console.error('Local storage error:', error);
            return null;
        }
    }
    
    getAllTasksLocal() {
        try {
            return JSON.parse(localStorage.getItem('atd_tasks') || '[]');
        } catch (error) {
            console.error('Local storage error:', error);
            return [];
        }
    }
}

// グローバルに公開
window.StorageManager = StorageManager;
