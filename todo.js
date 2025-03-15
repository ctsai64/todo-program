const API_URL = 'https://todo-program.onrender.com';

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dateStr = now.toLocaleDateString(undefined, options);
    
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
    document.getElementById('date').textContent = dateStr;
}

setInterval(updateClock, 1000);
updateClock();

function generateRandomColor() {
    const hue = Math.random() * 60 + 180; // Range from 180-240 (blue spectrum)
    const saturation = Math.random() * 30 + 60; // 60-90%
    const lightness = Math.random() * 20 + 40; // 40-60%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

class LiquidAnimation {
    constructor(canvas, color) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.currentLevel = 0;
        this.targetLevel = 0;
        this.transitionStartLevel = 0;
        this.transitionStartTime = null;
        this.transitionDuration = 2000;
        this.color = this.generateRandomColor();
        this.c = 0;
        this.resize();
        this.draw();
    }
    generateRandomColor() {
        const hue = Math.random() * 60 + 180; // Range from 180-240 (blue spectrum)
        const saturation = Math.random() * 30 + 60; // 60-90% saturation
        const lightness = Math.random() * 20 + 40; // 40-60% lightness
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.color;

        if (this.transitionStartTime) {
            const elapsed = Date.now() - this.transitionStartTime;
            const progress = Math.min(elapsed / this.transitionDuration, 1);
            this.currentLevel = this.transitionStartLevel + 
                (this.targetLevel - this.transitionStartLevel) * progress;
            if (progress === 1) this.transitionStartTime = null;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height - (this.canvas.height * this.currentLevel / 100));
        
        const waveHeight = 20;
        const temp = waveHeight * Math.sin(this.c / 50);
        this.ctx.bezierCurveTo(
            this.canvas.width / 3, this.canvas.height - (this.canvas.height * this.currentLevel / 100) - temp,
            2 * this.canvas.width / 3, this.canvas.height - (this.canvas.height * this.currentLevel / 100) + temp,
            this.canvas.width, this.canvas.height - (this.canvas.height * this.currentLevel / 100)
        );
        
        this.ctx.fill();
        this.update();
        requestAnimationFrame(() => this.draw());
    }

    update() {
        this.c = (this.c + 1) % (100 * Math.PI);
    }

    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    setLevel(level) {
        this.transitionStartLevel = this.currentLevel;
        this.targetLevel = level;
        this.transitionStartTime = Date.now();
    }
}

class TodoList {
    constructor(container, color, title = 'New List') {
        this.container = container;
        this.color = color;
        this.title = title;
        this.todos = [];
        this.setupUI();
        this.loadTodos();
        this.container._todoList = this;
    }

    setupUI() {
        this.container.innerHTML = `
            <div class="list-header">
                <input type="text" class="list-title" value="${this.title}" spellcheck="false">
                <button class="delete-list-btn">×</button>
            </div>
            <div class="todo-input-container">
                <input type="text" class="todo-input" placeholder="Add a new task...">
                <button class="add-todo-btn">+</button>
            </div>
            <ul class="todo-list"></ul>
            <canvas class="background-canvas"></canvas>
        `;

        this.canvas = this.container.querySelector('.background-canvas');
        this.animation = new LiquidAnimation(this.canvas, this.color);
        this.setupEventListeners();
    }

    setupEventListeners() {
        const addBtn = this.container.querySelector('.add-todo-btn');
        const input = this.container.querySelector('.todo-input');
        const deleteBtn = this.container.querySelector('.delete-list-btn');
        const titleInput = this.container.querySelector('.list-title');

        addBtn.addEventListener('click', () => this.addTodo());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        deleteBtn.addEventListener('click', () => this.deleteList());

        titleInput.addEventListener('change', () => {
            this.title = titleInput.value;
            this.saveTodos();
            saveAllLists();
        });

        window.addEventListener('resize', () => this.animation.resize());
    }

    addTodo() {
        const input = this.container.querySelector('.todo-input');
        const text = input.value.trim();
        if (!text) return;

        const todo = {
            text,
            completed: false,
            id: Date.now(),
            dueDate: null
        };

        this.todos.push(todo);
        this.renderTodo(todo);
        this.saveTodos();
        this.sortTodos();
        input.value = '';
    }

    sortTodos() {
        this.todos.sort((a, b) => {
            // First sort by completion status
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            // Then sort by due date for tasks with same completion status
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        // Clear and re-render all todos
        const todoList = this.container.querySelector('.todo-list');
        todoList.innerHTML = '';
        this.todos.forEach(todo => this.renderTodo(todo));
    }

    renderTodo(todo) {
        const li = document.createElement('li');
        li.className = 'todo-item' + (todo.completed ? ' completed' : '');
        li.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
            <span>${todo.text}</span>
            <div class="todo-date-container">
                <button class="date-picker-btn" aria-label="Set Due Date">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path fill="currentColor" d="M4 0v1H2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V3a2 2 0 00-2-2h-2V0h-2v1H6V0H4zm0 5V4h2v1h4V4h2v1h2v2H2V5h2zm-2 3h12v6H2V8z"/>
                    </svg>
                </button>
                ${todo.dueDate ? `<span class="due-date">${new Date(todo.dueDate).toLocaleDateString()}</span>` : ''}
                <input type="date" class="date-input" style="display: none;">
            </div>
            <button class="delete-todo" aria-label="Delete Task">×</button>
        `;

        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', () => {
            todo.completed = checkbox.checked;
            li.classList.toggle('completed');
            this.saveTodos();
            this.sortTodos();
        });

        const deleteBtn = li.querySelector('.delete-todo');
        deleteBtn.addEventListener('click', () => {
            this.todos = this.todos.filter(t => t.id !== todo.id);
            li.remove();
            this.saveTodos();
        });

        const datePickerBtn = li.querySelector('.date-picker-btn');
        const dateInput = li.querySelector('.date-input');
        const dueDateSpan = li.querySelector('.due-date');

        datePickerBtn.addEventListener('click', () => {
            dateInput.style.display = 'block';
            dateInput.showPicker();
        });

        dateInput.addEventListener('change', () => {
            todo.dueDate = dateInput.value;
            if (dueDateSpan) {
                dueDateSpan.textContent = new Date(dateInput.value).toLocaleDateString();
            } else {
                const newDueDateSpan = document.createElement('span');
                newDueDateSpan.className = 'due-date';
                newDueDateSpan.textContent = new Date(dateInput.value).toLocaleDateString();
                li.querySelector('.todo-date-container').insertBefore(
                    newDueDateSpan,
                    dateInput
                );
            }
            dateInput.style.display = 'none';
            this.saveTodos();
            this.sortTodos();
        });

        this.container.querySelector('.todo-list').appendChild(li);
    }

    saveTodos() {
        const listId = this.container.dataset.listId;
        const listData = {
            todos: this.todos,
            color: this.color,
            title: this.title
        };
        localStorage.setItem(`list_${listId}`, JSON.stringify(listData));
        this.updateProgress();
    }

    loadTodos() {
        const listId = this.container.dataset.listId;
        const listData = JSON.parse(localStorage.getItem(`list_${listId}`));
        if (listData) {
            this.todos = listData.todos || [];
            this.color = listData.color;
            this.title = listData.title;
            this.container.querySelector('.list-title').value = this.title;
            this.todos.forEach(todo => this.renderTodo(todo));
            this.updateProgress();
        }
    }

    updateProgress() {
        const total = this.todos.length;
        if (total === 0) {
            this.animation.setLevel(0);
            return;
        }
        const completed = this.todos.filter(todo => todo.completed).length;
        const percentage = (completed / total) * 100;
        this.animation.setLevel(percentage);
    }

    deleteList() {
        const listId = this.container.dataset.listId;
        localStorage.removeItem(`list_${listId}`);
        this.container.remove();
        saveAllLists();
    }
}

function saveAllLists() {
    const lists = document.querySelectorAll('.list-container');
    const listsData = Array.from(lists).map(listEl => ({
        id: listEl.dataset.listId,
        title: listEl.querySelector('.list-title').value,
        color: listEl._todoList.color
    }));
    localStorage.setItem('lists', JSON.stringify(listsData));
}

function loadAllLists() {
    const listsData = JSON.parse(localStorage.getItem('lists')) || [];
    if (listsData.length === 0) {
        createNewList();
        return;
    }
    
    listsData.forEach(listData => {
        const container = document.createElement('div');
        container.className = 'list-container';
        container.dataset.listId = listData.id;
        document.getElementById('listsContainer').insertBefore(
            container,
            document.getElementById('addListContainer')
        );
        new TodoList(container, listData.color, listData.title);
    });
}

function createNewList() {
    const container = document.createElement('div');
    container.className = 'list-container';
    container.dataset.listId = Date.now();
    
    document.getElementById('listsContainer').insertBefore(
        container,
        document.getElementById('addListContainer')
    );
    
    const color = generateRandomColor();
    const newList = new TodoList(container, color);
    saveAllLists();
    return newList;
}

document.getElementById('addListBtn').addEventListener('click', createNewList);
document.addEventListener('DOMContentLoaded', loadAllLists);