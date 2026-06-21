/**
 * OmniSuite To-Do List Module
 * Manages tasks, filters, badges, progress bars, and browser local storage persistence.
 */
class TodoList {
  constructor() {
    this.tasks = this.loadTasks();
    this.currentFilter = 'all'; // 'all', 'active', 'completed'

    // DOM Elements
    this.formEl = document.getElementById('todo-form');
    this.inputEl = document.getElementById('todo-input');
    this.listContainerEl = document.getElementById('todo-list-items');
    this.emptyStateEl = document.getElementById('todo-empty-state');
    
    // Filters & Actions
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.clearCompletedBtn = document.getElementById('todo-clear-completed');

    // Badges & Progress
    this.badgeAll = document.getElementById('badge-all');
    this.badgeActive = document.getElementById('badge-active');
    this.badgeCompleted = document.getElementById('badge-completed');
    this.progressBarFill = document.getElementById('todo-progress-bar');
    this.progressPercentText = document.getElementById('todo-progress-percent');

    this.init();
  }

  init() {
    // Form Submission (Add Task)
    this.formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addTask();
    });

    // Filter Buttons click
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.getAttribute('data-filter');
        this.render();
      });
    });

    // Clear Completed click
    this.clearCompletedBtn.addEventListener('click', () => {
      this.clearCompleted();
    });

    this.render();
  }

  loadTasks() {
    const stored = localStorage.getItem('omnisuite_todo_tasks');
    return stored ? JSON.parse(stored) : [];
  }

  saveTasks() {
    localStorage.setItem('omnisuite_todo_tasks', JSON.stringify(this.tasks));
    this.updateStats();
  }

  addTask() {
    const text = this.inputEl.value.trim();
    if (!text) return;

    const newTask = {
      id: Date.now(),
      text: text,
      completed: false,
      timestamp: Date.now()
    };

    this.tasks.unshift(newTask); // Add to beginning of array
    this.inputEl.value = '';
    this.saveTasks();
    this.render();
  }

  toggleTask(id) {
    this.tasks = this.tasks.map(task => {
      if (task.id === id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    this.saveTasks();
    this.render();
  }

  deleteTask(id) {
    // CSS Fade-out animation could be triggered here if desired
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.saveTasks();
    this.render();
  }

  clearCompleted() {
    this.tasks = this.tasks.filter(task => !task.completed);
    this.saveTasks();
    this.render();
  }

  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const active = total - completed;

    // Update Badges
    this.badgeAll.textContent = total;
    this.badgeActive.textContent = active;
    this.badgeCompleted.textContent = completed;

    // Update Progress Bar
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    this.progressBarFill.style.width = `${percent}%`;
    this.progressPercentText.textContent = `${percent}%`;
  }

  render() {
    this.listContainerEl.innerHTML = '';
    
    // Filter tasks
    const filteredTasks = this.tasks.filter(task => {
      if (this.currentFilter === 'active') return !task.completed;
      if (this.currentFilter === 'completed') return task.completed;
      return true; // 'all'
    });

    // Toggle Empty State view
    if (filteredTasks.length === 0) {
      this.emptyStateEl.classList.remove('hidden');
      this.listContainerEl.classList.add('hidden');
      
      // Update text in empty state depending on filter
      const emptyText = this.emptyStateEl.querySelector('p');
      const emptyIcon = this.emptyStateEl.querySelector('i');
      if (this.currentFilter === 'active') {
        emptyText.textContent = "No active tasks! Add some tasks above.";
        if (emptyIcon) emptyIcon.setAttribute('data-lucide', 'circle-dashed');
      } else if (this.currentFilter === 'completed') {
        emptyText.textContent = "No completed tasks yet. Finish a task to see it here!";
        if (emptyIcon) emptyIcon.setAttribute('data-lucide', 'check-circle-2');
      } else {
        emptyText.textContent = "You're all caught up! Add a task to start.";
        if (emptyIcon) emptyIcon.setAttribute('data-lucide', 'clipboard-list');
      }

      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    } else {
      this.emptyStateEl.classList.add('hidden');
      this.listContainerEl.classList.remove('hidden');

      filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `todo-item ${task.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
          <div class="todo-item-left">
            <div class="todo-checkbox">
              <i data-lucide="check"></i>
            </div>
            <span class="todo-text">${this.escapeHTML(task.text)}</span>
          </div>
          <button class="btn-todo-delete" title="Delete Task">
            <i data-lucide="trash-2"></i>
          </button>
        `;

        // Event: Toggle check status on clicking list item text/checkbox
        li.querySelector('.todo-item-left').addEventListener('click', () => {
          this.toggleTask(task.id);
        });

        // Event: Delete task click
        li.querySelector('.btn-todo-delete').addEventListener('click', (e) => {
          e.stopPropagation(); // Avoid triggering toggleTask
          
          // CSS smooth deletion effect
          li.style.transform = 'translateX(20px)';
          li.style.opacity = '0';
          setTimeout(() => {
            this.deleteTask(task.id);
          }, 200);
        });

        this.listContainerEl.appendChild(li);
      });

      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }

    this.updateStats();
  }

  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
