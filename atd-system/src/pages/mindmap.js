// マインドマップページ管理
class MindmapPage {
    constructor() {
        this.mindmapManager = new MindmapManager();
        this.modalManager = new ModalManager();
        this.nodes = [];
        this.connections = [];
    }
    
    async initialize() {
        console.log('Initializing mindmap page...');
        
        // マインドマップの読み込み
        await this.loadMindmap();
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 初期ノードの作成
        this.createInitialNode();
    }
    
    async loadMindmap() {
        // モックデータ
        this.nodes = [
            {
                id: 'node_1',
                title: 'プロジェクト管理',
                description: 'メインプロジェクトの管理',
                type: 'objective',
                position: { x: 400, y: 300 },
                parentId: null,
                children: ['node_2', 'node_3'],
                taskIds: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        ];
        
        this.renderMindmap();
    }
    
    renderMindmap() {
        const canvas = document.getElementById('mindmap-canvas');
        if (!canvas) return;
        
        // 簡易的なマインドマップ表示
        let html = '<div class="mindmap-nodes">';
        
        this.nodes.forEach(node => {
            html += `
                <div class="mindmap-node" data-node-id="${node.id}" style="left: ${node.position.x}px; top: ${node.position.y}px;">
                    <div class="node-content">
                        <h4>${node.title}</h4>
                        <p>${node.description}</p>
                        <div class="node-actions">
                            <button onclick="app.addChildNode('${node.id}')">+ 子ノード</button>
                            <button onclick="app.editNode('${node.id}')">編集</button>
                            <button onclick="app.deleteNode('${node.id}')">削除</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        canvas.innerHTML = html;
    }
    
    setupEventListeners() {
        // ノード追加ボタン
        const addNodeBtn = document.getElementById('add-node-btn');
        if (addNodeBtn) {
            addNodeBtn.addEventListener('click', () => this.showAddNodeModal());
        }
        
        // タスク生成ボタン
        const generateTasksBtn = document.getElementById('generate-tasks-btn');
        if (generateTasksBtn) {
            generateTasksBtn.addEventListener('click', () => this.generateTasksFromMindmap());
        }
    }
    
    createInitialNode() {
        if (this.nodes.length === 0) {
            const rootNode = this.mindmapManager.addNode({
                title: 'メインプロジェクト',
                description: 'プロジェクトのルートノード',
                type: 'objective',
                position: { x: 400, y: 300 }
            });
            this.nodes.push(rootNode);
            this.renderMindmap();
        }
    }
    
    showAddNodeModal() {
        const modalContent = `
            <form id="add-node-form">
                <div class="form-group">
                    <label for="node-title">ノード名</label>
                    <input type="text" id="node-title" required>
                </div>
                <div class="form-group">
                    <label for="node-description">説明</label>
                    <textarea id="node-description"></textarea>
                </div>
                <div class="form-group">
                    <label for="node-type">タイプ</label>
                    <select id="node-type">
                        <option value="objective">目的</option>
                        <option value="kpi">KPI</option>
                        <option value="action">アクション</option>
                        <option value="task">タスク</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">追加</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">キャンセル</button>
                </div>
            </form>
        `;
        
        this.modalManager.show('ノード追加', modalContent);
        
        // フォーム送信の処理
        const form = document.getElementById('add-node-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddNode(form);
            });
        }
    }
    
    async handleAddNode(form) {
        const nodeData = {
            title: document.getElementById('node-title').value,
            description: document.getElementById('node-description').value,
            type: document.getElementById('node-type').value,
            position: { x: Math.random() * 600 + 100, y: Math.random() * 400 + 100 }
        };
        
        try {
            const newNode = this.mindmapManager.addNode(nodeData);
            this.nodes.push(newNode);
            this.renderMindmap();
            this.modalManager.close();
        } catch (error) {
            console.error('Add node error:', error);
            alert('ノードの追加に失敗しました。');
        }
    }
    
    async generateTasksFromMindmap() {
        try {
            const tasks = this.mindmapManager.generateTasksFromNodes();
            
            if (tasks.length === 0) {
                alert('タスクを生成できるノードがありません。');
                return;
            }
            
            // タスクを生成
            const taskManager = new TaskManager();
            for (const taskData of tasks) {
                await taskManager.addTask(taskData);
            }
            
            alert(`${tasks.length}個のタスクを生成しました。`);
            
            // タスクページに遷移
            if (window.app) {
                window.app.navigateToPage('tasks');
            }
            
        } catch (error) {
            console.error('Generate tasks error:', error);
            alert('タスクの生成に失敗しました。');
        }
    }
    
    addChildNode(parentId) {
        const parentNode = this.nodes.find(n => n.id === parentId);
        if (parentNode) {
            this.showAddNodeModal();
            // 親ノードの情報を設定
            document.getElementById('node-title').placeholder = `${parentNode.title}の子ノード`;
        }
    }
    
    editNode(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            const modalContent = `
                <form id="edit-node-form">
                    <div class="form-group">
                        <label for="edit-node-title">ノード名</label>
                        <input type="text" id="edit-node-title" value="${node.title}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-node-description">説明</label>
                        <textarea id="edit-node-description">${node.description}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">更新</button>
                        <button type="button" class="btn btn-secondary" onclick="app.closeModal()">キャンセル</button>
                    </div>
                </form>
            `;
            
            this.modalManager.show('ノード編集', modalContent);
            
            // フォーム送信の処理
            const form = document.getElementById('edit-node-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleEditNode(nodeId, form);
                });
            }
        }
    }
    
    async handleEditNode(nodeId, form) {
        const updates = {
            title: document.getElementById('edit-node-title').value,
            description: document.getElementById('edit-node-description').value
        };
        
        try {
            const updatedNode = this.mindmapManager.updateNode(nodeId, updates);
            const nodeIndex = this.nodes.findIndex(n => n.id === nodeId);
            if (nodeIndex >= 0) {
                this.nodes[nodeIndex] = updatedNode;
                this.renderMindmap();
            }
            this.modalManager.close();
        } catch (error) {
            console.error('Edit node error:', error);
            alert('ノードの更新に失敗しました。');
        }
    }
    
    deleteNode(nodeId) {
        if (confirm('このノードを削除しますか？')) {
            try {
                this.mindmapManager.deleteNode(nodeId);
                this.nodes = this.nodes.filter(n => n.id !== nodeId);
                this.renderMindmap();
            } catch (error) {
                console.error('Delete node error:', error);
                alert('ノードの削除に失敗しました。');
            }
        }
    }
    
    // ページの破棄
    destroy() {
        // クリーンアップ処理
    }
}

// グローバルに公開
window.MindmapPage = MindmapPage;
