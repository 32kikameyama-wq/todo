// Firebase設定（モック版）
const firebaseConfig = {
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
};

// Firebase初期化（モック版）
try {
    // Firebaseが利用できない場合はモックオブジェクトを作成
    window.firebaseApp = {
        name: 'demo-app',
        options: firebaseConfig
    };
    
    window.firebaseAuth = {
        currentUser: null,
        onAuthStateChanged: (callback) => {
            // モック認証状態 - 即座に未認証状態を返す
            setTimeout(() => {
                callback(null); // 未認証状態
            }, 100);
        },
        signInWithPopup: async () => {
            // モックログイン
            return { user: { displayName: 'デモユーザー', email: 'demo@example.com' } };
        },
        signInAnonymously: async () => {
            // モック匿名ログイン
            return { user: { displayName: 'ゲストユーザー', email: null } };
        },
        signOut: async () => {
            // モックログアウト
            return Promise.resolve();
        }
    };
    
    window.firebaseDB = {
        collection: () => ({
            doc: () => ({
                set: () => Promise.resolve(),
                get: () => Promise.resolve({ exists: () => false }),
                update: () => Promise.resolve(),
                delete: () => Promise.resolve()
            }),
            add: () => Promise.resolve({ id: 'demo-id' }),
            get: () => Promise.resolve({ docs: [] })
        })
    };
    
    console.log('Firebase mock initialized');
} catch (error) {
    console.error('Firebase initialization error:', error);
}
