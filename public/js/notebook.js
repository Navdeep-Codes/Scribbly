document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements - Notebook
    const markdownEditor = document.getElementById('markdown-editor');
    const markdownPreview = document.getElementById('markdown-preview');
    const currentDateDisplay = document.getElementById('current-date');
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    const todayBtn = document.getElementById('today');
    const toggleViewBtn = document.getElementById('toggle-view');
    const editMode = document.getElementById('edit-mode');
    const previewMode = document.getElementById('preview-mode');
    const saveStatus = document.getElementById('save-status');
    const formatButtons = document.querySelectorAll('.formatting-toolbar button[data-markdown]');
    const drawerToggle = document.getElementById('drawer-toggle');
    const markdownHelpDrawer = document.getElementById('markdown-help-drawer');
    
    // DOM Elements - Navigation
    const navButtons = document.querySelectorAll('.nav-button');
    const pages = document.querySelectorAll('.page-content');
    const currentTimeEl = document.getElementById('current-time');
    
    // Server API URL
    const API_URL = '/api';
    
    // Current date
    let currentDate = new Date();
    
    // Auto-save timer
    let autoSaveTimer = null;
    
    // Initialize notebook and nav
    initNotebook();
    initNavigation();
    updateCurrentTime();

    // Set up markdown parser options
    const markedOptions = {
        breaks: true,
        gfm: true,
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        }
    };
    
    // Set up event listeners
    if (markdownEditor) {
        markdownEditor.addEventListener('input', startAutoSave);
    }
    
    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', goToPreviousDay);
    }
    
    if (nextDayBtn) {
        nextDayBtn.addEventListener('click', goToNextDay);
    }
    
    if (todayBtn) {
        todayBtn.addEventListener('click', goToToday);
    }
    
    if (toggleViewBtn) {
        toggleViewBtn.addEventListener('click', toggleView);
    }
    
    if (drawerToggle) {
        drawerToggle.addEventListener('click', toggleMarkdownHelp);
    }
    
    // Format buttons
    formatButtons.forEach(button => {
        button.addEventListener('click', () => {
            insertMarkdownSyntax(button.getAttribute('data-markdown'));
        });
    });
    
    // Navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.getAttribute('data-page');
            navigateToPage(pageId);
        });
    });
    
    // Initialize notebook
    function initNotebook() {
        updateDateDisplay();
        loadEntry();
    }
    
    // Initialize navigation
    function initNavigation() {
        // Set active page based on current URL or default to diary
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page') || 'diary';
        navigateToPage(pageParam, false);
        
        // Update time every minute
        setInterval(updateCurrentTime, 60000);
    }
    
    // Update current time display
    function updateCurrentTime() {
        const now = new Date();
        const formattedTime = now.toLocaleString('en-US', { 
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true 
        });
        currentTimeEl.textContent = formattedTime;
    }
    
    // Navigate to a page
    function navigateToPage(pageId, updateUrl = true) {
        // Update nav buttons
        navButtons.forEach(button => {
            if (button.getAttribute('data-page') === pageId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Update page visibility
        pages.forEach(page => {
            if (page.getAttribute('data-page') === pageId) {
                page.classList.remove('hidden');
            } else {
                page.classList.add('hidden');
            }
        });
        
        // Update URL if needed
        if (updateUrl) {
            window.history.pushState({}, '', `?page=${pageId}`);
        }
        
        // Special handling for diary page
        if (pageId === 'diary') {
            setTimeout(() => {
                updatePreview();
            }, 100);
        }
    }
    
    // Update the date display
    function updateDateDisplay() {
        if (!currentDateDisplay) return;
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateDisplay.textContent = currentDate.toLocaleDateString('en-US', options);
    }

    // Format date for API
    function formatDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    // Load entry for current date
    async function loadEntry() {
        if (!markdownEditor || !markdownPreview) return;
        
        try {
            const dateKey = formatDateKey(currentDate);
            const response = await fetch(`${API_URL}/entry/${dateKey}`);
            
            if (!response.ok) {
                throw new Error('Failed to load entry');
            }
            
            const data = await response.json();
            
            markdownEditor.value = data.content || '';
            
            // If there's no content and it's today, maybe add a template
            if (!data.content && dateKey === formatDateKey(new Date())) {
                const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
                markdownEditor.value = `# Entry for ${currentDateDisplay.textContent}\n\nWritten at ${currentTime}\n\n`;
            }
            
            // Update preview
            updatePreview();
            
            // Update save status
            updateSaveStatus('Loaded');
        } catch (error) {
            console.error('Error loading entry:', error);
            markdownEditor.value = '# Error loading entry\n\nThere was a problem loading the entry for this date.';
            updatePreview();
        }
    }
    
    // Save current entry
    async function saveEntry() {
        if (!markdownEditor) return;
        
        try {
            const dateKey = formatDateKey(currentDate);
            const content = markdownEditor.value;
            
            const response = await fetch(`${API_URL}/entry/${dateKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save entry');
            }
            
            updateSaveStatus('Saved');
        } catch (error) {
            console.error('Error saving entry:', error);
            updateSaveStatus('Error saving');
        }
    }
    
    // Start auto-save timer
    function startAutoSave() {
        updateSaveStatus('Typing...');
        
        // Update preview in real time
        updatePreview();
        
        // Clear previous timer
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer);
        }
        
        // Set new timer
        autoSaveTimer = setTimeout(() => {
            saveEntry();
        }, 1000); // Auto-save after 1 second of inactivity
    }
    
    // Update save status indicator
    function updateSaveStatus(message) {
        if (!saveStatus) return;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
        saveStatus.textContent = `${message} at ${time}`;
        
        if (message === 'Saved') {
            saveStatus.classList.add('saved');
            setTimeout(() => {
                saveStatus.classList.remove('saved');
            }, 2000);
        } else {
            saveStatus.classList.remove('saved');
        }
    }
    
    // Update markdown preview
    function updatePreview() {
        if (!markdownEditor || !markdownPreview) return;
        
        const content = markdownEditor.value;
        markdownPreview.innerHTML = marked.parse(content, markedOptions);
        
        // Apply syntax highlighting to code blocks
        document.querySelectorAll('#markdown-preview pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }
    
    // Navigate to previous day
    function goToPreviousDay() {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateDisplay();
        loadEntry();
    }
    
    // Navigate to next day
    function goToNextDay() {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateDisplay();
        loadEntry();
    }
    
    // Navigate to today
    function goToToday() {
        currentDate = new Date();
        updateDateDisplay();
        loadEntry();
    }
    
    // Toggle between edit and preview modes
    function toggleView() {
        editMode.classList.toggle('active');
        previewMode.classList.toggle('active');
        
        if (previewMode.classList.contains('active')) {
            toggleViewBtn.innerHTML = '<i class="fas fa-edit"></i>';
            toggleViewBtn.title = "Edit Mode";
            updatePreview();
        } else {
            toggleViewBtn.innerHTML = '<i class="fas fa-eye"></i>';
            toggleViewBtn.title = "Preview Mode";
            markdownEditor.focus();
        }
    }
    
    // Insert markdown syntax
    function insertMarkdownSyntax(syntax) {
        if (!markdownEditor) return;
        
        const start = markdownEditor.selectionStart;
        const end = markdownEditor.selectionEnd;
        const text = markdownEditor.value;
        let selectedText = text.substring(start, end);
        let replacement = '';
        
        // Custom handling for different markdown features
        if (syntax.includes('text')) {
            // For bold, italic, etc. where we wrap the text
            const parts = syntax.split('text');
            
            if (selectedText) {
                replacement = parts[0] + selectedText + parts[1];
            } else {
                replacement = syntax;
                selectedText = 'text';
            }
            
            markdownEditor.value = 
                text.substring(0, start) + 
                replacement + 
                text.substring(end);
                
            // Position cursor inside the syntax if no text was selected
            if (start === end) {
                markdownEditor.selectionStart = start + parts[0].length;
                markdownEditor.selectionEnd = start + parts[0].length + selectedText.length;
            } else {
                markdownEditor.selectionStart = start;
                markdownEditor.selectionEnd = start + replacement.length;
            }
        } else {
            // For list items, headings, etc. where we prefix the line
            if (syntax === '# ' || syntax === '- ' || syntax === '1. ' || syntax === '> ') {
                // Find the start of the line
                let lineStart = start;
                while (lineStart > 0 && text.charAt(lineStart - 1) !== '\n') {
                    lineStart--;
                }
                
                replacement = syntax + text.substring(lineStart, end);
                markdownEditor.value = 
                    text.substring(0, lineStart) + 
                    replacement + 
                    text.substring(end);
                
                markdownEditor.selectionStart = lineStart + syntax.length;
                markdownEditor.selectionEnd = lineStart + replacement.length;
            } else {
                // For horizontal rule, code blocks, etc.
                replacement = syntax;
                
                if (syntax === '```\ncode\n```') {
                    markdownEditor.value = 
                        text.substring(0, start) + 
                        replacement + 
                        text.substring(end);
                    
                    markdownEditor.selectionStart = start + 4;
                    markdownEditor.selectionEnd = start + 8;
                } else {
                    markdownEditor.value = 
                        text.substring(0, start) + 
                        replacement + 
                        text.substring(end);
                    
                    markdownEditor.selectionStart = start + replacement.length;
                    markdownEditor.selectionEnd = start + replacement.length;
                }
            }
        }
        
        markdownEditor.focus();
        startAutoSave();
    }
    
    // Toggle markdown help drawer
    function toggleMarkdownHelp() {
        markdownHelpDrawer.classList.toggle('open');
    }

    // Set personalized greeting on first load for today
    function setPersonalizedGreeting() {
        if (!markdownEditor || markdownEditor.value.trim() !== '') return;
        
        const now = new Date();
        const hour = now.getHours();
        let greeting = "Good morning";
        
        if (hour >= 12 && hour < 17) {
            greeting = "Good afternoon";
        } else if (hour >= 17) {
            greeting = "Good evening";
        }
        
        const template = `# ${greeting}, Navdeep! 👋\n\n${currentDateDisplay.textContent}\n\n## Today's Goals\n\n- [ ] Complete Day 1 of my diary project\n- [ ] Learn more about Markdown\n- [ ] Add a new feature to my notebook\n\n## Thoughts\n\nWrite your thoughts here...\n\n> **TIP**: You can see how Markdown works by toggling the preview mode!`;
        
        markdownEditor.value = template;
        updatePreview();
        startAutoSave();
    }
    
    // Initial load - set personalized greeting if on diary page
    if (formatDateKey(currentDate) === formatDateKey(new Date())) {
        setTimeout(setPersonalizedGreeting, 500);
    }
    
    // Initialize task functionality
    initTaskFunctionality();
    
    function initTaskFunctionality() {
        const addTaskBtn = document.getElementById('add-task-btn');
        const newTaskInput = document.getElementById('new-task');
        const taskList = document.getElementById('task-list');
        const filterButtons = document.querySelectorAll('.task-filters .filter');
        
        if (!addTaskBtn || !newTaskInput || !taskList) return;
        
        // Add new task
        addTaskBtn.addEventListener('click', addNewTask);
        newTaskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addNewTask();
            }
        });
        
        // Filter tasks
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filterType = this.getAttribute('data-filter');
                filterTasks(filterType);
                
                // Update active filter
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        // Delete task and toggle completion
        taskList.addEventListener('click', function(e) {
            // Delete button clicked
            if (e.target.closest('.delete-task')) {
                const taskItem = e.target.closest('.task-item');
                taskItem.remove();
                saveTasks();
            }
            
            // Checkbox toggled
            if (e.target.type === 'checkbox') {
                const taskItem = e.target.closest('.task-item');
                taskItem.classList.toggle('completed', e.target.checked);
                saveTasks();
            }
        });
        
        function addNewTask() {
            const taskText = newTaskInput.value.trim();
            if (!taskText) return;
            
            const taskId = 'task-' + Date.now();
            const taskItem = document.createElement('li');
            taskItem.className = 'task-item';
            taskItem.innerHTML = `
                <input type="checkbox" id="${taskId}">
                <label for="${taskId}">${taskText}</label>
                <button class="delete-task"><i class="fas fa-trash-alt"></i></button>
            `;
            
            taskList.appendChild(taskItem);
            newTaskInput.value = '';
            newTaskInput.focus();
            saveTasks();
        }
        
        function filterTasks(filterType) {
            const tasks = taskList.querySelectorAll('.task-item');
            
            tasks.forEach(task => {
                switch (filterType) {
                    case 'active':
                        task.style.display = task.classList.contains('completed') ? 'none' : '';
                        break;
                    case 'completed':
                        task.style.display = task.classList.contains('completed') ? '' : 'none';
                        break;
                    default: // 'all'
                        task.style.display = '';
                }
            });
        }
        
        // Save tasks to local storage
        function saveTasks() {
            const tasks = [];
            taskList.querySelectorAll('.task-item').forEach(taskItem => {
                const checkbox = taskItem.querySelector('input[type="checkbox"]');
                const label = taskItem.querySelector('label');
                
                tasks.push({
                    id: checkbox.id,
                    text: label.textContent,
                    completed: checkbox.checked
                });
            });
            
            localStorage.setItem('notebook_tasks', JSON.stringify(tasks));
        }
        
        // Load tasks from local storage
        function loadTasks() {
            const tasksJson = localStorage.getItem('notebook_tasks');
            if (!tasksJson) return;
            
            try {
                const tasks = JSON.parse(tasksJson);
                
                // Clear existing tasks
                taskList.innerHTML = '';
                
                // Add tasks from storage
                tasks.forEach(task => {
                    const taskItem = document.createElement('li');
                    taskItem.className = 'task-item';
                    if (task.completed) {
                        taskItem.classList.add('completed');
                    }
                    
                    taskItem.innerHTML = `
                        <input type="checkbox" id="${task.id}" ${task.completed ? 'checked' : ''}>
                        <label for="${task.id}">${task.text}</label>
                        <button class="delete-task"><i class="fas fa-trash-alt"></i></button>
                    `;
                    
                    taskList.appendChild(taskItem);
                });
            } catch (error) {
                console.error('Error loading tasks:', error);
            }
        }
        
        // Load tasks on init
        loadTasks();
    }
    
    // Initialize notes functionality
    initNotesFunctionality();
    
    function initNotesFunctionality() {
        const addNoteBtn = document.getElementById('add-note-btn');
        const notesList = document.querySelector('.notes-list');
        
        if (!addNoteBtn || !notesList) return;
        
        // Add new note
        addNoteBtn.addEventListener('click', openNoteEditor);
        
        // Note actions (edit/delete)
        notesList.addEventListener('click', function(e) {
            // Edit button clicked
            if (e.target.closest('.fa-edit')) {
                const noteItem = e.target.closest('.note-item');
                const title = noteItem.querySelector('h3').textContent;
                const content = noteItem.querySelector('p').textContent;
                openNoteEditor(title, content, noteItem);
            }
            
            // Delete button clicked
            if (e.target.closest('.fa-trash')) {
                const noteItem = e.target.closest('.note-item');
                if (confirm('Delete this note?')) {
                    noteItem.remove();
                    saveNotes();
                }
            }
        });
        
        function openNoteEditor(existingTitle = '', existingContent = '', existingNote = null) {
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'note-modal';
            
            let title = existingTitle;
            let content = existingContent;
            
            if (typeof existingTitle === 'object') { // If called from click event
                title = '';
                content = '';
                existingNote = null;
            }
            
            modal.innerHTML = `
                <div class="note-editor">
                    <h3>Edit Note</h3>
                    <input type="text" class="note-title-input" placeholder="Note title" value="${title}">
                    <textarea class="note-content-input" placeholder="Note content">${content}</textarea>
                    <div class="note-actions">
                        <button class="cancel-note">Cancel</button>
                        <button class="save-note">Save</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Focus on title input
            setTimeout(() => {
                modal.querySelector('.note-title-input').focus();
            }, 100);
            
            // Add event listeners
            modal.querySelector('.cancel-note').addEventListener('click', () => {
                modal.remove();
            });
            
            modal.querySelector('.save-note').addEventListener('click', () => {
                const titleInput = modal.querySelector('.note-title-input');
                const contentInput = modal.querySelector('.note-content-input');
                
                if (!titleInput.value.trim()) {
                    alert('Please enter a title for your note.');
                    return;
                }
                
                saveNoteFromEditor(titleInput.value, contentInput.value, existingNote);
                modal.remove();
            });
            
            // Close when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
            // Add modal styles dynamically if not already present
            if (!document.getElementById('modal-styles')) {
                const style = document.createElement('style');
                style.id = 'modal-styles';
                style.textContent = `
                    .note-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                    }
                    
                    .note-editor {
                        background-color: white;
                        border-radius: 8px;
                        padding: 20px;
                        width: 80%;
                        max-width: 600px;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    }
                    
                    .note-editor h3 {
                        margin-bottom: 15px;
                        color: var(--ink-color);
                    }
                    
                    .note-title-input {
                        width: 100%;
                        padding: 10px;
                        border: 1px solid var(--line-color);
                        border-radius: 4px;
                        margin-bottom: 15px;
                        font-size: 1rem;
                    }
                    
                    .note-content-input {
                        width: 100%;
                        height: 200px;
                        padding: 10px;
                        border: 1px solid var(--line-color);
                        border-radius: 4px;
                        margin-bottom: 15px;
                        font-size: 1rem;
                        resize: vertical;
                    }
                    
                    .note-actions {
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                    }
                    
                    .note-actions button {
                        padding: 8px 15px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 1rem;
                    }
                    
                    .cancel-note {
                        background-color: #f1f1f1;
                        border: 1px solid #ddd;
                    }
                    
                    .save-note {
                        background-color: var(--accent-color);
                        border: none;
                        color: white;
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        function saveNoteFromEditor(title, content, existingNote) {
            const today = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            if (existingNote) {
                // Update existing note
                existingNote.querySelector('h3').textContent = title;
                existingNote.querySelector('p').textContent = content;
            } else {
                // Create new note element
                const addNote = notesList.querySelector('.add-note');
                
                const noteItem = document.createElement('div');
                noteItem.className = 'note-item';
                noteItem.innerHTML = `
                    <h3>${title}</h3>
                    <p>${content}</p>
                    <div class="note-meta">
                        <span>${today}</span>
                        <div class="note-actions">
                            <button><i class="fas fa-edit"></i></button>
                            <button><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
                
                // Insert before the "Add Note" button
                notesList.insertBefore(noteItem, addNote);
            }
            
            // Save all notes
            saveNotes();
        }
        
        // Save notes to local storage
        function saveNotes() {
            const notes = [];
            notesList.querySelectorAll('.note-item').forEach(noteItem => {
                // Skip the "add note" item
                if (noteItem.classList.contains('add-note')) return;
                
                const title = noteItem.querySelector('h3').textContent;
                const content = noteItem.querySelector('p').textContent;
                const date = noteItem.querySelector('.note-meta span').textContent;
                
                notes.push({
                    title,
                    content,
                    date
                });
            });
            
            localStorage.setItem('notebook_notes', JSON.stringify(notes));
        }
        
        // Load notes from local storage
        function loadNotes() {
            const notesJson = localStorage.getItem('notebook_notes');
            if (!notesJson) return;
            
            try {
                const notes = JSON.parse(notesJson);
                const addNote = notesList.querySelector('.add-note');
                
                // Clear existing notes (except add-note button)
                notesList.querySelectorAll('.note-item:not(.add-note)').forEach(item => {
                    item.remove();
                });
                
                // Add notes from storage
                notes.forEach(note => {
                    const noteItem = document.createElement('div');
                    noteItem.className = 'note-item';
                    noteItem.innerHTML = `
                        <h3>${note.title}</h3>
                        <p>${note.content}</p>
                        <div class="note-meta">
                            <span>${note.date}</span>
                            <div class="note-actions">
                                <button><i class="fas fa-edit"></i></button>
                                <button><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `;
                    
                    // Insert before the "Add Note" button
                    notesList.insertBefore(noteItem, addNote);
                });
            } catch (error) {
                console.error('Error loading notes:', error);
            }
        }
        
        // Load notes on init
        loadNotes();
    }
    
    // Initialize goals functionality
    initGoalsFunctionality();
    
    function initGoalsFunctionality() {
        const addGoalBtn = document.getElementById('add-goal-btn');
        const goalsContainer = document.querySelector('.goals-container');
        
        if (!addGoalBtn || !goalsContainer) return;
        
        // Add new goal
        addGoalBtn.addEventListener('click', openGoalEditor);
        
        // Goal actions (edit/delete)
        goalsContainer.addEventListener('click', function(e) {
            // If clicked on the progress bar, update progress
            if (e.target.classList.contains('progress-bar') || e.target.classList.contains('progress-fill')) {
                const goalItem = e.target.closest('.goal-item');
                const rect = e.target.getBoundingClientRect();
                const clickPosition = e.clientX - rect.left;
                const percentage = Math.round((clickPosition / rect.width) * 100);
                
                updateGoalProgress(goalItem, percentage);
            }
        });
        
        function openGoalEditor() {
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'goal-modal';
            
            modal.innerHTML = `
                <div class="goal-editor">
                    <h3>Add New Goal</h3>
                    <input type="text" class="goal-title-input" placeholder="Goal title">
                    <textarea class="goal-description-input" placeholder="Goal description"></textarea>
                    <div class="goal-due-date">
                        <label>Due Date:</label>
                        <input type="date" class="goal-date-input">
                    </div>
                    <div class="goal-actions">
                        <button class="cancel-goal">Cancel</button>
                        <button class="save-goal">Save</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Set default date (2 weeks from now)
            const twoWeeksLater = new Date();
            twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
            modal.querySelector('.goal-date-input').value = twoWeeksLater.toISOString().split('T')[0];
            
            // Focus on title input
            setTimeout(() => {
                modal.querySelector('.goal-title-input').focus();
            }, 100);
            
            // Add event listeners
            modal.querySelector('.cancel-goal').addEventListener('click', () => {
                modal.remove();
            });
            
            modal.querySelector('.save-goal').addEventListener('click', () => {
                const titleInput = modal.querySelector('.goal-title-input');
                const descInput = modal.querySelector('.goal-description-input');
                const dateInput = modal.querySelector('.goal-date-input');
                
                if (!titleInput.value.trim()) {
                    alert('Please enter a title for your goal.');
                    return;
                }
                
                saveGoalFromEditor(titleInput.value, descInput.value, dateInput.value);
                modal.remove();
            });
            
            // Close when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
            // Add modal styles if not present (reuse note modal styles)
            if (!document.getElementById('modal-styles')) {
                const style = document.createElement('style');
                style.id = 'modal-styles';
                style.textContent = `
                    .goal-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                    }
                    
                    .goal-editor {
                        background-color: white;
                        border-radius: 8px;
                        padding: 20px;
                        width: 80%;
                        max-width: 600px;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    }
                    
                    .goal-editor h3 {
                        margin-bottom: 15px;
                        color: var(--ink-color);
                    }
                    
                    .goal-title-input {
                        width: 100%;
                        padding: 10px;
                        border: 1px solid var(--line-color);
                        border-radius: 4px;
                        margin-bottom: 15px;
                        font-size: 1rem;
                    }
                    
                    .goal-description-input {
                        width: 100%;
                        height: 100px;
                        padding: 10px;
                        border: 1px solid var(--line-color);
                        border-radius: 4px;
                        margin-bottom: 15px;
                        font-size: 1rem;
                        resize: vertical;
                    }
                    
                    .goal-due-date {
                        margin-bottom: 15px;
                    }
                    
                    .goal-date-input {
                        padding: 8px;
                        border: 1px solid var(--line-color);
                        border-radius: 4px;
                    }
                    
                    .goal-actions {
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                    }
                    
                    .goal-actions button {
                        padding: 8px 15px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 1rem;
                    }
                    
                    .cancel-goal {
                        background-color: #f1f1f1;
                        border: 1px solid #ddd;
                    }
                    
                    .save-goal {
                        background-color: var(--accent-color);
                        border: none;
                        color: white;
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        function saveGoalFromEditor(title, description, dueDate) {
            // Format the date
            const dueDisplay = new Date(dueDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Create goal element
            const addGoal = goalsContainer.querySelector('.add-goal');
            
            const goalItem = document.createElement('div');
            goalItem.className = 'goal-item';
            goalItem.innerHTML = `
                <div class="goal-header">
                    <h3>${title}</h3>
                    <span class="goal-progress">0%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="goal-details">
                    <p>${description || 'No description provided.'}</p>
                    <span class="goal-date">Due: ${dueDisplay}</span>
                </div>
            `;
            
            // Insert before the "Add Goal" button
            goalsContainer.insertBefore(goalItem, addGoal);
            
            // Save all goals
            saveGoals();
        }
        
        function updateGoalProgress(goalItem, percentage) {
            // Clamp value between 0-100
            percentage = Math.max(0, Math.min(100, percentage));
            
            // Update visual elements
            goalItem.querySelector('.goal-progress').textContent = `${percentage}%`;
            goalItem.querySelector('.progress-fill').style.width = `${percentage}%`;
            
            // Change color based on progress
            const progressFill = goalItem.querySelector('.progress-fill');
            
            if (percentage < 30) {
                progressFill.style.backgroundColor = '#e74c3c'; // Red
            } else if (percentage < 70) {
                progressFill.style.backgroundColor = '#f39c12'; // Orange
            } else {
                progressFill.style.backgroundColor = '#27ae60'; // Green
            }
            
            // Save goals
            saveGoals();
        }
        
        // Save goals to local storage
        function saveGoals() {
            const goals = [];
            goalsContainer.querySelectorAll('.goal-item').forEach(goalItem => {
                // Skip the "add goal" item
                if (goalItem.classList.contains('add-goal')) return;
                
                const title = goalItem.querySelector('h3').textContent;
                const progress = parseInt(goalItem.querySelector('.goal-progress').textContent);
                const description = goalItem.querySelector('.goal-details p').textContent;
                const dueDate = goalItem.querySelector('.goal-date').textContent.replace('Due: ', '');
                
                goals.push({
                    title,
                    progress,
                    description,
                    dueDate,
                    color: goalItem.querySelector('.progress-fill').style.backgroundColor
                });
            });
            
            localStorage.setItem('notebook_goals', JSON.stringify(goals));
        }
        
        // Load goals from local storage
        function loadGoals() {
            const goalsJson = localStorage.getItem('notebook_goals');
            if (!goalsJson) return;
            
            try {
                const goals = JSON.parse(goalsJson);
                const addGoal = goalsContainer.querySelector('.add-goal');
                
                // Clear existing goals (except add-goal button)
                goalsContainer.querySelectorAll('.goal-item:not(.add-goal)').forEach(item => {
                    item.remove();
                });
                
                // Add goals from storage
                goals.forEach(goal => {
                    const goalItem = document.createElement('div');
                    goalItem.className = 'goal-item';
                    goalItem.innerHTML = `
                        <div class="goal-header">
                            <h3>${goal.title}</h3>
                            <span class="goal-progress">${goal.progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${goal.progress}%; background-color: ${goal.color || 'var(--accent-color)'}"></div>
                        </div>
                        <div class="goal-details">
                            <p>${goal.description}</p>
                            <span class="goal-date">Due: ${goal.dueDate}</span>
                        </div>
                    `;
                    
                    // Insert before the "Add Goal" button
                    goalsContainer.insertBefore(goalItem, addGoal);
                });
            } catch (error) {
                console.error('Error loading goals:', error);
            }
        }
        
        // Load goals on init
        loadGoals();
    }
});