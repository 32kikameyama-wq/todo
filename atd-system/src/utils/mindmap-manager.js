// マインドマップ管理ユーティリティ
class MindmapManager {
    constructor() {
        this.nodes = [];
        this.connections = [];
        this.storage = new StorageManager();
    }
    
    // ノードの追加
    addNode(nodeData) {
        const node = {
            id: this.generateNodeId(),
            title: nodeData.title,
            description: nodeData.description || '',
            type: nodeData.type || 'action',
            position: nodeData.position || { x: 100, y: 100 },
            parentId: nodeData.parentId || null,
            children: [],
            taskIds: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        this.nodes.push(node);
        return node;
    }
    
    // ノードの更新
    updateNode(nodeId, updates) {
        const nodeIndex = this.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex >= 0) {
            this.nodes[nodeIndex] = { ...this.nodes[nodeIndex], ...updates, updatedAt: Date.now() };
            return this.nodes[nodeIndex];
        }
        return null;
    }
    
    // ノードの削除
    deleteNode(nodeId) {
        const nodeIndex = this.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex >= 0) {
            this.nodes.splice(nodeIndex, 1);
            return true;
        }
        return false;
    }
    
    // 接続の追加
    addConnection(fromNodeId, toNodeId) {
        const connection = {
            id: this.generateConnectionId(),
            from: fromNodeId,
            to: toNodeId,
            createdAt: Date.now()
        };
        
        this.connections.push(connection);
        return connection;
    }
    
    // ノードからタスク生成
    generateTasksFromNodes() {
        const tasks = [];
        
        this.nodes.forEach(node => {
            if (node.type === 'action' || node.type === 'task') {
                const task = {
                    id: this.generateTaskId(),
                    title: node.title,
                    description: node.description,
                    priority: this.calculatePriority(node),
                    status: 'pending',
                    isFocus: false,
                    dueDate: this.calculateDueDate(node),
                    estimatedTime: this.estimateTime(node),
                    mindmapNodeId: node.id,
                    parentTaskId: node.parentId ? this.getTaskByNodeId(node.parentId)?.id : null,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                
                tasks.push(task);
                node.taskIds.push(task.id);
            }
        });
        
        return tasks;
    }
    
    // 優先度の計算
    calculatePriority(node) {
        // ノードの深さに基づいて優先度を計算
        const depth = this.getNodeDepth(node.id);
        return Math.min(4, Math.max(1, depth));
    }
    
    // 期限の計算
    calculateDueDate(node) {
        const today = new Date();
        const days = this.getNodeDepth(node.id) * 2; // 深さに応じて日数を設定
        today.setDate(today.getDate() + days);
        return today.toISOString().split('T')[0];
    }
    
    // 時間見積もり
    estimateTime(node) {
        const baseTime = 60; // 基本60分
        const depth = this.getNodeDepth(node.id);
        return baseTime * Math.pow(1.5, depth - 1);
    }
    
    // ノードの深さ取得
    getNodeDepth(nodeId) {
        let depth = 1;
        let currentNode = this.nodes.find(n => n.id === nodeId);
        
        while (currentNode && currentNode.parentId) {
            depth++;
            currentNode = this.nodes.find(n => n.id === currentNode.parentId);
        }
        
        return depth;
    }
    
    // ノードIDでタスク取得
    getTaskByNodeId(nodeId) {
        // 簡易的な実装
        return null;
    }
    
    // ID生成
    generateNodeId() {
        return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateConnectionId() {
        return 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateTaskId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// グローバルに公開
window.MindmapManager = MindmapManager;
