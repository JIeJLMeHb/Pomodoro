document.addEventListener('DOMContentLoaded', function() {
    const minutesDisplay = document.getElementById('minutes');
    const secondsDisplay = document.getElementById('seconds');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const statusText = document.getElementById('status-text');
    const progressRing = document.querySelector('.progress-ring-fill');
    
    // Task elements
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const tasksList = document.getElementById('tasks-list');
    const tasksCounter = document.getElementById('tasks-counter');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    
    const settings = {
        pomodoro: 25 * 60,
        'short-break': 5 * 60,
        'long-break': 15 * 60
    };
    
    let currentMode = 'pomodoro';
    let timeLeft = settings[currentMode];
    let timerInterval = null;
    let isRunning = false;
    let totalTime = settings[currentMode];
    let tasks = JSON.parse(localStorage.getItem('pomodoroTasks')) || [];
    
    // Initialize
    updateDisplay();
    renderTasks();
    updateTasksCounter();

    // Timer event listeners
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            switchMode(this.dataset.mode);
        });
    });
    
    // Task event listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    function startTimer() {
        if (isRunning) return;
        
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        anime({
            targets: startBtn,
            scale: [1, 1.1, 1],
            duration: 300,
            easing: 'easeInOutQuad'
        });
        
        anime({
            targets: statusText,
            opacity: [0, 1],
            translateY: [10, 0],
            duration: 500,
            easing: 'easeOutQuad'
        });
        
        if (currentMode === 'pomodoro') {
            statusText.textContent = 'Focus time!';
            statusText.style.color = '#e94560';
        } else {
            statusText.textContent = 'Break time!';
            statusText.style.color = '#4cd137';
        }
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateDisplay();
            
            if (timeLeft <= 0) {
                completeTimer();
            }
        }, 1000);
    }
    
    function pauseTimer() {
        if (!isRunning) return;
        
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        clearInterval(timerInterval);
        
        anime({
            targets: pauseBtn,
            scale: [1, 1.1, 1],
            duration: 300,
            easing: 'easeInOutQuad'
        });
        
        statusText.textContent = 'Paused';
        statusText.style.color = '#fbc531';
    }
    
    function resetTimer() {
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        clearInterval(timerInterval);
        
        timeLeft = settings[currentMode];
        totalTime = settings[currentMode];
        updateDisplay();
        
        anime({
            targets: resetBtn,
            scale: [1, 1.1, 1],
            duration: 300,
            easing: 'easeInOutQuad'
        });
        
        statusText.textContent = 'Ready to focus';
        statusText.style.color = 'rgba(255, 255, 255, 0.8)';
    }
    
    function switchMode(mode) {
        modeBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        anime({
            targets: '.mode-btn',
            opacity: [0.5, 1],
            duration: 500,
            easing: 'easeOutQuad'
        });
        
        currentMode = mode;
        resetTimer();
        
        if (mode === 'pomodoro') {
            progressRing.style.stroke = '#e94560';
        } else {
            progressRing.style.stroke = '#4cd137';
        }
    }
    
    function updateDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        minutesDisplay.textContent = minutes.toString().padStart(2, '0');
        secondsDisplay.textContent = seconds.toString().padStart(2, '0');

        const circumference = 2 * Math.PI * 140;
        const offset = circumference - (timeLeft / totalTime) * circumference;
        progressRing.style.strokeDashoffset = offset;
    }
    
    function completeTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        
        anime.timeline({
            targets: '.timer-text',
            easing: 'easeOutExpo'
        })
        .add({
            scale: [1, 1.2],
            duration: 300
        })
        .add({
            scale: [1.2, 1],
            duration: 300
        });
        
        anime({
            targets: '.progress-ring-fill',
            stroke: ['#e94560', '#4cd137', '#e94560'],
            duration: 1000,
            loop: 3,
            easing: 'easeInOutSine'
        });
        
        anime({
            targets: statusText,
            textContent: currentMode === 'pomodoro' ? 'Time for a break!' : 'Break is over!',
            round: 1,
            duration: 500,
            easing: 'easeOutExpo'
        });
        
        // Auto-complete current task when pomodoro finishes
        if (currentMode === 'pomodoro') {
            completeCurrentTask();
        }
    }
    
    // Task Management Functions
    function addTask() {
        const text = taskInput.value.trim();
        if (text === '') return;
        
        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.unshift(task);
        saveTasks();
        renderTasks();
        updateTasksCounter();
        
        taskInput.value = '';
        taskInput.focus();
        
        // Animation for new task
        const newTaskElement = tasksList.firstChild;
        if (newTaskElement) {
            anime({
                targets: newTaskElement,
                opacity: [0, 1],
                translateY: [-20, 0],
                duration: 500,
                easing: 'easeOutQuad'
            });
        }
    }
    
    function renderTasks() {
        if (tasks.length === 0) {
            tasksList.innerHTML = '<div class="empty-tasks">No tasks yet. Add one above!</div>';
            return;
        }
        
        tasksList.innerHTML = '';
        
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            taskElement.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}"></div>
                <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
                <button class="task-delete" data-id="${task.id}">×</button>
            `;
            
            tasksList.appendChild(taskElement);
        });
        
        // Add event listeners to task elements
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', toggleTask);
        });
        
        document.querySelectorAll('.task-delete').forEach(button => {
            button.addEventListener('click', deleteTask);
        });
    }
    
    function toggleTask(e) {
        const taskId = parseInt(e.target.dataset.id);
        const task = tasks.find(t => t.id === taskId);
        
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
            updateTasksCounter();
            
            // Animation
            anime({
                targets: e.target,
                scale: [1, 1.2, 1],
                duration: 300,
                easing: 'easeInOutQuad'
            });
        }
    }
    
    function deleteTask(e) {
        const taskId = parseInt(e.target.dataset.id);
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        updateTasksCounter();
        
        // Animation
        anime({
            targets: e.target.closest('.task-item'),
            opacity: [1, 0],
            translateX: [0, -20],
            duration: 300,
            easing: 'easeInQuad',
            complete: function() {
                renderTasks();
            }
        });
    }
    
    function clearCompletedTasks() {
        const completedCount = tasks.filter(task => task.completed).length;
        
        if (completedCount === 0) return;
        
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateTasksCounter();
        
        // Animation
        anime({
            targets: clearCompletedBtn,
            scale: [1, 1.1, 1],
            duration: 300,
            easing: 'easeInOutQuad'
        });
    }
    
    function completeCurrentTask() {
        // Find the first incomplete task and mark it as completed
        const incompleteTask = tasks.find(task => !task.completed);
        if (incompleteTask) {
            incompleteTask.completed = true;
            saveTasks();
            renderTasks();
            updateTasksCounter();
        }
    }
    
    function updateTasksCounter() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const remainingTasks = totalTasks - completedTasks;
        
        if (totalTasks === 0) {
            tasksCounter.textContent = '0 tasks';
        } else if (completedTasks === totalTasks) {
            tasksCounter.textContent = 'All done! 🎉';
        } else {
            tasksCounter.textContent = `${remainingTasks} of ${totalTasks} remaining`;
        }
    }
    
    function saveTasks() {
        localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
    }
    
    // Initial animations
    anime({
        targets: '.title',
        translateY: [-50, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutExpo'
    });
    
    anime({
        targets: '.timer-section',
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 800,
        delay: 200,
        easing: 'easeOutExpo'
    });
    
    anime({
        targets: '.tasks-section',
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 800,
        delay: 400,
        easing: 'easeOutExpo'
    });
});