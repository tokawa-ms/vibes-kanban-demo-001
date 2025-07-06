// Kanban Task Management Application
// ES6+ JavaScript implementation

class KanbanApp {
    constructor() {
        this.tasks = [];
        this.archivedTasks = [];
        this.currentEditingTask = null;
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.sortBy = 'updatedAt';
        
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.bindEvents();
        this.render();
    }

    // Local Storage Management
    loadFromLocalStorage() {
        const tasks = localStorage.getItem('kanban-tasks');
        const archivedTasks = localStorage.getItem('kanban-archived');
        
        if (tasks) {
            this.tasks = JSON.parse(tasks);
        }
        
        if (archivedTasks) {
            this.archivedTasks = JSON.parse(archivedTasks);
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('kanban-tasks', JSON.stringify(this.tasks));
        localStorage.setItem('kanban-archived', JSON.stringify(this.archivedTasks));
    }

    // Task Management
    createTask(title, description, priority = 'medium') {
        const task = {
            id: this.generateId(),
            title,
            description,
            status: 'todo',
            priority,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.tasks.push(task);
        this.saveToLocalStorage();
        this.render();
        
        return task;
    }

    updateTask(id, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveToLocalStorage();
            this.render();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveToLocalStorage();
        this.render();
    }

    archiveTask(id) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            const task = this.tasks[taskIndex];
            task.archivedAt = new Date().toISOString();
            this.archivedTasks.push(task);
            this.tasks.splice(taskIndex, 1);
            this.saveToLocalStorage();
            this.render();
        }
    }

    restoreTask(id) {
        const taskIndex = this.archivedTasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            const task = this.archivedTasks[taskIndex];
            delete task.archivedAt;
            task.updatedAt = new Date().toISOString();
            this.tasks.push(task);
            this.archivedTasks.splice(taskIndex, 1);
            this.saveToLocalStorage();
            this.render();
        }
    }

    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getPriorityColor(priority) {
        const colors = {
            high: 'bg-red-100 text-red-800',
            medium: 'bg-yellow-100 text-yellow-800',
            low: 'bg-green-100 text-green-800'
        };
        return colors[priority] || colors.medium;
    }

    getPriorityText(priority) {
        const texts = {
            high: '高',
            medium: '中',
            low: '低'
        };
        return texts[priority] || texts.medium;
    }

    // Filtering and Sorting
    getFilteredTasks() {
        let filteredTasks = [...this.tasks];

        // Apply search filter
        if (this.searchTerm) {
            filteredTasks = filteredTasks.filter(task =>
                task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                task.description.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        }

        // Apply status filter
        if (this.statusFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.status === this.statusFilter);
        }

        // Apply sorting
        filteredTasks.sort((a, b) => {
            switch (this.sortBy) {
                case 'createdAt':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'updatedAt':
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                default:
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
            }
        });

        return filteredTasks;
    }

    // Rendering
    render() {
        this.renderTasks();
        this.renderArchive();
        this.updateCounts();
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        const columns = {
            todo: document.getElementById('todoColumn'),
            progress: document.getElementById('progressColumn'),
            done: document.getElementById('doneColumn')
        };

        // Clear all columns
        Object.values(columns).forEach(column => {
            column.innerHTML = '';
        });

        // Render tasks by status
        Object.keys(columns).forEach(status => {
            const statusTasks = filteredTasks.filter(task => task.status === status);
            const column = columns[status];

            if (statusTasks.length === 0) {
                column.innerHTML = '<div class="empty-state">タスクがありません</div>';
            } else {
                statusTasks.forEach(task => {
                    column.appendChild(this.createTaskElement(task));
                });
            }
        });
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-card bg-white p-4 rounded-lg shadow-sm border priority-${task.priority}`;
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;

        const highlightedTitle = this.highlightSearchTerm(task.title);
        const highlightedDescription = this.highlightSearchTerm(task.description);

        taskElement.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <h3 class="font-medium text-gray-800 flex-1">${highlightedTitle}</h3>
                <div class="flex items-center gap-1 ml-2">
                    <span class="px-2 py-1 text-xs rounded-full ${this.getPriorityColor(task.priority)}">
                        ${this.getPriorityText(task.priority)}
                    </span>
                    <div class="relative">
                        <button class="task-menu-btn p-1 text-gray-400 hover:text-gray-600 rounded" data-task-id="${task.id}">
                            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                            </svg>
                        </button>
                        <div class="task-menu absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden min-w-32">
                            <button class="edit-task w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" data-task-id="${task.id}">編集</button>
                            ${task.status === 'done' ? 
                                `<button class="archive-task w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" data-task-id="${task.id}">アーカイブ</button>` : 
                                ''
                            }
                            <button class="delete-task w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50" data-task-id="${task.id}">削除</button>
                        </div>
                    </div>
                </div>
            </div>
            ${task.description ? `<p class="text-gray-600 text-sm mb-3">${highlightedDescription}</p>` : ''}
            <div class="flex items-center justify-between text-xs text-gray-500">
                <span>作成: ${this.formatDate(task.createdAt)}</span>
                <span>更新: ${this.formatDate(task.updatedAt)}</span>
            </div>
        `;

        this.bindTaskEvents(taskElement);
        return taskElement;
    }

    renderArchive() {
        const archiveContainer = document.getElementById('archiveContainer');
        archiveContainer.innerHTML = '';

        if (this.archivedTasks.length === 0) {
            archiveContainer.innerHTML = '<div class="col-span-full empty-state">アーカイブされたタスクはありません</div>';
        } else {
            this.archivedTasks.forEach(task => {
                const taskElement = this.createArchivedTaskElement(task);
                archiveContainer.appendChild(taskElement);
            });
        }
    }

    createArchivedTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `bg-gray-50 p-4 rounded-lg border priority-${task.priority}`;

        taskElement.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <h3 class="font-medium text-gray-700 flex-1">${task.title}</h3>
                <div class="flex items-center gap-1 ml-2">
                    <span class="px-2 py-1 text-xs rounded-full ${this.getPriorityColor(task.priority)}">
                        ${this.getPriorityText(task.priority)}
                    </span>
                    <button class="restore-task p-1 text-blue-500 hover:text-blue-700 rounded" data-task-id="${task.id}" title="復元">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                        </svg>
                    </button>
                </div>
            </div>
            ${task.description ? `<p class="text-gray-600 text-sm mb-3">${task.description}</p>` : ''}
            <div class="flex items-center justify-between text-xs text-gray-500">
                <span>完了: ${this.formatDate(task.archivedAt)}</span>
                <span>作成: ${this.formatDate(task.createdAt)}</span>
            </div>
        `;

        return taskElement;
    }

    highlightSearchTerm(text) {
        if (!this.searchTerm) return text;
        
        const regex = new RegExp(`(${this.searchTerm})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    updateCounts() {
        const todoCount = this.tasks.filter(task => task.status === 'todo').length;
        const progressCount = this.tasks.filter(task => task.status === 'progress').length;
        const doneCount = this.tasks.filter(task => task.status === 'done').length;
        const archiveCount = this.archivedTasks.length;

        document.getElementById('todoCount').textContent = todoCount;
        document.getElementById('progressCount').textContent = progressCount;
        document.getElementById('doneCount').textContent = doneCount;
        document.getElementById('archiveCount').textContent = archiveCount;
    }

    // Event Binding
    bindEvents() {
        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openModal();
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') {
                this.closeModal();
            }
        });

        // Form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.render();
        });

        // Status filter
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.statusFilter = e.target.value;
            this.render();
        });

        // Sort by
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.render();
        });

        // Archive toggle
        document.getElementById('toggleArchive').addEventListener('click', () => {
            this.toggleArchiveSection();
        });

        // Drag and drop events
        this.bindDragDropEvents();

        // Document click handler for task menus
        document.addEventListener('click', (e) => {
            this.handleDocumentClick(e);
        });
    }

    bindTaskEvents(taskElement) {
        // Task menu button
        const menuBtn = taskElement.querySelector('.task-menu-btn');
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleTaskMenu(e.target.closest('.task-menu-btn'));
        });

        // Edit task
        const editBtn = taskElement.querySelector('.edit-task');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editTask(e.target.dataset.taskId);
        });

        // Delete task
        const deleteBtn = taskElement.querySelector('.delete-task');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.confirmDeleteTask(e.target.dataset.taskId);
        });

        // Archive task
        const archiveBtn = taskElement.querySelector('.archive-task');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.confirmArchiveTask(e.target.dataset.taskId);
            });
        }
    }

    bindDragDropEvents() {
        // Task drag events
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.target.classList.remove('dragging');
            }
        });

        // Column drop events
        const columns = document.querySelectorAll('[data-status]');
        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', (e) => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = column.dataset.status;
                
                this.updateTaskStatus(taskId, newStatus);
            });
        });
    }

    // Modal Management
    openModal(task = null) {
        this.currentEditingTask = task;
        const modal = document.getElementById('taskModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('taskForm');

        if (task) {
            title.textContent = 'タスクを編集';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskPriority').value = task.priority;
        } else {
            title.textContent = '新しいタスク';
            form.reset();
        }

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        modal.querySelector('.bg-white').classList.add('modal-enter');
        document.getElementById('taskTitle').focus();
    }

    closeModal() {
        const modal = document.getElementById('taskModal');
        const modalContent = modal.querySelector('.bg-white');
        
        modalContent.classList.add('modal-exit');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            modalContent.classList.remove('modal-enter', 'modal-exit');
            this.currentEditingTask = null;
        }, 200);
    }

    handleFormSubmit() {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;

        if (!title) {
            alert('タイトルは必須です。');
            return;
        }

        if (this.currentEditingTask) {
            this.updateTask(this.currentEditingTask.id, {
                title,
                description,
                priority
            });
        } else {
            this.createTask(title, description, priority);
        }

        this.closeModal();
    }

    // Task Actions
    updateTaskStatus(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) {
            const oldStatus = task.status;
            this.updateTask(taskId, { status: newStatus });
            
            // Add completion animation if moved to done
            if (newStatus === 'done' && oldStatus !== 'done') {
                const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
                if (taskElement) {
                    taskElement.classList.add('task-complete');
                    setTimeout(() => {
                        taskElement.classList.remove('task-complete');
                    }, 600);
                }
            }
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.openModal(task);
        }
    }

    confirmDeleteTask(taskId) {
        if (confirm('このタスクを削除しますか？この操作は取り消せません。')) {
            this.deleteTask(taskId);
        }
    }

    confirmArchiveTask(taskId) {
        if (confirm('このタスクをアーカイブしますか？アーカイブされたタスクは後で復元できます。')) {
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.classList.add('task-archive');
                setTimeout(() => {
                    this.archiveTask(taskId);
                }, 500);
            } else {
                this.archiveTask(taskId);
            }
        }
    }

    // UI Interactions
    toggleTaskMenu(button) {
        // Close all other menus
        document.querySelectorAll('.task-menu').forEach(menu => {
            if (menu !== button.nextElementSibling) {
                menu.classList.add('hidden');
            }
        });

        // Toggle current menu
        const menu = button.nextElementSibling;
        menu.classList.toggle('hidden');
    }

    handleDocumentClick(e) {
        // Close task menus when clicking outside
        if (!e.target.closest('.task-menu-btn') && !e.target.closest('.task-menu')) {
            document.querySelectorAll('.task-menu').forEach(menu => {
                menu.classList.add('hidden');
            });
        }

        // Handle restore task
        if (e.target.closest('.restore-task')) {
            const taskId = e.target.closest('.restore-task').dataset.taskId;
            this.restoreTaskWithAnimation(taskId);
        }
    }

    restoreTaskWithAnimation(taskId) {
        if (confirm('このタスクを復元しますか？')) {
            this.restoreTask(taskId);
            // Add restore animation to the newly restored task
            setTimeout(() => {
                const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
                if (taskElement) {
                    taskElement.classList.add('task-restore');
                    setTimeout(() => {
                        taskElement.classList.remove('task-restore');
                    }, 500);
                }
            }, 100);
        }
    }

    toggleArchiveSection() {
        const section = document.getElementById('archiveSection');
        const toggleBtn = document.getElementById('toggleArchive');
        const toggleText = document.getElementById('archiveToggleText');
        const icon = toggleBtn.previousElementSibling.querySelector('svg');

        if (section.classList.contains('hidden')) {
            section.classList.remove('hidden');
            toggleText.textContent = '非表示';
            icon.classList.add('archive-toggle', 'open');
        } else {
            section.classList.add('hidden');
            toggleText.textContent = '表示';
            icon.classList.remove('archive-toggle', 'open');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KanbanApp();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N to add new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('addTaskBtn').click();
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('taskModal');
        if (!modal.classList.contains('hidden')) {
            document.getElementById('closeModal').click();
        }
    }
});