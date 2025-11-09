// Canvas Workflow JavaScript
console.log('🎨 Loading Canvas Workflow...');

// Global variables
let workflowNodes = [];
let connections = [];
let nodeIdCounter = 0;
let connectionIdCounter = 0;
let draggedModel = null;
let isConnecting = false;
let connectionStart = null;
let temporaryLine = null;

// Selection variables
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionBox = null;
let selectedNodes = new Set();
let selectedConnections = new Set();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化Canvas工作流...');
    loadModels();
    setupDragAndDrop();
    setupCanvasSelection();
    setupKeyboardShortcuts();
    
    // 恢复保存的工作流
    restoreWorkflow();
    
    // 如果从工作流页点击"Try Now"跳转过来，优先加载预选的工作流
    try {
        const selectedWorkflowRaw = localStorage.getItem('selectedWorkflow');
        if (selectedWorkflowRaw) {
            const selectedWorkflow = JSON.parse(selectedWorkflowRaw);
            if (selectedWorkflow && selectedWorkflow.models && selectedWorkflow.models.length > 0) {
                loadWorkflowToCanvas(selectedWorkflow);
            }
            // 只使用一次，避免刷新后重复加载
            localStorage.removeItem('selectedWorkflow');
        }
    } catch (e) {
        console.error('Failed to load selected workflow:', e);
    }
    
    console.log('Canvas工作流初始化完成');
});

// 新增函数：恢复工作流
function restoreWorkflow() {
    // 检查是否有保存的Canvas工作流数据
    const canvasWorkflow = localStorage.getItem('canvasWorkflow');
    
    if (canvasWorkflow) {
        try {
            const workflowData = JSON.parse(canvasWorkflow);
            console.log('恢复工作流:', workflowData.name);
            
            // 恢复节点
            if (workflowData.nodes && workflowData.nodes.length > 0) {
                workflowData.nodes.forEach(nodeData => {
                    // 添加到workflowNodes数组
                    workflowNodes.push(nodeData);
                    
                    // 创建DOM元素
                    createNodeElement(nodeData);
                    
                    // 更新计数器
                    const nodeNumber = parseInt(nodeData.id.split('-')[1]);
                    if (nodeNumber >= nodeIdCounter) {
                        nodeIdCounter = nodeNumber + 1;
                    }
                });
                
                // 延迟恢复连接，确保节点已创建
                setTimeout(() => {
                    if (workflowData.connections && workflowData.connections.length > 0) {
                        workflowData.connections.forEach(connData => {
                            connections.push(connData);
                            drawConnection(connData);
                            
                            const connNumber = parseInt(connData.id.split('-')[1]);
                            if (connNumber >= connectionIdCounter) {
                                connectionIdCounter = connNumber + 1;
                            }
                        });
                    }
                }, 200);
            }
        } catch (e) {
            console.error('恢复工作流失败:', e);
        }
    }
}

// 新增函数：创建节点DOM元素
function createNodeElement(nodeData) {
    const nodeElement = document.createElement('div');
    nodeElement.className = 'workflow-node';
    nodeElement.id = nodeData.id;
    nodeElement.style.left = `${nodeData.x}px`;
    nodeElement.style.top = `${nodeData.y}px`;
    
    const displayName = nodeData.modelName.length > 20 ? 
        nodeData.modelName.substring(0, 20) + '...' : nodeData.modelName;
    
    nodeElement.innerHTML = `
        <div class="node-header">
            <div class="node-title" title="${nodeData.modelName}">${displayName}</div>
        </div>
        <div class="node-category">${nodeData.category}</div>
        <div class="node-tokens">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6"/>
                <path d="m21 12-6-3-6 3-6-3"/>
            </svg>
            ${nodeData.quantity}K tokens
        </div>
    `;
    
    // 添加连接点
    const leftPoint = document.createElement('div');
    leftPoint.className = 'connection-point left';
    leftPoint.dataset.node = nodeData.id;
    leftPoint.dataset.type = 'left';
    
    const rightPoint = document.createElement('div');
    rightPoint.className = 'connection-point right';
    rightPoint.dataset.node = nodeData.id;
    rightPoint.dataset.type = 'right';
    
    nodeElement.appendChild(leftPoint);
    nodeElement.appendChild(rightPoint);
    
    setupNodeDragging(nodeElement, nodeData);
    setupConnectionPoints(nodeElement, nodeData);
    
    document.getElementById('workflowNodes').appendChild(nodeElement);
}

// 新增函数：恢复保存的工作流
function restoreSavedWorkflow() {
    // 检查多个可能的存储位置
    const savedWorkflow = localStorage.getItem('savedWorkflow');
    const canvasWorkflow = localStorage.getItem('canvasWorkflow');
    
    let workflowToRestore = null;
    
    if (savedWorkflow) {
        try {
            workflowToRestore = JSON.parse(savedWorkflow);
        } catch (e) {
            console.error('Error parsing saved workflow:', e);
        }
    } else if (canvasWorkflow) {
        try {
            workflowToRestore = JSON.parse(canvasWorkflow);
        } catch (e) {
            console.error('Error parsing canvas workflow:', e);
        }
    }
    
    if (workflowToRestore && workflowToRestore.nodes && workflowToRestore.nodes.length > 0) {
        console.log('Restoring workflow with', workflowToRestore.nodes.length, 'nodes');
        restoreWorkflowFromData(workflowToRestore);
    }
}

// 新增函数：从数据恢复工作流
function restoreWorkflowFromData(workflowData) {
    // 清空现有内容
    workflowNodes = [];
    connections = [];
    nodeIdCounter = 0;
    connectionIdCounter = 0;
    
    // 恢复节点
    workflowData.nodes.forEach(nodeData => {
        const restoredNode = {
            id: nodeData.id,
            modelName: nodeData.modelName,
            modelType: nodeData.modelType || 'token',
            category: nodeData.category,
            quantity: nodeData.quantity || 2,
            x: nodeData.x,
            y: nodeData.y
        };
        
        workflowNodes.push(restoredNode);
        
        // 创建DOM元素
        const nodeElement = document.createElement('div');
        nodeElement.className = 'workflow-node';
        nodeElement.id = restoredNode.id;
        nodeElement.style.left = `${restoredNode.x}px`;
        nodeElement.style.top = `${restoredNode.y}px`;
        
        const displayName = restoredNode.modelName.length > 20 ? 
            restoredNode.modelName.substring(0, 20) + '...' : restoredNode.modelName;
        
        nodeElement.innerHTML = `
            <div class="node-header">
                <div class="node-title" title="${restoredNode.modelName}">${displayName}</div>
            </div>
            <div class="node-category">${restoredNode.category}</div>
            <div class="node-tokens">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6"/>
                    <path d="m21 12-6-3-6 3-6-3"/>
                </svg>
                ${restoredNode.quantity}K tokens
            </div>
        `;
        
        // 添加连接点
        const leftPoint = document.createElement('div');
        leftPoint.className = 'connection-point left';
        leftPoint.dataset.node = restoredNode.id;
        leftPoint.dataset.type = 'left';
        
        const rightPoint = document.createElement('div');
        rightPoint.className = 'connection-point right';
        rightPoint.dataset.node = restoredNode.id;
        rightPoint.dataset.type = 'right';
        
        nodeElement.appendChild(leftPoint);
        nodeElement.appendChild(rightPoint);
        
        setupNodeDragging(nodeElement, restoredNode);
        setupConnectionPoints(nodeElement, restoredNode);
        
        document.getElementById('workflowNodes').appendChild(nodeElement);
        
        // 更新计数器
        const nodeNumber = parseInt(restoredNode.id.split('-')[1]);
        if (nodeNumber > nodeIdCounter) {
            nodeIdCounter = nodeNumber;
        }
    });
    
    // 恢复连接
    if (workflowData.connections) {
        setTimeout(() => {
            workflowData.connections.forEach(connectionData => {
                connections.push(connectionData);
                drawConnection(connectionData);
                
                const connectionNumber = parseInt(connectionData.id.split('-')[1]);
                if (connectionNumber > connectionIdCounter) {
                    connectionIdCounter = connectionNumber;
                }
            });
        }, 100);
    }
    
    console.log('Workflow restored successfully');
}

// Setup canvas selection functionality
function setupCanvasSelection() {
    const canvasWorkspace = document.getElementById('canvasWorkspace');
    let longPressTimer = null;
    
    canvasWorkspace.addEventListener('mousedown', (e) => {
        // Only handle if not clicking on nodes, connection points, or during connection
        if (e.target.closest('.workflow-node') || 
            e.target.closest('.connection-point') || 
            isConnecting || 
            draggedModel) {
        return;
    }
    
        const canvasRect = canvasWorkspace.getBoundingClientRect();
        selectionStart = {
            x: e.clientX - canvasRect.left,
            y: e.clientY - canvasRect.top
        };
        
        // Start long press timer for selection
        longPressTimer = setTimeout(() => {
            // Start selection immediately when long press is detected
            startSelection(e);
        }, 150); // 150ms long press for selection - faster response
        
    e.preventDefault();
    });
    
    canvasWorkspace.addEventListener('mousemove', (e) => {
        // If long press timer is active and we're dragging, start selection immediately
        if (longPressTimer) {
            const canvasRect = canvasWorkspace.getBoundingClientRect();
            const currentX = e.clientX - canvasRect.left;
            const currentY = e.clientY - canvasRect.top;
            const distance = Math.sqrt(
                Math.pow(currentX - selectionStart.x, 2) + 
                Math.pow(currentY - selectionStart.y, 2)
            );
            
            // If dragging while holding down, start selection immediately
            if (distance > 5) { // 5px threshold
                clearTimeout(longPressTimer);
                longPressTimer = null;
                // Start selection immediately when dragging during long press
                if (!isSelecting) {
                    startSelection(e);
                }
            }
        }
        
        // Update selection box if selecting
        if (isSelecting) {
            updateSelectionBox(e);
        }
    });
    
    canvasWorkspace.addEventListener('mouseup', (e) => {
        // Clear long press timer
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        
        // End selection if selecting
        if (isSelecting) {
            endSelection();
        }
    });
}
    
    // Start selection box
function startSelection(event) {
    console.log('📦 Starting selection box');
    
    isSelecting = true;
    const canvasWorkspace = document.getElementById('canvasWorkspace');
    
    // Create selection box element
    selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    selectionBox.style.left = `${selectionStart.x}px`;
    selectionBox.style.top = `${selectionStart.y}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    
    canvasWorkspace.appendChild(selectionBox);
    
    // If we're starting due to drag, immediately update the box size
    if (event) {
        updateSelectionBox(event);
    }
    
    // Add global mouse move and up listeners
    document.addEventListener('mousemove', updateSelectionBox);
    document.addEventListener('mouseup', endSelection);
}

// Update selection box
function updateSelectionBox(event) {
    if (!isSelecting || !selectionBox) return;
    
    const canvasWorkspace = document.getElementById('canvasWorkspace');
    const canvasRect = canvasWorkspace.getBoundingClientRect();
    const currentX = event.clientX - canvasRect.left;
    const currentY = event.clientY - canvasRect.top;
    
    const left = Math.min(selectionStart.x, currentX);
    const top = Math.min(selectionStart.y, currentY);
    const width = Math.abs(currentX - selectionStart.x);
    const height = Math.abs(currentY - selectionStart.y);
    
    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
    
    // Preview selection
    previewSelection(left, top, width, height);
}

// Preview selection
function previewSelection(left, top, width, height) {
    const selectionRect = { left, top, right: left + width, bottom: top + height };
    
    // Preview nodes
    workflowNodes.forEach(node => {
        const nodeElement = document.getElementById(node.id);
        if (nodeElement && isNodeInSelection(nodeElement, selectionRect)) {
            nodeElement.classList.add('selection-preview');
        } else if (nodeElement) {
            nodeElement.classList.remove('selection-preview');
        }
    });
    
    // Preview connections
    connections.forEach(connection => {
        const lineElement = document.getElementById(connection.id);
        if (lineElement && isConnectionInSelection(connection, selectionRect)) {
            lineElement.classList.add('selection-preview');
        } else if (lineElement) {
            lineElement.classList.remove('selection-preview');
        }
    });
}

// Check if node is in selection
function isNodeInSelection(nodeElement, selectionRect) {
        const nodeRect = nodeElement.getBoundingClientRect();
    const canvasRect = document.getElementById('canvasWorkspace').getBoundingClientRect();
        
        const nodeRelativeRect = {
            left: nodeRect.left - canvasRect.left,
            top: nodeRect.top - canvasRect.top,
            right: nodeRect.right - canvasRect.left,
            bottom: nodeRect.bottom - canvasRect.top
        };
        
    return !(selectionRect.right < nodeRelativeRect.left || 
             selectionRect.left > nodeRelativeRect.right || 
             selectionRect.bottom < nodeRelativeRect.top || 
             selectionRect.top > nodeRelativeRect.bottom);
}

// Check if connection is in selection
function isConnectionInSelection(connection, selectionRect) {
    const fromNode = document.getElementById(connection.from.nodeId);
    const toNode = document.getElementById(connection.to.nodeId);
    
    if (!fromNode || !toNode) return false;
    
    const fromPoint = fromNode.querySelector(`.connection-point.${connection.from.type}`);
    const toPoint = toNode.querySelector(`.connection-point.${connection.to.type}`);
    
    if (!fromPoint || !toPoint) return false;
    
    const canvasRect = document.getElementById('canvasWorkspace').getBoundingClientRect();
    
    const fromRect = fromPoint.getBoundingClientRect();
    const toRect = toPoint.getBoundingClientRect();
    
    const fromX = fromRect.left + fromRect.width / 2 - canvasRect.left;
    const fromY = fromRect.top + fromRect.height / 2 - canvasRect.top;
    const toX = toRect.left + toRect.width / 2 - canvasRect.left;
    const toY = toRect.top + toRect.height / 2 - canvasRect.top;
    
    // Check if line intersects selection box
    const centerX = (fromX + toX) / 2;
    const centerY = (fromY + toY) / 2;
    
    return centerX >= selectionRect.left && centerX <= selectionRect.right &&
           centerY >= selectionRect.top && centerY <= selectionRect.bottom;
}

// End selection
function endSelection() {
    if (!isSelecting) return;
    
    console.log('📦 Ending selection');
    
    // Clear previous selection
    clearSelection();
    
    // Finalize selection
    document.querySelectorAll('.selection-preview').forEach(element => {
        if (element.classList.contains('workflow-node')) {
            selectedNodes.add(element.id);
            element.classList.remove('selection-preview');
            element.classList.add('selected');
        } else if (element.classList.contains('connection-line')) {
            selectedConnections.add(element.id);
            element.classList.remove('selection-preview');
            element.classList.add('selected');
        }
    });
    
    // Remove selection box
    if (selectionBox) {
        selectionBox.remove();
        selectionBox = null;
    }
    
    // Reset state
    isSelecting = false;
    
    // Remove global listeners
    document.removeEventListener('mousemove', updateSelectionBox);
    document.removeEventListener('mouseup', endSelection);
    
    console.log(`✅ Selected ${selectedNodes.size} nodes and ${selectedConnections.size} connections`);
}

// Clear selection
function clearSelection() {
    selectedNodes.forEach(nodeId => {
        const nodeElement = document.getElementById(nodeId);
        if (nodeElement) {
            nodeElement.classList.remove('selected', 'selection-preview');
        }
    });
    selectedNodes.clear();
    
    selectedConnections.forEach(connectionId => {
        const lineElement = document.getElementById(connectionId);
        if (lineElement) {
            lineElement.classList.remove('selected', 'selection-preview');
        }
    });
    selectedConnections.clear();
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            if (selectedNodes.size > 0 || selectedConnections.size > 0) {
                deleteSelectedElements();
                e.preventDefault();
            }
        }
        
        if (e.key === 'Escape') {
            clearSelection();
            if (isSelecting) {
                endSelection();
            }
            // Cancel connection if connecting
            if (isConnecting) {
                cancelConnection();
            }
        }
    });
}

// Delete selected elements
function deleteSelectedElements() {
    if (selectedNodes.size === 0 && selectedConnections.size === 0) return;
    
    const nodeCount = selectedNodes.size;
    const connectionCount = selectedConnections.size;
    
    console.log(`🗑️ Deleting ${nodeCount} nodes and ${connectionCount} connections`);
    
    // Delete connections
    selectedConnections.forEach(connectionId => {
        const connectionIndex = connections.findIndex(c => c.id === connectionId);
        if (connectionIndex !== -1) {
            const lineElement = document.getElementById(connectionId);
            if (lineElement) lineElement.remove();
            connections.splice(connectionIndex, 1);
        }
    });
    
    // Delete nodes
    selectedNodes.forEach(nodeId => {
        // Remove node's connections
    const nodeConnections = connections.filter(c => 
        c.from.nodeId === nodeId || c.to.nodeId === nodeId
    );
    
        nodeConnections.forEach(connection => {
            const lineElement = document.getElementById(connection.id);
            if (lineElement) lineElement.remove();
            const connectionIndex = connections.findIndex(c => c.id === connection.id);
            if (connectionIndex !== -1) connections.splice(connectionIndex, 1);
        });
        
        // Remove node
    const nodeIndex = workflowNodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) workflowNodes.splice(nodeIndex, 1);
    
    const nodeElement = document.getElementById(nodeId);
        if (nodeElement) nodeElement.remove();
    });
    
    // Clear selection
    clearSelection();
    
    console.log(`✅ Deleted ${nodeCount} nodes and ${connectionCount} connections`);
}

// Load models
function loadModels() {
    const modelsList = document.getElementById('modelsList');
    const modelsCount = document.getElementById('modelsCount');
    
    // Load user's assets from localStorage
    let userModels = [];
    try {
        const myAssets = JSON.parse(localStorage.getItem('myAssets')) || { tokens: [], shares: [] };
        
        // Get models that user owns
        myAssets.tokens.forEach(token => {
            if (token.quantity > 0) {
                const modelData = getModelData(token.modelName);
                if (modelData) {
                    userModels.push({
                        modelName: token.modelName,
                        type: 'token',
                        category: modelData.category,
                        quantity: token.quantity,
                        tokenPrice: modelData.tokenPrice,
                        sharePrice: modelData.sharePrice,
                        rating: modelData.rating,
                        purpose: modelData.purpose,
                        useCase: modelData.useCase
                    });
                }
            }
        });
    } catch (error) {
        console.error('Error loading user models:', error);
    }
    
    // If no models owned, show some sample models
    if (userModels.length === 0) {
        userModels = [];
    }
    
    modelsList.innerHTML = '';
    
    userModels.forEach(model => {
        const modelElement = createModelElement(model);
        modelsList.appendChild(modelElement);
    });
    
    modelsCount.textContent = `${userModels.length} models`;
    console.log(`✅ Loaded ${userModels.length} models`);
}

// Create model element
function createModelElement(model) {
    const modelElement = document.createElement('div');
    modelElement.className = 'model-item';
    modelElement.draggable = true;
    
    modelElement.dataset.modelName = model.modelName;
    modelElement.dataset.modelType = model.type;
    modelElement.dataset.category = model.category;
    modelElement.dataset.quantity = model.quantity;
    
    const displayName = model.modelName.length > 25 ? 
        model.modelName.substring(0, 25) + '...' : model.modelName;
    
    modelElement.innerHTML = `
        <div class="model-header">
            <div class="model-name" title="${model.modelName}">${displayName}</div>
            <div class="model-type">${model.type}</div>
            </div>
            <div class="model-category">${model.category}</div>
        <div class="model-tokens">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6"/>
                <path d="m21 12-6-3-6 3-6-3"/>
                </svg>
            ${model.quantity}K tokens
        </div>
    `;
    
    modelElement.addEventListener('dragstart', handleDragStart);
    modelElement.addEventListener('dragend', handleDragEnd);
    
    return modelElement;
}

// Setup drag and drop
function setupDragAndDrop() {
    const canvasWorkspace = document.getElementById('canvasWorkspace');
    
    canvasWorkspace.addEventListener('dragover', handleDragOver);
    canvasWorkspace.addEventListener('dragenter', handleDragEnter);
    canvasWorkspace.addEventListener('dragleave', handleDragLeave);
    canvasWorkspace.addEventListener('drop', handleDrop);
    
    console.log('✅ Drag and drop setup complete');
}

// Drag handlers
function handleDragStart(e) {
    console.log('🚀 Drag started:', e.target.dataset.modelName);
    
    draggedModel = {
        name: e.target.dataset.modelName,
        type: e.target.dataset.modelType,
        category: e.target.dataset.category,
        quantity: e.target.dataset.quantity
    };
    
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'copy';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    hideDropZone();
    draggedModel = null;
}

function handleDragOver(e) {
        e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (draggedModel) {
        showDropZone();
    }
}

function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
        hideDropZone();
    }
}

function handleDrop(e) {
    e.preventDefault();
    hideDropZone();
    
    console.log('🎯 Drop event triggered');
    
    if (!draggedModel) return;
    
    const canvasRect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(10, e.clientX - canvasRect.left - 140);
    const y = Math.max(10, e.clientY - canvasRect.top - 100);
    
        createWorkflowNode(draggedModel, x, y);
    draggedModel = null;
}

// Show/hide drop zone
function showDropZone() {
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
        dropZone.style.display = 'block';
        dropZone.classList.add('active');
    }
}

function hideDropZone() {
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
        dropZone.style.display = 'none';
        dropZone.classList.remove('active');
    }
}

// Create workflow node
function createWorkflowNode(model, x, y) {
    const nodeId = `node-${++nodeIdCounter}`;
    
    const nodeData = {
        id: nodeId,
        modelName: model.name,
        modelType: model.type,
        category: model.category,
        quantity: model.quantity,
        x: x,
        y: y
    };
    
    workflowNodes.push(nodeData);
    
    const nodeElement = document.createElement('div');
    nodeElement.className = 'workflow-node appear';
    nodeElement.id = nodeId;
    nodeElement.style.left = `${x}px`;
    nodeElement.style.top = `${y}px`;
    
    const displayName = model.name.length > 20 ? 
        model.name.substring(0, 20) + '...' : model.name;
    
    nodeElement.innerHTML = `
        <div class="node-header">
            <div class="node-title" title="${model.name}">${displayName}</div>
        </div>
        <div class="node-category">${model.category}</div>
        <div class="node-tokens">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6"/>
                <path d="m21 12-6-3-6 3-6-3"/>
            </svg>
            ${model.quantity}K tokens
        </div>
    `;
    
    // Add connection points after creating the main content
    const leftPoint = document.createElement('div');
    leftPoint.className = 'connection-point left';
    leftPoint.dataset.node = nodeId;
    leftPoint.dataset.type = 'left';
    leftPoint.title = 'Click to start connection (ESC to cancel)';
    
    const rightPoint = document.createElement('div');
    rightPoint.className = 'connection-point right';
    rightPoint.dataset.node = nodeId;
    rightPoint.dataset.type = 'right';
    rightPoint.title = 'Click to start connection (ESC to cancel)';
    
    nodeElement.appendChild(leftPoint);
    nodeElement.appendChild(rightPoint);
    
    setupNodeDragging(nodeElement, nodeData);
    setupConnectionPoints(nodeElement, nodeData);
    
    const workflowNodesContainer = document.getElementById('workflowNodes');
    workflowNodesContainer.appendChild(nodeElement);
    
    console.log('✅ Created workflow node:', nodeData);
}



// Setup connection points functionality
function setupConnectionPoints(nodeElement, nodeData) {
    const connectionPoints = nodeElement.querySelectorAll('.connection-point');
    
    connectionPoints.forEach(point => {
        // Click to start connection
        point.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (isConnecting) {
                // If already connecting, end the connection
                endConnection(point);
    } else {
                // Start new connection
                startConnection(point, e);
            }
        });
        
        // Mouse enter - highlight as target during connection
        point.addEventListener('mouseenter', () => {
            if (isConnecting && point !== connectionStart.element) {
                point.classList.add('target');
                // Auto-connect when hovering over target point
                setTimeout(() => {
                    if (point.classList.contains('target')) {
                        endConnection(point);
                    }
                }, 200); // 200ms delay for auto-connect
            }
        });
        
        // Mouse leave - remove target highlight
        point.addEventListener('mouseleave', () => {
            point.classList.remove('target');
        });
    });
}

// Start connection from a point
function startConnection(point, event) {
    console.log('🔗 Starting connection from:', point.dataset.node, point.dataset.type);
    
    isConnecting = true;
    connectionStart = {
        element: point,
        nodeId: point.dataset.node,
        type: point.dataset.type
    };
    
    point.classList.add('connecting');
    
    // Show connection mode indicator
    showConnectionModeIndicator();
    
    // Create temporary line
    createTemporaryLine(point, event);
    
    // Add global mouse move listener
    document.addEventListener('mousemove', updateTemporaryLine);
    document.addEventListener('mouseup', cancelConnection);
}

// End connection at a point
function endConnection(targetPoint) {
    if (!isConnecting || !connectionStart) return;
    
    const startNodeId = connectionStart.nodeId;
            const targetNodeId = targetPoint.dataset.node;
    
    // Don't connect to the same node
    if (startNodeId !== targetNodeId) {
        createNodeConnection(connectionStart, {
            element: targetPoint,
                    nodeId: targetNodeId, 
            type: targetPoint.dataset.type
        });
        console.log('✅ Connection created:', startNodeId, '→', targetNodeId);
    }
    
    cancelConnection();
}

// Cancel connection
function cancelConnection() {
    if (!isConnecting) return;
    
    // Remove temporary line
    if (temporaryLine) {
        temporaryLine.remove();
        temporaryLine = null;
    }
    
    // Remove connecting class
    if (connectionStart && connectionStart.element) {
        connectionStart.element.classList.remove('connecting');
    }
    
    // Remove target highlights
    document.querySelectorAll('.connection-point.target').forEach(point => {
        point.classList.remove('target');
    });
    
    // Reset state
    isConnecting = false;
    connectionStart = null;
    
    // Remove global listeners
    document.removeEventListener('mousemove', updateTemporaryLine);
    document.removeEventListener('mouseup', cancelConnection);
    
    console.log('🚫 Connection cancelled');
    
    // Hide connection mode indicator
    hideConnectionModeIndicator();
}

// Show connection mode indicator
function showConnectionModeIndicator() {
    let indicator = document.getElementById('connectionModeIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'connectionModeIndicator';
        indicator.className = 'connection-mode-indicator';
        indicator.innerHTML = `
            <div class="indicator-content">
                <span class="indicator-icon">🔗</span>
                <span class="indicator-text">Connection Mode - Click another point or press ESC to cancel</span>
            </div>
        `;
        document.body.appendChild(indicator);
    }
    indicator.style.display = 'block';
}

// Hide connection mode indicator
function hideConnectionModeIndicator() {
    const indicator = document.getElementById('connectionModeIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// Create temporary line during connection
function createTemporaryLine(startPoint, event) {
    const svg = document.getElementById('connectionsSvg');
    const connectionsGroup = document.getElementById('connectionsGroup');
    
    const startRect = startPoint.getBoundingClientRect();
    const canvasRect = svg.getBoundingClientRect();
    
    const startX = startRect.left + startRect.width / 2 - canvasRect.left;
    const startY = startRect.top + startRect.height / 2 - canvasRect.top;
    const endX = event.clientX - canvasRect.left;
    const endY = event.clientY - canvasRect.top;
    
    temporaryLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    temporaryLine.setAttribute('class', 'connection-line temporary');
    temporaryLine.setAttribute('marker-end', 'url(#arrowhead)');
    
    const path = createCurvedPath(startX, startY, endX, endY);
    temporaryLine.setAttribute('d', path);
    
    connectionsGroup.appendChild(temporaryLine);
}

// Update temporary line position
function updateTemporaryLine(event) {
    if (!temporaryLine || !connectionStart) return;
    
    const svg = document.getElementById('connectionsSvg');
    const startPoint = connectionStart.element;
    
    const startRect = startPoint.getBoundingClientRect();
    const canvasRect = svg.getBoundingClientRect();
    
    const startX = startRect.left + startRect.width / 2 - canvasRect.left;
    const startY = startRect.top + startRect.height / 2 - canvasRect.top;
    const endX = event.clientX - canvasRect.left;
    const endY = event.clientY - canvasRect.top;
    
    const path = createCurvedPath(startX, startY, endX, endY);
    temporaryLine.setAttribute('d', path);
}

// Create curved path for connections
function createCurvedPath(startX, startY, endX, endY) {
    const midX = (startX + endX) / 2;
    const controlOffset = Math.abs(endX - startX) * 0.3;
    
    return `M ${startX} ${startY} Q ${startX + controlOffset} ${startY} ${midX} ${(startY + endY) / 2} Q ${endX - controlOffset} ${endY} ${endX} ${endY}`;
}

// Create actual connection between nodes
function createNodeConnection(start, end) {
    const connectionId = `connection-${++connectionIdCounter}`;
    
    // Check for duplicate connections
    const exists = connections.find(conn => 
        (conn.from.nodeId === start.nodeId && conn.to.nodeId === end.nodeId) ||
        (conn.from.nodeId === end.nodeId && conn.to.nodeId === start.nodeId)
    );
    
    if (exists) {
        console.log('⚠️ Connection already exists');
        return;
    }
    
    const connection = {
        id: connectionId,
        from: start,
        to: end
    };
    
    connections.push(connection);
    drawConnection(connection);
    
    // Update priorities when new connection is created
    updateAllPriorities();
}

// Draw permanent connection line
function drawConnection(connection) {
    const svg = document.getElementById('connectionsSvg');
    const connectionsGroup = document.getElementById('connectionsGroup');
    
    const fromNode = document.getElementById(connection.from.nodeId);
    const toNode = document.getElementById(connection.to.nodeId);
    
    if (!fromNode || !toNode) return;
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('id', connection.id);
    line.setAttribute('class', 'connection-line');
    line.setAttribute('marker-end', 'url(#arrowhead)');
    
    // Calculate and set path
    updateConnectionPath(connection, line);
    
    // Add click handler for selection
    line.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔗 Selected connection:', connection.id);
    });
    
    connectionsGroup.appendChild(line);
}

// Update connection path
function updateConnectionPath(connection, line) {
    const fromNode = document.getElementById(connection.from.nodeId);
    const toNode = document.getElementById(connection.to.nodeId);
    
    if (!fromNode || !toNode) return;
    
    const svg = document.getElementById('connectionsSvg');
    const canvasRect = svg.getBoundingClientRect();
    
    // Get connection points
    const fromPoint = fromNode.querySelector(`.connection-point.${connection.from.type}`);
    const toPoint = toNode.querySelector(`.connection-point.${connection.to.type}`);
    
    if (!fromPoint || !toPoint) return;
    
    const fromRect = fromPoint.getBoundingClientRect();
    const toRect = toPoint.getBoundingClientRect();
    
    const fromX = fromRect.left + fromRect.width / 2 - canvasRect.left;
    const fromY = fromRect.top + fromRect.height / 2 - canvasRect.top;
    const toX = toRect.left + toRect.width / 2 - canvasRect.left;
    const toY = toRect.top + toRect.height / 2 - canvasRect.top;
    
    const path = createCurvedPath(fromX, fromY, toX, toY);
    line.setAttribute('d', path);
}

// Update all connections when nodes move
function updateAllConnections() {
    connections.forEach(connection => {
        const line = document.getElementById(connection.id);
        if (line) {
            updateConnectionPath(connection, line);
        }
    });
}

// Update all node priorities based on position
function updateAllPriorities() {
    // This function can be used to update execution order based on node positions
    // For now, it's a placeholder for future functionality
    console.log('🔄 Updated node priorities');
}

// Setup node dragging
function setupNodeDragging(nodeElement, nodeData) {
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let nodeStart = { x: 0, y: 0 };
    
    nodeElement.addEventListener('mousedown', (e) => {
        if (e.target.closest('.node-control')) return;
        
            isDragging = true;
            dragStart = { x: e.clientX, y: e.clientY };
            nodeStart = { x: nodeData.x, y: nodeData.y };
            
            nodeElement.classList.add('dragging');
            
            document.addEventListener('mousemove', handleNodeDrag);
            document.addEventListener('mouseup', handleNodeDragEnd);
        
        e.preventDefault();
    });
    
    function handleNodeDrag(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        nodeData.x = Math.max(0, nodeStart.x + deltaX);
        nodeData.y = Math.max(0, nodeStart.y + deltaY);
        
        nodeElement.style.left = `${nodeData.x}px`;
        nodeElement.style.top = `${nodeData.y}px`;
        
        // Update connections when node moves
        updateAllConnections();
        
        // Update priorities when node position changes
        updateAllPriorities();
    }
    
    function handleNodeDragEnd() {
        isDragging = false;
        nodeElement.classList.remove('dragging');
        
        document.removeEventListener('mousemove', handleNodeDrag);
        document.removeEventListener('mouseup', handleNodeDragEnd);
    }
}

// UI Functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

function filterModels() {
    const searchTerm = document.getElementById('modelSearch').value.toLowerCase();
    const modelItems = document.querySelectorAll('.model-item');
    
    modelItems.forEach(item => {
        const modelName = item.dataset.modelName.toLowerCase();
        const category = item.dataset.category.toLowerCase();
        const visible = modelName.includes(searchTerm) || category.includes(searchTerm);
        item.style.display = visible ? 'block' : 'none';
    });
}

function clearCanvas() {
    if (workflowNodes.length === 0) return;
    
    if (confirm('Clear entire canvas? This cannot be undone.')) {
        workflowNodes.forEach(node => {
            const nodeElement = document.getElementById(node.id);
            if (nodeElement) nodeElement.remove();
        });
        
        // Clear connections
        connections.forEach(connection => {
            const lineElement = document.getElementById(connection.id);
            if (lineElement) lineElement.remove();
        });
        
        workflowNodes = [];
        connections = [];
        nodeIdCounter = 0;
        connectionIdCounter = 0;
        
        // Reset button states
        document.getElementById('saveRunBtn').style.display = 'flex';
        document.getElementById('runBtn').style.display = 'none';
        
        // Clear workflow data
        localStorage.removeItem('currentWorkflow');
        
        console.log('🧹 Canvas cleared');
    }
}

function saveWorkflow() {
    const workflow = {
        nodes: workflowNodes,
        connections: connections,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('savedWorkflow', JSON.stringify(workflow));
    localStorage.setItem('canvasWorkflow', JSON.stringify(workflow)); // 双重保存
    alert('✅ Workflow saved successfully!');
    console.log('💾 Workflow saved:', workflow);
}

function runWorkflow() {
    if (workflowNodes.length === 0) {
        alert('⚠️ Please add some models to create a workflow first.');
        return;
    }

    // Build a sequential topological order (no parallel). Tie-break by x, then name.
    const nodes = workflowNodes.map(n => ({ id: n.id, name: n.modelName, category: n.category, x: n.x || 0 }));
    const nodeIds = new Set(nodes.map(n => n.id));
    const byId = new Map(nodes.map(n => [n.id, n]));
    const posX = new Map(nodes.map(n => [n.id, n.x]));

    const edges = connections
        .filter(c => nodeIds.has(c.from.nodeId) && nodeIds.has(c.to.nodeId) && c.from.nodeId !== c.to.nodeId)
        .map(c => ({ from: c.from.nodeId, to: c.to.nodeId }));

    const inDeg = new Map();
    nodes.forEach(n => inDeg.set(n.id, 0));
    edges.forEach(e => inDeg.set(e.to, (inDeg.get(e.to) || 0) + 1));

    const adj = new Map();
    nodes.forEach(n => adj.set(n.id, []));
    edges.forEach(e => adj.get(e.from).push(e.to));

    const ready = [];
    inDeg.forEach((deg, id) => { if (deg === 0) ready.push(id); });
    ready.sort((a, b) => (posX.get(a) - posX.get(b)) || (byId.get(a).name.localeCompare(byId.get(b).name)));

    const seq = [];
    let processed = 0;
    while (ready.length) {
        const u = ready.shift();
        seq.push(u);
        processed++;
        for (const v of adj.get(u)) {
            inDeg.set(v, inDeg.get(v) - 1);
            if (inDeg.get(v) === 0) {
                ready.push(v);
                ready.sort((a, b) => (posX.get(a) - posX.get(b)) || (byId.get(a).name.localeCompare(byId.get(b).name)));
            }
        }
    }

    let orderedNodes;
    let orderNote;
    if (processed !== nodes.length) {
        // Cycle fallback: left → right
        orderedNodes = [...workflowNodes].sort((a, b) => a.x - b.x);
        orderNote = 'Left to Right (cycle fallback)';
        console.warn('⚠️ Cycle detected in canvas workflow. Using left→right order.');
    } else {
        orderedNodes = seq.map(id => byId.get(id)).filter(Boolean);
        orderNote = 'Topological order (no parallel)';
    }

    let description = `🚀 Running workflow with ${workflowNodes.length} nodes:\n\n`;
    orderedNodes.forEach((node, index) => {
        description += `${index + 1}. ${node.name || node.modelName} (${node.category})\n`;
    });
    description += `\n📊 Execution order: ${orderNote}\n`;
    description += `✨ Workflow execution simulated successfully!`;

    alert(description);
    console.log('🚀 Workflow executed:', orderedNodes.map(n => (n.name || n.modelName)));
}

function configureNode(nodeId) {
    const node = workflowNodes.find(n => n.id === nodeId);
    if (node) {
        alert(`⚙️ Configure ${node.modelName}\n\nThis feature allows you to set model parameters and options.`);
    }
}

function deleteNode(nodeId) {
    if (confirm('Delete this node?')) {
        const nodeIndex = workflowNodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
            workflowNodes.splice(nodeIndex, 1);
        }
        
        const nodeElement = document.getElementById(nodeId);
        if (nodeElement) {
            nodeElement.remove();
        }
        
        console.log('🗑️ Node deleted:', nodeId);
    }
}

// Modal functions
function showSaveRunModal() {
    if (workflowNodes.length === 0) {
        alert('⚠️ Please add some models to create a workflow first.');
        return;
    }
    
    const modal = document.getElementById('saveRunModal');
    modal.classList.add('show');
    
    // Focus on the first input
    setTimeout(() => {
        document.getElementById('workflowName').focus();
    }, 100);
}

function hideSaveRunModal() {
    const modal = document.getElementById('saveRunModal');
    modal.classList.remove('show');
    
    // Clear form
    document.getElementById('workflowName').value = '';
    document.getElementById('workflowDescription').value = '';
    document.getElementById('visibilityPublic').checked = true;
}

function saveAndRunWorkflow() {
    const workflowName = document.getElementById('workflowName').value.trim();
    const workflowDescription = document.getElementById('workflowDescription').value.trim();
    const visibility = 'private';
    
    if (!workflowName) {
        alert('请输入工作流名称。');
        return;
    }

    // 收集模型列表 - 在这里添加
    const modelsList = workflowNodes.map(node => node.modelName);
    const modelsUsed = modelsList.length > 0 ? `${modelsList.join(', ')} (${modelsList.length} models)` : 'None';
    
    
    // 保存完整的工作流数据
    const completeWorkflowData = {
        id: 'workflow_' + Date.now(),
        name: workflowName,
        description: workflowDescription,
        visibility: visibility,
        // 添加这些字段用于 My Workflows 显示
        models: modelsList,
        modelsUsed: modelsUsed,
        modelCount: modelsList.length,
        // 保存节点的完整信息
        nodes: workflowNodes.map(node => ({
            id: node.id,
            modelName: node.modelName,
            modelType: node.modelType,
            category: node.category,
            quantity: node.quantity,
            x: node.x,
            y: node.y
        })),
        // 保存连接的完整信息
        connections: connections.map(conn => ({
            id: conn.id,
            from: {
                nodeId: conn.from.nodeId,
                type: conn.from.type
            },
            to: {
                nodeId: conn.to.nodeId,
                type: conn.to.type
            }
        })),
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        status: 'running'
    };
    
    // 保存到 currentWorkflow（用于index.html显示状态）
    localStorage.setItem('currentWorkflow', JSON.stringify(completeWorkflowData));
    
    // 保存到 canvasWorkflow（用于Canvas恢复）
    localStorage.setItem('canvasWorkflow', JSON.stringify(completeWorkflowData));
    
    
    // 无论公有还是私有，都保存到 myWorkflows（用户点击Run就自动保存）
    let myWorkflows = JSON.parse(localStorage.getItem('myWorkflows') || '[]');
    myWorkflows.push(completeWorkflowData);
    localStorage.setItem('myWorkflows', JSON.stringify(myWorkflows));
    
    hideSaveRunModal();
    alert(`工作流 "${workflowName}" 保存成功！正在跳转到聊天页面...`);
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Load workflow to canvas
function loadWorkflowToCanvas(workflow) {
    console.log('🔄 Loading workflow to canvas:', workflow.name);
    
    // Force clear existing nodes without confirmation
    workflowNodes.forEach(node => {
        const nodeElement = document.getElementById(node.id);
        if (nodeElement) nodeElement.remove();
    });
    
    // Clear connections
    connections.forEach(connection => {
        const lineElement = document.getElementById(connection.id);
        if (lineElement) lineElement.remove();
    });
    
    workflowNodes = [];
    connections = [];
    nodeIdCounter = 0;
    connectionIdCounter = 0;
    
    // Create nodes for each model in the workflow
    let xOffset = 100;
    workflow.models.forEach((model, index) => {
        // Find the model in our model data
        const modelData = findModelByName(model.name);
        if (modelData) {
            createWorkflowNode(modelData, xOffset, 200);
            xOffset += 350; // Space between nodes
        }
    });
    
    // Connect nodes sequentially
    setTimeout(() => {
        connectWorkflowNodes();
    }, 500);
    
    // Show Run button and hide Save and Run button
    document.getElementById('saveRunBtn').style.display = 'none';
    document.getElementById('runBtn').style.display = 'flex';
    
    // Store workflow data
    localStorage.setItem('currentWorkflow', JSON.stringify({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        status: 'ready'
    }));
    
    console.log('✅ Workflow loaded successfully');
}

// Find model by name
function findModelByName(name) {
    // Use model-data.js to get real model information
    const modelData = getModelData(name);
    if (modelData) {
        return {
            name: name,
            type: modelData.category,
            category: modelData.category,
            quantity: 2, // Default quantity
            purpose: modelData.purpose,
            useCase: modelData.useCase,
            industry: modelData.industry,
            rating: modelData.rating,
            tokenPrice: modelData.tokenPrice,
            sharePrice: modelData.sharePrice
        };
    }
    
    // Fallback for models not in model-data.js
    return {
        name: name,
        type: 'AI Model',
        category: 'AI Research',
        quantity: 2
    };
}

// Connect workflow nodes sequentially
function connectWorkflowNodes() {
    const nodes = document.querySelectorAll('.workflow-node');
    
    for (let i = 0; i < nodes.length - 1; i++) {
        const currentNode = nodes[i];
        const nextNode = nodes[i + 1];
        
        const currentRightPoint = currentNode.querySelector('.connection-point.right');
        const nextLeftPoint = nextNode.querySelector('.connection-point.left');
        
        if (currentRightPoint && nextLeftPoint) {
            // Create connection between nodes
            const start = {
                element: currentRightPoint,
                nodeId: currentRightPoint.dataset.node,
                type: 'right'
            };
            
            const end = {
                element: nextLeftPoint,
                nodeId: nextLeftPoint.dataset.node,
                type: 'left'
            };
            
            createNodeConnection(start, end);
        }
    }
}

// Run selected workflow
function runSelectedWorkflow() {
    const currentWorkflow = localStorage.getItem('currentWorkflow');
    if (!currentWorkflow) {
        alert('⚠️ No workflow selected to run.');
        return;
    }
    
    // Build exportable graph and a single sequential topological order (no parallel)
    function exportWorkflowGraphAndSequence() {
        // Enrich nodes with model description from model-data.js
        const nodes = workflowNodes.map(n => {
            const md = (typeof getModelData === 'function') ? getModelData(n.modelName) : null;
            return {
                id: n.id,
                name: n.modelName,
                category: n.category,
                purpose: md && md.purpose ? md.purpose : '',
                useCase: md && md.useCase ? md.useCase : '',
                industry: md && md.industry ? md.industry : ''
            };
        });
        const nodeIds = new Set(nodes.map(n => n.id));
        const posX = new Map(workflowNodes.map(n => [n.id, n.x || 0]));
        
        // Directed edges
        const edges = connections
            .filter(c => nodeIds.has(c.from.nodeId) && nodeIds.has(c.to.nodeId) && c.from.nodeId !== c.to.nodeId)
            .map(c => ({ from: c.from.nodeId, to: c.to.nodeId }));
        
        // Kahn's algorithm → single sequence with tie-breakers
        const inDeg = new Map();
        nodes.forEach(n => inDeg.set(n.id, 0));
        edges.forEach(e => inDeg.set(e.to, (inDeg.get(e.to) || 0) + 1));
        
        const adj = new Map();
        nodes.forEach(n => adj.set(n.id, []));
        edges.forEach(e => adj.get(e.from).push(e.to));
        
        const byId = new Map(nodes.map(n => [n.id, n]));
        const ready = [];
        inDeg.forEach((deg, id) => { if (deg === 0) ready.push(id); });
        ready.sort((a, b) => (posX.get(a) - posX.get(b)) || (byId.get(a).name.localeCompare(byId.get(b).name)));
        
        const seq = [];
        let processed = 0;
        while (ready.length) {
            const u = ready.shift();
            seq.push(u);
            processed++;
            for (const v of adj.get(u)) {
                inDeg.set(v, inDeg.get(v) - 1);
                if (inDeg.get(v) === 0) {
                    ready.push(v);
                    ready.sort((a, b) => (posX.get(a) - posX.get(b)) || (byId.get(a).name.localeCompare(byId.get(b).name)));
                }
            }
        }
        
        if (processed !== nodes.length) {
            console.warn('⚠️ Cycle detected; falling back to left→right order.');
            const byX = [...workflowNodes].sort((a,b) => a.x - b.x).map(n => n.id);
            return {
                nodes,
                edges,
                sequenceByIds: byX,
                sequenceByNames: byX.map(id => nodes.find(n => n.id === id) && nodes.find(n => n.id === id).name).filter(Boolean)
            };
        }
        
        const sequenceByNames = seq.map(id => byId.get(id) && byId.get(id).name).filter(Boolean);
        return { nodes, edges, sequenceByIds: seq, sequenceByNames };
    }
    
    try {
        const wf = JSON.parse(currentWorkflow);
        const runId = Date.now().toString();
        const { nodes, edges, sequenceByNames } = exportWorkflowGraphAndSequence();
        const experts = nodes.map(n => n.name);
        const expertDetails = nodes.map(n => ({
            name: n.name,
            purpose: n.purpose,
            useCase: n.useCase,
            category: n.category,
            industry: n.industry
        }));
        
        wf.status = 'running';
        wf.runId = runId;
        wf.experts = experts;
        wf.expertDetails = expertDetails;
        wf.graph = { nodes, edges };
        wf.sequence = sequenceByNames;
        
        localStorage.setItem('currentWorkflow', JSON.stringify(wf));
        
        // Clear any forced model when starting workflow from Canvas
        localStorage.removeItem('forcedModel');
        console.log('🧹 Cleared forcedModel when starting workflow from Canvas');
        
        alert(`🚀 Starting workflow: ${wf.name}\n\nOrder: ${sequenceByNames.join(' → ')}`);
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (e) {
        console.error('Error running workflow:', e);
        alert('❌ Error running workflow');
    }
}

// 收集当前canvas上的workflow数据
function collectWorkflowData() {
    const models = [];
    const nodeData = [];
    
    workflowNodes.forEach((node, index) => {
        models.push(node.modelName);
        nodeData.push({
            id: node.id,
            modelName: node.modelName,
            x: node.x,
            y: node.y,
            index: index
        });
    });
    
    // 收集连接数据
    const connectionData = connections.map(conn => ({
        id: conn.id,
        from: conn.from,
        to: conn.to
    }));
    
    return {
        models: models,
        nodes: nodeData,
        connections: connectionData
    };
}

// 保存workflow到My Assets
function saveWorkflowToMyAssets(workflow) {
    try {
        let myWorkflows = JSON.parse(localStorage.getItem('myWorkflows')) || [];
        myWorkflows.push(workflow);
        localStorage.setItem('myWorkflows', JSON.stringify(myWorkflows));
        console.log('Workflow saved to My Assets:', workflow);
        return true;
    } catch (error) {
        console.error('Error saving workflow:', error);
        alert('Failed to save workflow. Please try again.');
        return false;
    }
}

// Export functions
window.toggleSidebar = toggleSidebar;
window.filterModels = filterModels;
window.clearCanvas = clearCanvas;
window.saveWorkflow = saveWorkflow;
window.runWorkflow = runWorkflow;
window.configureNode = configureNode;
window.deleteNode = deleteNode;
window.showSaveRunModal = showSaveRunModal;
window.hideSaveRunModal = hideSaveRunModal;
window.saveAndRunWorkflow = saveAndRunWorkflow;
window.runSelectedWorkflow = runSelectedWorkflow;
function getCurrentCanvasModels() {
    return workflowNodes.map(node => node.modelName);
}
window.getCurrentCanvasModels = getCurrentCanvasModels;

console.log('✅ Canvas Workflow JavaScript loaded');
