// Firebase設定（モックモード）
const firebaseConfig = {
    apiKey: "mock-api-key",
    authDomain: "mock.firebaseapp.com",
    projectId: "mock-project",
    storageBucket: "mock.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:mock"
};

// Firebase初期化（エラーハンドリング付き）
try {
    // Firebaseが利用可能かチェック
    if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
        // Firebaseを初期化
        firebase.initializeApp(firebaseConfig);
        
        // Firebaseサービスを設定
        window.firebaseAuth = firebase.auth();
        window.firebaseDB = firebase.firestore();
        
        console.log('✅ Firebase初期化完了');
    } else {
        console.log('⚠️ Firebase初期化をスキップ（既に初期化済みまたはFirebaseが利用不可）');
    }
} catch (error) {
    console.warn('⚠️ Firebase初期化エラー（モックモードで動作）:', error.message);
    
    // モックオブジェクトを作成
    window.firebaseAuth = null;
    window.firebaseDB = null;
    
    console.log('🔄 モックモードで動作します');
}

// Firebase初期化
let firebaseApp, firebaseAuth, firebaseDB;

try {
    // Firebase SDKが読み込まれているかチェック
    if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
        // Firebase初期化
        firebaseApp = firebase.initializeApp(firebaseConfig);
        firebaseAuth = firebase.auth();
        firebaseDB = firebase.firestore();
        
        // Google認証プロバイダーの設定
        const googleProvider = new firebase.auth.GoogleAuthProvider();
        googleProvider.addScope('email');
        googleProvider.addScope('profile');
        
        // グローバルに公開
        window.firebaseApp = firebaseApp;
        window.firebaseAuth = firebaseAuth;
        window.firebaseDB = firebaseDB;
        window.googleProvider = googleProvider;
        
        console.log('🔥 Firebase initialized successfully - v1.5.0');
    } else {
        throw new Error('Firebase SDK not loaded');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
    
    // フォールバック: モック版を使用
    console.log('Falling back to mock Firebase');
    
    window.firebaseApp = {
        name: 'mock-app',
        options: firebaseConfig
    };
    
    window.firebaseAuth = {
        currentUser: null,
        onAuthStateChanged: (callback) => {
            setTimeout(() => {
                callback(null);
            }, 100);
        },
        signInWithPopup: async () => {
            return { user: { displayName: 'デモユーザー', email: 'demo@example.com' } };
        },
        signInAnonymously: async () => {
            return { user: { displayName: 'ゲストユーザー', email: null } };
        },
        signOut: async () => {
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
}
