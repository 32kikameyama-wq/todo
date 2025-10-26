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
        
        // SVGベースのマインドマップ描画
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 1200 800');
        svg.className = 'mindmap-svg';
        
        // 接続線の描画
        this.renderConnections(svg);
        
        // ノードの描画
        this.renderNodes(svg);
        
        canvas.innerHTML = '';
        canvas.appendChild(svg);
        
        // ドラッグ&ドロップ機能の設定
        this.setupDragAndDrop();
    }
    
    renderConnections(svg) {
        this.connections.forEach(connection => {
            const fromNode = this.nodes.find(n => n.id === connection.from);
            const toNode = this.nodes.find(n => n.id === connection.to);
            
            if (fromNode && toNode) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', fromNode.position.x + 75);
                line.setAttribute('y1', fromNode.position.y + 25);
                line.setAttribute('x2', toNode.position.x + 75);
                line.setAttribute('y2', toNode.position.y + 25);
                line.setAttribute('stroke', '#666');
                line.setAttribute('stroke-width', '2');
                line.setAttribute('stroke-dasharray', '5,5');
                line.className = 'connection-line';
                svg.appendChild(line);
            }
        });
    }
    
    renderNodes(svg) {
        this.nodes.forEach(node => {
            const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            nodeGroup.setAttribute('transform', `translate(${node.position.x}, ${node.position.y})`);
            nodeGroup.className = 'mindmap-node-group';
            nodeGroup.setAttribute('data-node-id', node.id);
            
            // ノードの背景
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('width', '150');
            rect.setAttribute('height', '50');
            rect.setAttribute('rx', '10');
            rect.setAttribute('ry', '10');
            rect.setAttribute('fill', this.getNodeColor(node.type));
            rect.setAttribute('stroke', '#333');
            rect.setAttribute('stroke-width', '2');
            rect.className = 'node-background';
            nodeGroup.appendChild(rect);
            
            // ノードのタイトル
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '75');
            text.setAttribute('y', '20');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('fill', '#333');
            text.textContent = node.title;
            nodeGroup.appendChild(text);
            
            // ノードのタイプ表示
            const typeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            typeText.setAttribute('x', '75');
            typeText.setAttribute('y', '35');
            typeText.setAttribute('text-anchor', 'middle');
            typeText.setAttribute('font-size', '10');
            typeText.setAttribute('fill', '#666');
            typeText.textContent = this.getNodeTypeLabel(node.type);
            nodeGroup.appendChild(typeText);
            
            // 子ノード追加ボタン
            const addButton = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            addButton.setAttribute('cx', '140');
            addButton.setAttribute('cy', '25');
            addButton.setAttribute('r', '8');
            addButton.setAttribute('fill', '#4CAF50');
            addButton.setAttribute('stroke', '#fff');
            addButton.setAttribute('stroke-width', '2');
            addButton.className = 'add-child-btn';
            addButton.setAttribute('data-parent-id', node.id);
            nodeGroup.appendChild(addButton);
            
            const addText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            addText.setAttribute('x', '140');
            addText.setAttribute('y', '29');
            addText.setAttribute('text-anchor', 'middle');
            addText.setAttribute('font-size', '12');
            addText.setAttribute('font-weight', 'bold');
            addText.setAttribute('fill', '#fff');
            addText.textContent = '+';
            nodeGroup.appendChild(addText);
            
            svg.appendChild(nodeGroup);
        });
    }
    
    getNodeColor(type) {
        const colors = {
            'objective': '#E3F2FD',
            'kpi': '#FFF3E0',
            'action': '#E8F5E8',
            'task': '#FCE4EC'
        };
        return colors[type] || '#F5F5F5';
    }
    
    getNodeTypeLabel(type) {
        const labels = {
            'objective': '目的',
            'kpi': 'KPI',
            'action': 'アクション',
            'task': 'タスク'
        };
        return labels[type] || 'ノード';
    }
    
    setupDragAndDrop() {
        const nodes = document.querySelectorAll('.mindmap-node-group');
        nodes.forEach(nodeGroup => {
            nodeGroup.draggable = true;
            
            nodeGroup.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', nodeGroup.dataset.nodeId);
                nodeGroup.classList.add('dragging');
            });
            
            nodeGroup.addEventListener('dragend', () => {
                nodeGroup.classList.remove('dragging');
            });
            
            nodeGroup.addEventListener('drag', (e) => {
                const rect = nodeGroup.getBoundingClientRect();
                const canvas = document.getElementById('mindmap-canvas');
                const canvasRect = canvas.getBoundingClientRect();
                
                const x = e.clientX - canvasRect.left;
                const y = e.clientY - canvasRect.top;
                
                nodeGroup.setAttribute('transform', `translate(${x - 75}, ${y - 25})`);
                
                // ノードの位置を更新
                const nodeId = nodeGroup.dataset.nodeId;
                const node = this.nodes.find(n => n.id === nodeId);
                if (node) {
                    node.position.x = x - 75;
                    node.position.y = y - 25;
                }
            });
        });
        
        // 子ノード追加ボタンのイベント
        const addButtons = document.querySelectorAll('.add-child-btn');
        addButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const parentId = button.dataset.parentId;
                this.addChildNode(parentId);
            });
        });
        
        // ノードクリックイベント
        nodes.forEach(nodeGroup => {
            nodeGroup.addEventListener('click', (e) => {
                if (!e.target.classList.contains('add-child-btn')) {
                    const nodeId = nodeGroup.dataset.nodeId;
                    this.showNodeDetails(nodeId);
                }
            });
        });
    }
    
    showNodeDetails(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        const modalContent = `
            <div class="node-details">
                <h3>${node.title}</h3>
                <p><strong>タイプ:</strong> ${this.getNodeTypeLabel(node.type)}</p>
                <p><strong>説明:</strong> ${node.description || '説明なし'}</p>
                <p><strong>作成日:</strong> ${new Date(node.createdAt).toLocaleDateString()}</p>
                <div class="node-actions">
                    <button class="btn btn-primary" onclick="mindmapPage.editNode('${nodeId}')">編集</button>
                    <button class="btn btn-secondary" onclick="mindmapPage.addChildNode('${nodeId}')">子ノード追加</button>
                    <button class="btn btn-danger" onclick="mindmapPage.deleteNode('${nodeId}')">削除</button>
                </div>
            </div>
        `;
        
        if (window.app) {
            window.app.showModal('ノード詳細', modalContent);
        }
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
