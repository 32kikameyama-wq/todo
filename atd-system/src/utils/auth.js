// 認証管理ユーティリティ
class AuthManager {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.initializeAuth();
    }
    
    async initializeAuth() {
        try {
            const { getAuth, onAuthStateChanged } = await import('firebase/auth');
            this.auth = getAuth();
            
            // 認証状態の監視
            onAuthStateChanged(this.auth, (user) => {
                this.currentUser = user;
                this.onAuthStateChange(user);
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
        }
    }
    
    onAuthStateChange(user) {
        // 認証状態変更時の処理
        if (user) {
            console.log('User signed in:', user);
        } else {
            console.log('User signed out');
        }
    }
    
    // Googleログイン
    async signInWithGoogle() {
        if (!this.auth) return null;
        try {
            const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            return result.user;
        } catch (error) {
            console.error('Google sign in error:', error);
            throw error;
        }
    }
    
    // 匿名ログイン
    async signInAnonymously() {
        if (!this.auth) return null;
        try {
            const { signInAnonymously } = await import('firebase/auth');
            const result = await signInAnonymously(this.auth);
            return result.user;
        } catch (error) {
            console.error('Anonymous sign in error:', error);
            throw error;
        }
    }
    
    // ログアウト
    async signOut() {
        if (!this.auth) return;
        try {
            const { signOut } = await import('firebase/auth');
            await signOut(this.auth);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }
    
    // 現在のユーザー取得
    getCurrentUser() {
        return this.currentUser;
    }
    
    // 認証状態チェック
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// グローバルに公開
window.AuthManager = AuthManager;
