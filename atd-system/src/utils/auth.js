// 認証管理ユーティリティ
class AuthManager {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.authStateListeners = [];
        this.initializeAuth();
    }
    
    async initializeAuth() {
        try {
            console.log('🔐 AuthManager初期化開始');
            
            // タブ間同期を設定
            this.setupCrossTabSync();
            
            // 既存のセッションを復元
            const existingSession = localStorage.getItem('atd_current_session');
            if (existingSession) {
                const session = JSON.parse(existingSession);
                const user = session.user;
                
                // 登録済みメンバーリストから最新のプロフィール情報を読み込む
                const registeredMembers = this.getRegisteredMembers();
                const userProfile = registeredMembers.find(m => m.id === user.uid);
                
                if (userProfile) {
                    this.currentUser = {
                        ...user,
                        displayName: userProfile.displayName || userProfile.name || user.displayName,
                        bio: userProfile.bio || '',
                        avatar: userProfile.avatar || '',
                        avatarPosition: userProfile.avatarPosition || { x: 50, y: 50, scale: 100 }
                    };
                } else {
                    this.currentUser = user;
                }
                
                console.log('🔐 既存セッションを復元:', this.currentUser.displayName);
            }
            
            // Firebase認証が利用可能かチェック
            if (window.firebaseAuth) {
                this.auth = window.firebaseAuth;
                
                // 認証状態の監視
                this.auth.onAuthStateChanged((user) => {
                    if (user) {
                        // 登録済みメンバーリストから最新のプロフィール情報を読み込む
                        const registeredMembers = this.getRegisteredMembers();
                        const userProfile = registeredMembers.find(m => m.id === user.uid);
                        
                        if (userProfile) {
                            this.currentUser = {
                                ...user,
                                displayName: userProfile.displayName || userProfile.name || user.displayName,
                                bio: userProfile.bio || '',
                                avatar: userProfile.avatar || '',
                                avatarPosition: userProfile.avatarPosition || { x: 50, y: 50, scale: 100 }
                            };
                        } else {
                            this.currentUser = user;
                        }
                    } else {
                        this.currentUser = null;
                    }
                    
                    this.onAuthStateChange(this.currentUser);
                });
                
                console.log('✅ Auth manager initialized with Firebase - v1.5.0');
            } else {
                console.log('✅ Auth manager initialized in mock mode');
            }
            
            console.log('✅ AuthManager初期化完了');
        } catch (error) {
            console.error('❌ AuthManager初期化エラー:', error);
            // エラーが発生してもモックモードで動作を継続
            console.log('🔄 モックモードで動作を継続します');
        }
    }
    
    onAuthStateChange(user) {
        // 認証状態変更時の処理
        if (user) {
            console.log('User signed in:', user.displayName || user.email);
            // セッション情報をローカルストレージに保存
            localStorage.setItem('atd_current_session', JSON.stringify({
                user: user,
                loginTime: Date.now(),
                sessionId: this.generateSessionId()
            }));
            this.notifyAuthStateListeners(user);
        } else {
            console.log('User signed out');
            // セッション情報を削除
            localStorage.removeItem('atd_current_session');
            this.notifyAuthStateListeners(null);
        }
        
        // 他のタブに状態変更を通知
        this.broadcastAuthStateChange(user);
    }
    
    // セッションIDの生成
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // 他のタブに認証状態変更を通知
    broadcastAuthStateChange(user) {
        const event = new CustomEvent('atd_auth_state_change', {
            detail: { user: user }
        });
        window.dispatchEvent(event);
    }
    
    // 他のタブからの認証状態変更を監視
    setupCrossTabSync() {
        window.addEventListener('atd_auth_state_change', (event) => {
            const { user } = event.detail;
            this.currentUser = user;
            this.notifyAuthStateListeners(user);
        });
        
        // ページ読み込み時にセッションを復元
        window.addEventListener('storage', (event) => {
            if (event.key === 'atd_current_session') {
                if (event.newValue) {
                    const session = JSON.parse(event.newValue);
                    const user = session.user;
                    
                    // 登録済みメンバーリストから最新のプロフィール情報を読み込む
                    const registeredMembers = this.getRegisteredMembers();
                    const userProfile = registeredMembers.find(m => m.id === user.uid);
                    
                    if (userProfile) {
                        this.currentUser = {
                            ...user,
                            displayName: userProfile.displayName || userProfile.name || user.displayName,
                            bio: userProfile.bio || '',
                            avatar: userProfile.avatar || '',
                            avatarPosition: userProfile.avatarPosition || { x: 50, y: 50, scale: 100 }
                        };
                    } else {
                        this.currentUser = user;
                    }
                    
                    this.notifyAuthStateListeners(this.currentUser);
                } else {
                    this.currentUser = null;
                    this.notifyAuthStateListeners(null);
                }
            }
        });
    }
    
    // 認証状態リスナーの追加
    addAuthStateListener(callback) {
        this.authStateListeners.push(callback);
    }
    
    // 認証状態リスナーの通知
    notifyAuthStateListeners(user) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Auth state listener error:', error);
            }
        });
    }
    
    // Googleログイン
    async signInWithGoogle() {
        if (!this.auth) {
            console.log('Firebase auth not available, using mock');
            return { user: { displayName: 'デモユーザー', email: 'demo@example.com' } };
        }
        
        try {
            const provider = window.googleProvider || new firebase.auth.GoogleAuthProvider();
            const result = await this.auth.signInWithPopup(provider);
            return result;
        } catch (error) {
            console.error('Google sign in error:', error);
            throw error;
        }
    }
    

    // 新規ユーザー登録
    async registerUser(userData) {
        try {
            console.log('🔐 新規ユーザー登録試行:', userData.email);
            
            // 既存ユーザーのチェック
            const existingMembers = this.getRegisteredMembers();
            const existingUser = existingMembers.find(member => 
                member.email.toLowerCase() === userData.email.toLowerCase()
            );
            
            if (existingUser) {
                throw new Error('このメールアドレスは既に登録されています');
            }
            
            // パスワードの検証
            if (userData.password.length < 6) {
                throw new Error('パスワードは6文字以上で入力してください');
            }
            
            if (userData.password !== userData.passwordConfirm) {
                throw new Error('パスワードが一致しません');
            }
            
            // 新規ユーザーの作成
            const newUser = {
                id: this.generateUserId(),
                name: userData.name,
                email: userData.email.toLowerCase(),
                password: userData.password, // 実際の実装ではハッシュ化が必要
                role: 'member',
                status: 'active',
                createdAt: new Date().toISOString(),
                createdBy: 'self_registration',
                profile: {
                    avatar: '',
                    displayName: userData.name,
                    bio: '',
                    preferences: {
                        theme: 'light',
                        notifications: true,
                        language: 'ja'
                    }
                }
            };
            
            // 既存メンバーに追加
            const updatedMembers = [...existingMembers, newUser];
            const data = {
                registeredMembers: updatedMembers,
                memberRegistrationPassword: '',
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('atd_registered_members', JSON.stringify(data));
            
            console.log('✅ 新規ユーザー登録成功:', newUser);
            return { user: newUser };
            
        } catch (error) {
            console.error('❌ ユーザー登録エラー:', error);
            throw error;
        }
    }
    
    // ユーザーIDの生成
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // パスワードリセット要求
    async requestPasswordReset(email) {
        try {
            console.log('🔐 パスワードリセット要求:', email);
            
            const registeredMembers = this.getRegisteredMembers();
            const user = registeredMembers.find(member => 
                member.email.toLowerCase() === email.toLowerCase()
            );
            
            if (!user) {
                throw new Error('このメールアドレスは登録されていません');
            }
            
            // リセットトークンの生成
            const resetToken = this.generateResetToken();
            const resetExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24時間後
            
            // リセット情報を保存
            const resetData = {
                token: resetToken,
                email: email,
                expiry: resetExpiry,
                createdAt: Date.now()
            };
            
            localStorage.setItem('atd_password_reset_' + resetToken, JSON.stringify(resetData));
            
            console.log('✅ パスワードリセットトークン生成:', resetToken);
            return { token: resetToken, message: 'パスワードリセット用のトークンが生成されました' };
            
        } catch (error) {
            console.error('❌ パスワードリセット要求エラー:', error);
            throw error;
        }
    }
    
    // パスワードリセット実行
    async resetPassword(token, newPassword) {
        try {
            console.log('🔐 パスワードリセット実行:', token);
            
            // リセットトークンの検証
            const resetData = localStorage.getItem('atd_password_reset_' + token);
            if (!resetData) {
                throw new Error('無効なリセットトークンです');
            }
            
            const reset = JSON.parse(resetData);
            if (Date.now() > reset.expiry) {
                localStorage.removeItem('atd_password_reset_' + token);
                throw new Error('リセットトークンの有効期限が切れています');
            }
            
            // パスワードの検証
            if (newPassword.length < 6) {
                throw new Error('パスワードは6文字以上で入力してください');
            }
            
            // ユーザーのパスワードを更新
            const registeredMembers = this.getRegisteredMembers();
            const userIndex = registeredMembers.findIndex(member => 
                member.email.toLowerCase() === reset.email.toLowerCase()
            );
            
            if (userIndex === -1) {
                throw new Error('ユーザーが見つかりません');
            }
            
            registeredMembers[userIndex].password = newPassword;
            registeredMembers[userIndex].updatedAt = Date.now();
            
            // データを保存
            const data = {
                registeredMembers: registeredMembers,
                memberRegistrationPassword: '',
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('atd_registered_members', JSON.stringify(data));
            
            // リセットトークンを削除
            localStorage.removeItem('atd_password_reset_' + token);
            
            console.log('✅ パスワードリセット完了');
            return { success: true, message: 'パスワードが正常にリセットされました' };
            
        } catch (error) {
            console.error('❌ パスワードリセット実行エラー:', error);
            throw error;
        }
    }
    
    // リセットトークンの生成
    generateResetToken() {
        return 'reset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 一般ユーザーログイン
    async signInAsUser(email, password) {
        try {
            console.log('🔐 ユーザーログイン試行:', email);
            console.log('🔐 入力パスワード長:', password ? password.length : 0);
            console.log('🔐 入力メールアドレス詳細:', {
                original: email,
                trimmed: email ? email.trim() : '',
                lowercased: email ? email.trim().toLowerCase() : '',
                length: email ? email.length : 0
            });
            console.log('🔐 入力パスワード詳細:', {
                original: password,
                trimmed: password ? password.trim() : '',
                length: password ? password.length : 0
            });
            
            // 登録済みメンバーから検索
            const registeredMembers = this.getRegisteredMembers();
            console.log('📋 登録済みメンバー一覧:', registeredMembers);
            console.log('📋 メンバー数:', registeredMembers.length);
            
            // デバッグ用: ローカルストレージの生データを確認
            const rawData = localStorage.getItem('atd_registered_members');
            console.log('💾 ローカルストレージ生データ:', rawData);
            console.log('💾 ローカルストレージデータ長:', rawData ? rawData.length : 0);
            console.log('💾 ローカルストレージデータタイプ:', typeof rawData);
            
            console.log('🔍 メンバー検索開始 - 各メンバーの詳細比較:');
            const user = registeredMembers.find((member, index) => {
                // Safari対応: 文字列の正規化とトリム
                const normalizedMemberEmail = member.email ? member.email.trim().toLowerCase() : '';
                const normalizedInputEmail = email ? email.trim().toLowerCase() : '';
                const normalizedMemberPassword = member.password ? member.password.trim() : '';
                const normalizedInputPassword = password ? password.trim() : '';
                
                const emailMatch = normalizedMemberEmail === normalizedInputEmail;
                const passwordMatch = normalizedMemberPassword === normalizedInputPassword;
                const statusActive = member.status === 'active';
                const allMatch = emailMatch && passwordMatch && statusActive;
                
                console.log(`🔍 メンバー${index + 1}比較結果:`, {
                    memberId: member.id,
                    memberName: member.name,
                    memberEmail: member.email,
                    memberEmailType: typeof member.email,
                    memberEmailLength: member.email ? member.email.length : 0,
                    inputEmail: email,
                    inputEmailType: typeof email,
                    inputEmailLength: email ? email.length : 0,
                    normalizedMemberEmail: normalizedMemberEmail,
                    normalizedInputEmail: normalizedInputEmail,
                    emailMatch: emailMatch,
                    memberPassword: member.password,
                    memberPasswordType: typeof member.password,
                    memberPasswordLength: member.password ? member.password.length : 0,
                    inputPassword: password,
                    inputPasswordType: typeof password,
                    inputPasswordLength: password ? password.length : 0,
                    normalizedMemberPassword: normalizedMemberPassword,
                    normalizedInputPassword: normalizedInputPassword,
                    passwordMatch: passwordMatch,
                    memberStatus: member.status,
                    statusActive: statusActive,
                    allMatch: allMatch,
                    createdAt: member.createdAt
                });
                
                return allMatch;
            });
            
            console.log('🔍 find()の結果:', {
                user: user,
                userExists: !!user,
                userType: typeof user,
                userId: user ? user.id : 'undefined'
            });
            
            if (user) {
                const userData = {
                    uid: user.id,
                    email: user.email,
                    displayName: user.name,
                    isAnonymous: false,
                    role: user.role || 'member'
                };
                
                this.currentUser = userData;
                this.onAuthStateChange(userData);
                console.log('✅ ユーザーログイン成功:', userData);
                return { user: userData };
            } else {
                console.log('❌ ユーザーが見つかりません');
                console.log('❌ 検索条件:', {
                    inputEmail: email,
                    inputPassword: password ? '***' : '',
                    memberCount: registeredMembers.length
                });
                
                // 登録済みメンバーがいない場合の特別なメッセージ
                if (registeredMembers.length === 0) {
                    throw new Error('登録済みのユーザーが存在しません。管理ページからユーザー登録を行ってください。');
                } else {
                    throw new Error('メールアドレスまたはパスワードが正しくありません。管理ページで登録した情報を確認してください。');
                }
            }
        } catch (error) {
            console.error('❌ ユーザーログインエラー:', error);
            throw error;
        }
    }

    // テスト用: デフォルトユーザーを作成
    createTestUser() {
        const testUser = {
            id: 'test_user_001',
            name: 'テストユーザー',
            email: '0fx326052cf183b@au.com',
            password: 'test123',
            role: 'member',
            status: 'active',
            createdAt: new Date().toISOString(),
            createdBy: 'system'
        };
        
        const data = {
            registeredMembers: [testUser],
            memberRegistrationPassword: '',
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('atd_registered_members', JSON.stringify(data));
        console.log('🧪 テストユーザーを作成しました:', testUser);
        return testUser;
    }

    // 登録済みメンバーを取得
    getRegisteredMembers() {
        try {
            console.log('🔍 getRegisteredMembers() 開始');
            
            // Safari対応: ローカルストレージの可用性をチェック
            if (typeof(Storage) === "undefined") {
                console.error('❌ ローカルストレージがサポートされていません');
                return [];
            }
            
            // Safari対応: プライベートブラウジングモードのチェック
            try {
                const testKey = 'atd_test_' + Date.now();
                localStorage.setItem(testKey, 'test');
                localStorage.removeItem(testKey);
            } catch (error) {
                console.error('❌ ローカルストレージが使用できません（プライベートブラウジングモードの可能性）:', error);
                return [];
            }
            
            const saved = localStorage.getItem('atd_registered_members');
            console.log('💾 ローカルストレージから取得:', saved);
            console.log('💾 データタイプ:', typeof saved);
            console.log('💾 データ長:', saved ? saved.length : 0);
            console.log('💾 データがnullか:', saved === null);
            console.log('💾 データがundefinedか:', saved === undefined);
            console.log('💾 データが空文字か:', saved === '');
            
            if (saved && saved !== 'null' && saved !== 'undefined' && saved !== '') {
                console.log('📊 JSONパース開始');
                const data = JSON.parse(saved);
                console.log('📊 パースされたデータ:', data);
                console.log('📊 データタイプ:', typeof data);
                console.log('📊 registeredMembers存在:', !!data.registeredMembers);
                console.log('📊 registeredMembersタイプ:', typeof data.registeredMembers);
                console.log('📊 registeredMembers配列か:', Array.isArray(data.registeredMembers));
                
                const members = data.registeredMembers || [];
                console.log('👥 登録済みメンバー:', members);
                console.log('👥 メンバー数:', members.length);
                console.log('👥 メンバー配列か:', Array.isArray(members));
                
                // 各メンバーの詳細をログ出力
                members.forEach((member, index) => {
                    console.log(`👤 メンバー${index + 1}詳細:`, {
                        id: member.id,
                        name: member.name,
                        email: member.email,
                        password: member.password,
                        status: member.status,
                        role: member.role,
                        createdAt: member.createdAt,
                        emailType: typeof member.email,
                        passwordType: typeof member.password,
                        nameType: typeof member.name,
                        statusType: typeof member.status
                    });
                });
                
                return members;
            }
            console.log('⚠️ ローカルストレージにデータなし');
            console.log('⚠️ 条件チェック:', {
                saved: saved,
                notNull: saved !== null,
                notUndefined: saved !== undefined,
                notEmpty: saved !== '',
                notNullString: saved !== 'null',
                notUndefinedString: saved !== 'undefined'
            });
            return [];
        } catch (error) {
            console.error('❌ 登録済みメンバーの取得エラー:', error);
            console.error('❌ エラー詳細:', error.message);
            console.error('❌ エラースタック:', error.stack);
            return [];
        }
    }

    // 匿名ログイン
    async signInAnonymously() {
        if (!this.auth) {
            console.log('Firebase auth not available, using mock');
            return { user: { displayName: 'ゲストユーザー', email: null } };
        }
        
        try {
            const result = await this.auth.signInAnonymously();
            return result;
        } catch (error) {
            console.error('Anonymous sign in error:', error);
            throw error;
        }
    }
    
    // ログアウト
    async signOut() {
        if (!this.auth) {
            console.log('Firebase auth not available, using mock');
            return Promise.resolve();
        }
        
        try {
            await this.auth.signOut();
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
    
    // ユーザー情報の取得
    getUserInfo() {
        if (!this.currentUser) return null;
        
        return {
            uid: this.currentUser.uid,
            displayName: this.currentUser.displayName || 'ユーザー',
            email: this.currentUser.email,
            photoURL: this.currentUser.photoURL,
            isAnonymous: this.currentUser.isAnonymous
        };
    }
    
    // ユーザープロファイルの更新
    async updateProfile(displayName, photoURL) {
        if (!this.auth || !this.currentUser) return;
        
        try {
            await this.currentUser.updateProfile({
                displayName: displayName,
                photoURL: photoURL
            });
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }
    
    // ユーザープロフィール更新（拡張版）
    async updateUserProfile(profileData) {
        try {
            if (!this.currentUser) {
                throw new Error('ユーザーがログインしていません');
            }
            
            console.log('💾 ユーザープロフィール更新開始:', {
                userId: this.currentUser.uid,
                profileData: profileData
            });
            
            // 登録済みメンバーリストを取得
            const data = JSON.parse(localStorage.getItem('atd_registered_members') || '{"registeredMembers": []}');
            const members = data.registeredMembers || [];
            console.log('📋 現在のメンバー数:', members.length);
            
            // 現在のユーザーを探して更新
            const userIndex = members.findIndex(m => m.id === this.currentUser.uid);
            console.log('🔍 ユーザーインデックス:', userIndex);
            
            if (userIndex >= 0) {
                console.log('👤 更新前のユーザー情報:', members[userIndex]);
                
                // バックアップを作成（削除保護のため）
                const backupKey = `atd_user_backup_${this.currentUser.uid}_${Date.now()}`;
                localStorage.setItem(backupKey, JSON.stringify(members[userIndex]));
                console.log('💾 バックアップ作成:', backupKey);
                
                // ユーザー情報を更新
                const updatedUser = {
                    ...members[userIndex],
                    name: profileData.displayName || members[userIndex].name,
                    displayName: profileData.displayName || members[userIndex].displayName,
                    bio: profileData.bio || '',
                    avatar: profileData.avatar || '',
                    avatarPosition: profileData.avatarPosition || { x: 50, y: 50, scale: 100 },
                    email: profileData.email || members[userIndex].email,
                    updatedAt: new Date().toISOString(),
                    lastProfileUpdate: Date.now(),
                    profileVersion: (members[userIndex].profileVersion || 0) + 1
                };
                
                members[userIndex] = updatedUser;
                console.log('👤 更新後のユーザー情報:', members[userIndex]);
                
                // データを保存
                data.registeredMembers = members;
                data.lastUpdated = new Date().toISOString();
                localStorage.setItem('atd_registered_members', JSON.stringify(data));
                console.log('💾 メンバーデータ保存完了');
                
                // プロフィール変更履歴を保存
                this.saveProfileChangeHistory(this.currentUser.uid, profileData);
                
                // currentUserも更新
                this.currentUser.displayName = profileData.displayName || this.currentUser.displayName;
                this.currentUser.bio = profileData.bio || '';
                this.currentUser.avatar = profileData.avatar || '';
                this.currentUser.avatarPosition = profileData.avatarPosition || { x: 50, y: 50, scale: 100 };
                this.currentUser.email = profileData.email || this.currentUser.email;
                
                console.log('✅ ユーザープロフィール更新完了:', {
                    displayName: this.currentUser.displayName,
                    email: this.currentUser.email,
                    bio: this.currentUser.bio
                });
                
                return { success: true };
            } else {
                console.error('❌ ユーザーが見つかりません:', this.currentUser.uid);
                throw new Error('ユーザー情報が見つかりません');
            }
            
        } catch (error) {
            console.error('❌ ユーザープロフィール更新エラー:', error);
            throw error;
        }
    }
    
    // プロフィール変更履歴の保存
    saveProfileChangeHistory(userId, profileData) {
        try {
            const historyKey = `atd_profile_history_${userId}`;
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            
            const changeRecord = {
                timestamp: Date.now(),
                changes: profileData,
                version: history.length + 1
            };
            
            history.push(changeRecord);
            
            // 最新の10件のみ保持
            if (history.length > 10) {
                history.splice(0, history.length - 10);
            }
            
            localStorage.setItem(historyKey, JSON.stringify(history));
            console.log('📝 プロフィール変更履歴を保存:', changeRecord);
        } catch (error) {
            console.error('❌ プロフィール変更履歴保存エラー:', error);
        }
    }
    
    // 自動保存機能
    startAutoSave(userId, profileData, intervalMs = 30000) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(async () => {
            try {
                await this.updateUserProfile(profileData);
                console.log('🔄 自動保存完了');
            } catch (error) {
                console.error('❌ 自動保存エラー:', error);
            }
        }, intervalMs);
        
        console.log('🔄 自動保存を開始しました');
    }
    
    // 自動保存の停止
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('🔄 自動保存を停止しました');
        }
    }
    
    // プロフィールの復元
    async restoreProfile(userId, version = null) {
        try {
            if (!this.currentUser || this.currentUser.uid !== userId) {
                throw new Error('認証が必要です');
            }
            
            const historyKey = `atd_profile_history_${userId}`;
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            
            if (history.length === 0) {
                throw new Error('復元可能な履歴がありません');
            }
            
            // 指定されたバージョンまたは最新版を取得
            const targetRecord = version ? 
                history.find(h => h.version === version) : 
                history[history.length - 1];
            
            if (!targetRecord) {
                throw new Error('指定されたバージョンが見つかりません');
            }
            
            // プロフィールを復元
            await this.updateUserProfile(targetRecord.changes);
            
            console.log('🔄 プロフィールを復元しました:', targetRecord);
            return { success: true, restoredVersion: targetRecord.version };
            
        } catch (error) {
            console.error('❌ プロフィール復元エラー:', error);
            throw error;
        }
    }
    
    // プロフィールの保護状態確認
    isProfileProtected(userId) {
        try {
            const data = JSON.parse(localStorage.getItem('atd_registered_members') || '{"registeredMembers": []}');
            const members = data.registeredMembers || [];
            const user = members.find(m => m.id === userId);
            
            return user && user.profileVersion > 0;
        } catch (error) {
            console.error('❌ プロフィール保護状態確認エラー:', error);
            return false;
        }
    }
}

// グローバルに公開
window.AuthManager = AuthManager;
