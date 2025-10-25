// モーダル管理コンポーネント
class ModalManager {
    constructor() {
        this.overlay = document.getElementById('modal-overlay');
        this.title = document.getElementById('modal-title');
        this.body = document.getElementById('modal-body');
        this.closeBtn = document.getElementById('modal-close');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }
        
        // ESCキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) {
                this.close();
            }
        });
    }
    
    show(title, content) {
        if (this.title) this.title.textContent = title;
        if (this.body) this.body.innerHTML = content;
        if (this.overlay) this.overlay.classList.remove('hidden');
        
        // フォーカス管理
        const firstInput = this.body.querySelector('input, textarea, select, button');
        if (firstInput) firstInput.focus();
    }
    
    close() {
        if (this.overlay) this.overlay.classList.add('hidden');
    }
    
    isOpen() {
        return this.overlay && !this.overlay.classList.contains('hidden');
    }
}

// グローバルに公開
window.ModalManager = ModalManager;
