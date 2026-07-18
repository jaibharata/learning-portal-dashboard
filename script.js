// Global error overlay for easy debugging
window.addEventListener('error', (e) => {
  const overlay = document.getElementById('debug-error-overlay') || document.createElement('div');
  overlay.id = 'debug-error-overlay';
  overlay.style.position = 'fixed';
  overlay.style.bottom = '10px';
  overlay.style.right = '10px';
  overlay.style.background = 'rgba(220, 38, 38, 0.95)';
  overlay.style.color = '#fff';
  overlay.style.padding = '12px 18px';
  overlay.style.borderRadius = '8px';
  overlay.style.zIndex = '99999';
  overlay.style.maxWidth = '350px';
  overlay.style.fontSize = '0.8rem';
  overlay.style.fontFamily = 'monospace';
  overlay.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  overlay.style.whiteSpace = 'pre-wrap';
  overlay.innerHTML = `<strong>Runtime Error:</strong><br>${e.message}<br><small style="opacity:0.8;">at ${e.filename}:${e.lineno}</small>`;
  document.body.appendChild(overlay);
});

window.addEventListener('unhandledrejection', (e) => {
  const overlay = document.getElementById('debug-error-overlay') || document.createElement('div');
  overlay.id = 'debug-error-overlay';
  overlay.style.position = 'fixed';
  overlay.style.bottom = '10px';
  overlay.style.right = '10px';
  overlay.style.background = 'rgba(220, 38, 38, 0.95)';
  overlay.style.color = '#fff';
  overlay.style.padding = '12px 18px';
  overlay.style.borderRadius = '8px';
  overlay.style.zIndex = '99999';
  overlay.style.maxWidth = '350px';
  overlay.style.fontSize = '0.8rem';
  overlay.style.fontFamily = 'monospace';
  overlay.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  overlay.style.whiteSpace = 'pre-wrap';
  overlay.innerHTML = `<strong>Promise Rejection:</strong><br>${e.reason}`;
  document.body.appendChild(overlay);
});

// State variables
let state = {
  theme: 'system',
  todos: [],
  journals: [],
  resources: [],
  activeJournalId: null,
  
  // Dynamic Roadmap
  roadmap: [],
  
  // Sprint Board
  sprints: [],
  activeSprint: 'Sprint 1',
  sprintTasks: [],
  editingTaskId: null,
  
  // Simulator State
  simulator: {
    type: 'token-bucket',
    capacity: 10,
    rate: 2, // per second
    tokens: 10,
    waterLevel: 0, // for leaky bucket
    slidingWindowRequests: [], // timestamp array
    logs: [],
    autoSendInterval: null,
    isAutoSending: false
  }
};

// Seed Data
const DEFAULT_ROADMAP = [
  {
    id: "cat-ai",
    title: "AI Engineering",
    sagaId: "SAGA-AI-101",
    sagaTargetHours: 50,
    topics: [
      { id: "top-llm", text: "LLM Foundations", epicId: "EPIC-AI-LLM", completed: false, notes: "", links: "", hoursLogged: 0, percentComplete: 0 },
      { id: "top-prompt", text: "Prompt Engineering", epicId: "EPIC-AI-PRM", completed: false, notes: "", links: "", hoursLogged: 0, percentComplete: 0 },
      { id: "top-langgraph", text: "LangGraph Workflows", epicId: "EPIC-AI-LGP", completed: false, notes: "", links: "", hoursLogged: 0, percentComplete: 0 },
      { id: "top-crewai", text: "CrewAI Multi-Agents", epicId: "EPIC-AI-CRW", completed: false, notes: "", links: "", hoursLogged: 0, percentComplete: 0 }
    ]
  },
  {
    id: "cat-sd",
    title: "System Design",
    sagaId: "SAGA-SD-102",
    sagaTargetHours: 40,
    topics: [
      { id: "top-ratelimit", text: "Rate Limiter Simulator", epicId: "EPIC-SD-RTL", completed: false, notes: "", links: "", hoursLogged: 0, percentComplete: 0 },
      { id: "top-redis", text: "Redis Caching", epicId: "EPIC-SD-RDS", completed: false, notes: "", links: "", hoursLogged: 0, percentComplete: 0 },
      { id: "top-kafka", text: "Kafka Streaming", epicId: "EPIC-SD-KFK", completed: false, notes: "", links: "", hoursLogged: 0, percentComplete: 0 }
    ]
  }
];

const DEFAULT_SPRINTS = ["Sprint 1", "Sprint 2", "Backlog"];

const DEFAULT_SPRINT_TASKS = [
  { id: "st-1", title: "Build Rate Limiter Simulator", desc: "Design Token/Leaky bucket visualizer widget.", category: "System Design", epicId: "top-ratelimit", priority: "high", estimate: 3, status: "in-progress", sprint: "Sprint 1" },
  { id: "st-2", title: "Study Prompt Engineering", desc: "Understand xml tag boundaries and few-shot prompts.", category: "AI Engineering", epicId: "top-prompt", priority: "medium", estimate: 1, status: "todo", sprint: "Sprint 1" },
  { id: "st-3", title: "Integrate LLM API", desc: "Setup streaming response connections using Gemini SDK.", category: "AI Engineering", epicId: "top-llm", priority: "high", estimate: 5, status: "todo", sprint: "Sprint 2" },
  { id: "st-4", title: "Kafka Cluster Configuration", desc: "Learn partition balancing and streaming metrics.", category: "System Design", epicId: "top-kafka", priority: "low", estimate: 2, status: "todo", sprint: "Backlog" }
];

const DEFAULT_RESOURCES = [
  { id: 1, title: 'Designing Data-Intensive Applications', desc: 'The definitive guide to system design, scalability, and data modeling by Martin Kleppmann.', cat: 'system-design', author: 'Martin Kleppmann', type: 'book', url: '#' },
  { id: 2, title: 'System Design Primer', desc: 'Learn how to design large-scale systems. Prep for the system design interview.', cat: 'system-design', author: 'Donne Martin', type: 'article', url: 'https://github.com/donnemartin/system-design-primer' },
  { id: 3, title: 'LangGraph Course: AI Agents', desc: 'Build stateful, multi-agent workflows with LangGraph and LangChain.', cat: 'ai', author: 'LangChain', type: 'course', url: '#' },
  { id: 4, title: 'Prompt Engineering Guide', desc: 'Guides, papers, lectures, and tools for prompt engineering and LLM customization.', cat: 'ai', author: 'DAIR.AI', type: 'article', url: 'https://www.promptingguide.ai/' },
  { id: 5, title: 'Effective Java (3rd Edition)', desc: 'Best practices for writing clean, efficient, and maintainable Java code.', cat: 'backend', author: 'Joshua Bloch', type: 'book', url: '#' },
  { id: 6, title: 'Redis In Action', desc: 'An introduction to Redis and using it to build fast backend architectures.', cat: 'backend', author: 'Josiah L. Carlson', type: 'book', url: '#' }
];

const DEFAULT_JOURNALS = [
  {
    id: 'j-1',
    date: '2026-07-15',
    title: 'Diving into LangGraph and Agentic Frameworks',
    body: `Today I spent time researching agentic workflows. Instead of standard linear chains, LangGraph allows modeling loops and complex graphs of decision-making agents.

Key learnings:
1. State management is critical. Every node in the graph can read and modify the shared state.
2. Human-in-the-loop triggers can interrupt execution, allowing manual input before advancing the graph.
3. Created a basic two-agent graph: one writes drafts, another critques and approves.

Next step: build a tool-calling assistant that queries a weather API.`,
    tags: ['focused', 'productive']
  },
  {
    id: 'j-2',
    date: '2026-07-14',
    title: 'Visualizing Rate Limiting Algorithms',
    body: `Reviewed standard rate limiter strategies for high-scale microservices:

1. **Token Bucket**: Accumulates tokens at a constant rate. Request consumes token. Handles bursts well.
2. **Leaky Bucket**: Requests enter bucket as water, drip out at constant rate. Smooths outbound traffic, but introduces latency.
3. **Sliding Window Log**: Stores exact request timestamps. Accurate but high memory overhead.
4. **Sliding Window Counter**: Estimates rate based on current and previous window counts. Highly efficient.

I'm building an interactive JS simulator next to visually model these!`,
    tags: ['productive']
  }
];

const DEFAULT_TODOS = [
  { id: 't-1', text: 'Build Rate Limiter simulation visualizer', completed: true },
  { id: 't-2', text: 'Draft daily study journal entry', completed: false },
  { id: 't-3', text: 'Read Chapter 4 of Designing Data-Intensive Applications', completed: false },
  { id: 't-4', text: 'Test AI prompt playground prototype', completed: false }
];

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  loadLocalStorage();
  setupRouting();
  setupTheme();
  setupCheckboxes();
  setupTodos();
  setupJournals();
  setupResources();
  setupSimulator();
  populateSandboxEpicDropdown();
  setupPlayground();
  setupSearch();
  setupGlobalEvents();
  setupTopicNotesModal();
  setupCalendarModal();
  
  // Setup Dynamic Categories & Sprints Events
  setupDynamicRoadmapEvents();
  setupKanbanEvents();
  
  // Render initial views
  updateProgressMetrics();
  renderRoadmap();
  renderSprintBoard();
  renderAiEngineeringTrack();
  renderSidebarTracks();
  renderActivityMap();
});

// 1. LocalStorage Management
function loadLocalStorage() {
  state.theme = localStorage.getItem('color-scheme') || 'system';
  
  // Initialize dynamic Current Focus state
  const focusVal = localStorage.getItem('portal_current_focus_cat');
  state.currentFocusCatId = focusVal || 'cat-ai';
  
  const savedTodos = localStorage.getItem('portal_todos');
  state.todos = savedTodos ? JSON.parse(savedTodos) : DEFAULT_TODOS;
  
  const savedJournals = localStorage.getItem('portal_journals');
  state.journals = savedJournals ? JSON.parse(savedJournals) : DEFAULT_JOURNALS;
  if (state.journals.length > 0) {
    state.activeJournalId = state.journals[0].id;
  }
  
  const savedResources = localStorage.getItem('portal_resources');
  state.resources = savedResources ? JSON.parse(savedResources) : DEFAULT_RESOURCES;
  
  // Dynamic Roadmap Categories
  const savedRoadmap = localStorage.getItem('portal_dynamic_roadmap');
  state.roadmap = savedRoadmap ? JSON.parse(savedRoadmap) : DEFAULT_ROADMAP;
  
  // Seed Saga & Epic parameters for all categories (including custom ones)
  let migratedRoadmap = false;
  state.roadmap.forEach(cat => {
    // Migrate old epicId to sagaId at category level
    if (cat.epicId && !cat.sagaId) {
      cat.sagaId = cat.epicId.replace('EPIC-', 'SAGA-');
      delete cat.epicId;
      migratedRoadmap = true;
    }
    if (cat.epicTargetHours && typeof cat.sagaTargetHours !== 'number') {
      cat.sagaTargetHours = cat.epicTargetHours;
      delete cat.epicTargetHours;
      migratedRoadmap = true;
    }

    if (!cat.sagaId) {
      cat.sagaId = 'SAGA-' + cat.id.replace('cat-', '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
      migratedRoadmap = true;
    }
    if (typeof cat.sagaTargetHours !== 'number') {
      cat.sagaTargetHours = 40;
      migratedRoadmap = true;
    }

    // Seed Epic ID for each topic/module
    if (cat.topics) {
      cat.topics.forEach(topic => {
        if (!topic.epicId) {
          const cleanText = topic.text.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
          topic.epicId = 'EPIC-' + (topic.id.replace('top-', '').toUpperCase() || cleanText);
          migratedRoadmap = true;
        }
      });
    }
  });

  if (migratedRoadmap) {
    saveToStorage('portal_dynamic_roadmap', state.roadmap);
  }

  // Sprints & Task Board
  const savedSprints = localStorage.getItem('portal_sprints');
  state.sprints = savedSprints ? JSON.parse(savedSprints) : DEFAULT_SPRINTS;
  state.activeSprint = state.sprints[0] || 'Sprint 1';
  
  const savedSprintTasks = localStorage.getItem('portal_sprint_tasks');
  state.sprintTasks = savedSprintTasks ? JSON.parse(savedSprintTasks) : DEFAULT_SPRINT_TASKS;

  // Migrate Sprint Tasks without epicId
  let migratedTasks = false;
  state.sprintTasks.forEach(task => {
    if (!task.epicId && task.category) {
      const matchCat = state.roadmap.find(c => c.title.toLowerCase() === task.category.toLowerCase());
      if (matchCat && matchCat.topics && matchCat.topics.length > 0) {
        task.epicId = matchCat.topics[0].id; // link to first topic/module ID
        migratedTasks = true;
      }
    }
  });

  if (migratedTasks) {
    saveToStorage('portal_sprint_tasks', state.sprintTasks);
  }

  // Custom Concepts visualizer
  const savedConcepts = localStorage.getItem('portal_custom_concepts');
  const savedEpic = localStorage.getItem('portal_attached_epic');
  state.visualizer = {
    activeConcept: 'rate-limiter',
    attachedEpicId: savedEpic || '',
    customConcepts: savedConcepts ? JSON.parse(savedConcepts) : ["Message Queue"],
    lb: {
      algo: 'round-robin',
      servers: [
        { id: 'A', name: 'Server A', weight: 1, active: true, connections: 0 },
        { id: 'B', name: 'Server B', weight: 2, active: true, connections: 0 },
        { id: 'C', name: 'Server C', weight: 1, active: true, connections: 0 }
      ],
      nextServerIndex: 0,
      autoSendInterval: null,
      isAutoSending: false
    },
    cache: {
      slots: [],
      data: {
        'Key_A': 'Asset Data Value A',
        'Key_B': 'Asset Data Value B',
        'Key_C': 'Asset Data Value C',
        'Key_D': 'Asset Data Value D',
        'Key_E': 'Asset Data Value E',
        'Key_F': 'Asset Data Value F'
      },
      hits: 0,
      misses: 0,
      logs: []
    },
    db: {
      masterVal: 100,
      replicas: [
        { id: 'A', val: 100 },
        { id: 'B', val: 100 }
      ],
      replicationLagMs: 800,
      isSyncing: false
    },
    customSim: {
      queue: [],
      logs: []
    }
  };
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Populate the Focus Category dropdown in the dashboard header
function populateFocusDropdown() {
  const select = document.getElementById('focus-category-select');
  if (!select) return;
  
  const optionsHtml = state.roadmap.map(c => 
    `<option value="${c.id}" ${c.id === state.currentFocusCatId ? 'selected' : ''}>${c.title}</option>`
  ).join('');
  
  if (select.innerHTML !== optionsHtml) {
    select.innerHTML = optionsHtml;
  }
}

// Populate the Sandbox Epic Attachment selector
function populateSandboxEpicDropdown() {
  const selector = document.getElementById('sandbox-epic-selector');
  if (!selector) return;
  
  let optionsHtml = '<option value="">-- Connect to Epic Checkpoint (Optional) --</option>';
  state.roadmap.forEach(cat => {
    if (cat.topics) {
      cat.topics.forEach(top => {
        optionsHtml += `<option value="${top.id}" ${state.visualizer.attachedEpicId === top.id ? 'selected' : ''}>${cat.title} ➔ ${top.text} [${top.epicId || ''}]</option>`;
      });
    }
  });
  
  if (selector.innerHTML !== optionsHtml) {
    selector.innerHTML = optionsHtml;
  }
}

// Calculate rolled up estimates and logged hours for a specific Epic (Topic)
function getEpicEffortMetrics(catId, topicId) {
  const category = state.roadmap.find(c => c.id === catId);
  const topic = category ? (category.topics ? category.topics.find(t => t.id === topicId) : null) : null;
  if (!topic) return { estimateSp: 0, loggedHours: 0 };

  const epicId = topic.epicId || '';
  const epicTopicId = topic.id || '';

  // Sum task-level estimates and logged hours mapped to this Epic
  let taskEstimate = 0;
  let taskLogged = 0;

  if (Array.isArray(state.sprintTasks)) {
    state.sprintTasks.forEach(task => {
      const isMapped = task.epicId && (task.epicId === epicTopicId || (epicId && task.epicId === epicId));
      if (isMapped) {
        taskEstimate += parseFloat(task.estimate) || 0;
        taskLogged += parseFloat(task.hoursLogged) || 0;
      }
    });
  }

  // Epic total logged hours = task logged hours + direct topic study hours logged
  const totalLogged = taskLogged + (parseFloat(topic.hours) || 0);

  return {
    estimateSp: taskEstimate,
    loggedHours: totalLogged
  };
}

// Calculate rolled up estimates and logged hours for an entire Category (Saga)
function getSagaEffortMetrics(catId) {
  const category = state.roadmap.find(c => c.id === catId);
  if (!category) return { estimateSp: 0, loggedHours: 0 };

  let totalEstimate = 0;
  let totalLogged = 0;

  if (category.topics) {
    category.topics.forEach(topic => {
      const epicMetrics = getEpicEffortMetrics(catId, topic.id);
      totalEstimate += epicMetrics.estimateSp;
      totalLogged += epicMetrics.loggedHours;
    });
  }

  return {
    estimateSp: totalEstimate,
    loggedHours: totalLogged
  };
}

// Quick log study hours for an Epic (Topic)
window.logTopicHours = function(catId, topicId) {
  const hoursInput = document.getElementById(`log-hours-input-${topicId}`);
  let hoursVal = parseFloat(hoursInput ? hoursInput.value : 0);
  
  // Check dashboard input if main is empty
  if (isNaN(hoursVal) || hoursVal <= 0) {
    const dashHoursInput = document.getElementById(`log-hours-input-dash-${topicId}`);
    hoursVal = parseFloat(dashHoursInput ? dashHoursInput.value : 0);
  }

  if (isNaN(hoursVal) || hoursVal <= 0) {
    alert("Please enter a valid study duration in hours (e.g. 1.5).");
    return;
  }

  const category = state.roadmap.find(c => c.id === catId);
  const topic = category ? (category.topics ? category.topics.find(t => t.id === topicId) : null) : null;
  
  if (category && topic) {
    // 1. Log directly to topic hours
    topic.hours = (parseFloat(topic.hours) || 0) + hoursVal;
    saveToStorage('portal_dynamic_roadmap', state.roadmap);

    // 2. Automatically generate a study journal entry for today
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    
    const newJournal = {
      id: 'j-' + Date.now(),
      date: dateStr,
      title: `Logged study hours for: ${topic.text}`,
      body: `Logged ${hoursVal} hours of study under ${category.title} Saga (Epic: ${topic.text} [${topic.epicId || ''}]).`,
      tags: ['productive', 'focused'],
      hours: hoursVal
    };
    
    state.journals.unshift(newJournal);
    state.activeJournalId = newJournal.id;
    saveToStorage('portal_journals', state.journals);

    // 3. Clear inputs
    if (hoursInput) hoursInput.value = '';
    const dashHoursInput = document.getElementById(`log-hours-input-dash-${topicId}`);
    if (dashHoursInput) dashHoursInput.value = '';

    // 4. Update UI
    renderRoadmap();
    updateProgressMetrics();
    renderSidebarTracks();
    renderSprintBoard();
    renderActivityCharts();
    renderActivityMap();
    if (typeof renderJournalList === 'function') renderJournalList();
    if (typeof loadActiveJournal === 'function') loadActiveJournal();
    
    // If they are on details page, refresh details page
    if (window.location.hash === `#category-${catId}`) {
      showCategoryPage(catId);
    }
    
    alert(`Success: Logged ${hoursVal} hrs for "${topic.text}". Reflection entry created in study journal!`);
  }
};

// Render Dynamic Activity Map Calendar (Contribution Grid)
function renderActivityMap() {
  const container = document.getElementById('activity-map-grid');
  const summary = document.getElementById('activity-map-summary');
  if (!container) return;

  container.innerHTML = '';

  const year = 2026;
  const month = 6; // July is index 6 (0-indexed)
  const monthName = "July";
  
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  dayNames.forEach(d => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'streak-day-header';
    dayHeader.textContent = d;
    container.appendChild(dayHeader);
  });

  const firstDayIndex = 2; // Wednesday
  const totalDays = 31;

  for (let i = 0; i < firstDayIndex; i++) {
    const padCell = document.createElement('div');
    padCell.className = 'streak-cell';
    padCell.style.opacity = '0.15';
    padCell.style.pointerEvents = 'none';
    container.appendChild(padCell);
  }

  const hoursByDay = {};
  state.journals.forEach(j => {
    if (j.date) {
      hoursByDay[j.date] = (hoursByDay[j.date] || 0) + (parseFloat(j.hours) || 0);
    }
  });

  let activeDaysCount = 0;
  let currentStreak = 0;
  const todayDateNum = 16;

  for (let d = 1; d <= totalDays; d++) {
    const cell = document.createElement('div');
    cell.className = 'streak-cell';
    cell.textContent = d;

    const dateStr = `2026-07-${String(d).padStart(2, '0')}`;
    const hoursLogged = hoursByDay[dateStr] || 0;

    if (hoursLogged > 0) {
      activeDaysCount++;
      cell.classList.add('active');
      cell.setAttribute('title', `Study Logged: ${hoursLogged} hrs (${dateStr})`);
      
      if (hoursLogged <= 1.5) {
        cell.style.background = 'rgba(168, 85, 247, 0.4)';
      } else if (hoursLogged <= 3.5) {
        cell.style.background = 'rgba(168, 85, 247, 0.7)';
      } else {
        cell.style.background = 'var(--accent)';
      }
    } else {
      cell.setAttribute('title', `No study logged (${dateStr})`);
    }

    if (d === todayDateNum) {
      cell.style.border = '2px solid var(--accent)';
      cell.setAttribute('title', (cell.getAttribute('title') || '') + ' - Today');
    }

    if (d > todayDateNum) {
      cell.style.opacity = '0.35';
    }

    // Attach click listener for interactive logging
    cell.addEventListener('click', () => {
      openCalendarLogModal(dateStr);
    });

    container.appendChild(cell);
  }

  let streakCheck = todayDateNum;
  const todayStr = `2026-07-${String(todayDateNum).padStart(2, '0')}`;
  const yesterdayStr = `2026-07-${String(todayDateNum - 1).padStart(2, '0')}`;
  
  if (hoursByDay[todayStr] > 0) {
    while (streakCheck > 0) {
      const checkStr = `2026-07-${String(streakCheck).padStart(2, '0')}`;
      if (hoursByDay[checkStr] > 0) {
        currentStreak++;
        streakCheck--;
      } else {
        break;
      }
    }
  } else if (hoursByDay[yesterdayStr] > 0) {
    streakCheck = todayDateNum - 1;
    while (streakCheck > 0) {
      const checkStr = `2026-07-${String(streakCheck).padStart(2, '0')}`;
      if (hoursByDay[checkStr] > 0) {
        currentStreak++;
        streakCheck--;
      } else {
        break;
      }
    }
  }

  if (summary) {
    summary.innerHTML = `
      <span>🔥 ${activeDaysCount} days active in ${monthName}</span>
      <span>Current Streak: <strong>${currentStreak} days</strong></span>
    `;
  }
}
window.renderActivityMap = renderActivityMap;

// Open the date-specific calendar study logger modal
function openCalendarLogModal(dateStr) {
  const modal = document.getElementById('calendar-modal');
  const dateLabel = document.getElementById('calendar-modal-date-label');
  const existingLogsContainer = document.getElementById('calendar-existing-logs-container');
  const existingLogsDiv = document.getElementById('calendar-existing-logs');
  
  if (!modal || !dateLabel) return;
  
  state.selectedCalendarDate = dateStr;
  
  // Format date label (e.g., July 15, 2026)
  const dateParts = dateStr.split('-');
  const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateLabel.textContent = dateObj.toLocaleDateString('en-US', options);

  // 1. Fetch existing entries for this date
  const matchedJournals = state.journals.filter(j => j.date === dateStr);
  if (matchedJournals.length > 0) {
    existingLogsContainer.style.display = 'block';
    existingLogsDiv.innerHTML = matchedJournals.map(j => `
      <div style="padding:6px 10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:4px; font-size:0.78rem; display:flex; flex-direction:column; gap:2px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:700; color:var(--text-primary);">${j.title}</span>
          <span class="badge badge-purple" style="font-size:0.6rem; padding:1px 4px;">⏱️ ${j.hours || 0} hrs</span>
        </div>
        ${j.body ? `<div style="color:var(--text-secondary); font-size:0.72rem; font-style:italic;">${j.body}</div>` : ''}
      </div>
    `).join('');
  } else {
    existingLogsContainer.style.display = 'none';
    existingLogsDiv.innerHTML = '';
  }

  // 2. Populate Categories and wire topics dropdown
  const catSelect = document.getElementById('calendar-log-cat');
  const topicSelect = document.getElementById('calendar-log-topic');
  
  if (catSelect && topicSelect) {
    catSelect.innerHTML = state.roadmap.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
    
    const syncTopics = (catId) => {
      const category = state.roadmap.find(c => c.id === catId);
      if (category && category.topics && category.topics.length > 0) {
        topicSelect.innerHTML = category.topics.map(t => `<option value="${t.id}">${t.text}</option>`).join('');
        topicSelect.disabled = false;
      } else {
        topicSelect.innerHTML = '<option value="">-- No Epics Defined --</option>';
        topicSelect.disabled = true;
      }
    };
    
    catSelect.onchange = (e) => syncTopics(e.target.value);
    syncTopics(catSelect.value);
  }

  // 3. Reset form inputs
  document.getElementById('calendar-log-hours').value = '1.0';
  document.getElementById('calendar-log-note').value = '';
  document.getElementById('calendar-log-tags').value = 'focused';

  modal.classList.add('active');
}

// Set up event listeners for calendar modal actions
function setupCalendarModal() {
  const modal = document.getElementById('calendar-modal');
  const closeBtn = document.getElementById('calendar-modal-close');
  const cancelBtn = document.getElementById('calendar-modal-cancel');
  const saveBtn = document.getElementById('calendar-modal-save');
  
  if (!modal) return;
  
  const hide = () => modal.classList.remove('active');
  
  if (closeBtn) closeBtn.addEventListener('click', hide);
  if (cancelBtn) cancelBtn.addEventListener('click', hide);
  
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const catId = document.getElementById('calendar-log-cat').value;
      const topicId = document.getElementById('calendar-log-topic').value;
      const hoursVal = parseFloat(document.getElementById('calendar-log-hours').value);
      const noteVal = document.getElementById('calendar-log-note').value.trim();
      const tagVal = document.getElementById('calendar-log-tags').value;
      
      if (!catId || !topicId || isNaN(hoursVal) || hoursVal <= 0) {
        alert('Please fill out all fields with valid values.');
        return;
      }
      
      const category = state.roadmap.find(c => c.id === catId);
      const topic = category ? category.topics.find(t => t.id === topicId) : null;
      
      if (category && topic) {
        // 1. Log directly to topic study hours
        topic.hours = (parseFloat(topic.hours) || 0) + hoursVal;
        saveToStorage('portal_dynamic_roadmap', state.roadmap);
        
        // 2. Automatically generate study journal entry for the selected date
        const dateParts = state.selectedCalendarDate.split('-');
        const dateLabel = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;
        
        const newJournal = {
          id: 'j-' + Date.now(),
          date: dateLabel,
          title: `Study session for: ${topic.text}`,
          body: noteVal || `Completed study module on "${topic.text}" under ${category.title} Saga path.`,
          tags: [tagVal, 'productive'],
          hours: hoursVal
        };
        
        state.journals.unshift(newJournal);
        saveToStorage('portal_journals', state.journals);
        
        // 3. Clear inputs & hide
        hide();
        
        // 4. Update UI dashboards
        renderRoadmap();
        updateProgressMetrics();
        renderSidebarTracks();
        renderSprintBoard();
        renderActivityCharts();
        renderActivityMap();
        if (typeof renderJournalList === 'function') renderJournalList();
        if (typeof loadActiveJournal === 'function') loadActiveJournal();
        
        alert(`Success: Logged ${hoursVal} hours for "${topic.text}" on ${dateLabel}!`);
      }
    });
  }
}

// 2. Hash-based routing
function setupRouting() {
  const routes = ['#dashboard', '#rate-limiter', '#journal', '#resources', '#progress', '#sprint-board'];
  
  function handleRoute() {
    let hash = window.location.hash || '#dashboard';
    
    // Clear simulation intervals if moving away from system design sandbox
    if (hash !== '#rate-limiter' && typeof stopAllSandboxIntervals === 'function') {
      stopAllSandboxIntervals();
    }

    // Dynamic category routing
    if (hash.startsWith('#category-')) {
      const catId = hash.replace('#category-', '');
      showCategoryPage(catId);
      return;
    }
    
    // Static routing
    if (!routes.includes(hash)) {
      hash = '#dashboard';
      window.location.hash = hash;
    }
    
    document.querySelectorAll('.view-pane').forEach(pane => {
      pane.classList.remove('active');
    });
    
    const targetPaneId = `view-${hash.substring(1)}`;
    const targetPane = document.getElementById(targetPaneId);
    if (targetPane) {
      targetPane.classList.add('active');
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
      }
    });
    
    // Highlight category in sidebar if we match one of them
    const activeCatLink = document.getElementById('nav-category-' + hash.replace('#category-', ''));
    if (activeCatLink) {
      activeCatLink.classList.add('active');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (hash === '#progress') {
      renderActivityCharts();
      renderActivityMap();
    }
    if (hash === '#sprint-board') {
      renderSprintBoard();
    }
    if (hash === '#dashboard') {
      renderRoadmap();
      updateProgressMetrics();
      renderSidebarTracks();
    }
    if (hash === '#rate-limiter') {
      populateSandboxEpicDropdown();
      if (typeof renderVisualizerTabs === 'function') renderVisualizerTabs();
      if (typeof renderActiveVisualizer === 'function') renderActiveVisualizer();
    }
    
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('mobile-active');
  }
  
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

// 3. Theme toggle system
function setupTheme() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const toggleText = document.getElementById('theme-toggle-text');
  const toggleIcon = document.getElementById('theme-toggle-icon');
  
  function applyTheme(theme) {
    state.theme = theme;
    if (theme === 'system') {
      document.documentElement.style.setProperty('color-scheme', 'light dark');
      localStorage.removeItem('color-scheme');
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      updateThemeUI(isDark ? 'dark' : 'light', true);
    } else {
      document.documentElement.style.setProperty('color-scheme', theme);
      localStorage.setItem('color-scheme', theme);
      updateThemeUI(theme, false);
    }
  }
  
  function updateThemeUI(resolvedTheme, isSystem) {
    if (resolvedTheme === 'dark') {
      toggleText.textContent = isSystem ? 'System (Dark)' : 'Dark Mode';
      toggleIcon.innerHTML = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`;
    } else {
      toggleText.textContent = isSystem ? 'System (Light)' : 'Light Mode';
      toggleIcon.innerHTML = `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>`;
    }
  }
  
  toggleBtn.addEventListener('click', () => {
    if (state.theme === 'system') {
      applyTheme('dark');
    } else if (state.theme === 'dark') {
      applyTheme('light');
    } else {
      applyTheme('system');
    }
  });
  
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.theme === 'system') {
      applyTheme('system');
    }
  });
  
  applyTheme(state.theme);
}

// 4. Progress Checkboxes & Calculations
function setupCheckboxes() {
  document.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox' && e.target.hasAttribute('data-topic-id')) {
      const checkbox = e.target;
      const topicId = checkbox.getAttribute('data-topic-id');
      
      // Update state model
      let found = false;
      state.roadmap.forEach(cat => {
        cat.topics.forEach(top => {
          if (top.id === topicId) {
            top.completed = checkbox.checked;
            found = true;
          }
        });
      });
      
      if (found) {
        saveToStorage('portal_dynamic_roadmap', state.roadmap);
        
        // Find matching checkboxes in other views and sync them
        document.querySelectorAll(`input[type="checkbox"][data-topic-id="${topicId}"]`).forEach(cb => {
          cb.checked = checkbox.checked;
          const item = cb.closest('.checklist-item');
          if (item) {
            if (checkbox.checked) {
              item.classList.add('completed');
            } else {
              item.classList.remove('completed');
            }
          }
        });
        
        updateProgressMetrics();
        renderRoadmap();
        renderAiEngineeringTrack();
      }
    }
  });
}
function updateProgressMetrics() {
  // Calculations: checked roadmap topics + done tasks
  let totalRoadmap = 0;
  let checkedRoadmap = 0;
  
  state.roadmap.forEach(cat => {
    cat.topics.forEach(top => {
      totalRoadmap++;
      const pct = typeof top.percentComplete === 'number' ? top.percentComplete : (top.completed ? 100 : 0);
      checkedRoadmap += (pct / 100);
    });
  });

  const totalTasks = state.sprintTasks.length;
  const doneTasks = state.sprintTasks.filter(t => t.status === 'done').length;

  const combinedChecked = checkedRoadmap + doneTasks;
  const combinedTotal = totalRoadmap + totalTasks;
  
  const overallPercent = combinedTotal > 0 ? Math.round((combinedChecked / combinedTotal) * 100) : 0;
  
  // Specific track percentages
  // AI Engineering progress
  const aiCat = state.roadmap.find(c => c.id === 'cat-ai' || c.title.toLowerCase().includes('ai'));
  const aiTotal = aiCat ? aiCat.topics.length : 0;
  const aiChecked = aiCat ? aiCat.topics.reduce((sum, t) => sum + (typeof t.percentComplete === 'number' ? t.percentComplete : (t.completed ? 100 : 0)), 0) / 100 : 0;
  const aiPercent = aiTotal > 0 ? Math.round((aiChecked / aiTotal) * 100) : 0;

  // System Design progress
  const sdCat = state.roadmap.find(c => c.id === 'cat-sd' || c.title.toLowerCase().includes('system'));
  const sdTotal = sdCat ? sdCat.topics.length : 0;
  const sdChecked = sdCat ? sdCat.topics.reduce((sum, t) => sum + (typeof t.percentComplete === 'number' ? t.percentComplete : (t.completed ? 100 : 0)), 0) / 100 : 0;
  const sdPercent = sdTotal > 0 ? Math.round((sdChecked / sdTotal) * 100) : 0;
  // Update UI Elements
  const circleOffset = 251.2 - (251.2 * overallPercent) / 100;
  const progressCircle = document.querySelector('.progress-circle-val');
  if (progressCircle && progressCircle.id !== 'focus-progress-circle') {
    progressCircle.style.strokeDashoffset = circleOffset;
  }
  const textCircle = document.querySelector('.progress-circle-percentage');
  if (textCircle) {
    textCircle.textContent = `${overallPercent}%`;
  }
  
  // 1. Calculate focused Saga progress
  const focusCat = state.roadmap.find(c => c.id === state.currentFocusCatId) || state.roadmap[0];
  let focusPercent = 0;
  if (focusCat && focusCat.topics) {
    const focusTotal = focusCat.topics.length;
    const focusChecked = focusCat.topics.reduce((sum, t) => sum + (typeof t.percentComplete === 'number' ? t.percentComplete : (t.completed ? 100 : 0)), 0) / 100;
    focusPercent = focusTotal > 0 ? Math.round((focusChecked / focusTotal) * 100) : 0;
  }

  // 2. Render focused Saga progress circle and text labels
  const focusCircle = document.getElementById('focus-progress-circle');
  const focusLabel = document.getElementById('focus-progress-label');
  const focusTitle = document.getElementById('focus-title');
  const focusSubtitle = document.getElementById('focus-subtitle');

  if (focusCircle) {
    const focusOffset = 251.2 - (251.2 * focusPercent) / 100;
    focusCircle.style.strokeDashoffset = focusOffset;
  }
  if (focusLabel) {
    focusLabel.textContent = `${focusPercent}%`;
  }
  if (focusTitle && focusCat) {
    focusTitle.textContent = focusCat.title;
  }
  if (focusSubtitle && focusCat) {
    const metrics = getSagaEffortMetrics(focusCat.id);
    focusSubtitle.textContent = `Saga Code: ${focusCat.sagaId || ''} | Estimate: ${metrics.estimateSp} SP | Logged: ${metrics.loggedHours} hrs`;
  }

  // Sync Focus dropdown selection option
  populateFocusDropdown();
  
  const overallProgressNum = document.getElementById('overall-progress-num');
  if (overallProgressNum) {
    overallProgressNum.innerHTML = `${overallPercent}<span class="stat-unit">%</span>`;
  }
  
  const cardsCompletedText = document.getElementById('cards-completed-text');
  if (cardsCompletedText) {
    cardsCompletedText.textContent = `${combinedChecked} of ${combinedTotal} targets completed`;
  }
  
  // Progress Page Elements
  const progOverallFill = document.getElementById('prog-page-overall-fill');
  const progOverallLabel = document.getElementById('prog-page-overall-label');
  if (progOverallFill) progOverallFill.style.width = `${overallPercent}%`;
  if (progOverallLabel) progOverallLabel.textContent = `${overallPercent}%`;

  const progAiFill = document.getElementById('prog-page-ai-fill');
  const progAiLabel = document.getElementById('prog-page-ai-label');
  if (progAiFill) progAiFill.style.width = `${aiPercent}%`;
  if (progAiLabel) progAiLabel.textContent = `${aiPercent}%`;

  const progSdFill = document.getElementById('prog-page-sd-fill');
  const progSdLabel = document.getElementById('prog-page-sd-label');
  if (progSdFill) progSdFill.style.width = `${sdPercent}%`;
  if (progSdLabel) progSdLabel.textContent = `${sdPercent}%`;

  // XP Sidebar progress
  const sidebarXp = document.getElementById('sidebar-xp-progress');
  const sidebarXpLabel = document.getElementById('sidebar-xp-label');
  if (sidebarXp) {
    const xpPercent = Math.min(overallPercent * 1.5 + 10, 100);
    sidebarXp.style.width = `${xpPercent}%`;
    if (sidebarXpLabel) {
      sidebarXpLabel.textContent = `XP: ${Math.round(xpPercent * 10)}/1000`;
    }
  }
  
  // Mini Kanban Dashboard summary counts
  const miniTodo = document.getElementById('mini-todo-count');
  const miniInprogress = document.getElementById('mini-inprogress-count');
  const miniDone = document.getElementById('mini-done-count');
  
  if (miniTodo) miniTodo.textContent = state.sprintTasks.filter(t => t.status === 'todo').length;
  if (miniInprogress) miniInprogress.textContent = state.sprintTasks.filter(t => t.status === 'in-progress').length;
  if (miniDone) miniDone.textContent = state.sprintTasks.filter(t => t.status === 'done').length;
}

// 5. Dynamic Roadmap (Checkbox lists + Admin controls)
// Render Roadmap overview using scrollable horizontal tiles and nested drilldowns
function renderRoadmap() {
  const container = document.getElementById('dynamic-roadmap-container');
  if (!container) return;

  container.innerHTML = '';

  // 1. Create a scrollable horizontal wrapper
  const tilesWrapper = document.createElement('div');
  tilesWrapper.className = 'roadmap-tiles-container';

  state.roadmap.forEach(cat => {
    // Calculate rolled-up Saga level effort metrics
    const sagaMetrics = getSagaEffortMetrics(cat.id);
    
    // Calculate completion percentage for the progress bar
    const totalTopics = cat.topics ? cat.topics.length : 0;
    const checkedTopics = cat.topics ? cat.topics.reduce((sum, t) => sum + (typeof t.percentComplete === 'number' ? t.percentComplete : (t.completed ? 100 : 0)), 0) / 100 : 0;
    const progressPercent = totalTopics > 0 ? Math.round((checkedTopics / totalTopics) * 100) : 0;

    const tileDiv = document.createElement('div');
    tileDiv.className = 'roadmap-tile';
    
    // Header block
    let catHeader = `
      <div>
        <div class="category-header" style="margin-bottom:6px;">
          <span style="font-weight:800; font-size:1rem; color:var(--text-primary); cursor:pointer;" onclick="window.location.hash='#category-${cat.id}'" title="Drill down to details">${cat.title}</span>
          <button type="button" class="category-delete-btn" data-cat-id="${cat.id}" title="Delete Saga">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>
          </button>
        </div>
        <div style="font-size:0.7rem; font-family:monospace; color:var(--accent); font-weight:700; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <span>Saga Code: ${cat.sagaId || ''}</span>
          <span style="color:var(--text-muted);">Est: ${sagaMetrics.estimateSp} SP | Logged: ${sagaMetrics.loggedHours}h</span>
        </div>
        
        <!-- Completion progress bar -->
        <div class="progress-container" style="margin-top:0; margin-bottom:8px;">
          <div class="progress-info" style="margin-bottom:2px; font-size:0.7rem;">
            <span>Completion</span>
            <span>${progressPercent}%</span>
          </div>
          <div class="progress-track" style="height:6px; border-radius:3px;">
            <div class="progress-fill" style="width: ${progressPercent}%; background: linear-gradient(90deg, var(--primary), var(--accent));"></div>
          </div>
        </div>
      </div>
    `;
    
    // Topics items list (Epics)
    let topicsListHtml = '<div class="roadmap-list" style="flex:1; max-height:280px; overflow-y:auto; padding-right:4px; display:flex; flex-direction:column; gap:8px;">';
    
    if (!cat.topics || cat.topics.length === 0) {
      topicsListHtml += `<div style="padding: 12px; font-size:0.75rem; color:var(--text-secondary); text-align:center; font-style:italic;">No Epics yet. Add one below!</div>`;
    } else {
      cat.topics.forEach(top => {
        // Calculate Epic-level effort metrics
        const epicMetrics = getEpicEffortMetrics(cat.id, top.id);
        
        // Find sprint tasks under this Epic
        let epicTasks = [];
        if (Array.isArray(state.sprintTasks)) {
          epicTasks = state.sprintTasks.filter(task => 
            task.epicId && (task.epicId === top.id || task.epicId === top.epicId)
          );
        }

        // Adjust completed checkbox state automatically if there are tasks
        if (epicTasks.length > 0) {
          const allCompleted = epicTasks.every(t => t.status === 'done');
          if (top.completed !== allCompleted) {
            top.completed = allCompleted;
            saveToStorage('portal_dynamic_roadmap', state.roadmap);
          }
        }

        // Quick log hours elements
        const quickLogHtml = `
          <div style="display:flex; align-items:center; gap:6px; margin-top:6px; margin-left:26px;">
            <input type="number" step="0.5" min="0" placeholder="hrs" id="log-hours-input-dash-${top.id}" style="width:45px; padding:3px; font-size:0.7rem; border-radius:4px; border:1px solid var(--border-color); background:var(--bg-app); color:var(--text-primary); text-align:center;">
            <button type="button" onclick="logTopicHours('${cat.id}', '${top.id}')" style="padding:2px 8px; font-size:0.7rem; border-radius:4px; font-weight:600; cursor:pointer; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-primary); transition:all 0.2s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border-color)'">Log</button>
            <span style="font-size:0.68rem; color:var(--text-secondary); margin-left:auto;">⏱️ ${epicMetrics.loggedHours} hrs</span>
          </div>
        `;

        // Render Epic (Topic) checkbox row
        topicsListHtml += `
          <div class="checklist-item ${top.completed ? 'completed' : ''}" style="padding:8px; border-radius:8px; background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.03);">
            <div class="topic-item-wrapper" style="flex-direction:column; align-items:flex-start; gap:2px; width:100%;">
              <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <label class="custom-checkbox">
                    <input type="checkbox" ${top.completed ? 'checked' : ''} data-topic-id="${top.id}">
                    <span class="checkbox-mark"></span>
                  </label>
                  <span class="checklist-text topic-notes-trigger" data-cat-id="${cat.id}" data-topic-id="${top.id}" style="font-weight:600; font-size:0.8rem;" title="Click to view/edit study notes">${top.text}</span>
                </div>
                <button type="button" class="topic-delete-btn" data-cat-id="${cat.id}" data-topic-id="${top.id}" title="Delete Epic">
                  <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>
                </button>
              </div>
              
              <!-- Epic ID and Task details row -->
              <div style="display:flex; align-items:center; justify-content:space-between; width:100%; margin-left:26px; margin-top:2px;">
                <span style="font-size:0.6rem; font-family:monospace; color:var(--text-secondary); background:rgba(255,255,255,0.05); padding:1px 3px; border-radius:3px;">${top.epicId || ''}</span>
                ${epicTasks.length > 0 ? `
                  <button type="button" class="nested-tasks-toggle-btn" onclick="toggleDashboardEpicTasks('${cat.id}', '${top.id}')" id="btn-toggle-tasks-${top.id}" style="font-size:0.68rem;">
                    <span>[+] Tasks (${epicTasks.length})</span>
                  </button>
                ` : ''}
              </div>
              
              <!-- Quick logger -->
              ${quickLogHtml}

              <!-- Sub-tasks container -->
              ${epicTasks.length > 0 ? `
                <div id="nested-tasks-container-${top.id}" class="nested-tasks-box" style="display:none;">
                  ${epicTasks.map(task => {
                    let badgeClass = 'badge-blue';
                    if (task.status === 'in-progress') badgeClass = 'badge-yellow';
                    if (task.status === 'done') badgeClass = 'badge-green';
                    
                    return `
                      <div class="nested-task-item ${task.status === 'done' ? 'completed' : ''}">
                        <div style="display:flex; align-items:center; gap:6px;">
                          <input type="checkbox" ${task.status === 'done' ? 'checked' : ''} onclick="toggleDashboardTaskStatus('${task.id}', this.checked)" style="cursor:pointer; transform:scale(0.85);">
                          <span style="font-weight:500; cursor:pointer;" onclick="editSprintTaskFromSagaPage('${task.id}')" title="Edit details">${task.title}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:4px;">
                          <span style="font-size:0.65rem; color:var(--text-muted); font-family:monospace;">${task.estimate || 0} SP</span>
                          <span class="badge ${badgeClass}" style="font-size:0.55rem; padding:1px 3px; scale:0.9;">${task.status}</span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}
              
              <!-- Notes preview box -->
              ${top.notes ? `<div class="notes-preview-box topic-notes-trigger" style="font-size:0.68rem; color:var(--text-secondary); padding:4px 8px; margin-left:26px; margin-top:4px; font-style:italic; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width: 250px; background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius:4px; cursor:pointer;" data-cat-id="${cat.id}" data-topic-id="${top.id}" title="Click to edit notes">📝 ${top.notes}</div>` : ''}
            </div>
          </div>
        `;
      });
    }
    topicsListHtml += '</div>';

    // Inline form to add topic directly at bottom of tile card
    const addTopicFormHtml = `
      <div style="display:flex; gap:6px; margin-top:auto; padding-top:10px; border-top:1px dashed var(--border-color);">
        <input type="text" class="modal-input" placeholder="Add Epic module..." id="new-top-input-${cat.id}" style="flex:1; padding:6px 10px; font-size:0.78rem; border-radius:6px;">
        <button type="button" class="btn btn-secondary add-topic-btn" data-cat-id="${cat.id}" style="padding:6px 10px; border-radius:6px; font-size:0.75rem;">Add</button>
        <button type="button" class="btn btn-secondary enhance-topic-btn" data-cat-id="${cat.id}" style="padding:6px 10px; border-radius:6px; font-size:0.75rem; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1)); border-color: rgba(168, 85, 247, 0.3); color: var(--accent);" title="Enhance Topic with Gemini AI">✨ AI</button>
      </div>
    `;

    tileDiv.innerHTML = catHeader + topicsListHtml + addTopicFormHtml;
    tilesWrapper.appendChild(tileDiv);
  });

  container.appendChild(tilesWrapper);
}

// Toggle expansion of sub-tasks in a specific Epic card on the dashboard
window.toggleDashboardEpicTasks = function(catId, topicId) {
  const box = document.getElementById(`nested-tasks-container-${topicId}`);
  const btn = document.getElementById(`btn-toggle-tasks-${topicId}`);
  if (!box || !btn) return;

  const isHidden = box.style.display === 'none';
  if (isHidden) {
    box.style.display = 'flex';
    btn.querySelector('span').textContent = `[-] Hide Tasks`;
  } else {
    box.style.display = 'none';
    
    // Count tasks
    let taskCount = 0;
    if (Array.isArray(state.sprintTasks)) {
      const category = state.roadmap.find(c => c.id === catId);
      const topic = category ? category.topics.find(t => t.id === topicId) : null;
      if (topic) {
        taskCount = state.sprintTasks.filter(task => 
          task.epicId && (task.epicId === topicId || task.epicId === topic.epicId)
        ).length;
      }
    }
    btn.querySelector('span').textContent = `[+] Tasks (${taskCount})`;
  }
};

// Toggle status of a task between "todo"/"done" directly from the dashboard nested checklist
window.toggleDashboardTaskStatus = function(taskId, isChecked) {
  const task = state.sprintTasks.find(t => t.id === taskId);
  if (task) {
    task.status = isChecked ? 'done' : 'todo';
    saveToStorage('portal_sprint_tasks', state.sprintTasks);
    
    // Refresh dashboards and rollups
    renderSprintBoard();
    updateProgressMetrics();
    renderRoadmap();
  }
};

function setupDynamicRoadmapEvents() {
  const addCatBtn = document.getElementById('add-cat-btn');
  const addCatInput = document.getElementById('new-cat-title-input');
  
  if (addCatBtn && addCatInput) {
    addCatBtn.addEventListener('click', () => {
      const title = addCatInput.value.trim();
      if (!title) return;
      
      const newCat = {
        id: 'cat-' + Date.now(),
        title: title,
        sagaId: 'SAGA-' + String(Date.now()).substring(7),
        sagaTargetHours: 40,
        topics: []
      };
      
      state.roadmap.push(newCat);
      saveToStorage('portal_dynamic_roadmap', state.roadmap);
      addCatInput.value = '';
      renderRoadmap();
      updateProgressMetrics();
      renderSidebarTracks();
    });
  }

  // Handle dynamic additions & deletions inside roadmap container
  const roadmapContainer = document.getElementById('dynamic-roadmap-container');
  if (roadmapContainer) {
    roadmapContainer.addEventListener('click', (e) => {
      // Enhance Topic click (Gemini AI simulator)
      const enhanceBtn = e.target.closest('.enhance-topic-btn');
      if (enhanceBtn) {
        const catId = enhanceBtn.getAttribute('data-cat-id');
        const inputField = document.getElementById(`new-top-input-${catId}`);
        const originalText = inputField ? inputField.value.trim() : '';
        
        if (!originalText) {
          if (inputField) {
            inputField.placeholder = "Type a keyword first, e.g. 'Kafka'...";
            inputField.classList.add('pulse');
            setTimeout(() => inputField.classList.remove('pulse'), 1000);
          }
          return;
        }
        
        enhanceBtn.disabled = true;
        inputField.disabled = true;
        inputField.value = "✨ Gemini is creating key objectives...";
        
        setTimeout(() => {
          let enhancedText = "";
          const query = originalText.toLowerCase();
          
          if (query.includes('kafka')) {
            enhancedText = "Apache Kafka: Set up brokers, configure partition balancing, and stream event logs";
          } else if (query.includes('redis')) {
            enhancedText = "Redis Caching: Set up eviction policies, implement pub/sub channels, and design caches";
          } else if (query.includes('docker')) {
            enhancedText = "Docker Containerization: Write multi-stage Dockerfiles, manage network bridges, and mount volumes";
          } else if (query.includes('kubernetes') || query.includes('k8s')) {
            enhancedText = "Kubernetes Orchestration: Deploy pods, bind cluster service mappings, and configure ingress";
          } else if (query.includes('react')) {
            enhancedText = "React Core: Optimize render behaviors, compose custom hooks, and manage state context";
          } else if (query.includes('next')) {
            enhancedText = "Next.js App Router: Implement Server Actions, static-site hydration, and API routing";
          } else if (query.includes('llm')) {
            enhancedText = "LLM Integration: Connect text embedding interfaces, tweak temperatures, and manage context tokens";
          } else if (query.includes('rag')) {
            enhancedText = "Vector Database & RAG: Build semantic chunk indexes, connect Pinecone DB, and inject context";
          } else if (query.includes('agent')) {
            enhancedText = "AI Agentic Workflows: Build state loops in LangGraph, define custom tools, and deploy agents";
          } else if (query.includes('spring')) {
            enhancedText = "Spring Boot Backend: Build REST microservices, secure CORS endpoints, and query JPA tables";
          } else if (query.includes('java')) {
            enhancedText = "Modern Java: Use concurrency virtual threads, stream collectors, and pattern match cases";
          } else if (query.includes('system') || query.includes('design')) {
            enhancedText = "System Architecture: Scale database replica shards, configure CDNs, and balance web loads";
          } else if (query.includes('api') || query.includes('security')) {
            enhancedText = "API Gateway Security: Configure JWT authorization filters, OAuth callback codes, and rate limits";
          } else {
            const titleCased = originalText.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            enhancedText = `${titleCased} Deep Dive: Explore core structures, build local environments, and verify log outputs`;
          }
          
          inputField.value = enhancedText;
          inputField.disabled = false;
          enhanceBtn.disabled = false;
          inputField.focus();
        }, 800);
        
        return;
      }

      // Add Topic button click
      const topicBtn = e.target.closest('.add-topic-btn');
      if (topicBtn) {
        const catId = topicBtn.getAttribute('data-cat-id');
        const inputField = document.getElementById(`new-top-input-${catId}`);
        const topicText = inputField ? inputField.value.trim() : '';
        
        if (!topicText) return;
        
        const category = state.roadmap.find(c => c.id === catId);
        if (category) {
          category.topics.push({
            id: 'top-' + Date.now(),
            text: topicText,
            epicId: 'EPIC-' + String(Date.now()).substring(7),
            completed: false,
            notes: '',
            links: '',
            hoursLogged: 0,
            percentComplete: 0
          });
          saveToStorage('portal_dynamic_roadmap', state.roadmap);
          renderRoadmap();
          updateProgressMetrics();
          renderAiEngineeringTrack();
          
          // Refresh category page if active
          const hash = window.location.hash;
          if (hash === `#category-${catId}`) {
            showCategoryPage(catId);
          }
        }
        return;
      }

    });
  }

  // Handle deletions globally so they work on both the Dashboard and the Category Details pages (using capture phase to preempt and prevent default behaviors/reloads in Chrome)
  document.addEventListener('click', (e) => {
    try {
      // Delete Category (Saga) click
      const catDeleteBtn = e.target.closest('.category-delete-btn');
      if (catDeleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const catId = catDeleteBtn.getAttribute('data-cat-id');
        const category = state.roadmap.find(c => c.id === catId);
        const categoryTitle = category ? category.title : '';
        const topicIds = (category && category.topics) ? category.topics.map(t => t.id) : [];
        const topicEpicIds = (category && category.topics) ? category.topics.map(t => t.epicId).filter(Boolean) : [];

        if (confirm('Are you sure you want to delete this entire category (Saga) and all its topics and tasks?')) {
          // 1. Delete sprint tasks under this category/Saga
          if (Array.isArray(state.sprintTasks)) {
            state.sprintTasks = state.sprintTasks.filter(t => {
              const matchesCategory = typeof t.category === 'string' && typeof categoryTitle === 'string' && t.category.toLowerCase() === categoryTitle.toLowerCase();
              const matchesEpic = t.epicId && (topicIds.includes(t.epicId) || topicEpicIds.includes(t.epicId));
              return !matchesCategory && !matchesEpic;
            });
            saveToStorage('portal_sprint_tasks', state.sprintTasks);
          }

          // 2. Delete category itself
          state.roadmap = state.roadmap.filter(c => c.id !== catId);
          saveToStorage('portal_dynamic_roadmap', state.roadmap);

          // Adjust current focus category ID if we deleted the active one
          if (state.currentFocusCatId === catId) {
            state.currentFocusCatId = state.roadmap[0] ? state.roadmap[0].id : '';
            localStorage.setItem('portal_current_focus_cat', state.currentFocusCatId);
          }

          // 3. Re-render and update UI
          renderRoadmap();
          updateProgressMetrics();
          renderSidebarTracks();
          renderSprintBoard();
          renderActivityMap();
          renderActivityCharts();

          // Redirect if they were on that deleted category
          const hash = window.location.hash;
          if (hash === `#category-${catId}` || hash.startsWith(`#category-${catId}`)) {
            window.location.hash = '#dashboard';
          }
        }
        return;
      }

      // Delete Topic (Epic) click
      const topDeleteBtn = e.target.closest('.topic-delete-btn');
      if (topDeleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const catId = topDeleteBtn.getAttribute('data-cat-id');
        const topId = topDeleteBtn.getAttribute('data-topic-id');
        const category = state.roadmap.find(c => c.id === catId);
        if (category) {
          const topic = category.topics ? category.topics.find(t => t.id === topId) : null;
          const topicName = topic ? topic.text : 'this topic';
          const topicEpicId = topic ? topic.epicId : '';

          if (confirm(`Are you sure you want to delete "${topicName}" (Epic) and all its sprint tasks?`)) {
            // 1. Delete tasks under this Epic
            if (Array.isArray(state.sprintTasks)) {
              state.sprintTasks = state.sprintTasks.filter(t => {
                const matchesEpic = t.epicId && (t.epicId === topId || (topicEpicId && t.epicId === topicEpicId));
                return !matchesEpic;
              });
              saveToStorage('portal_sprint_tasks', state.sprintTasks);
            }

            // 2. Delete topic itself
            if (category.topics) {
              category.topics = category.topics.filter(t => t.id !== topId);
            }
            saveToStorage('portal_dynamic_roadmap', state.roadmap);

            // 3. Re-render and update UI
            renderRoadmap();
            updateProgressMetrics();
            renderAiEngineeringTrack();
            renderSprintBoard();
            renderActivityMap();
            renderActivityCharts();

            // Refresh category page if active
            const hash = window.location.hash;
            if (hash === `#category-${catId}`) {
              showCategoryPage(catId);
            }
          }
        }
        return;
      }
    } catch (err) {
      alert("Error during delete: " + err.message + "\n" + err.stack);
    }
  }, true);
}

// 6. Sprint Board Kanban Layout
function renderSprintBoard() {
  const tabsContainer = document.getElementById('sprint-tabs-list');
  const todoList = document.getElementById('kanban-list-todo');
  const inprogressList = document.getElementById('kanban-list-inprogress');
  const doneList = document.getElementById('kanban-list-done');
  if (!tabsContainer || !todoList || !inprogressList || !doneList) return;

  // 0. Render Saga/Epic Summary board cards
  const epicsSummaryContainer = document.getElementById('kanban-epics-summary');
  if (epicsSummaryContainer) {
    epicsSummaryContainer.innerHTML = '';
    
    // Add global callback window.toggleRollupView if not defined
    if (!window.toggleRollupView) {
      window.toggleRollupView = function(view) {
        state.activeRollupView = view;
        renderSprintBoard();
      };
    }
    
    const activeView = state.activeRollupView || 'sagas';
    
    // Create toggle UI element and append
    const toggleWrapper = document.createElement('div');
    toggleWrapper.style.width = '100%';
    toggleWrapper.style.display = 'flex';
    toggleWrapper.style.justifyContent = 'space-between';
    toggleWrapper.style.alignItems = 'center';
    toggleWrapper.style.marginBottom = '12px';
    toggleWrapper.innerHTML = `
      <span style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em;">Jira Board Roll-up</span>
      <div style="display:flex; gap:6px;">
        <button class="select-btn ${activeView === 'sagas' ? 'active' : ''}" onclick="toggleRollupView('sagas')" style="padding:4px 10px; font-size:0.75rem; border-radius:4px; font-weight:600; cursor:pointer;">Sagas (Categories)</button>
        <button class="select-btn ${activeView === 'epics' ? 'active' : ''}" onclick="toggleRollupView('epics')" style="padding:4px 10px; font-size:0.75rem; border-radius:4px; font-weight:600; cursor:pointer;">Epics (Modules)</button>
      </div>
    `;
    epicsSummaryContainer.appendChild(toggleWrapper);

    const cardsContainer = document.createElement('div');
    cardsContainer.style.display = 'flex';
    cardsContainer.style.gap = '16px';
    cardsContainer.style.overflowX = 'auto';
    cardsContainer.style.width = '100%';
    cardsContainer.style.paddingBottom = '8px';
    cardsContainer.style.flexWrap = 'wrap';

    if (activeView === 'sagas') {
      state.roadmap.forEach(category => {
        const sagaId = category.sagaId || ('SAGA-' + category.id.replace('cat-', '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase());
        const sagaTarget = category.sagaTargetHours || 40;
        
        // Find tasks linked to this Saga (Category title or topic Epic IDs)
        const relatedTasks = state.sprintTasks.filter(t => 
          (t.category && t.category.toLowerCase() === category.title.toLowerCase()) ||
          (t.epicId && category.topics.some(top => top.id === t.epicId || top.epicId === t.epicId))
        );
        const taskCount = relatedTasks.length;
        const doneTaskCount = relatedTasks.filter(t => t.status === 'done').length;
        
        let sagaTotalSp = 0;
        let sagaCompletedSp = 0;
        relatedTasks.forEach(task => {
          const est = parseFloat(task.estimate) || 0;
          sagaTotalSp += est;
          if (task.status === 'done') {
            sagaCompletedSp += est;
          } else if (task.status === 'in-progress') {
            sagaCompletedSp += (est * 0.5);
          }
        });
        
        const sagaProgressPercent = sagaTotalSp > 0 ? Math.round((sagaCompletedSp / sagaTotalSp) * 100) : 0;
        
        const card = document.createElement('div');
        card.className = 'card';
        card.style.margin = '0';
        card.style.flex = '1';
        card.style.minWidth = '240px';
        card.style.borderTop = '3.5px solid var(--primary)';
        
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <span style="font-size:0.65rem; font-weight:700; color:var(--primary); font-family:monospace;">${sagaId}</span>
            <span style="font-size:0.65rem; color:var(--text-secondary); font-weight:600;">${doneTaskCount}/${taskCount} Tasks</span>
          </div>
          <h4 style="font-size:0.85rem; font-weight:800; margin:0 0 6px 0; color:var(--text-primary);">
            <a href="#category-${category.id}" style="color:inherit; text-decoration:none; display:flex; align-items:center; gap:4px;">
              ${category.title}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </h4>
          
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.7rem; color:var(--text-secondary); margin-bottom:4px;">
            <span>Saga Progress: ${sagaProgressPercent}%</span>
            <span>${sagaCompletedSp} / ${sagaTotalSp} SP</span>
          </div>
          
          <div style="background:var(--border-color); height:6px; border-radius:3px; overflow:hidden; margin-bottom:6px;">
            <div style="background:var(--primary); height:100%; width:${sagaProgressPercent}%;"></div>
          </div>
          <div style="font-size:0.65rem; color:var(--text-muted); text-align:right; font-weight:500;">Target: ${sagaTarget}h budget</div>
        `;
        cardsContainer.appendChild(card);
      });
    } else {
      // Render Epic summaries
      state.roadmap.forEach(category => {
        category.topics.forEach(topic => {
          const epicId = topic.epicId || ('EPIC-' + topic.id.replace('top-', '').toUpperCase());
          const relatedTasks = state.sprintTasks.filter(t => t.epicId === topic.id || t.epicId === topic.epicId);
          const taskCount = relatedTasks.length;
          const doneTaskCount = relatedTasks.filter(t => t.status === 'done').length;
          
          let epicTotalSp = 0;
          let epicCompletedSp = 0;
          relatedTasks.forEach(task => {
            const est = parseFloat(task.estimate) || 0;
            epicTotalSp += est;
            if (task.status === 'done') {
              epicCompletedSp += est;
            } else if (task.status === 'in-progress') {
              epicCompletedSp += (est * 0.5);
            }
          });
          
          const epicProgressPercent = epicTotalSp > 0 ? Math.round((epicCompletedSp / epicTotalSp) * 100) : 0;
          
          const card = document.createElement('div');
          card.className = 'card';
          card.style.margin = '0';
          card.style.flex = '1';
          card.style.minWidth = '240px';
          card.style.borderTop = '3.5px solid var(--accent)';
          
          card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
              <span style="font-size:0.65rem; font-weight:700; color:var(--accent); font-family:monospace;">${epicId}</span>
              <span style="font-size:0.65rem; color:var(--text-secondary); font-weight:600;">${doneTaskCount}/${taskCount} Tasks</span>
            </div>
            <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; margin-bottom:2px;">Saga: ${category.title}</div>
            <h4 style="font-size:0.85rem; font-weight:800; margin:0 0 6px 0; color:var(--text-primary);">
              <a href="#category-${category.id}" style="color:inherit; text-decoration:none; display:flex; align-items:center; gap:4px;">
                ${topic.text}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </h4>
            
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.7rem; color:var(--text-secondary); margin-bottom:4px;">
              <span>Epic Progress: ${epicProgressPercent}%</span>
              <span>${epicCompletedSp} / ${epicTotalSp} SP</span>
            </div>
            
            <div style="background:var(--border-color); height:6px; border-radius:3px; overflow:hidden;">
              <div style="background:var(--accent); height:100%; width:${epicProgressPercent}%;"></div>
            </div>
          `;
          cardsContainer.appendChild(card);
        });
      });
    }
    epicsSummaryContainer.appendChild(cardsContainer);
  }

  // 1. Render Sprints Tab Selector headers
  tabsContainer.innerHTML = '';
  state.sprints.forEach(sprint => {
    const activeClass = sprint === state.activeSprint ? 'active' : '';
    const btn = document.createElement('button');
    btn.className = `sprint-tab-btn ${activeClass}`;
    btn.setAttribute('data-sprint', sprint);
    btn.textContent = sprint;
    tabsContainer.appendChild(btn);
  });

  // 2. Clear Kanban Lists
  todoList.innerHTML = '';
  inprogressList.innerHTML = '';
  doneList.innerHTML = '';

  // 3. Filter Tasks by Active Sprint
  const activeTasks = state.sprintTasks.filter(t => t.sprint === state.activeSprint);

  // 4. Fill task counts on headers
  const countTodo = activeTasks.filter(t => t.status === 'todo').length;
  const countInprogress = activeTasks.filter(t => t.status === 'in-progress').length;
  const countDone = activeTasks.filter(t => t.status === 'done').length;

  document.getElementById('header-count-todo').textContent = countTodo;
  document.getElementById('header-count-inprogress').textContent = countInprogress;
  document.getElementById('header-count-done').textContent = countDone;

  if (activeTasks.length === 0) {
    const emptyMsg = `<div style="padding: 20px; font-size:0.85rem; color:var(--text-secondary); text-align:center;">No tasks in this Sprint. Click Create Task to populate!</div>`;
    todoList.innerHTML = emptyMsg;
    return;
  }

  // Helper function to build card HTML
  function createTaskCard(task) {
    const priorityClass = `badge-priority-${task.priority}`;
    
    // Options to move sprint via select (mobile compatibility)
    let sprintOptions = state.sprints.map(s => `
      <option value="${s}" ${s === task.sprint ? 'selected' : ''}>${s}</option>
    `).join('');

    const card = document.createElement('div');
    card.className = 'kanban-task-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-task-id', task.id);
    card.innerHTML = `
      <div class="card-actions-wrapper">
        <button class="card-action-btn edit-task" data-id="${task.id}" title="Edit Task">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button class="card-action-btn delete delete-task" data-id="${task.id}" title="Delete Task">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
        </button>
      </div>
      
      <div class="kanban-task-title">${task.title}</div>
      <div class="kanban-task-desc">${task.desc || ''}</div>
      
      <div style="margin-bottom: 8px;">
        <select class="mobile-move-select move-sprint-select" data-id="${task.id}" title="Move Sprint">
          ${sprintOptions}
        </select>
        <select class="mobile-move-select move-status-select" data-id="${task.id}" title="Move Status">
          <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
          <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
          <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
        </select>
      </div>
      
      <div class="kanban-task-meta">
        <span class="badge ${priorityClass}">${task.priority}</span>
        <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">${task.category}</span>
        <span class="kanban-task-estimate">
          <span>⭐</span>
          <span>${task.estimate || 0} SP</span>
        </span>
      </div>
    `;

    return card;
  }

  // 5. Append tasks to matching status lists
  activeTasks.forEach(task => {
    const card = createTaskCard(task);
    if (task.status === 'todo') {
      todoList.appendChild(card);
    } else if (task.status === 'in-progress') {
      inprogressList.appendChild(card);
    } else if (task.status === 'done') {
      doneList.appendChild(card);
    }
  });

  // Re-bind native HTML5 Drag and Drop events
  bindDragAndDrop();
}

function bindDragAndDrop() {
  const cards = document.querySelectorAll('.kanban-task-card');
  const columns = document.querySelectorAll('.kanban-column');

  cards.forEach(card => {
    card.addEventListener('dragstart', () => {
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });

  columns.forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      column.classList.add('drag-over');
    });

    column.addEventListener('dragleave', () => {
      column.classList.remove('drag-over');
    });

    column.addEventListener('drop', () => {
      column.classList.remove('drag-over');
      const card = document.querySelector('.kanban-task-card.dragging');
      if (card) {
        const taskId = card.getAttribute('data-task-id');
        const nextStatus = column.getAttribute('data-status');
        
        // Update state task status
        const task = state.sprintTasks.find(t => t.id === taskId);
        if (task && task.status !== nextStatus) {
          task.status = nextStatus;
          saveToStorage('portal_sprint_tasks', state.sprintTasks);
          renderSprintBoard();
          updateProgressMetrics();
        }
      }
    });
  });
}

function updateTaskModalEpicsDropdown(categoryTitle, selectEpicId) {
  const epicSelector = document.getElementById('task-input-epic');
  if (!epicSelector) return;

  const category = state.roadmap.find(c => c.title.toLowerCase() === categoryTitle.toLowerCase());
  if (category && category.topics && category.topics.length > 0) {
    epicSelector.innerHTML = category.topics.map(t => `<option value="${t.id}">${t.text} (${t.epicId || ''})</option>`).join('');
    if (selectEpicId) {
      epicSelector.value = selectEpicId;
    } else {
      epicSelector.selectedIndex = 0;
    }
  } else {
    epicSelector.innerHTML = '<option value="">No Epics Available</option>';
  }
}

function setupKanbanEvents() {
  const tabsList = document.getElementById('sprint-tabs-list');
  const newSprintBtn = document.getElementById('new-sprint-btn');
  const openModalBtn = document.getElementById('task-create-btn');
  const modal = document.getElementById('task-modal');
  const closeModalBtn = document.getElementById('task-modal-close');
  const modalSaveBtn = document.getElementById('task-save-btn');
  const modalDeleteBtn = document.getElementById('task-delete-btn');
  
  // Dynamic drop-down population for Epics inside the Task modal
  const catSelector = document.getElementById('task-input-cat');
  if (catSelector) {
    catSelector.addEventListener('change', (e) => {
      updateTaskModalEpicsDropdown(e.target.value);
    });
  }

  // Sprint Switch Tabs click
  if (tabsList) {
    tabsList.addEventListener('click', (e) => {
      const tab = e.target.closest('.sprint-tab-btn');
      if (tab) {
        state.activeSprint = tab.getAttribute('data-sprint');
        renderSprintBoard();
      }
    });
  }

  // Create new Sprint
  if (newSprintBtn) {
    newSprintBtn.addEventListener('click', () => {
      const sprintName = prompt('Enter New Sprint Name (e.g. Sprint 3):');
      if (!sprintName) return;
      
      const cleanName = sprintName.trim();
      if (!state.sprints.includes(cleanName)) {
        state.sprints.push(cleanName);
        state.activeSprint = cleanName;
        saveToStorage('portal_sprints', state.sprints);
        renderSprintBoard();
      }
    });
  }

  // Add Task Button modal open
  if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
      state.editingTaskId = null;
      document.getElementById('task-modal-title').textContent = 'Create Sprint Task';
      
      // Populate category selector options dynamically from roadmap categories
      const catSel = document.getElementById('task-input-cat');
      catSel.innerHTML = state.roadmap.map(c => `<option value="${c.title}">${c.title}</option>`).join('');
      
      // Populate Epic choices
      if (state.roadmap.length > 0) {
        updateTaskModalEpicsDropdown(state.roadmap[0].title);
      } else {
        const epicSelector = document.getElementById('task-input-epic');
        if (epicSelector) epicSelector.innerHTML = '<option value="">No Epics Available</option>';
      }

      // Populate sprint choices
      const sprintSelector = document.getElementById('task-input-sprint');
      sprintSelector.innerHTML = state.sprints.map(s => `<option value="${s}">${s}</option>`).join('');
      sprintSelector.value = state.activeSprint;

      // Clear values
      document.getElementById('task-input-title').value = '';
      document.getElementById('task-input-desc').value = '';
      document.getElementById('task-input-priority').value = 'medium';
      document.getElementById('task-input-estimate').value = '1';
      document.getElementById('task-input-status').value = 'todo';
      const hoursInput = document.getElementById('task-input-logged-hours');
      if (hoursInput) hoursInput.value = '';
      
      modalDeleteBtn.style.display = 'none';
      modal.classList.add('active');
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  // Save Task
  if (modalSaveBtn) {
    modalSaveBtn.addEventListener('click', () => {
      const title = document.getElementById('task-input-title').value.trim();
      const desc = document.getElementById('task-input-desc').value.trim();
      const category = document.getElementById('task-input-cat').value;
      const epicId = document.getElementById('task-input-epic').value;
      const priority = document.getElementById('task-input-priority').value;
      const estimate = parseInt(document.getElementById('task-input-estimate').value) || 1;
      const sprint = document.getElementById('task-input-sprint').value;
      const status = document.getElementById('task-input-status').value;
      const hoursInput = document.getElementById('task-input-logged-hours');
      const hoursLogged = hoursInput ? parseFloat(hoursInput.value) || 0 : 0;

      if (!title) {
        alert('Please enter a task title');
        return;
      }

      if (state.editingTaskId) {
        // Edit task
        const task = state.sprintTasks.find(t => t.id === state.editingTaskId);
        if (task) {
          task.title = title;
          task.desc = desc;
          task.category = category;
          task.epicId = epicId;
          task.priority = priority;
          task.estimate = estimate;
          task.sprint = sprint;
          task.status = status;
          task.hoursLogged = hoursLogged;
        }
      } else {
        // Create new task
        const newTask = {
          id: 'st-' + Date.now(),
          title,
          desc,
          category,
          epicId,
          priority,
          estimate,
          sprint,
          status,
          hoursLogged
        };
        state.sprintTasks.push(newTask);
      }

      saveToStorage('portal_sprint_tasks', state.sprintTasks);
      modal.classList.remove('active');
      
      // Update all visual dashboards and trackers
      renderSprintBoard();
      updateProgressMetrics();
      renderRoadmap();
      renderActivityMap();
      renderActivityCharts();
      
      const hash = window.location.hash;
      if (hash.startsWith('#category-')) {
        const catId = hash.replace('#category-', '');
        showCategoryPage(catId);
      }
    });
  }

  // Delete Task from inside Modal edit
  if (modalDeleteBtn) {
    modalDeleteBtn.addEventListener('click', () => {
      if (state.editingTaskId && confirm('Are you sure you want to delete this task?')) {
        state.sprintTasks = state.sprintTasks.filter(t => t.id !== state.editingTaskId);
        saveToStorage('portal_sprint_tasks', state.sprintTasks);
        modal.classList.remove('active');
        renderSprintBoard();
        updateProgressMetrics();

        const hash = window.location.hash;
        if (hash.startsWith('#category-')) {
          const catId = hash.replace('#category-', '');
          showCategoryPage(catId);
        }
      }
    });
  }

  // Board level inline card button actions (Edit/Delete/Mobile drop actions)
  const sprintBoardView = document.getElementById('view-sprint-board');
  if (sprintBoardView) {
    sprintBoardView.addEventListener('click', (e) => {
      // Edit Task button click
      const editBtn = e.target.closest('.edit-task');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        const task = state.sprintTasks.find(t => t.id === id);
        if (task) {
          state.editingTaskId = id;
          document.getElementById('task-modal-title').textContent = 'Edit Task Details';
          
          // Populate category selector
          const catSel = document.getElementById('task-input-cat');
          catSel.innerHTML = state.roadmap.map(c => `<option value="${c.title}">${c.title}</option>`).join('');
          catSel.value = task.category;
          
          // Populate Epic choices
          updateTaskModalEpicsDropdown(task.category, task.epicId);

          // Populate sprint choices
          const sprintSelector = document.getElementById('task-input-sprint');
          sprintSelector.innerHTML = state.sprints.map(s => `<option value="${s}">${s}</option>`).join('');
          sprintSelector.value = task.sprint;

          // Set form inputs
          document.getElementById('task-input-title').value = task.title;
          document.getElementById('task-input-desc').value = task.desc || '';
          document.getElementById('task-input-priority').value = task.priority;
          document.getElementById('task-input-estimate').value = task.estimate;
          document.getElementById('task-input-status').value = task.status;
          const hoursInput = document.getElementById('task-input-logged-hours');
          if (hoursInput) hoursInput.value = task.hoursLogged || '';
          
          modalDeleteBtn.style.display = 'block';
          modal.classList.add('active');
        }
        return;
      }

      // Delete Task button click
      const deleteBtn = e.target.closest('.delete-task');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this task?')) {
          state.sprintTasks = state.sprintTasks.filter(t => t.id !== id);
          saveToStorage('portal_sprint_tasks', state.sprintTasks);
          renderSprintBoard();
          updateProgressMetrics();
        }
      }
    });

    // Mobile compatibility dropdown selection change
    sprintBoardView.addEventListener('change', (e) => {
      const selectStatus = e.target.closest('.move-status-select');
      if (selectStatus) {
        const id = selectStatus.getAttribute('data-id');
        const task = state.sprintTasks.find(t => t.id === id);
        if (task) {
          task.status = selectStatus.value;
          saveToStorage('portal_sprint_tasks', state.sprintTasks);
          renderSprintBoard();
          updateProgressMetrics();
        }
        return;
      }

      const selectSprint = e.target.closest('.move-sprint-select');
      if (selectSprint) {
        const id = selectSprint.getAttribute('data-id');
        const task = state.sprintTasks.find(t => t.id === id);
        if (task) {
          task.sprint = selectSprint.value;
          saveToStorage('portal_sprint_tasks', state.sprintTasks);
          renderSprintBoard();
          updateProgressMetrics();
        }
      }
    });
  }
}

// 7. Todos Tracker
function setupTodos() {
  const todoContainer = document.getElementById('todo-list');
  const todoInput = document.getElementById('todo-new-input');
  const todoAddBtn = document.getElementById('todo-add-btn');
  const todoCount = document.getElementById('todo-count');
  
  function renderTodos() {
    todoContainer.innerHTML = '';
    
    // 1. Filter out expired uncompleted todos
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    state.todos = state.todos.filter(todo => {
      if (todo.completed) return true;
      if (todo.expiryDays && todo.expiryDays > 0 && todo.createdDate) {
        const ageMs = now - todo.createdDate;
        const ageDays = ageMs / oneDayMs;
        if (ageDays >= todo.expiryDays) {
          return false;
        }
      }
      return true;
    });
    
    saveToStorage('portal_todos', state.todos);

    if (state.todos.length === 0) {
      todoContainer.innerHTML = '<div style="padding: 10px; text-align: center; color: var(--text-secondary); font-size: 0.85rem;">All tasks done! Add some above.</div>';
      if (todoCount) todoCount.textContent = '0 remaining';
      return;
    }
    
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayStartMs = todayStart.getTime();
    
    const todaysList = [];
    const rolloversList = [];
    let activeCount = 0;
    
    state.todos.forEach(todo => {
      if (!todo.completed) activeCount++;
      const createdTime = todo.createdDate || parseFloat(todo.id.replace('t-', '')) || Date.now();
      
      if (createdTime < todayStartMs && !todo.completed) {
        rolloversList.push(todo);
      } else {
        todaysList.push(todo);
      }
    });

    function createTodoHtml(todo, isRollover) {
      const createdTime = todo.createdDate || parseFloat(todo.id.replace('t-', '')) || Date.now();
      const ageMs = now - createdTime;
      const ageDays = Math.floor(ageMs / oneDayMs);
      const rolloverBadge = isRollover ? `<span class="todo-overdue-badge">⏳ Overdue ${ageDays}d</span>` : '';
      
      return `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" style="margin-bottom: 6px;">
          <div class="todo-left" style="flex:1; display:flex; align-items:center;">
            <label class="custom-checkbox">
              <input type="checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
              <span class="checkbox-mark"></span>
            </label>
            <span class="todo-text checklist-text" style="margin-left: 8px;">${todo.text}</span>
          </div>
          ${rolloverBadge}
          <button class="todo-delete-btn" data-id="${todo.id}">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      `;
    }

    let innerHtml = '';
    
    if (rolloversList.length > 0) {
      innerHtml += `
        <div style="font-size:0.7rem; font-weight:700; color:var(--warning); text-transform:uppercase; margin-top:4px; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
          <span>⚠️ Rollover Tasks</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          ${rolloversList.map(t => createTodoHtml(t, true)).join('')}
        </div>
      `;
    }
    
    if (todaysList.length > 0) {
      innerHtml += `
        <div style="font-size:0.7rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-top:8px; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
          <span>📅 Today's Tasks</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          ${todaysList.map(t => createTodoHtml(t, false)).join('')}
        </div>
      `;
    }
    
    todoContainer.innerHTML = innerHtml;
    
    if (todoCount) {
      todoCount.textContent = `${activeCount} remaining`;
    }
  }
  
  function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;
    
    const expirySelect = document.getElementById('todo-expiry-select');
    const expiryDays = expirySelect ? parseInt(expirySelect.value) : 0;
    
    const newTodo = {
      id: 't-' + Date.now(),
      text: text,
      completed: false,
      createdDate: Date.now(),
      expiryDays: expiryDays
    };
    
    state.todos.push(newTodo);
    saveToStorage('portal_todos', state.todos);
    todoInput.value = '';
    renderTodos();
  }
  
  todoAddBtn.addEventListener('click', addTodo);
  todoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTodo();
  });
  
  todoContainer.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.todo-delete-btn');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      state.todos = state.todos.filter(t => t.id !== id);
      saveToStorage('portal_todos', state.todos);
      renderTodos();
      return;
    }
    
    const checkbox = e.target.closest('input[type="checkbox"]');
    if (checkbox) {
      const id = checkbox.getAttribute('data-id');
      const todo = state.todos.find(t => t.id === id);
      if (todo) {
        todo.completed = checkbox.checked;
        saveToStorage('portal_todos', state.todos);
        renderTodos();
      }
    }
  });
  
  renderTodos();
}

// 8. Journal Logic
function setupJournals() {
  const listContainer = document.getElementById('journal-list');
  const titleInput = document.getElementById('journal-title');
  const bodyInput = document.getElementById('journal-body');
  const saveBtn = document.getElementById('journal-save-btn');
  const newBtn = document.getElementById('journal-new-btn');
  const tagBtns = document.querySelectorAll('.journal-tag-btn');
  
  let selectedTags = [];
  
  function renderJournalList() {
    listContainer.innerHTML = '';
    state.journals.forEach(journal => {
      const item = document.createElement('div');
      item.className = `journal-list-item ${journal.id === state.activeJournalId ? 'active' : ''}`;
      item.setAttribute('data-id', journal.id);
      
      let tagsHtml = journal.tags.map(t => {
        const emo = t === 'focused' ? '⚡' : t === 'productive' ? '🌱' : '🪵';
        return `<span class="tag-mini">${emo} ${t}</span>`;
      }).join(' ');
      
      item.innerHTML = `
        <div class="journal-list-date">${journal.date}</div>
        <div class="journal-list-title">${journal.title || 'Untitled Entry'}</div>
        <div class="journal-list-tags">${tagsHtml}</div>
      `;
      listContainer.appendChild(item);
    });
  }
  
  function loadActiveJournal() {
    const journal = state.journals.find(j => j.id === state.activeJournalId);
    const hoursInput = document.getElementById('journal-hours');
    if (journal) {
      titleInput.value = journal.title;
      bodyInput.value = journal.body;
      if (hoursInput) hoursInput.value = journal.hours || '';
      selectedTags = [...journal.tags];
      
      tagBtns.forEach(btn => {
        const tag = btn.getAttribute('data-tag');
        if (selectedTags.includes(tag)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    } else {
      titleInput.value = '';
      bodyInput.value = '';
      if (hoursInput) hoursInput.value = '';
      selectedTags = [];
      tagBtns.forEach(btn => btn.classList.remove('active'));
    }
  }
  
  function saveJournal() {
    const title = titleInput.value.trim() || 'Untitled Entry';
    const body = bodyInput.value.trim();
    const hoursInput = document.getElementById('journal-hours');
    const hours = hoursInput ? parseFloat(hoursInput.value) || 0 : 0;
    
    if (!body) return;
    
    let journal = state.journals.find(j => j.id === state.activeJournalId);
    
    if (journal) {
      journal.title = title;
      journal.body = body;
      journal.tags = [...selectedTags];
      journal.hours = hours;
    } else {
      const newId = 'j-' + Date.now();
      const today = new Date().toISOString().split('T')[0];
      journal = {
        id: newId,
        date: today,
        title: title,
        body: body,
        tags: [...selectedTags],
        hours: hours
      };
      state.journals.unshift(journal);
      state.activeJournalId = newId;
    }
    
    saveToStorage('portal_journals', state.journals);
    renderJournalList();
    loadActiveJournal();
    updateDashboardJournalPreview();
    
    // Refresh visual progress tracking calendar & activity logs
    if (typeof renderActivityMap === 'function') {
      renderActivityMap();
    }
    if (typeof renderActivityCharts === 'function') {
      renderActivityCharts();
    }
    if (typeof updateProgressMetrics === 'function') {
      updateProgressMetrics();
    }
  }
  
  tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
        btn.classList.remove('active');
      } else {
        selectedTags.push(tag);
        btn.classList.add('active');
      }
    });
  });
  
  listContainer.addEventListener('click', (e) => {
    const item = e.target.closest('.journal-list-item');
    if (item) {
      state.activeJournalId = item.getAttribute('data-id');
      renderJournalList();
      loadActiveJournal();
    }
  });
  
  newBtn.addEventListener('click', () => {
    state.activeJournalId = null;
    renderJournalList();
    loadActiveJournal();
    titleInput.focus();
  });
  
  saveBtn.addEventListener('click', saveJournal);
  
  let autosaveTimeout;
  bodyInput.addEventListener('input', () => {
    clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(() => {
      saveJournal();
    }, 1500);
  });
  
  renderJournalList();
  loadActiveJournal();
  updateDashboardJournalPreview();
}

function updateDashboardJournalPreview() {
  const container = document.getElementById('dash-recent-journals');
  if (!container) return;
  
  container.innerHTML = '';
  if (state.journals.length === 0) {
    container.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.85rem;">No journal entries yet.</div>';
    return;
  }
  
  state.journals.slice(0, 2).forEach(j => {
    const card = document.createElement('div');
    card.style.borderLeft = '3px solid var(--primary)';
    card.style.paddingLeft = '12px';
    card.style.marginBottom = '12px';
    card.innerHTML = `
      <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight:600; margin-bottom: 2px;">${j.date}</div>
      <div style="font-weight:600; font-size:0.9rem; margin-bottom: 4px;">${j.title}</div>
      <div style="font-size:0.8rem; color: var(--text-secondary); white-space: nowrap; overflow:hidden; text-overflow:ellipsis;">${j.body.substring(0, 80)}...</div>
    `;
    container.appendChild(card);
  });
}

// 9. Resources & Bookmarks Catalog
function setupResources() {
  const grid = document.getElementById('resources-grid');
  const tabsContainer = document.getElementById('resources-tabs');
  const openModalBtn = document.getElementById('resource-add-btn');
  const closeModalBtn = document.getElementById('modal-close');
  const modal = document.getElementById('resource-modal');
  const modalSaveBtn = document.getElementById('modal-save-btn');
  
  let activeTab = 'all';
  
  function renderResources() {
    grid.innerHTML = '';
    
    const filtered = state.resources.filter(res => {
      if (activeTab === 'all') return true;
      return res.cat === activeTab;
    });
    
    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">No resources found. Add one!</div>';
      return;
    }
    
    filtered.forEach(res => {
      const typeLabel = res.type === 'book' ? '📘 Book' : res.type === 'course' ? '🎓 Course' : '📄 Article';
      const badgeColor = res.type === 'book' ? 'badge-blue' : res.type === 'course' ? 'badge-purple' : 'badge-green';
      
      const card = document.createElement('a');
      card.className = 'resource-card';
      card.href = res.url || '#';
      card.target = '_blank';
      card.innerHTML = `
        <div class="resource-header">
          <span class="badge ${badgeColor}">${typeLabel}</span>
          <svg class="resource-link-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>
        </div>
        <div class="resource-title">${res.title}</div>
        <div class="resource-desc">${res.desc}</div>
        <div class="resource-footer">
          <span class="resource-author">${res.author || ''}</span>
        </div>
      `;
      grid.appendChild(card);
    });
  }
  
  tabsContainer.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.resource-tab-btn');
    if (tabBtn) {
      document.querySelectorAll('.resource-tab-btn').forEach(b => b.classList.remove('active'));
      tabBtn.classList.add('active');
      activeTab = tabBtn.getAttribute('data-cat');
      renderResources();
    }
  });
  
  openModalBtn.addEventListener('click', () => {
    modal.classList.add('active');
  });
  
  closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });
  
  modalSaveBtn.addEventListener('click', () => {
    const title = document.getElementById('modal-res-title').value.trim();
    const desc = document.getElementById('modal-res-desc').value.trim();
    const author = document.getElementById('modal-res-author').value.trim();
    const cat = document.getElementById('modal-res-cat').value;
    const type = document.getElementById('modal-res-type').value;
    const url = document.getElementById('modal-res-url').value.trim() || '#';
    
    if (!title || !desc) {
      alert('Please enter title and description');
      return;
    }
    
    const newRes = {
      id: Date.now(),
      title,
      desc,
      author,
      cat,
      type,
      url
    };
    
    state.resources.unshift(newRes);
    saveToStorage('portal_resources', state.resources);
    
    document.getElementById('modal-res-title').value = '';
    document.getElementById('modal-res-desc').value = '';
    document.getElementById('modal-res-author').value = '';
    document.getElementById('modal-res-url').value = '';
    
    modal.classList.remove('active');
    renderResources();
  });
  
  renderResources();
}

// 10. Rate Limiter Visual Simulator
function setupSimulator() {
  const tabsList = document.getElementById('visualizer-tabs-list');
  const sandboxContainer = document.getElementById('visualizer-sandbox-container');
  const customVisBtn = document.getElementById('custom-vis-btn');
  const customVisInput = document.getElementById('custom-vis-input');

  let activeIntervals = [];

  function stopAllSandboxIntervals() {
    activeIntervals.forEach(intervalId => clearInterval(intervalId));
    activeIntervals = [];
    if (state.simulator.autoSendInterval) {
      clearInterval(state.simulator.autoSendInterval);
      state.simulator.autoSendInterval = null;
    }
    state.simulator.isAutoSending = false;
    if (state.visualizer.lb.autoSendInterval) {
      clearInterval(state.visualizer.lb.autoSendInterval);
      state.visualizer.lb.autoSendInterval = null;
    }
    state.visualizer.lb.isAutoSending = false;

    if (window.activeSimIntervals) {
      window.activeSimIntervals.forEach(id => clearInterval(id));
      window.activeSimIntervals = [];
    }
  }
  window.stopAllSandboxIntervals = stopAllSandboxIntervals;

  // Handle visualizer tab selection clicks
  if (tabsList) {
    tabsList.addEventListener('click', (e) => {
      const tab = e.target.closest('.sprint-tab-btn');
      if (tab) {
        document.querySelectorAll('#visualizer-tabs-list .sprint-tab-btn').forEach(btn => btn.classList.remove('active'));
        tab.classList.add('active');
        
        stopAllSandboxIntervals();
        state.visualizer.activeConcept = tab.getAttribute('data-concept');
        renderActiveVisualizer();
      }
    });
  }

  // Handle Generate Simulation button click
  const generateSimBtn = document.getElementById('sandbox-generate-sim-btn');
  if (generateSimBtn) {
    generateSimBtn.addEventListener('click', () => {
      const typeSelect = document.getElementById('sandbox-type-selector');
      const epicSelect = document.getElementById('sandbox-epic-selector');
      
      const simType = typeSelect ? typeSelect.value : 'rate-limiter';
      const epicId = epicSelect ? epicSelect.value : '';
      
      stopAllSandboxIntervals();
      
      if (sandboxContainer) {
        sandboxContainer.innerHTML = `
          <div class="ai-compiling-overlay" style="padding: 60px; text-align: center; color: var(--accent);">
            <div style="font-size: 2.2rem; margin-bottom:12px; display:inline-block; animation: floatToken 1.2s infinite alternate;">⚙️</div>
            <div style="font-weight: 700; font-size: 1.1rem; color:var(--text-primary); margin-bottom:8px;">Initializing Simulation Engine</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);" id="engine-loading-step">Booting telemetry listeners...</div>
          </div>
        `;
      }
      
      setTimeout(() => {
        state.visualizer.attachedEpicId = epicId;
        state.visualizer.activeConcept = simType;
        saveToStorage('portal_attached_epic', epicId);
        
        renderVisualizerTabs();
        renderActiveVisualizer();
        
        const epic = epicId ? state.roadmap.flatMap(c => c.topics).find(t => t.id === epicId) : null;
        const epicName = epic ? epic.text : 'Standalone Sandbox';
        alert(`Simulation successfully initialized for Epic: "${epicName}"!`);
      }, 700);
    });
  }

  // Handle custom Gemini AI Visualizer generation
  if (customVisBtn && customVisInput) {
    customVisBtn.addEventListener('click', () => {
      const conceptName = customVisInput.value.trim();
      if (!conceptName) return;
      
      stopAllSandboxIntervals();
      
      if (sandboxContainer) {
        sandboxContainer.innerHTML = `
          <div class="ai-compiling-overlay" style="padding: 40px; text-align: center; color: var(--accent);">
            <div style="font-size: 2.2rem; margin-bottom:12px; display:inline-block; animation: floatToken 1.2s infinite alternate;">✨</div>
            <div style="font-weight: 700; font-size: 1.1rem; color:var(--text-primary); margin-bottom:8px;">Gemini AI Compiler Sandbox</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);" id="ai-loading-step">Analyzing "${conceptName}" architectural layout...</div>
          </div>
        `;
        
        const steps = [
          "Mapping simulation message schemas...",
          "Composing pipeline SVG pipelines...",
          "Injecting event stream listeners...",
          "Compiling reactive telemetry metrics..."
        ];
        
        let stepIdx = 0;
        const stepInterval = setInterval(() => {
          const stepLabel = document.getElementById('ai-loading-step');
          if (stepLabel && stepIdx < steps.length) {
            stepLabel.textContent = steps[stepIdx++];
          }
        }, 450);
        activeIntervals.push(stepInterval);

        setTimeout(() => {
          clearInterval(stepInterval);
          
          const cleanId = 'custom-' + conceptName.toLowerCase().replace(/\s+/g, '-');
          
          if (!state.visualizer.customConcepts.includes(conceptName)) {
            state.visualizer.customConcepts.push(conceptName);
            saveToStorage('portal_custom_concepts', state.visualizer.customConcepts);
            renderVisualizerTabs();
          }
          
          state.visualizer.activeConcept = cleanId;
          customVisInput.value = '';
          renderActiveVisualizer();
        }, 2000);
      }
    });
  }

  function renderVisualizerTabs() {
    if (!tabsList) return;
    
    let tabsHtml = `
      <button class="sprint-tab-btn ${state.visualizer.activeConcept === 'rate-limiter' ? 'active' : ''}" data-concept="rate-limiter">Rate Limiter</button>
      <button class="sprint-tab-btn ${state.visualizer.activeConcept === 'load-balancer' ? 'active' : ''}" data-concept="load-balancer">Load Balancer</button>
      <button class="sprint-tab-btn ${state.visualizer.activeConcept === 'lru-cache' ? 'active' : ''}" data-concept="lru-cache">LRU Cache</button>
      <button class="sprint-tab-btn ${state.visualizer.activeConcept === 'db-replication' ? 'active' : ''}" data-concept="db-replication">DB Replication</button>
      <button class="sprint-tab-btn ${state.visualizer.activeConcept === 'kafka' ? 'active' : ''}" data-concept="kafka">Kafka Partitioning</button>
      <button class="sprint-tab-btn ${state.visualizer.activeConcept === 'ai-prompt' ? 'active' : ''}" data-concept="ai-prompt">AI Prompt Sandbox</button>
      <button class="sprint-tab-btn ${state.visualizer.activeConcept === 'flowchart' ? 'active' : ''}" data-concept="flowchart">Interactive Flowchart</button>
      <button class="sprint-tab-btn ${state.visualizer.activeConcept === 'node-event-loop' ? 'active' : ''}" data-concept="node-event-loop">Node.js Event Loop</button>
    `;
    
    state.visualizer.customConcepts.forEach(name => {
      const cleanId = 'custom-' + name.toLowerCase().replace(/\s+/g, '-');
      tabsHtml += `
        <button class="sprint-tab-btn ${state.visualizer.activeConcept === cleanId ? 'active' : ''}" data-concept="${cleanId}">✨ ${name}</button>
      `;
    });
    
    tabsList.innerHTML = tabsHtml;
  }

  function renderActiveVisualizer() {
    const concept = state.visualizer.activeConcept;
    if (!sandboxContainer) return;

    // Create a mock topic if none attached to prevent errors in functions
    const topic = state.visualizer.attachedEpicId ? 
      state.roadmap.flatMap(c => c.topics).find(t => t.id === state.visualizer.attachedEpicId) : 
      { id: 'sandbox-mock-topic', text: 'Sandbox Simulation Concept', epicId: 'EPIC-SANDBOX', completed: false, notes: '', links: '', hoursLogged: 0, percentComplete: 0 };

    const epic = state.visualizer.attachedEpicId ? state.roadmap.flatMap(c => c.topics).find(t => t.id === state.visualizer.attachedEpicId) : null;
    let category = null;
    if (epic) {
      category = state.roadmap.find(c => c.topics.some(t => t.id === epic.id));
    }
    
    const attachmentBanner = epic ? `
      <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 0.8rem; color: var(--text-primary); display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="color:#10b981; font-weight:700;">●</span>
          <span>Active Simulation connected to Epic: <strong>${epic.text} [${epic.epicId || ''}]</strong></span>
        </div>
        ${category ? `<button type="button" onclick="window.location.hash='#category-${category.id}'" style="padding:4px 10px; font-size:0.7rem; font-weight:600; cursor:pointer; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">View Curriculum</button>` : ''}
      </div>
    ` : `
      <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 0.8rem; color: var(--text-secondary);">
        ℹ️ Sandbox currently running in standalone mode. Use the selector above to connect to a curriculum checkpoint Epic.
      </div>
    `;

    if (concept === 'rate-limiter') {
      sandboxContainer.innerHTML = attachmentBanner + getRateLimiterHtml();
      initRateLimiterHandlers();
    } else if (concept === 'load-balancer') {
      sandboxContainer.innerHTML = attachmentBanner + getLoadBalancerHtml();
      initLoadBalancerHandlers();
    } else if (concept === 'lru-cache') {
      sandboxContainer.innerHTML = attachmentBanner + getLruCacheHtml();
      initLruCacheHandlers();
    } else if (concept === 'db-replication') {
      sandboxContainer.innerHTML = attachmentBanner + getDbReplicationHtml();
      initDbReplicationHandlers();
    } else if (concept === 'kafka') {
      sandboxContainer.innerHTML = attachmentBanner + getKafkaSimulationHtml(topic);
      initializeKafkaSimulation(topic.id);
    } else if (concept === 'ai-prompt') {
      sandboxContainer.innerHTML = attachmentBanner + getPromptSimulationHtml(topic);
      initializePromptSimulation(topic.id);
    } else if (concept === 'flowchart') {
      sandboxContainer.innerHTML = attachmentBanner + getFlowchartSimulationHtml(topic);
      initializeFlowchartSimulation(topic.id, topic.text);
    } else if (concept === 'node-event-loop') {
      sandboxContainer.innerHTML = attachmentBanner + getNodeEventLoopHtml();
      initNodeEventLoopHandlers();
    } else if (concept.startsWith('custom-')) {
      const conceptName = state.visualizer.customConcepts.find(name => {
        const cleanId = 'custom-' + name.toLowerCase().replace(/\s+/g, '-');
        return cleanId === concept;
      }) || "Custom Simulation";
      
      sandboxContainer.innerHTML = attachmentBanner + getCustomSimHtml(conceptName);
      initCustomSimHandlers(conceptName);
    }
  }

  // ==========================================
  // 8. NODE.JS EVENT LOOP & LIBUV SUB-SIMULATOR
  // ==========================================
  function getNodeEventLoopHtml() {
    return `
      <div class="node-sim-container" style="display:flex; flex-direction:column; gap:20px; color:var(--text-primary);">
        <!-- Header controls -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; background:rgba(255,255,255,0.02); padding:16px; border:1px solid var(--border-color); border-radius:10px;">
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="button" class="btn btn-primary" id="btn-node-http" style="background:linear-gradient(135deg, var(--primary), var(--accent)); font-size:0.8rem; border:none; display:flex; align-items:center; gap:6px;">
              🌐 Outbound HTTP Call
            </button>
            <button type="button" class="btn btn-primary" id="btn-node-fs" style="background:var(--accent); font-size:0.8rem; border:none; display:flex; align-items:center; gap:6px;">
              📂 Async File I/O (fs)
            </button>
            <button type="button" class="btn btn-primary" id="btn-node-crypto" style="background:var(--badge-yellow); color:#000; font-size:0.8rem; border:none; display:flex; align-items:center; gap:6px;">
              🔑 CPU Crypto Hash
            </button>
            <button type="button" class="btn btn-secondary" id="btn-node-clear" style="font-size:0.8rem; display:flex; align-items:center; gap:6px;">
              🗑️ Reset Sim
            </button>
          </div>
          <div style="display:flex; align-items:center; gap:16px;">
            <label style="font-size:0.8rem; display:flex; align-items:center; gap:6px; color:var(--text-secondary);">
              Speed: 
              <select id="node-sim-speed" style="background:var(--bg-app); border:1px solid var(--border-color); color:var(--text-primary); padding:4px 8px; border-radius:4px; font-size:0.8rem; cursor:pointer;">
                <option value="1200">Normal (1.2s)</option>
                <option value="600">Fast (0.6s)</option>
                <option value="2500">Slow (2.5s)</option>
              </select>
            </label>
            <button type="button" class="btn btn-secondary" id="btn-node-auto" style="font-size:0.8rem;">
              ▶️ Auto-Inject Traffic
            </button>
          </div>
        </div>

        <!-- Grid Visualization Layout -->
        <div style="display:grid; grid-template-columns: 1.1fr 1fr; gap:20px; min-height:420px; flex-wrap:wrap;">
          
          <!-- Left Column: Single-Threaded Runtime -->
          <div style="display:flex; flex-direction:column; gap:16px; border:1px solid var(--border-color); border-radius:12px; padding:16px; background:rgba(255,255,255,0.01);">
            <h3 style="font-size:0.9rem; font-weight:800; border-bottom:1px solid var(--border-color); padding-bottom:8px; margin:0; display:flex; align-items:center; gap:6px; color:var(--text-primary);">
              <span style="color:var(--primary); font-size:0.7rem;">●</span> Single-Threaded JS Engine (V8 Runtime)
            </h3>
            
            <div style="display:grid; grid-template-columns: 1.1fr 1fr; gap:16px; flex:1;">
              <!-- Call Stack -->
              <div style="background:rgba(0,0,0,0.15); border:1px solid var(--border-color); border-radius:8px; padding:12px; display:flex; flex-direction:column;">
                <div style="font-size:0.7rem; font-weight:700; color:var(--text-secondary); margin-bottom:8px; display:flex; justify-content:space-between; text-transform:uppercase;">
                  <span>📥 CALL STACK</span>
                  <span id="node-stack-status" style="color:var(--text-muted); font-size:0.65rem;">Idle</span>
                </div>
                <div id="node-call-stack" style="display:flex; flex-direction:column-reverse; gap:6px; flex:1; justify-content:flex-start; min-height:180px; background:rgba(0,0,0,0.25); border-radius:6px; padding:10px; border:1px solid rgba(255,255,255,0.02);">
                  <!-- Stack frames mount here dynamically -->
                </div>
              </div>

              <!-- Event Loop Ring -->
              <div style="background:rgba(0,0,0,0.15); border:1px solid var(--border-color); border-radius:8px; padding:12px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size:0.7rem; font-weight:700; color:var(--text-secondary); margin-bottom:12px; width:100%; text-align:left; text-transform:uppercase;">🔄 Event Loop (libuv)</div>
                
                <div style="position:relative; width:120px; height:120px; border-radius:50%; border:3px dashed rgba(168, 85, 247, 0.25); display:flex; align-items:center; justify-content:center;" id="node-event-loop-circle">
                  <!-- Event Loop rotating pointer -->
                  <div id="node-event-loop-spinner" style="position:absolute; width:100%; height:100%; border-radius:50%; border-top:3px solid var(--accent); transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform: rotate(0deg);"></div>
                  <div style="text-align:center; font-size:0.65rem; font-weight:800; color:var(--text-primary); z-index:2; line-height:1.2;">
                    EVENT LOOP<br>
                    <span id="node-loop-phase" style="font-size:0.58rem; color:var(--accent); font-weight:bold; letter-spacing:0.5px;">POLL</span>
                  </div>
                </div>
                <div style="font-size:0.62rem; color:var(--text-muted); text-align:center; margin-top:12px; line-height:1.3;">Checks callback queue & triggers Call Stack execution.</div>
              </div>
            </div>

            <!-- Callback / Task Queue -->
            <div style="background:rgba(0,0,0,0.15); border:1px solid var(--border-color); border-radius:8px; padding:12px;">
              <div style="font-size:0.7rem; font-weight:700; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase; display:flex; justify-content:space-between;">
                <span>📋 CALLBACK QUEUE (Macro/Micro Tasks)</span>
                <span id="node-queue-count" style="color:var(--text-muted); font-size:0.65rem;">0 Items</span>
              </div>
              <div id="node-callback-queue" style="display:flex; gap:8px; min-height:54px; background:rgba(0,0,0,0.25); border-radius:6px; padding:8px; overflow-x:auto; align-items:center; border:1px solid rgba(255,255,255,0.02);">
                <!-- Callbacks wait here -->
                <div style="color:var(--text-muted); font-size:0.7rem; width:100%; text-align:center;">Queue is empty</div>
              </div>
            </div>

          </div>

          <!-- Right Column: Asynchronous Concurrency Layers -->
          <div style="display:flex; flex-direction:column; gap:16px; border:1px solid var(--border-color); border-radius:12px; padding:16px; background:rgba(255,255,255,0.01);">
            <h3 style="font-size:0.9rem; font-weight:800; border-bottom:1px solid var(--border-color); padding-bottom:8px; margin:0; display:flex; align-items:center; gap:6px; color:var(--text-primary);">
              <span style="color:var(--accent); font-size:0.7rem;">●</span> Non-Blocking Delegate Layer (OS & libuv)
            </h3>

            <!-- OS Network Sockets (epoll / kqueue) -->
            <div style="background:rgba(0,0,0,0.15); border:1px solid var(--border-color); border-radius:8px; padding:12px; flex:1; display:flex; flex-direction:column;">
              <div style="font-size:0.7rem; font-weight:700; color:var(--text-primary); margin-bottom:4px; display:flex; justify-content:space-between; align-items:center; text-transform:uppercase;">
                <span>🌐 OS Network Stack (Sockets)</span>
                <span style="font-size:0.6rem; color:#10b981; font-weight:800; background:rgba(16,185,129,0.08); padding:2px 6px; border-radius:4px;">No Threads (Asynchronous OS Kernel)</span>
              </div>
              <div style="font-size:0.68rem; color:var(--text-secondary); margin-bottom:10px;">Handles outbound network connections (`http.request`) without consuming Node.js threads.</div>
              <div id="node-os-sockets" style="display:flex; flex-direction:column; gap:6px; flex:1; background:rgba(0,0,0,0.25); border-radius:6px; padding:8px; min-height:76px; justify-content:center; border:1px solid rgba(255,255,255,0.02);">
                <div style="color:var(--text-muted); font-size:0.7rem; text-align:center;" id="node-no-sockets">No active network socket connections</div>
              </div>
            </div>

            <!-- Libuv Worker Thread Pool -->
            <div style="background:rgba(0,0,0,0.15); border:1px solid var(--border-color); border-radius:8px; padding:12px; flex:1; display:flex; flex-direction:column;">
              <div style="font-size:0.7rem; font-weight:700; color:var(--text-primary); margin-bottom:4px; display:flex; justify-content:space-between; align-items:center; text-transform:uppercase;">
                <span>🧵 Libuv Worker Threads</span>
                <span style="font-size:0.6rem; color:var(--accent); font-weight:800; background:rgba(168,85,247,0.08); padding:2px 6px; border-radius:4px;">ThreadPool (Size: 4)</span>
              </div>
              <div style="font-size:0.68rem; color:var(--text-secondary); margin-bottom:10px;">Executes blocking operations (File system operations `fs.*`, cryptography hashes, compression).</div>
              <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; flex:1; min-height:80px;" id="node-thread-pool">
                <!-- 4 Thread Workers -->
                <div class="thread-worker" id="node-worker-1" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); border-radius:6px; padding:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; font-size:0.65rem; transition:border-color 0.2s;">
                  <div style="font-weight:800; color:var(--text-secondary);">Worker #1</div>
                  <div class="worker-task" style="color:var(--text-muted); font-size:0.58rem; text-align:center;">Idle</div>
                </div>
                <div class="thread-worker" id="node-worker-2" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); border-radius:6px; padding:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; font-size:0.65rem; transition:border-color 0.2s;">
                  <div style="font-weight:800; color:var(--text-secondary);">Worker #2</div>
                  <div class="worker-task" style="color:var(--text-muted); font-size:0.58rem; text-align:center;">Idle</div>
                </div>
                <div class="thread-worker" id="node-worker-3" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); border-radius:6px; padding:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; font-size:0.65rem; transition:border-color 0.2s;">
                  <div style="font-weight:800; color:var(--text-secondary);">Worker #3</div>
                  <div class="worker-task" style="color:var(--text-muted); font-size:0.58rem; text-align:center;">Idle</div>
                </div>
                <div class="thread-worker" id="node-worker-4" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); border-radius:6px; padding:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; font-size:0.65rem; transition:border-color 0.2s;">
                  <div style="font-weight:800; color:var(--text-secondary);">Worker #4</div>
                  <div class="worker-task" style="color:var(--text-muted); font-size:0.58rem; text-align:center;">Idle</div>
                </div>
              </div>
            </div>

          </div>

        </div>

        <!-- Terminal Output Log -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; background:rgba(0,0,0,0.15); padding:16px; border:1px solid var(--border-color); border-radius:12px;">
          <!-- Log stream -->
          <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="font-size:0.7rem; font-weight:800; color:var(--text-secondary); display:flex; justify-content:space-between; text-transform:uppercase;">
              <span>📟 Process Terminal Console</span>
              <button type="button" id="btn-node-clear-console" style="background:none; border:none; color:var(--primary); cursor:pointer; font-size:0.65rem; font-weight:700;">Clear Output</button>
            </div>
            <div id="node-console" style="background:#05050a; font-family:var(--font-mono); font-size:0.7rem; line-height:1.45; padding:10px; border-radius:6px; height:150px; overflow-y:auto; border:1px solid var(--border-color); color:#a78bfa;">
              <div style="color:var(--text-muted);">Simulator ready. Click Outbound HTTP, Async File, or CPU Crypto to trigger execution ticks.</div>
            </div>
          </div>
          
          <!-- Tutorial Panel -->
          <div style="display:flex; flex-direction:column; justify-content:center; gap:8px; padding-left:16px; border-left:1px dashed var(--border-color);">
            <h4 style="font-size:0.8rem; font-weight:800; color:var(--primary); margin:0; text-transform:uppercase;">Node.js Single-Threaded Architecture Mechanics</h4>
            <div style="font-size:0.72rem; color:var(--text-secondary); line-height:1.45; display:flex; flex-direction:column; gap:4px;">
              <div>• <strong>Main Thread & Call Stack:</strong> Executing blocking CPU computations here locks the server. To keep the server fast, heavy tasks are delegated.</div>
              <div>• <strong>HTTP Network Sockets:</strong> Outbound requests are delegated directly to the OS kernel stack (epoll/kqueue). They consume 0 threads, which is how Node.js scale-handles millions of requests.</div>
              <div>• <strong>Libuv Worker Threads:</strong> Thread pools execute blocking system APIs (like DNS or File I/O) asynchronously, keeping the main thread free.</div>
              <div>• <strong>Event Loop cycles:</strong> Checks callback queues and pulls completions back into the Call Stack for immediate processing.</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function initNodeEventLoopHandlers() {
    let simState = {
      pendingTasks: [],
      callStack: [],
      callbackQueue: [],
      activeSockets: [],
      activeWorkers: [null, null, null, null],
      tickInterval: null,
      isAutoInjecting: false,
      autoInjectInterval: null,
      simSpeed: 1200,
      eventLoopAngle: 0,
      eventLoopPhases: ['POLL', 'CHECK', 'CLOSE', 'TIMER', 'PENDING'],
      eventLoopPhaseIndex: 0
    };

    const logToSim = (msg, color = 'var(--text-primary)') => {
      const consoleDiv = document.getElementById('node-console');
      if (!consoleDiv) return;
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const logItem = document.createElement('div');
      logItem.style.color = color;
      logItem.innerHTML = `<span style="color:var(--text-muted); font-weight:normal;">[${timeStr}]</span> ${msg}`;
      consoleDiv.appendChild(logItem);
      consoleDiv.scrollTop = consoleDiv.scrollHeight;
    };

    const addTask = (type, label) => {
      const task = {
        id: 'task-' + Math.random().toString(36).substr(2, 5),
        type: type,
        label: label,
        timer: type === 'http' ? 2 : (type === 'fs' ? 2 : 3),
        state: 'pending'
      };
      simState.pendingTasks.push(task);
      logToSim(`📥 Inbound trigger: <strong>${label}</strong> queued into memory.`, 'var(--text-primary)');
      renderState();
    };

    const renderState = () => {
      const stackDiv = document.getElementById('node-call-stack');
      const stackStatus = document.getElementById('node-stack-status');
      if (stackDiv) {
        if (simState.callStack.length === 0) {
          stackDiv.innerHTML = '<div style="color:var(--text-muted); font-size:0.7rem; text-align:center; padding-top:20px; width:100%;">Call Stack empty (Idle)</div>';
          if (stackStatus) {
            stackStatus.textContent = 'Idle';
            stackStatus.style.color = 'var(--text-muted)';
          }
        } else {
          stackDiv.innerHTML = simState.callStack.map(f => `
            <div style="background:${f.type === 'http' ? 'rgba(99, 102, 241, 0.15)' : (f.type === 'fs' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(234, 179, 8, 0.15)')}; border:1px solid ${f.type === 'http' ? 'var(--primary)' : (f.type === 'fs' ? 'var(--accent)' : 'var(--badge-yellow)')}; padding:6px 10px; border-radius:4px; font-size:0.72rem; text-align:center; font-family:var(--font-mono); font-weight:700; color:var(--text-primary);">
              ${f.label}
            </div>
          `).join('');
          if (stackStatus) {
            stackStatus.textContent = 'Executing';
            stackStatus.style.color = 'var(--accent)';
          }
        }
      }

      const socketsDiv = document.getElementById('node-os-sockets');
      if (socketsDiv) {
        if (simState.activeSockets.length === 0) {
          socketsDiv.innerHTML = '<div style="color:var(--text-muted); font-size:0.7rem; text-align:center; width:100%;" id="node-no-sockets">No active network socket connections</div>';
        } else {
          socketsDiv.innerHTML = simState.activeSockets.map(s => `
            <div style="padding:6px 10px; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.3); border-radius:6px; display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; width:100%;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="width:6px; height:6px; border-radius:50%; background:#10b981; display:inline-block;"></span>
                <span style="font-weight:700; color:var(--text-primary); font-family:var(--font-mono);">${s.label}</span>
              </div>
              <span style="color:var(--text-secondary); font-size:0.65rem;">timeout: ${s.timer}t</span>
            </div>
          `).join('');
        }
      }

      for (let i = 1; i <= 4; i++) {
        const workerDiv = document.getElementById(`node-worker-${i}`);
        if (workerDiv) {
          const task = simState.activeWorkers[i - 1];
          const taskLabelDiv = workerDiv.querySelector('.worker-task');
          if (task) {
            workerDiv.style.borderColor = task.type === 'fs' ? 'var(--accent)' : 'var(--badge-yellow)';
            workerDiv.style.background = 'rgba(168, 85, 247, 0.05)';
            if (taskLabelDiv) {
              taskLabelDiv.innerHTML = `<span style="font-weight:bold; color:var(--text-primary); font-family:var(--font-mono);">${task.type.toUpperCase()} Thread</span><br><span style="font-size:0.55rem; color:var(--text-secondary);">t-rem: ${task.timer}t</span>`;
            }
          } else {
            workerDiv.style.borderColor = 'var(--border-color)';
            workerDiv.style.background = 'rgba(0,0,0,0.3)';
            if (taskLabelDiv) {
              taskLabelDiv.textContent = 'Idle';
              taskLabelDiv.style.color = 'var(--text-muted)';
            }
          }
        }
      }

      const queueDiv = document.getElementById('node-callback-queue');
      const queueCountSpan = document.getElementById('node-queue-count');
      if (queueDiv) {
        if (simState.callbackQueue.length === 0) {
          queueDiv.innerHTML = '<div style="color:var(--text-muted); font-size:0.7rem; width:100%; text-align:center;">Queue is empty</div>';
        } else {
          queueDiv.innerHTML = simState.callbackQueue.map(c => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:4px; padding:4px 8px; font-size:0.68rem; font-family:var(--font-mono); font-weight:700; white-space:nowrap; color:var(--accent);">
              ${c.label}
            </div>
          `).join('');
        }
      }
      if (queueCountSpan) {
        queueCountSpan.textContent = `${simState.callbackQueue.length} Items`;
      }
    };

    const runNodeSimTick = () => {
      simState.eventLoopAngle += 72;
      const spinner = document.getElementById('node-event-loop-spinner');
      if (spinner) {
        spinner.style.transform = `rotate(${simState.eventLoopAngle}deg)`;
      }
      simState.eventLoopPhaseIndex = (simState.eventLoopPhaseIndex + 1) % simState.eventLoopPhases.length;
      const phaseText = document.getElementById('node-loop-phase');
      if (phaseText) {
        phaseText.textContent = simState.eventLoopPhases[simState.eventLoopPhaseIndex];
      }

      // Decrement timers
      simState.activeSockets.forEach(s => {
        s.timer--;
        if (s.timer <= 0) {
          logToSim(`✔️ OS Network response received for: <strong>${s.label}</strong>. Callback pushed to Callback Queue.`, '#10b981');
          simState.callbackQueue.push({ type: s.type, id: s.id, label: `cb_httpResponse` });
        }
      });
      simState.activeSockets = simState.activeSockets.filter(s => s.timer > 0);

      for (let i = 0; i < 4; i++) {
        const task = simState.activeWorkers[i];
        if (task) {
          task.timer--;
          if (task.timer <= 0) {
            const cbName = task.type === 'fs' ? 'cb_fileRead' : 'cb_cryptoDone';
            logToSim(`✔️ Worker Thread #${i + 1} completed blocked operation. Pushed <strong>${cbName}</strong> to Callback Queue.`, 'var(--accent)');
            simState.callbackQueue.push({ type: task.type, id: task.id, label: cbName });
            simState.activeWorkers[i] = null;
          }
        }
      }

      // Process Call Stack
      if (simState.callStack.length > 0) {
        const topFrame = simState.callStack[simState.callStack.length - 1];
        
        if (topFrame.state === 'stack-executing') {
          if (topFrame.type === 'http') {
            logToSim(`🚀 Main Thread executes Outbound HTTP request setup. Registering socket in OS kernel...`, 'var(--primary)');
            simState.activeSockets.push({
              id: topFrame.id,
              type: 'http',
              label: `socket_${topFrame.id}`,
              timer: 2
            });
            simState.callStack.pop();
            logToSim(`💨 Socket registered. Call Stack pops frame. Main thread remains UNBLOCKED!`, 'var(--text-secondary)');
          } 
          else if (topFrame.type === 'fs') {
            const idleWorkerIndex = simState.activeWorkers.indexOf(null);
            if (idleWorkerIndex !== -1) {
              logToSim(`🚀 Main Thread executes blocking file call. Offloading task to <strong>Libuv Worker Thread #${idleWorkerIndex + 1}</strong>...`, 'var(--accent)');
              topFrame.timer = 2;
              simState.activeWorkers[idleWorkerIndex] = topFrame;
              simState.callStack.pop();
              logToSim(`💨 Task offloaded. Call Stack pops frame. Main thread remains UNBLOCKED!`, 'var(--text-secondary)');
            } else {
              logToSim(`⚠️ Worker threads busy. File read waiting in threadpool queues...`, 'var(--badge-yellow)');
            }
          } 
          else if (topFrame.type === 'crypto') {
            const idleWorkerIndex = simState.activeWorkers.indexOf(null);
            if (idleWorkerIndex !== -1) {
              logToSim(`🚀 Main Thread executes intensive CPU hashing. Offloading task to <strong>Libuv Worker Thread #${idleWorkerIndex + 1}</strong>...`, 'var(--badge-yellow)');
              topFrame.timer = 3;
              simState.activeWorkers[idleWorkerIndex] = topFrame;
              simState.callStack.pop();
              logToSim(`💨 Hashing delegated. Call Stack pops frame. Main thread remains UNBLOCKED!`, 'var(--text-secondary)');
            } else {
              logToSim(`⚠️ Worker threads busy. Hashing request waiting...`, 'var(--badge-yellow)');
            }
          } 
          else {
            logToSim(`🏁 Finished callback execution: <strong>${topFrame.label}</strong>. Pushed data to client/heap.`, 'var(--text-muted)');
            simState.callStack.pop();
          }
        }
      } 
      else if (simState.callbackQueue.length > 0) {
        const cb = simState.callbackQueue.shift();
        logToSim(`🔄 Event Loop detects Call Stack is empty. Pushing <strong>${cb.label}</strong> to Call Stack for immediate single-threaded execution.`, 'var(--primary)');
        cb.state = 'stack-executing';
        simState.callStack.push(cb);
      }
      else if (simState.pendingTasks.length > 0) {
        const pendingTask = simState.pendingTasks.shift();
        logToSim(`📥 Main Thread grabs request: <strong>${pendingTask.label}</strong>. Pushing frame to stack.`, 'var(--text-primary)');
        pendingTask.state = 'stack-executing';
        simState.callStack.push(pendingTask);
      }

      renderState();
    };

    const startSimLoop = () => {
      if (simState.tickInterval) clearInterval(simState.tickInterval);
      simState.tickInterval = setInterval(runNodeSimTick, simState.simSpeed);
      if (window.activeSimIntervals) {
        window.activeSimIntervals.push(simState.tickInterval);
      } else {
        window.activeSimIntervals = [simState.tickInterval];
      }
    };

    document.getElementById('btn-node-http').addEventListener('click', () => {
      addTask('http', 'http.request("api.github.com/jaibharata")');
    });

    document.getElementById('btn-node-fs').addEventListener('click', () => {
      addTask('fs', 'fs.readFile("index.html")');
    });

    document.getElementById('btn-node-crypto').addEventListener('click', () => {
      addTask('crypto', 'crypto.pbkdf2(pwd, salt)');
    });

    document.getElementById('btn-node-clear').addEventListener('click', () => {
      simState.pendingTasks = [];
      simState.callStack = [];
      simState.callbackQueue = [];
      simState.activeSockets = [];
      simState.activeWorkers = [null, null, null, null];
      logToSim(`🧹 Simulation states fully reset. Thread heap and socket registers cleared.`, 'var(--text-muted)');
      renderState();
    });

    document.getElementById('btn-node-clear-console').addEventListener('click', () => {
      const consoleDiv = document.getElementById('node-console');
      if (consoleDiv) consoleDiv.innerHTML = '<div style="color:var(--text-muted);">Console logs cleared. Ready for execution ticks.</div>';
    });

    const speedSelect = document.getElementById('node-sim-speed');
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        simState.simSpeed = parseInt(e.target.value);
        logToSim(`⚡ Speed adjusted to ${simState.simSpeed}ms.`, 'var(--text-secondary)');
        startSimLoop();
      });
    }

    const autoBtn = document.getElementById('btn-node-auto');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        if (simState.isAutoInjecting) {
          clearInterval(simState.autoInjectInterval);
          simState.autoInjectInterval = null;
          simState.isAutoInjecting = false;
          autoBtn.textContent = '▶️ Auto-Inject Traffic';
          autoBtn.classList.remove('btn-danger');
          logToSim(`⏹️ Auto-injection of client traffic stopped.`, 'var(--text-secondary)');
        } else {
          simState.isAutoInjecting = true;
          autoBtn.textContent = '⏹️ Stop Traffic';
          autoBtn.classList.add('btn-danger');
          logToSim(`▶️ Auto-injection of client traffic started. Simulating random inbound user requests...`, 'var(--accent)');
          
          simState.autoInjectInterval = setInterval(() => {
            const types = ['http', 'fs', 'crypto'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            if (randomType === 'http') {
              addTask('http', `HTTP GET /api/resource-${Math.floor(Math.random() * 100)}`);
            } else if (randomType === 'fs') {
              addTask('fs', `fs.readFile("file-${Math.floor(Math.random() * 5)}.txt")`);
            } else {
              addTask('crypto', `crypto.scrypt("pwd-${Math.floor(Math.random() * 10)}")`);
            }
          }, 3000);

          if (window.activeSimIntervals) {
            window.activeSimIntervals.push(simState.autoInjectInterval);
          } else {
            window.activeSimIntervals = [simState.autoInjectInterval];
          }
        }
      });
    }

    startSimLoop();
    renderState();
  }

  // ==========================================
  // 1. RATE LIMITER SUB-SIMULATOR
  // ==========================================
  function getRateLimiterHtml() {
    return `
      <div class="simulator-layout">
        <!-- Controls panel (Left) -->
        <div class="simulator-controls">
          <div class="control-group">
            <span class="control-label">Limiting Algorithm</span>
            <div class="select-btn-group">
              <button class="select-btn ${state.simulator.type === 'token-bucket' ? 'active' : ''}" data-sim="token-bucket">Token Bucket</button>
              <button class="select-btn ${state.simulator.type === 'leaky-bucket' ? 'active' : ''}" data-sim="leaky-bucket">Leaky Bucket</button>
              <button class="select-btn ${state.simulator.type === 'sliding-window' ? 'active' : ''}" data-sim="sliding-window">Sliding Window</button>
            </div>
          </div>

          <div class="control-group">
            <span class="control-label">
              <span>Bucket Capacity (Limit)</span>
              <span id="sim-cap-val">${state.simulator.capacity}</span>
            </span>
            <input type="range" class="control-slider" id="sim-cap" min="5" max="20" value="${state.simulator.capacity}">
          </div>

          <div class="control-group">
            <span class="control-label">
              <span>Refill / Leak Rate</span>
              <span id="sim-rate-val">${state.simulator.rate}/s</span>
            </span>
            <input type="range" class="control-slider" id="sim-rate" min="0.5" max="5" step="0.5" value="${state.simulator.rate}">
          </div>

          <div style="display: flex; gap: 10px; margin-top: 8px;">
            <button class="btn btn-primary" id="sim-send-btn" style="flex: 1; justify-content: center; border-radius: 8px;">
              Send Request
            </button>
            <button class="btn ${state.simulator.isAutoSending ? 'btn-primary' : 'btn-secondary'}" id="sim-auto-toggle" style="justify-content: center; border-radius: 8px; font-size: 0.8rem; padding: 10px 12px;">
              ${state.simulator.isAutoSending ? 'Auto Send (ON)' : 'Auto Send (OFF)'}
            </button>
          </div>
        </div>

        <!-- Visualization Panel (Right) -->
        <div>
          <div class="simulator-visualization">
            
            <div class="sim-status-indicator success" id="sim-indicator">
              <div class="indicator-dot"></div>
              <span>Waiting</span>
            </div>
            
            <div class="blocked-barrier" id="blocked-barrier">
              <div class="blocked-message">⚠️ HTTP 429: Too Many Requests</div>
            </div>

            <div class="bucket-visual-wrapper">
              <div class="bucket-outline" id="bucket-outline"></div>
              <div class="bucket-water-fill" id="bucket-water-fill"></div>
              <div class="tokens-container" id="tokens-container"></div>
            </div>

          </div>
          
          <div class="sim-logs-container">
            <h4 style="font-weight:600; font-size: 0.9rem; margin-bottom:12px;">Simulation Requests Log:</h4>
            <table class="sim-logs-table">
              <thead>
                <tr>
                  <th style="width: 25%;">Timestamp</th>
                  <th style="width: 25%;">Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody id="sim-logs-body">
                <tr>
                  <td colspan="3" style="text-align:center; color: var(--text-secondary);">Simulator ready. Send requests.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function initRateLimiterHandlers() {
    const container = document.getElementById('tokens-container');
    const sendRequestBtn = document.getElementById('sim-send-btn');
    const autoSendToggle = document.getElementById('sim-auto-toggle');
    const typeBtns = document.querySelectorAll('.select-btn[data-sim]');
    
    const capSlider = document.getElementById('sim-cap');
    const rateSlider = document.getElementById('sim-rate');
    const capVal = document.getElementById('sim-cap-val');
    const rateVal = document.getElementById('sim-rate-val');
    
    const indicator = document.getElementById('sim-indicator');
    const barrier = document.getElementById('blocked-barrier');
    const logList = document.getElementById('sim-logs-body');
    
    const waterFill = document.getElementById('bucket-water-fill');
    const bucketOutline = document.getElementById('bucket-outline');

    if (capSlider && rateSlider) {
      capSlider.addEventListener('input', () => {
        state.simulator.capacity = parseInt(capSlider.value);
        if (capVal) capVal.textContent = state.simulator.capacity;
        resetRateLimiterState();
      });
      
      rateSlider.addEventListener('input', () => {
        state.simulator.rate = parseFloat(rateSlider.value);
        if (rateVal) rateVal.textContent = state.simulator.rate + '/s';
      });
    }
    
    typeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        typeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.simulator.type = btn.getAttribute('data-sim');
        resetRateLimiterState();
      });
    });

    function resetRateLimiterState() {
      state.simulator.tokens = state.simulator.capacity;
      state.simulator.waterLevel = 0;
      state.simulator.slidingWindowRequests = [];
      if (logList) logList.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--text-secondary);">Simulator ready. Send requests.</td></tr>';
      
      if (bucketOutline && container && waterFill) {
        if (state.simulator.type === 'token-bucket') {
          bucketOutline.style.display = 'block';
          container.style.display = 'flex';
          waterFill.style.display = 'none';
        } else if (state.simulator.type === 'leaky-bucket') {
          bucketOutline.style.display = 'block';
          container.style.display = 'none';
          waterFill.style.display = 'block';
          waterFill.style.height = '0%';
        } else {
          bucketOutline.style.display = 'none';
          container.style.display = 'none';
          waterFill.style.display = 'none';
        }
      }
      renderRateLimiterVisual();
    }

    function logRateLimiterRequest(status, detail) {
      if (!logList) return;
      const timestamp = new Date().toLocaleTimeString();
      const row = document.createElement('tr');
      const badgeColor = status === 'ALLOWED' ? 'color: var(--success); font-weight: 600;' : 'color: var(--danger); font-weight: 600;';
      row.innerHTML = `
        <td>${timestamp}</td>
        <td style="${badgeColor}">${status}</td>
        <td>${detail}</td>
      `;
      if (logList.firstChild && logList.firstChild.textContent.includes("ready")) {
        logList.innerHTML = '';
      }
      logList.insertBefore(row, logList.firstChild);
      if (logList.children.length > 5) {
        logList.removeChild(logList.lastChild);
      }
    }

    function handleBlockedAnimation() {
      if (indicator) {
        indicator.className = 'sim-status-indicator blocked';
        indicator.querySelector('span').textContent = 'Blocked (429)';
      }
      if (barrier) {
        barrier.classList.add('active');
        setTimeout(() => barrier.classList.remove('active'), 400);
      }
    }

    function handleAllowedAnimation() {
      if (indicator) {
        indicator.className = 'sim-status-indicator success';
        indicator.querySelector('span').textContent = 'Success (200)';
      }
    }

    function fireRequest() {
      const now = Date.now();
      if (state.simulator.type === 'token-bucket') {
        if (state.simulator.tokens >= 1) {
          state.simulator.tokens = Math.floor(state.simulator.tokens - 1);
          handleAllowedAnimation();
          logRateLimiterRequest('ALLOWED', `Consumed 1 token. Tokens left: ${state.simulator.tokens.toFixed(0)}`);
        } else {
          handleBlockedAnimation();
          logRateLimiterRequest('BLOCKED', `Insufficient tokens in bucket`);
        }
      } else if (state.simulator.type === 'leaky-bucket') {
        const requestWater = 20;
        if (state.simulator.waterLevel + requestWater <= 100) {
          state.simulator.waterLevel = Math.min(100, state.simulator.waterLevel + requestWater);
          handleAllowedAnimation();
          logRateLimiterRequest('ALLOWED', `Queued in buffer. Level: ${state.simulator.waterLevel.toFixed(0)}%`);
        } else {
          handleBlockedAnimation();
          logRateLimiterRequest('BLOCKED', `Buffer overflow! Request discarded`);
        }
      } else {
        const windowMs = 10000;
        const limit = state.simulator.capacity;
        state.simulator.slidingWindowRequests = state.simulator.slidingWindowRequests.filter(t => now - t < windowMs);
        if (state.simulator.slidingWindowRequests.length < limit) {
          state.simulator.slidingWindowRequests.push(now);
          handleAllowedAnimation();
          logRateLimiterRequest('ALLOWED', `Request logged. Current window: ${state.simulator.slidingWindowRequests.length}/${limit}`);
        } else {
          handleBlockedAnimation();
          logRateLimiterRequest('BLOCKED', `Rate limit exceeded in window`);
        }
      }
      renderRateLimiterVisual();
    }

    function renderRateLimiterVisual() {
      if (!container) return;
      if (state.simulator.type === 'token-bucket') {
        container.innerHTML = '';
        const count = Math.floor(state.simulator.tokens);
        for (let i = 0; i < count; i++) {
          const dot = document.createElement('div');
          dot.className = 'token-node';
          dot.style.setProperty('--i', i);
          container.appendChild(dot);
        }
      } else if (state.simulator.type === 'leaky-bucket') {
        if (waterFill) waterFill.style.height = `${state.simulator.waterLevel}%`;
      } else {
        container.innerHTML = '';
        const count = state.simulator.slidingWindowRequests.length;
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.height = '100%';
        container.style.flexDirection = 'column';
        
        let dotListHtml = '';
        for (let i = 0; i < state.simulator.capacity; i++) {
          const isActive = i < count;
          const color = isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)';
          const shadow = isActive ? 'box-shadow: 0 0 10px var(--primary);' : '';
          dotListHtml += `<div style="width: 14px; height: 14px; border-radius:50%; background-color: ${color}; ${shadow} transition: all 0.2s;"></div>`;
        }
        
        container.innerHTML = `
          <div style="font-weight:600; font-size: 0.8rem; margin-bottom: 8px; color: var(--text-secondary);">ROLLING WINDOW (10s)</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;">${dotListHtml}</div>
          <div style="font-size: 1.4rem; font-weight:800; margin-top: 12px;">${count} / ${state.simulator.capacity}</div>
        `;
      }
    }

    // Refill tick timer
    const refillInterval = setInterval(() => {
      const tickSec = 0.1;
      if (state.simulator.type === 'token-bucket') {
        state.simulator.tokens = Math.min(state.simulator.capacity, state.simulator.tokens + (state.simulator.rate * tickSec));
        renderRateLimiterVisual();
      } else if (state.simulator.type === 'leaky-bucket') {
        state.simulator.waterLevel = Math.max(0, state.simulator.waterLevel - (state.simulator.rate * 5 * tickSec));
        renderRateLimiterVisual();
      } else {
        const now = Date.now();
        const countBefore = state.simulator.slidingWindowRequests.length;
        state.simulator.slidingWindowRequests = state.simulator.slidingWindowRequests.filter(t => now - t < 10000);
        if (state.simulator.slidingWindowRequests.length !== countBefore) {
          renderRateLimiterVisual();
        }
      }
    }, 100);
    activeIntervals.push(refillInterval);

    if (sendRequestBtn) sendRequestBtn.addEventListener('click', fireRequest);
    
    if (autoSendToggle) {
      autoSendToggle.addEventListener('click', () => {
        if (state.simulator.isAutoSending) {
          clearInterval(state.simulator.autoSendInterval);
          state.simulator.autoSendInterval = null;
          state.simulator.isAutoSending = false;
          autoSendToggle.textContent = 'Auto Send (OFF)';
          autoSendToggle.className = 'btn btn-secondary';
        } else {
          state.simulator.isAutoSending = true;
          autoSendToggle.textContent = 'Auto Send (ON)';
          autoSendToggle.className = 'btn btn-primary';
          
          state.simulator.autoSendInterval = setInterval(fireRequest, 400);
        }
      });
    }

    resetRateLimiterState();
  }

  // ==========================================
  // 2. LOAD BALANCER SUB-SIMULATOR
  // ==========================================
  function getLoadBalancerHtml() {
    return `
      <div class="simulator-layout">
        <!-- Controls Panel -->
        <div class="simulator-controls">
          <div class="control-group">
            <span class="control-label">Load Balancing Algorithm</span>
            <div class="select-btn-group" style="grid-template-columns: repeat(3, 1fr);">
              <button class="select-btn ${state.visualizer.lb.algo === 'round-robin' ? 'active' : ''}" data-lb-algo="round-robin">Round Robin</button>
              <button class="select-btn ${state.visualizer.lb.algo === 'weighted' ? 'active' : ''}" data-lb-algo="weighted">Weighted RR</button>
              <button class="select-btn ${state.visualizer.lb.algo === 'least-conn' ? 'active' : ''}" data-lb-algo="least-conn">Least Conn</button>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 4px;">
            <span class="control-label" style="margin-bottom:8px;">Backend Servers Config</span>
            <div style="display:flex; flex-direction:column; gap:10px;">
              ${state.visualizer.lb.servers.map(srv => `
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
                  <label style="display:flex; align-items:center; gap:6px; font-weight:600; cursor:pointer;">
                    <input type="checkbox" class="srv-toggle" data-srv-id="${srv.id}" ${srv.active ? 'checked' : ''}>
                    <span>${srv.name}</span>
                  </label>
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span>Weight:</span>
                    <input type="number" class="modal-input srv-weight" data-srv-id="${srv.id}" value="${srv.weight}" min="1" max="5" style="width:40px; padding:2px; border-radius:4px; text-align:center;">
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 16px;">
            <button class="btn btn-primary" id="lb-send-btn" style="flex: 1; justify-content: center; border-radius: 8px;">
              Route Request
            </button>
            <button class="btn ${state.visualizer.lb.isAutoSending ? 'btn-primary' : 'btn-secondary'}" id="lb-auto-toggle" style="justify-content: center; border-radius: 8px; font-size: 0.8rem; padding: 10px 12px;">
              ${state.visualizer.lb.isAutoSending ? 'Auto Send (ON)' : 'Auto Send (OFF)'}
            </button>
          </div>
        </div>

        <!-- Visualization Panel -->
        <div>
          <div class="simulator-visualization">
            <div style="display:flex; flex-direction:column; align-items:center; gap:16px; width:100%;">
              <div style="background:var(--primary-glow); border:2px solid var(--primary); border-radius:50%; width:44px; height:44px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.7rem; color:var(--primary);">CLIENT</div>
              <div style="background:var(--accent-glow); border:2px solid var(--accent); border-radius:8px; padding:6px 12px; font-weight:700; font-size:0.75rem; color:var(--accent);">LOAD BALANCER</div>
              <div class="lb-servers-container" id="lb-servers-container-visual"></div>
            </div>
          </div>

          <!-- Logs -->
          <div class="sim-logs-container">
            <h4 style="font-weight:600; font-size: 0.9rem; margin-bottom:12px;">Router Logs:</h4>
            <table class="sim-logs-table">
              <thead>
                <tr>
                  <th style="width: 25%;">Timestamp</th>
                  <th style="width: 25%;">Server Selected</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody id="lb-logs-body">
                <tr>
                  <td colspan="3" style="text-align:center; color: var(--text-secondary);">Load balancer ready. Route requests.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function initLoadBalancerHandlers() {
    const visualContainer = document.getElementById('lb-servers-container-visual');
    const sendBtn = document.getElementById('lb-send-btn');
    const autoToggle = document.getElementById('lb-auto-toggle');
    const logsBody = document.getElementById('lb-logs-body');
    const algoBtns = document.querySelectorAll('[data-lb-algo]');

    function renderLbVisual() {
      if (!visualContainer) return;
      visualContainer.innerHTML = state.visualizer.lb.servers.map(srv => `
        <div class="lb-server-node ${srv.active ? 'active' : 'offline'}" id="lb-server-node-${srv.id}">
          <div style="display:flex; justify-content:center; align-items:center;">
            <span class="lb-status-dot"></span>
            <span style="font-weight:700; font-size:0.8rem;">${srv.name}</span>
          </div>
          <div style="font-size:0.65rem; color:var(--text-secondary);">
            Active Connections: <b style="color:var(--text-primary);" id="srv-conn-${srv.id}">${srv.connections}</b>
          </div>
          <div style="font-size:0.65rem; color:var(--text-secondary);">
            Weight: <b>${srv.weight}</b>
          </div>
        </div>
      `).join('');
    }

    // Set connection decay loop to simulate servers completing their jobs
    const decayInterval = setInterval(() => {
      state.visualizer.lb.servers.forEach(srv => {
        if (srv.connections > 0 && Math.random() > 0.4) {
          srv.connections--;
        }
      });
      state.visualizer.lb.servers.forEach(srv => {
        const countLabel = document.getElementById(`srv-conn-${srv.id}`);
        if (countLabel) countLabel.textContent = srv.connections;
      });
    }, 1200);
    activeIntervals.push(decayInterval);

    // Toggle Algo Click
    algoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        algoBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.visualizer.lb.algo = btn.getAttribute('data-lb-algo');
      });
    });

    // Checkboxes change
    document.querySelectorAll('.srv-toggle').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-srv-id');
        const srv = state.visualizer.lb.servers.find(s => s.id === id);
        if (srv) {
          srv.active = e.target.checked;
          if (!srv.active) srv.connections = 0;
          renderLbVisual();
        }
      });
    });

    // Weight inputs change
    document.querySelectorAll('.srv-weight').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-srv-id');
        const srv = state.visualizer.lb.servers.find(s => s.id === id);
        if (srv) {
          srv.weight = Math.max(1, Math.min(5, parseInt(e.target.value) || 1));
          e.target.value = srv.weight;
          renderLbVisual();
        }
      });
    });

    function logLbRoute(serverName, details) {
      if (!logsBody) return;
      const timestamp = new Date().toLocaleTimeString();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${timestamp}</td>
        <td style="color:var(--accent); font-weight:700;">${serverName || 'BLOCKED'}</td>
        <td>${details}</td>
      `;
      if (logsBody.firstChild && logsBody.firstChild.textContent.includes("ready")) {
        logsBody.innerHTML = '';
      }
      logsBody.insertBefore(row, logsBody.firstChild);
      if (logsBody.children.length > 5) {
        logsBody.removeChild(logsBody.lastChild);
      }
    }

    function routeRequest() {
      const activeServers = state.visualizer.lb.servers.filter(s => s.active);
      if (activeServers.length === 0) {
        logLbRoute(null, 'Error: All backend servers are offline!');
        return;
      }
      
      let selected = null;
      const algo = state.visualizer.lb.algo;
      
      if (algo === 'round-robin') {
        selected = activeServers[state.visualizer.lb.nextServerIndex % activeServers.length];
        state.visualizer.lb.nextServerIndex = (state.visualizer.lb.nextServerIndex + 1) % activeServers.length;
      } else if (algo === 'weighted') {
        const totalWeight = activeServers.reduce((sum, s) => sum + s.weight, 0);
        let rand = Math.random() * totalWeight;
        let sum = 0;
        for (let s of activeServers) {
          sum += s.weight;
          if (rand <= sum) {
            selected = s;
            break;
          }
        }
        if (!selected) selected = activeServers[0];
      } else {
        // Least connections algorithm
        const sorted = [...activeServers].sort((x, y) => x.connections - y.connections);
        selected = sorted[0];
      }

      if (selected) {
        selected.connections++;
        renderLbVisual();
        logLbRoute(selected.name, `Routed via ${algo.toUpperCase()}. Current active conns: ${selected.connections}`);
        
        // Highlight server card visually
        const nodeEl = document.getElementById(`lb-server-node-${selected.id}`);
        if (nodeEl) {
          nodeEl.classList.add('pulse-glow-green');
          setTimeout(() => nodeEl.classList.remove('pulse-glow-green'), 500);
        }
      }
    }

    if (sendBtn) sendBtn.addEventListener('click', routeRequest);

    if (autoToggle) {
      autoToggle.addEventListener('click', () => {
        if (state.visualizer.lb.isAutoSending) {
          clearInterval(state.visualizer.lb.autoSendInterval);
          state.visualizer.lb.autoSendInterval = null;
          state.visualizer.lb.isAutoSending = false;
          autoToggle.textContent = 'Auto Send (OFF)';
          autoToggle.className = 'btn btn-secondary';
        } else {
          state.visualizer.lb.isAutoSending = true;
          autoToggle.textContent = 'Auto Send (ON)';
          autoToggle.className = 'btn btn-primary';
          
          state.visualizer.lb.autoSendInterval = setInterval(routeRequest, 500);
        }
      });
    }

    renderLbVisual();
  }

  // ==========================================
  // 3. LRU CACHE SUB-SIMULATOR
  // ==========================================
  function getLruCacheHtml() {
    return `
      <div class="simulator-layout">
        <!-- Controls Panel -->
        <div class="simulator-controls">
          <div class="control-group">
            <span class="control-label">Request Data Keys</span>
            <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:8px;">Request a key to test LRU cache loading and eviction loops.</p>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;">
              ${['Key_A', 'Key_B', 'Key_C', 'Key_D', 'Key_E', 'Key_F'].map(k => `
                <button class="btn btn-secondary cache-req-btn" data-key="${k}" style="padding:8px 4px; justify-content:center; font-size:0.8rem; border-radius:8px;">${k}</button>
              `).join('')}
            </div>
          </div>
          
          <div style="border-top:1px solid var(--border-color); padding-top:12px; margin-top:8px;">
            <span class="control-label">Cache Statistics</span>
            <div style="display:flex; flex-direction:column; gap:6px; font-size:0.8rem; margin-top:6px;">
              <div style="display:flex; justify-content:space-between;">
                <span>Cache Hits:</span>
                <span id="cache-hit-count" style="color:var(--success); font-weight:700;">${state.visualizer.cache.hits}</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span>Cache Misses:</span>
                <span id="cache-miss-count" style="color:var(--warning); font-weight:700;">${state.visualizer.cache.misses}</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span>Hit Ratio:</span>
                <span id="cache-ratio" style="font-weight:700;">0%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Visualization Panel -->
        <div>
          <div class="simulator-visualization">
            <div style="display:flex; flex-direction:column; align-items:center; gap:16px; width:100%;">
              <div id="cache-hit-miss-alert" style="padding:4px 14px; border-radius:12px; font-weight:700; font-size:0.8rem; height:24px; color:#fff; display:flex; align-items:center; justify-content:center;">Ready</div>
              
              <div style="font-weight:700; font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase;">LRU Cache Slots (Max Capacity: 4)</div>
              <div class="cache-slots-grid" id="cache-slots-visual"></div>
              
              <div style="background:var(--border-color); border:1px solid var(--text-secondary); border-radius:8px; padding:6px 12px; font-size:0.7rem; font-weight:600; color:var(--text-secondary);">ORIGIN DATABASE</div>
            </div>
          </div>

          <!-- Logs -->
          <div class="sim-logs-container">
            <h4 style="font-weight:600; font-size: 0.9rem; margin-bottom:12px;">Cache Access Log:</h4>
            <table class="sim-logs-table">
              <thead>
                <tr>
                  <th style="width: 25%;">Timestamp</th>
                  <th style="width: 25%;">Outcome</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody id="cache-logs-body">
                <tr>
                  <td colspan="3" style="text-align:center; color: var(--text-secondary);">Cache ready. Request assets to load.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function initLruCacheHandlers() {
    const slotsVisual = document.getElementById('cache-slots-visual');
    const logsBody = document.getElementById('cache-logs-body');
    const hitLabel = document.getElementById('cache-hit-count');
    const missLabel = document.getElementById('cache-miss-count');
    const ratioLabel = document.getElementById('cache-ratio');
    const alertBox = document.getElementById('cache-hit-miss-alert');

    function renderCacheVisual() {
      if (!slotsVisual) return;
      let slotsHtml = '';
      for (let i = 0; i < 4; i++) {
        const key = state.visualizer.cache.slots[i];
        if (key) {
          slotsHtml += `
            <div class="cache-slot-card filled" id="slot-card-${i}">
              <span style="font-size:0.65rem; color:var(--primary); font-weight:700;">SLOT ${i+1}</span>
              <span style="font-size:0.9rem; font-weight:800; margin-top:4px;">${key}</span>
              <span style="font-size:0.55rem; color:var(--text-secondary); margin-top:2px;">Age: ${i === 0 ? 'MRU' : i === 3 ? 'LRU' : i}</span>
            </div>
          `;
        } else {
          slotsHtml += `
            <div class="cache-slot-card">
              <span style="color:var(--text-muted); font-size:0.75rem;">[ EMPTY ]</span>
            </div>
          `;
        }
      }
      slotsVisual.innerHTML = slotsHtml;
      
      if (hitLabel) hitLabel.textContent = state.visualizer.cache.hits;
      if (missLabel) missLabel.textContent = state.visualizer.cache.misses;
      
      const total = state.visualizer.cache.hits + state.visualizer.cache.misses;
      if (ratioLabel) {
        ratioLabel.textContent = total > 0 ? ((state.visualizer.cache.hits / total) * 100).toFixed(0) + '%' : '0%';
      }
    }

    function logCacheOp(outcome, details) {
      if (!logsBody) return;
      const timestamp = new Date().toLocaleTimeString();
      const row = document.createElement('tr');
      const color = outcome === 'HIT' ? 'color: var(--success); font-weight:700;' : 'color: var(--warning); font-weight:700;';
      row.innerHTML = `
        <td>${timestamp}</td>
        <td style="${color}">${outcome}</td>
        <td>${details}</td>
      `;
      if (logsBody.firstChild && logsBody.firstChild.textContent.includes("ready")) {
        logsBody.innerHTML = '';
      }
      logsBody.insertBefore(row, logsBody.firstChild);
      if (logsBody.children.length > 5) {
        logsBody.removeChild(logsBody.lastChild);
      }
    }

    function accessCache(key) {
      const idx = state.visualizer.cache.slots.indexOf(key);
      if (alertBox) alertBox.style.visibility = 'visible';

      if (idx !== -1) {
        // Cache Hit
        state.visualizer.cache.hits++;
        // Move element to front of array (MRU position)
        state.visualizer.cache.slots.splice(idx, 1);
        state.visualizer.cache.slots.unshift(key);
        
        if (alertBox) {
          alertBox.textContent = `🎯 CACHE HIT [${key}]`;
          alertBox.style.background = 'var(--success-glow)';
          alertBox.style.border = '1px solid var(--success)';
          alertBox.style.color = 'var(--success)';
        }
        
        logCacheOp('HIT', `Read ${key} directly from cache storage.`);
        renderCacheVisual();
        
        const card = document.getElementById('slot-card-0');
        if (card) card.classList.add('hit-highlight');
      } else {
        // Cache Miss
        state.visualizer.cache.misses++;
        let evictionLog = "";
        
        if (state.visualizer.cache.slots.length >= 4) {
          const evicted = state.visualizer.cache.slots.pop(); // remove LRU item
          evictionLog = `, evicting Least Recently Used item [${evicted}]`;
        }
        
        state.visualizer.cache.slots.unshift(key); // load into MRU slot
        
        if (alertBox) {
          alertBox.textContent = `⚠️ CACHE MISS [${key}]`;
          alertBox.style.background = 'var(--warning-glow)';
          alertBox.style.border = '1px solid var(--warning)';
          alertBox.style.color = 'var(--warning)';
        }
        
        logCacheOp('MISS', `Pulled ${key} from Origin DB${evictionLog}.`);
        renderCacheVisual();
        
        const card = document.getElementById('slot-card-0');
        if (card) card.classList.add('miss-highlight');
      }
    }

    document.querySelectorAll('.cache-req-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        accessCache(key);
      });
    });

    renderCacheVisual();
  }

  // ==========================================
  // 4. DATABASE REPLICATION SUB-SIMULATOR
  // ==========================================
  function getDbReplicationHtml() {
    return `
      <div class="simulator-layout">
        <!-- Controls Panel -->
        <div class="simulator-controls">
          <div class="control-group">
            <span class="control-label">Database Operations</span>
            <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:12px;">Simulate write replication lag across master and read replicas.</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <button class="btn btn-primary" id="db-write-btn" style="justify-content:center; border-radius:8px;">
                ⚡ Write Data (Increment)
              </button>
              <button class="btn btn-secondary" id="db-read-btn" style="justify-content:center; border-radius:8px;">
                🔍 Read Data (Load Balanced)
              </button>
            </div>
          </div>

          <div class="control-group" style="border-top:1px solid var(--border-color); padding-top:12px; margin-top:4px;">
            <span class="control-label">
              <span>Replication Sync Delay</span>
              <span id="db-lag-val">${state.visualizer.db.replicationLagMs}ms</span>
            </span>
            <input type="range" class="control-slider" id="db-lag-slider" min="200" max="2000" step="100" value="${state.visualizer.db.replicationLagMs}">
          </div>
        </div>

        <!-- Visualization Panel -->
        <div>
          <div class="simulator-visualization">
            <div style="display:flex; flex-direction:column; align-items:center; gap:12px; width:100%;">
              <div id="db-sync-status" style="font-size:0.8rem; font-weight:700; color:var(--success); height:20px;">SYNCED</div>
              <div class="db-nodes-container">
                <!-- Master -->
                <div class="db-node-card master" id="db-node-master">
                  <div style="font-size:0.65rem; color:var(--accent); font-weight:700; margin-bottom:4px;">PRIMARY (WRITE)</div>
                  <div style="font-size:1.4rem; font-weight:800;" id="db-val-master">${state.visualizer.db.masterVal}</div>
                  <div style="font-size:0.6rem; color:var(--text-secondary); margin-top:2px;">Auto Increments</div>
                </div>
                
                <!-- Replication arrows -->
                <div style="display:flex; flex-direction:column; gap:16px; font-size:1.2rem; color:var(--border-color);">
                  <div id="replication-arrow-A" style="transition: all 0.2s;">➜</div>
                  <div id="replication-arrow-B" style="transition: all 0.2s;">➜</div>
                </div>

                <!-- Replicas -->
                <div style="display:flex; flex-direction:column; gap:12px;">
                  ${state.visualizer.db.replicas.map(rep => `
                    <div class="db-node-card replica" id="db-node-replica-${rep.id}">
                      <div style="font-size:0.65rem; color:var(--primary); font-weight:700; margin-bottom:4px;">REPLICA ${rep.id}</div>
                      <div style="font-size:1.2rem; font-weight:800;" id="db-val-replica-${rep.id}">${rep.val}</div>
                      <div style="font-size:0.6rem; color:var(--text-secondary); margin-top:2px;">Read node</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Logs -->
          <div class="sim-logs-container">
            <h4 style="font-weight:600; font-size: 0.9rem; margin-bottom:12px;">Replication Log:</h4>
            <table class="sim-logs-table">
              <thead>
                <tr>
                  <th style="width: 25%;">Timestamp</th>
                  <th style="width: 25%;">Operation</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody id="db-logs-body">
                <tr>
                  <td colspan="3" style="text-align:center; color: var(--text-secondary);">Replication pipeline ready. Write data.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function initDbReplicationHandlers() {
    const writeBtn = document.getElementById('db-write-btn');
    const readBtn = document.getElementById('db-read-btn');
    const lagSlider = document.getElementById('db-lag-slider');
    const lagVal = document.getElementById('db-lag-val');
    const masterValLabel = document.getElementById('db-val-master');
    const syncStatus = document.getElementById('db-sync-status');
    const arrowA = document.getElementById('replication-arrow-A');
    const arrowB = document.getElementById('replication-arrow-B');
    const logsBody = document.getElementById('db-logs-body');

    if (lagSlider && lagVal) {
      lagSlider.addEventListener('input', () => {
        state.visualizer.db.replicationLagMs = parseInt(lagSlider.value);
        lagVal.textContent = state.visualizer.db.replicationLagMs + 'ms';
      });
    }

    function logDbOp(op, details) {
      if (!logsBody) return;
      const timestamp = new Date().toLocaleTimeString();
      const row = document.createElement('tr');
      const color = op.startsWith('WRITE') ? 'color: var(--accent); font-weight:700;' : op.startsWith('READ') ? 'color: var(--primary); font-weight:700;' : 'color: var(--success);';
      row.innerHTML = `
        <td>${timestamp}</td>
        <td style="${color}">${op}</td>
        <td>${details}</td>
      `;
      if (logsBody.firstChild && logsBody.firstChild.textContent.includes("ready")) {
        logsBody.innerHTML = '';
      }
      logsBody.insertBefore(row, logsBody.firstChild);
      if (logsBody.children.length > 5) {
        logsBody.removeChild(logsBody.lastChild);
      }
    }

    function writeData() {
      state.visualizer.db.masterVal += 10;
      if (masterValLabel) masterValLabel.textContent = state.visualizer.db.masterVal;
      
      const masterCard = document.getElementById('db-node-master');
      if (masterCard) {
        masterCard.classList.add('pulse-glow-green');
        setTimeout(() => masterCard.classList.remove('pulse-glow-green'), 500);
      }
      
      if (syncStatus) {
        syncStatus.textContent = 'SYNCING REPLICAS...';
        syncStatus.style.color = 'var(--warning)';
      }
      if (arrowA) arrowA.style.color = 'var(--warning)';
      if (arrowB) arrowB.style.color = 'var(--warning)';
      
      logDbOp('WRITE-MASTER', `Written value ${state.visualizer.db.masterVal} to Primary. Broadcasting replication events.`);
      
      // Delay syncing logic according to lag slider
      const syncTimeout = setTimeout(() => {
        state.visualizer.db.replicas.forEach(rep => {
          rep.val = state.visualizer.db.masterVal;
          const repLabel = document.getElementById(`db-val-replica-${rep.id}`);
          if (repLabel) repLabel.textContent = rep.val;
          
          const node = document.getElementById(`db-node-replica-${rep.id}`);
          if (node) {
            node.classList.add('pulse-glow-green');
            setTimeout(() => node.classList.remove('pulse-glow-green'), 500);
          }
        });
        
        if (syncStatus) {
          syncStatus.textContent = 'SYNCED';
          syncStatus.style.color = 'var(--success)';
        }
        if (arrowA) arrowA.style.color = 'var(--success)';
        if (arrowB) arrowB.style.color = 'var(--success)';
        
        logDbOp('REPLICA-SYNC', `Replication sync complete (delay: ${state.visualizer.db.replicationLagMs}ms).`);
      }, state.visualizer.db.replicationLagMs);
      
      activeIntervals.push(syncTimeout);
    }

    function readData() {
      // Pick random replica
      const target = Math.random() > 0.5 ? 'A' : 'B';
      const rep = state.visualizer.db.replicas.find(r => r.id === target);
      
      const replicaCard = document.getElementById(`db-node-replica-${target}`);
      if (replicaCard) {
        replicaCard.classList.add('pulse-glow-blue');
        setTimeout(() => replicaCard.classList.remove('pulse-glow-blue'), 500);
      }
      
      logDbOp(`READ-REPLICA-${target}`, `Read request routed. Read value: ${rep.val} (Sync Lag Status: ${rep.val === state.visualizer.db.masterVal ? 'Clean' : 'Dirty/Lagging'})`);
    }

    if (writeBtn) writeBtn.addEventListener('click', writeData);
    if (readBtn) readBtn.addEventListener('click', readData);
  }

  // ==========================================
  // 5. CUSTOM AI-GENERATED CONCEPT SANDBOX
  // ==========================================
  function getCustomSimHtml(name) {
    return `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <h3 style="font-size:1.1rem; font-weight:700; color:var(--primary); margin-bottom:4px;">
          ✨ Dynamic Sandbox: ${name}
        </h3>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0;">
          Generative concept dashboard. Interact with custom parameters and simulation logs.
        </p>

        <div class="simulator-visualization" style="height:220px; display:flex; align-items:center; justify-content:center;">
          <div style="display:flex; flex-direction:column; align-items:center; gap:16px; width:100%; padding:20px;">
            <div style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">
              Simulation Pipeline View
            </div>
            <!-- Custom Dynamic Nodes Container -->
            <div class="ai-sim-pipeline" id="custom-vis-pipeline-container" style="min-height:90px; width:100%; max-width:500px;">
              <span style="color:var(--text-muted); font-size:0.75rem;">No items active. Use controls below to push events.</span>
            </div>
          </div>
        </div>

        <div class="card" style="padding:16px; border-color:var(--border-color);">
          <h4 style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:12px;">Interactive Sandbox Controls</h4>
          <div class="ai-sim-control-panel" id="custom-vis-actions-panel"></div>
        </div>

        <!-- Simulation Logs -->
        <div class="sim-logs-container">
          <h4 style="font-weight:600; font-size: 0.9rem; margin-bottom:12px;">Simulation telemetry:</h4>
          <table class="sim-logs-table">
            <thead>
              <tr>
                <th style="width: 25%;">Timestamp</th>
                <th style="width: 25%;">Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody id="custom-vis-logs-body">
              <tr>
                <td colspan="3" style="text-align:center; color: var(--text-secondary);">Sandbox engine active. Trigger operations.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function initCustomSimHandlers(name) {
    const pipeline = document.getElementById('custom-vis-pipeline-container');
    const actionsPanel = document.getElementById('custom-vis-actions-panel');
    const logsBody = document.getElementById('custom-vis-logs-body');

    // Populate buttons dynamically based on topic name
    const query = name.toLowerCase();
    
    if (query.includes('queue') || query.includes('kafka') || query.includes('stream')) {
      // Message Queue buttons
      if (actionsPanel) {
        actionsPanel.innerHTML = `
          <button class="btn btn-primary" id="custom-action-1">📤 Publish Message</button>
          <button class="btn btn-secondary" id="custom-action-2">📥 Consume Message</button>
          <button class="btn btn-secondary" id="custom-action-3">🗑️ Clear Queue</button>
        `;
      }
      
      let queueCount = 0;
      
      const act1 = document.getElementById('custom-action-1');
      const act2 = document.getElementById('custom-action-2');
      const act3 = document.getElementById('custom-action-3');
      
      function renderQueue() {
        if (!pipeline) return;
        if (state.visualizer.customSim.queue.length === 0) {
          pipeline.innerHTML = `<span style="color:var(--text-muted); font-size:0.75rem;">Queue Empty. Publish events.</span>`;
        } else {
          pipeline.innerHTML = state.visualizer.customSim.queue.map((msg, i) => `
            <div class="ai-sim-node" style="animation-delay:${i * 0.1}s;">
              <span style="color:var(--primary); font-size:1.1rem;">✉️</span>
              <span>${msg}</span>
            </div>
          `).join('');
        }
      }
      
      function logCustomSim(act, text) {
        if (!logsBody) return;
        const timestamp = new Date().toLocaleTimeString();
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${timestamp}</td>
          <td style="color:var(--primary); font-weight:700;">${act}</td>
          <td>${text}</td>
        `;
        if (logsBody.firstChild && logsBody.firstChild.textContent.includes("active")) {
          logsBody.innerHTML = '';
        }
        logsBody.insertBefore(row, logsBody.firstChild);
        if (logsBody.children.length > 5) logsBody.removeChild(logsBody.lastChild);
      }

      if (act1) {
        act1.addEventListener('click', () => {
          queueCount++;
          const msgName = `Msg_${queueCount}`;
          state.visualizer.customSim.queue.push(msgName);
          renderQueue();
          logCustomSim('PUBLISH', `Broker received message. Payload name: ${msgName}. Queue size: ${state.visualizer.customSim.queue.length}`);
        });
      }

      if (act2) {
        act2.addEventListener('click', () => {
          if (state.visualizer.customSim.queue.length > 0) {
            const consumed = state.visualizer.customSim.queue.shift();
            renderQueue();
            logCustomSim('CONSUME', `Consumer processed message [${consumed}]. Queue size: ${state.visualizer.customSim.queue.length}`);
          } else {
            logCustomSim('CONSUME-ERR', 'No messages left in queue buffer to pull.');
          }
        });
      }

      if (act3) {
        act3.addEventListener('click', () => {
          state.visualizer.customSim.queue = [];
          renderQueue();
          logCustomSim('CLEAR', 'Cleared queue storage cache values.');
        });
      }
      
      renderQueue();

    } else {
      // Generic Distributed Visualizer buttons
      if (actionsPanel) {
        actionsPanel.innerHTML = `
          <button class="btn btn-primary" id="custom-action-1">⚡ Trigger Event</button>
          <button class="btn btn-secondary" id="custom-action-2">🔄 Process Sync</button>
          <button class="btn btn-secondary" id="custom-action-3">🧹 Reset Sandbox</button>
        `;
      }
      
      const act1 = document.getElementById('custom-action-1');
      const act2 = document.getElementById('custom-action-2');
      const act3 = document.getElementById('custom-action-3');
      
      function renderGeneric() {
        if (!pipeline) return;
        if (state.visualizer.customSim.queue.length === 0) {
          pipeline.innerHTML = `<span style="color:var(--text-muted); font-size:0.75rem;">Nodes passive. Click trigger events.</span>`;
        } else {
          pipeline.innerHTML = state.visualizer.customSim.queue.map((node, i) => `
            <div class="ai-sim-node" style="border-color:var(--accent);">
              <span style="color:var(--accent); font-size:1.1rem;">⚙️</span>
              <span>${node}</span>
            </div>
          `).join('');
        }
      }

      function logCustomSim(act, text) {
        if (!logsBody) return;
        const timestamp = new Date().toLocaleTimeString();
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${timestamp}</td>
          <td style="color:var(--accent); font-weight:700;">${act}</td>
          <td>${text}</td>
        `;
        if (logsBody.firstChild && logsBody.firstChild.textContent.includes("active")) {
          logsBody.innerHTML = '';
        }
        logsBody.insertBefore(row, logsBody.firstChild);
        if (logsBody.children.length > 5) logsBody.removeChild(logsBody.lastChild);
      }

      if (act1) {
        act1.addEventListener('click', () => {
          const nodeName = `Node_${state.visualizer.customSim.queue.length + 1}`;
          state.visualizer.customSim.queue.push(nodeName);
          renderGeneric();
          logCustomSim('TRIGGER', `Fired operation event on dynamic pipeline. Loaded ${nodeName}`);
        });
      }

      if (act2) {
        act2.addEventListener('click', () => {
          if (state.visualizer.customSim.queue.length > 0) {
            const popped = state.visualizer.customSim.queue.pop();
            renderGeneric();
            logCustomSim('PROCESS', `Processed replication transaction on node ${popped}`);
          }
        });
      }

      if (act3) {
        act3.addEventListener('click', () => {
          state.visualizer.customSim.queue = [];
          renderGeneric();
          logCustomSim('RESET', 'Reinitialized system state metrics.');
        });
      }

      renderGeneric();
    }
  }
}

// 11. LLM Playground Interactive Mock
function setupPlayground() {
  const runBtn = document.getElementById('playground-run-btn');
  const sysPromptInput = document.getElementById('sys-prompt-input');
  const userPromptInput = document.getElementById('user-prompt-input');
  const outputBox = document.getElementById('playground-output');
  
  const MOCK_RESPONSES = {
    langgraph: `Based on your request, here is a breakdown of LangGraph:

LangGraph is a library for building stateful, multi-actor applications with LLMs, built on top of LangChain. It extends LangChain Expression Language (LCEL) with the ability to coordinate multiple chains (or actors) across cyclic computational steps.

Example structure:
\`\`\`python
from langgraph.graph import StateGraph, END

class State(TypedDict):
    input: str
    steps: list

workflow = StateGraph(State)
workflow.add_node("agent", agent_node)
workflow.add_node("tool", tool_node)
workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue)
workflow.add_edge("tool", "agent")
app = workflow.compile()
\`\`\`
Use LangGraph whenever your system is not a linear pipeline but instead requires feedback loops or dynamic routing decisions!`,
    
    agent: `Here is a summary of AI Agentic architectures:

AI Agents are systems where the LLM is used as an engine to plan actions, call tools, react to observations, and self-correct.

Core Patterns:
1. **ReAct (Reason + Act)**: Interleaves reasoning (thoughts) and actions (calling tools).
2. **Plan-and-Solve**: First generates a sequence of subtasks, then executes them sequentially.
3. **Multi-Agent Networks**: Independent agent units collaborating via a shared state or communication protocol (e.g. Creator -> Critic -> Reviewer).`,
    
    rag: `Vector Databases and Retrieval-Augmented Generation (RAG) summary:

1. **Chunking**: Break documents down into overlapping segments.
2. **Embedding**: Pass chunks to an embedding model generating coordinates.
3. **Retrieval**: Compute cosine similarity between query vector and database vectors.
4. **Context Injection**: Attach top-k matching documents to user prompt inside context window.

Database tools: Pinecone, ChromaDB, PGVector, Qdrant.`
  };
  
  runBtn.addEventListener('click', () => {
    const userText = userPromptInput.value.trim().toLowerCase();
    
    if (!userText) {
      outputBox.textContent = 'Please enter a user query.';
      return;
    }
    
    outputBox.innerHTML = '<span style="color:var(--text-secondary); animation: pulse 1s infinite;">Simulating LLM inference stream...</span>';
    
    let matchedKey = null;
    if (userText.includes('langgraph') || userText.includes('graph')) {
      matchedKey = 'langgraph';
    } else if (userText.includes('agent') || userText.includes('crewai')) {
      matchedKey = 'agent';
    } else if (userText.includes('rag') || userText.includes('vector') || userText.includes('retrieval')) {
      matchedKey = 'rag';
    }
    
    const responseText = matchedKey ? MOCK_RESPONSES[matchedKey] : `Thank you for your prompt!

I analyzed your query in the context of the system prompt:
"${sysPromptInput.value.trim()}"

This high-fidelity prototype playground simulated model inference successfully. Try typing "LangGraph", "AI Agent", or "RAG" to see specific learning documentation output!`;
    
    setTimeout(() => {
      outputBox.innerHTML = '';
      let i = 0;
      
      function typeChar() {
        if (i < responseText.length) {
          const char = responseText.charAt(i);
          if (char === '\n') {
            outputBox.innerHTML += '<br>';
          } else {
            outputBox.innerHTML += char;
          }
          i++;
          outputBox.scrollTop = outputBox.scrollHeight;
          setTimeout(typeChar, 5);
        }
      }
      
      typeChar();
    }, 1000);
  });
}

// 12. Global UI Events & Mobile drawer
function setupGlobalEvents() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const sidebar = document.querySelector('.sidebar');
  
  if (hamburgerBtn && sidebar) {
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('mobile-active');
    });
    
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('mobile-active') && !sidebar.contains(e.target)) {
        sidebar.classList.remove('mobile-active');
      }
    });
  }
  
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.accordion-trigger');
    if (trigger) {
      const module = trigger.closest('.accordion-module');
      if (module) {
        module.classList.toggle('expanded');
      }
    }
  });

  // Change Focused Saga dropdown handler
  document.addEventListener('change', (e) => {
    if (e.target.id === 'focus-category-select') {
      state.currentFocusCatId = e.target.value;
      localStorage.setItem('portal_current_focus_cat', state.currentFocusCatId);
      updateProgressMetrics();
    }
  });
}

// 13. Command Search & Filtering
function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const resultsBox = document.getElementById('search-results');
  
  const SEARCH_ITEMS = [
    { title: 'Dashboard Analytics', cat: 'Dashboard', hash: '#dashboard' },
    { title: 'Large Language Models (LLMs)', cat: 'AI Engineering', hash: '#ai-engineering' },
    { title: 'Prompt Engineering Techniques', cat: 'AI Engineering', hash: '#ai-engineering' },
    { title: 'LangGraph State Graphs', cat: 'AI Engineering', hash: '#ai-engineering' },
    { title: 'CrewAI Frameworks', cat: 'AI Engineering', hash: '#ai-engineering' },
    { title: 'Rate Limiter Visual Simulator', cat: 'System Design', hash: '#rate-limiter' },
    { title: 'Token Bucket & Leaky Bucket', cat: 'System Design', hash: '#rate-limiter' },
    { title: 'Study Journal & Reflection Log', cat: 'Journal', hash: '#journal' },
    { title: 'System Design & AI Resources Catalog', cat: 'Resources', hash: '#resources' },
    { title: 'Progress Visual Charts', cat: 'Progress Tracker', hash: '#progress' },
    { title: 'Sprint Kanban Task Board', cat: 'Sprint Board', hash: '#sprint-board' }
  ];
  
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      resultsBox.classList.remove('active');
      return;
    }
    
    const matches = SEARCH_ITEMS.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.cat.toLowerCase().includes(query)
    );
    
    if (matches.length === 0) {
      resultsBox.innerHTML = '<div style="padding: 12px; color: var(--text-secondary); font-size: 0.8rem;">No results found.</div>';
    } else {
      resultsBox.innerHTML = matches.map(item => `
        <div class="search-result-item" data-hash="${item.hash}">
          <div class="search-result-title">${item.title}</div>
          <div class="search-result-cat">${item.cat}</div>
        </div>
      `).join('');
    }
    
    resultsBox.classList.add('active');
  });
  
  resultsBox.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (item) {
      const hash = item.getAttribute('data-hash');
      window.location.hash = hash;
      searchInput.value = '';
      resultsBox.classList.remove('active');
    }
  });
  
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) {
      resultsBox.classList.remove('active');
    }
  });
}

// 14. Interactive SVG Charts (Progress page)
function renderActivityCharts() {
  const container = document.getElementById('progress-chart-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  const chartData = [2, 3.5, 1.5, 4, 3, 5, 2.5];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const width = 600;
  const height = 200;
  
  const points = chartData.map((val, idx) => {
    const x = 50 + (idx * 80);
    const y = 160 - (val * 25);
    return { x, y, val };
  });
  
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaData = `${pathData} L ${points[points.length-1].x} 160 L ${points[0].x} 160 Z`;
  
  let gridLines = '';
  for (let i = 0; i <= 5; i++) {
    const y = 160 - (i * 25);
    gridLines += `
      <line class="chart-grid-line" x1="40" y1="${y}" x2="560" y2="${y}" />
      <text class="chart-axis-text" x="20" y="${y + 4}">${i}h</text>
    `;
  }
  
  let dayTexts = '';
  points.forEach((p, idx) => {
    dayTexts += `
      <text class="chart-axis-text" x="${p.x - 10}" y="180">${days[idx]}</text>
      <circle class="chart-dot" cx="${p.x}" cy="${p.y}" r="5" />
    `;
  });
  
  container.innerHTML = `
    <svg class="svg-chart" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--primary)" />
          <stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
        </linearGradient>
      </defs>
      
      ${gridLines}
      <line class="chart-axis-line" x1="40" y1="160" x2="565" y2="160" />
      <path class="chart-area" d="${areaData}" />
      <path class="chart-line" d="${pathData}" />
      ${dayTexts}
    </svg>
  `;
}

/* ==========================================================================
   CURRICULUM NOTES & PROGRESS SYNCHRONIZATION
   ========================================================================== */

function renderAiEngineeringTrack() {
  const llmCategory = state.roadmap.find(c => c.id === 'cat-ai');
  if (!llmCategory) return;
  
  const topicsMap = {
    'top-llm': 'ai-track-mount-llm',
    'top-prompt': 'ai-track-mount-prompt',
    'top-langgraph': 'ai-track-mount-langgraph',
    'top-crewai': 'ai-track-mount-crewai'
  };

  Object.entries(topicsMap).forEach(([topicId, mountId]) => {
    const mountEl = document.getElementById(mountId);
    if (!mountEl) return;
    
    const topic = llmCategory.topics.find(t => t.id === topicId);
    if (!topic) return;
    
    // Notes snippet
    const notesSnippet = topic.notes ? `
      <div class="notes-preview-box topic-notes-trigger" data-cat-id="cat-ai" data-topic-id="${topic.id}" style="margin-top:8px; padding:10px; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:6px; font-size:0.8rem; color:var(--text-secondary); max-height:100px; overflow-y:auto; font-style:italic; cursor:pointer;" title="Click to edit notes">
        📝 ${topic.notes.replace(/\n/g, '<br>')}
      </div>
    ` : '';
    
    const linksSnippet = topic.links ? `
      <div style="font-size:0.75rem; color:var(--primary); margin-top:4px;">
        🔗 <a href="${topic.links}" target="_blank" style="color:var(--primary); text-decoration:underline;">Reference Resource</a>
      </div>
    ` : '';

    mountEl.innerHTML = `
      <div style="margin-top:16px; border-top:1px dashed var(--border-color); padding-top:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <label class="custom-checkbox">
              <input type="checkbox" ${topic.completed ? 'checked' : ''} data-topic-id="${topic.id}" class="ai-page-checkbox">
              <span class="checkbox-mark"></span>
            </label>
            <span style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">Course Checkpoint: ${topic.text}</span>
          </div>
          <button class="btn btn-secondary topic-notes-trigger" data-cat-id="cat-ai" data-topic-id="${topic.id}" style="padding:4px 8px; font-size:0.7rem; border-radius:4px;">📝 Notes</button>
        </div>
        ${notesSnippet}
        ${linksSnippet}
      </div>
    `;
  });
}

function setupTopicNotesModal() {
  const modal = document.getElementById('topic-notes-modal');
  const closeBtn = document.getElementById('topic-notes-close');
  const cancelBtn = document.getElementById('topic-notes-cancel');
  const saveBtn = document.getElementById('topic-notes-save');
  
  const titleField = document.getElementById('topic-notes-title');
  const completedChk = document.getElementById('topic-notes-completed');
  const notesTextarea = document.getElementById('topic-notes-textarea');
  const linksField = document.getElementById('topic-notes-links');
  const aiBtn = document.getElementById('topic-notes-ai-btn');

  const percentSlider = document.getElementById('topic-notes-percent-slider');
  const percentVal = document.getElementById('topic-notes-percent-val');

  let activeCatId = null;
  let activeTopicId = null;

  // Sync range slider and checkbox events inside the modal
  if (percentSlider) {
    percentSlider.addEventListener('input', () => {
      const val = parseInt(percentSlider.value);
      if (percentVal) percentVal.textContent = `${val}%`;
      if (completedChk) completedChk.checked = (val === 100);
    });
  }

  if (completedChk) {
    completedChk.addEventListener('change', () => {
      const checked = completedChk.checked;
      const targetVal = checked ? 100 : 0;
      if (percentSlider) percentSlider.value = targetVal;
      if (percentVal) percentVal.textContent = `${targetVal}%`;
    });
  }

  // Global event delegation for opening the modal
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.topic-notes-trigger');
    if (trigger) {
      activeCatId = trigger.getAttribute('data-cat-id');
      activeTopicId = trigger.getAttribute('data-topic-id');
      
      const category = state.roadmap.find(c => c.id === activeCatId);
      if (!category) return;
      const topic = category.topics.find(t => t.id === activeTopicId);
      if (!topic) return;

      // Populate fields
      if (titleField) titleField.textContent = `Study Guide: ${topic.text}`;
      
      const percent = typeof topic.percentComplete === 'number' ? topic.percentComplete : (topic.completed ? 100 : 0);
      if (percentSlider) percentSlider.value = percent;
      if (percentVal) percentVal.textContent = `${percent}%`;
      if (completedChk) completedChk.checked = (percent === 100);
      
      if (notesTextarea) notesTextarea.value = topic.notes || '';
      if (linksField) linksField.value = topic.links || '';

      if (modal) modal.classList.add('active');
    }
  });

  function closeModal() {
    if (modal) modal.classList.remove('active');
    activeCatId = null;
    activeTopicId = null;
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!activeCatId || !activeTopicId) return;
      const category = state.roadmap.find(c => c.id === activeCatId);
      if (category) {
        const topic = category.topics.find(t => t.id === activeTopicId);
        if (topic) {
          const val = percentSlider ? parseInt(percentSlider.value) : (completedChk && completedChk.checked ? 100 : 0);
          topic.percentComplete = val;
          topic.completed = (val === 100);
          topic.notes = notesTextarea ? notesTextarea.value.trim() : '';
          topic.links = linksField ? linksField.value.trim() : '';

          saveToStorage('portal_dynamic_roadmap', state.roadmap);
          
          // Sync matching checkboxes globally
          document.querySelectorAll(`input[type="checkbox"][data-topic-id="${activeTopicId}"]`).forEach(cb => {
            cb.checked = topic.completed;
            const item = cb.closest('.checklist-item');
            if (item) {
              if (topic.completed) {
                item.classList.add('completed');
              } else {
                item.classList.remove('completed');
              }
            }
          });

          closeModal();
          updateProgressMetrics();
          renderRoadmap();
          renderAiEngineeringTrack();
          
          // Refresh category page if active
          const hash = window.location.hash;
          if (hash.startsWith('#category-')) {
            showCategoryPage(activeCatId);
          }
        }
      }
    });
  }

  // Gemini AI Notes cheatsheet mock generator
  if (aiBtn) {
    aiBtn.addEventListener('click', () => {
      if (!activeTopicId) return;
      
      const prevText = aiBtn.textContent;
      aiBtn.disabled = true;
      aiBtn.textContent = '✨ Generating...';
      
      setTimeout(() => {
        let aiNotes = '';
        const title = titleField ? titleField.textContent.replace('Study Guide: ', '') : '';
        const query = title.toLowerCase();

        if (query.includes('llm') || query.includes('foundation')) {
          aiNotes = `--- LLM CORE FOUNDATIONS API CHEATSHEET ---
- Token Streaming Conns: Set body { stream: true }, decode Uint8Array packets recursively.
- Parameters:
  * Temperature (0.0 to 2.0): Higher = creative/random, Lower = deterministic.
  * Top_P (Nucleus Sampling): Limits options to top accumulated prob percentage.
- Sample API Config:
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.1 } });`;
        } else if (query.includes('prompt')) {
          aiNotes = `--- ADVANCED PROMPT STRUCTURE CHEATSHEET ---
- Few-Shot Prompting: Provide 2-3 structured example pairs in instructions to align formats.
- Chain of Thought (CoT): Append "Let's think step by step" to trigger logical breakdown paths.
- ReAct Prompt Loop: Structure model responses into Thought -> Action -> Observation steps.
- Boundaries: Wrap variables in explicit XML tags (e.g. <user_query>...</user_query>) to prevent injection.`;
        } else if (query.includes('langgraph') || query.includes('workflow')) {
          aiNotes = `--- STATEFUL AGENTS & LANGGRAPH CHEATSHEET ---
- State Model: Define a shared state Schema (TypedDict or Pydantic) passed between nodes.
- Graph Architecture:
  * Node: A python function taking State and returning state modifications.
  * Edge: Connections between nodes.
  * Conditional Edge: Router decisions branching execution dynamically.
- Setup Code:
  workflow = StateGraph(AgentState)
  workflow.add_node("agent", call_model)
  workflow.add_conditional_edges("agent", should_continue)`;
        } else if (query.includes('crewai') || query.includes('agent')) {
          aiNotes = `--- CREWAI MULTI-AGENT COLLABORATION ---
- Role Definition: Assign exact Role, Goal, and Backstory to each agent to focus persona parameters.
- Task Scoping: Link specialized tools to Tasks, and map Tasks to respective Agents.
- Inter-Agent Delegation: Allow managers to execute serial workflows or permit agents to request feedback.`;
        } else if (query.includes('rate limit') || query.includes('visualizer')) {
          aiNotes = `--- RATE LIMITING ALGORITHMS OUTLINE ---
- Token Bucket: Refills tokens periodically. Instant consumption. Supports burst traffic.
- Leaky Bucket: Queues requests in a buffer, processing them at a steady, fixed leak rate. Smooths traffic spikes.
- Sliding Window Log: Tracks request timestamps in memory to enforce absolute limits in trailing window ranges.`;
        } else if (query.includes('redis') || query.includes('cache')) {
          aiNotes = `--- REDIS CACHING ARCHITECTURES ---
- Cache-Aside pattern: Application checks cache first. On miss, query DB, write to cache, return.
- Eviction Policies:
  * Low Level LRU: Evict least recently accessed entries.
  * TTL Timeout: Set absolute expiration durations.`;
        } else if (query.includes('kafka') || query.includes('stream')) {
          aiNotes = `--- APACHE KAFKA SYSTEM ARCHITECTURE ---
- Core Components: Producers, Consumers, Topics, Partition shards, Broker servers.
- Partitioning: Message hash key routing.
- Commit Offsets: Consumer read offset state.`;
        } else {
          aiNotes = `--- STUDY GUIDE: ${title} ---
- Core Concept: Understand structural foundations and architectural dependencies.
- Local Sandbox Setup: Spin up local Docker container services or initialize SDK client drivers.
- Verification Steps: Log active connections, inspect payload schema logs, and execute unit test cases.`;
        }

        if (notesTextarea) {
          notesTextarea.value = aiNotes;
        }
        aiBtn.disabled = false;
        aiBtn.textContent = prevText;
      }, 700);
    });
  }
}

function renderSidebarTracks() {
  const container = document.getElementById('sidebar-tracks-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  state.roadmap.forEach(cat => {
    const link = document.createElement('a');
    link.href = `#category-${cat.id}`;
    link.className = 'nav-link';
    link.id = `nav-category-${cat.id}`;
    
    // Icon selections
    let svgIcon = `<svg viewBox="0 0 24 24"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/><circle cx="12" cy="12" r="4"/></svg>`; // AI Engineering
    if (cat.id === 'cat-sd' || cat.title.toLowerCase().includes('system') || cat.title.toLowerCase().includes('db') || cat.title.toLowerCase().includes('network')) {
      svgIcon = `<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`; // layered network / architecture
    } else if (cat.id !== 'cat-ai') {
      svgIcon = `<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V3a2.5 2.5 0 0 1 2.5-2.5H20v14H6.5a2.5 2.5 0 0 0-2.5 2.5z"/></svg>`; // book
    }
    
    link.innerHTML = `
      ${svgIcon}
      <span>${cat.title}</span>
    `;
    
    container.appendChild(link);
  });
}

function showCategoryPage(catId) {
  const category = state.roadmap.find(c => c.id === catId);
  if (!category) {
    window.location.hash = '#dashboard';
    return;
  }

  // Set side links active states
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  const activeLink = document.getElementById(`nav-category-${catId}`);
  if (activeLink) activeLink.classList.add('active');

  // Set view panes active states
  document.querySelectorAll('.view-pane').forEach(pane => pane.classList.remove('active'));
  const viewPane = document.getElementById('view-category-details');
  if (viewPane) viewPane.classList.add('active');

  // Stats calculation at Saga level
  const totalTopics = category.topics.length;
  const sagaMetrics = getSagaEffortMetrics(catId);
  const totalHours = sagaMetrics.loggedHours;
  let completedWeight = 0;

  category.topics.forEach(t => {
    const pct = typeof t.percentComplete === 'number' ? t.percentComplete : (t.completed ? 100 : 0);
    completedWeight += (pct / 100);
  });

  const progressPercent = totalTopics > 0 ? Math.round((completedWeight / totalTopics) * 100) : 0;

  // Saga Aggregation calculations
  const sagaId = category.sagaId || ('SAGA-' + category.id.replace('cat-', '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase());
  const sagaTarget = category.sagaTargetHours || 40;
  
  // Tasks related to this Saga (Category Title or matching any child Epic IDs)
  const relatedTasks = state.sprintTasks.filter(t => 
    (t.category && t.category.toLowerCase() === category.title.toLowerCase()) ||
    (t.epicId && category.topics.some(top => top.id === t.epicId || top.epicId === t.epicId))
  );
  const taskCount = relatedTasks.length;
  const doneTaskCount = relatedTasks.filter(t => t.status === 'done').length;
  
  let sagaTotalSp = 0;
  let sagaCompletedSp = 0;
  relatedTasks.forEach(task => {
    const est = parseFloat(task.estimate) || 0;
    sagaTotalSp += est;
    if (task.status === 'done') {
      sagaCompletedSp += est;
    } else if (task.status === 'in-progress') {
      sagaCompletedSp += (est * 0.5);
    }
  });
  
  const sagaProgressPercent = sagaTotalSp > 0 ? Math.round((sagaCompletedSp / sagaTotalSp) * 100) : 0;

  // Render Promo banners
  let visualizerBanner = '';
  if (catId === 'cat-sd') {
    visualizerBanner = `
      <div class="card" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%); border-color: rgba(99, 102, 241, 0.25); margin-bottom: 24px; padding: 20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
        <div>
          <h3 style="font-weight: 800; font-size:1.1rem; margin-bottom:4px; color:var(--text-primary);">🚀 System Design Visualizer Sandbox</h3>
          <p style="font-size:0.8rem; color:var(--text-secondary);">Test Rate Limiters, Load Balancers, LRU Caches, and Replication Sync interactive modules.</p>
        </div>
        <a href="#rate-limiter" class="btn btn-primary" style="padding:10px 20px; text-decoration:none; font-size:0.85rem; font-weight:600; border-radius:6px;">Launch Simulator</a>
      </div>
    `;
  }

  // Right column prompt sandbox content for AI engineering
  let sidePanelHtml = '';
  if (catId === 'cat-ai') {
    sidePanelHtml = `
      <div class="card" style="position: sticky; top: 90px; margin-bottom:20px;">
        <div class="card-header">
          <h3 class="card-title">
            <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/></svg>
            Prompt Sandbox
          </h3>
          <span class="badge badge-yellow">Gemini Mock</span>
        </div>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:12px;">Test prompt structures against systemic templates.</p>
        
        <div class="playground-container">
          <div class="playground-row">
            <label class="playground-label" for="sys-prompt-input">System Instruction</label>
            <textarea class="playground-input" id="sys-prompt-input" placeholder="You are an expert AI software engineer guiding a student..."></textarea>
          </div>
          <div class="playground-row">
            <label class="playground-label" for="user-prompt-input">User Input</label>
            <textarea class="playground-input" id="user-prompt-input" placeholder="Tell me about LangGraph..." style="min-height: 45px;"></textarea>
          </div>
          <button class="playground-btn" id="playground-run-btn" style="width: 100%;">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m5 3 14 9-14 9V3z"/></svg>
            Run Simulation
          </button>
        </div>

        <div style="margin-top: 16px;">
          <div class="playground-label" style="margin-bottom:6px;">Model Response Stream:</div>
          <div class="playground-output-box" id="playground-output" style="max-height: 180px; overflow-y: auto;">
            <span style="color:var(--text-muted);">Response will stream here once you run the simulation.</span>
          </div>
        </div>
      </div>
    `;
  } else {
    // Standard Sprint tasks integration card
    let tasksListHtml = '';
    if (relatedTasks.length === 0) {
      tasksListHtml = `<p style="font-size:0.8rem; color:var(--text-secondary); text-align:center; padding:15px 0;">No active Sprint Tasks linked to this Saga.</p>`;
    } else {
      relatedTasks.forEach(task => {
        let statusBadgeClass = 'badge-blue';
        if (task.status === 'in-progress') statusBadgeClass = 'badge-yellow';
        if (task.status === 'done') statusBadgeClass = 'badge-green';

        tasksListHtml += `
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding:10px 0; font-size:0.8rem;">
            <div>
              <div style="font-weight:600; color:var(--text-primary); cursor:pointer;" onclick="editSprintTaskFromSagaPage('${task.id}')" title="Edit Task">${task.title}</div>
              <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Est: ${task.estimate}h | Status: ${task.status}</div>
            </div>
            <span class="badge ${statusBadgeClass}">${task.status}</span>
          </div>
        `;
      });
    }

    sidePanelHtml = `
      <div class="card" style="position: sticky; top: 90px; margin-bottom:20px;">
        <div class="card-header" style="margin-bottom:12px;">
          <h3 class="card-title">
            <svg viewBox="0 0 24 24"><path d="M3 3h18v18H3zM9 3v18M15 3v18"/></svg>
            Linked Sprint Tasks
          </h3>
          <button class="btn btn-secondary" onclick="createSprintTaskForCategory('${category.title.replace(/'/g, "\\'")}')" style="padding:4px 8px; font-size:0.7rem; border-radius:4px;">⚡ Add Task</button>
        </div>
        ${tasksListHtml}
      </div>
    `;
  }

  // Generate Topics layout (Epics level)
  let topicsListHtml = '';
  if (totalTopics === 0) {
    topicsListHtml = `
      <div class="card" style="text-align:center; padding:40px; color:var(--text-secondary);">
        <p style="font-size:0.9rem;">No checkpoints defined under this category yet.</p>
        <p style="font-size:0.8rem; margin-top:10px;">Return to the Dashboard checklist to add topics.</p>
      </div>
    `;
  } else {
    category.topics.forEach(topic => {
      const topicNotes = topic.notes || '_No study notes captured yet. Click "Edit Notes" or the topic title to begin coding definitions._';
      const epicMetrics = getEpicEffortMetrics(catId, topic.id);
      const hours = epicMetrics.loggedHours;
      const percent = typeof topic.percentComplete === 'number' ? topic.percentComplete : (topic.completed ? 100 : 0);
      
      // Calculate individual Epic SP progress
      const epicTasks = state.sprintTasks.filter(t => t.epicId === topic.id || t.epicId === topic.epicId);
      const epicTaskCount = epicTasks.length;
      let epicTotalSp = 0;
      let epicCompletedSp = 0;
      
      epicTasks.forEach(task => {
        const est = parseFloat(task.estimate) || 0;
        epicTotalSp += est;
        if (task.status === 'done') {
          epicCompletedSp += est;
        } else if (task.status === 'in-progress') {
          epicCompletedSp += (est * 0.5);
        }
      });
      const epicProgressPercent = epicTotalSp > 0 ? Math.round((epicCompletedSp / epicTotalSp) * 100) : 0;
      
      // Inline tasks inside Epic Card
      let epicTasksHtml = '';
      if (epicTaskCount === 0) {
        epicTasksHtml = `<p style="font-size:0.75rem; color:var(--text-secondary); margin:4px 0 0 0; font-style:italic;">No tasks in this Epic module. Click "⚡ Add Task" to create one.</p>`;
      } else {
        epicTasksHtml = `<div style="display:flex; flex-direction:column; gap:4px; margin-top:10px; background:rgba(0,0,0,0.15); padding:8px 12px; border-radius:6px; border:1px solid var(--border-color);">
          <div style="font-size:0.7rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:4px; border-bottom:1px solid var(--border-color); padding-bottom:2px;">Sprint Tasks (${epicTaskCount})</div>`;
        epicTasks.forEach(task => {
          let statusBadgeClass = 'badge-blue';
          if (task.status === 'in-progress') statusBadgeClass = 'badge-yellow';
          if (task.status === 'done') statusBadgeClass = 'badge-green';
          
          epicTasksHtml += `
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; padding:4px 0; border-bottom:1px dashed rgba(255,255,255,0.02);">
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-weight:600; color:var(--text-primary); cursor:pointer; text-decoration:underline;" onclick="editSprintTaskFromSagaPage('${task.id}')" title="Edit Task">${task.title}</span>
                <span style="color:var(--text-muted); font-size:0.7rem;">(${task.estimate || 0} SP)</span>
              </div>
              <span class="badge ${statusBadgeClass}" style="font-size:0.65rem; padding:2px 4px;">${task.status}</span>
            </div>
          `;
        });
        epicTasksHtml += `</div>`;
      }
      
      topicsListHtml += `
        <div class="card" style="margin-bottom:20px; border-left: 3px solid ${percent === 100 ? 'var(--success)' : (percent > 0 ? 'var(--primary)' : 'var(--border-color)')}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 1px solid var(--border-color); padding-bottom:12px; margin-bottom:12px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <label class="custom-checkbox">
                <input type="checkbox" ${topic.completed ? 'checked' : ''} data-topic-id="${topic.id}">
                <span class="checkbox-mark"></span>
              </label>
              <h3 style="font-size:0.95rem; font-weight:700; margin:0; display:flex; align-items:center; gap:8px;">
                <span class="topic-notes-trigger" data-cat-id="${catId}" data-topic-id="${topic.id}" style="cursor:pointer;" title="View details">${topic.text}</span>
                <span style="font-size:0.65rem; font-family:monospace; color:var(--accent); font-weight:700; background:rgba(168,85,247,0.1); padding:2px 4px; border-radius:4px;">${topic.epicId || ''}</span>
              </h3>
            </div>
            
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="badge badge-purple" style="font-size:0.75rem;">⏱️ ${hours} hrs</span>
              <button class="btn btn-secondary" onclick="createSprintTaskForEpic('${catId}', '${topic.id}')" style="padding:4px 8px; font-size:0.7rem; border-radius:4px; border-color:var(--accent); color:var(--accent); font-weight:600; display:flex; align-items:center; gap:2px;">⚡ Add Task</button>
              <button class="btn btn-secondary topic-notes-trigger" data-cat-id="${catId}" data-topic-id="${topic.id}" style="padding:4px 8px; font-size:0.7rem; border-radius:4px;">Edit Notes</button>
              <button class="btn btn-primary" onclick="toggleTopicSimulation('${topic.id}', '${catId}')" style="padding:4px 8px; font-size:0.7rem; border-radius:4px; font-weight:600; background:linear-gradient(135deg, var(--primary), var(--accent)); border:none;">🖥️ Simulation</button>
              <button type="button" class="btn btn-secondary topic-delete-btn" data-cat-id="${catId}" data-topic-id="${topic.id}" style="border-color:var(--danger); color:var(--danger); padding:4px 8px; font-size:0.7rem; border-radius:4px;" title="Delete Epic">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>
              </button>
            </div>
          </div>

          <!-- Notes outlines block -->
          <div style="margin-bottom:14px;">
            <div style="font-size:0.82rem; color:var(--text-secondary); line-height:1.6; background:var(--bg-app); border:1px solid var(--border-color); border-radius:6px; padding:12px; font-style: italic; max-height: 160px; overflow-y:auto; white-space:pre-wrap;">${topicNotes}</div>
            ${topic.links ? `
              <div style="font-size:0.75rem; margin-top:8px;">
                🔗 reference link: <a href="${topic.links}" target="_blank" style="color:var(--primary); text-decoration:underline; font-weight:600;">${topic.links}</a>
              </div>
            ` : ''}
          </div>
          
          <!-- Epic Progress Bar -->
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px; background:rgba(255,255,255,0.01); padding:8px; border-radius:6px; border:1px dashed var(--border-color);">
            <span style="font-size:0.7rem; color:var(--text-secondary); width:95px; font-weight:500;">Epic Progress: <strong>${epicProgressPercent}%</strong></span>
            <div style="background:var(--border-color); height:6px; border-radius:3px; overflow:hidden; flex:1;">
              <div style="background:var(--accent); height:100%; width:${epicProgressPercent}%;"></div>
            </div>
            <span style="font-size:0.7rem; color:var(--text-secondary); font-weight:600; text-align:right; width:55px;">${epicCompletedSp}/${epicTotalSp} SP</span>
          </div>

          <!-- Nested Sprint Tasks inside Epic Card -->
          <div style="margin-bottom:12px;">
            ${epicTasksHtml}
          </div>

          <!-- Dynamic Simulation Playground Mounting Slot -->
          <div id="sim-container-${topic.id}" style="display:none; margin: 12px 0; padding:16px; border-radius:8px; border:1px solid var(--border-color); background:rgba(0,0,0,0.15); transition:all 0.3s ease-in-out;"></div>

          <!-- Completion Slider & Hours Logger combo -->
          <div style="background:rgba(255,255,255,0.015); border-top:1px dashed var(--border-color); padding-top:12px; display:flex; flex-direction:column; gap:12px;">
            
            <!-- Completion percentage allocation -->
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size:0.75rem; color:var(--text-secondary); width:85px; font-weight:500;">Check progress: <strong>${percent}%</strong></span>
              <input type="range" min="0" max="100" step="10" value="${percent}" class="topic-percent-slider" data-cat-id="${catId}" data-topic-id="${topic.id}" style="flex:1; accent-color:var(--primary); height:6px; border-radius:3px; background:var(--border-color); border:none; cursor:pointer;">
            </div>

            <!-- Hours spent logger -->
            <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.75rem; border-top: 1px solid rgba(255,255,255,0.02); padding-top:8px;">
              <span style="color:var(--text-secondary);">Log study hours:</span>
              <div style="display:flex; gap:6px; align-items:center;">
                <input type="number" step="0.5" min="0" placeholder="1.5" id="log-hours-input-${topic.id}" style="width:60px; padding:4px 8px; font-size:0.8rem; border-radius:4px; border:1px solid var(--border-color); background:var(--bg-app); color:var(--text-primary);">
                <button class="btn btn-secondary" onclick="logTopicHours('${catId}', '${topic.id}')" style="padding:4px 8px; font-size:0.75rem; border-radius:4px; font-weight:600;">Log</button>
              </div>
            </div>

          </div>
        </div>
      `;
    });
  }

  // Category view panel markup
  if (viewPane) {
    viewPane.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
        <div>
          <h1 class="page-title" style="font-size:1.6rem; font-weight:800; color:var(--text-primary);">${category.title} Saga Path</h1>
          <p class="page-subtitle">Track course outline Sagas, log study hours, and check off Epic curriculum milestones.</p>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" class="btn btn-secondary category-delete-btn" data-cat-id="${catId}" style="border-color:var(--danger); color:var(--danger); display:flex; align-items:center; gap:6px; font-size:0.8rem; padding:8px 14px; border-radius:6px; font-weight:600;" title="Delete Saga">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/></svg>
            Delete Saga
          </button>
          <a href="#dashboard" class="btn btn-secondary" style="text-decoration:none; display:flex; align-items:center; gap:6px; font-size:0.8rem; padding:8px 14px; border-radius:6px; font-weight:600;">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Dashboard View
          </a>
        </div>
      </div>

      ${visualizerBanner}

      <div class="grid-sidebar-layout">
        <!-- Left details column -->
        <div>
          <h2 style="font-size:1.1rem; font-weight:800; margin-bottom:16px;">Epics (Modules)</h2>
          ${topicsListHtml}
        </div>

        <!-- Right statistics column -->
        <div>
          <!-- Progress stats card -->
          <div class="card" style="margin-bottom:20px;">
            <h3 class="card-title" style="margin-bottom:16px;">
              <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Saga Checkpoint Progress
            </h3>
            
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; font-size:0.85rem;">
              <span style="color:var(--text-secondary);">Epics Checked:</span>
              <span style="font-weight:700; color:var(--text-primary);">${Math.round(completedWeight * 10) / 10} / ${totalTopics} Done</span>
            </div>

            <div style="background:var(--border-color); height:8px; border-radius:4px; overflow:hidden; margin-bottom:20px;">
              <div style="background:var(--primary); height:100%; width:${progressPercent}%;"></div>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; border-top: 1px solid var(--border-color); padding-top:14px; font-size:0.85rem;">
              <span style="color:var(--text-secondary);">Total Study Duration:</span>
              <span style="font-weight:800; color:var(--primary); font-size:1.05rem;">⚡ ${totalHours} hrs</span>
            </div>
          </div>

          <!-- Jira Saga controller card -->
          <div class="card" style="margin-bottom:20px; border-top: 4px solid var(--accent);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <h3 class="card-title" style="margin:0;">
                <svg viewBox="0 0 24 24" style="stroke:var(--accent); width:18px; height:18px;"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>
                Jira Saga Board
              </h3>
              <span class="badge badge-purple" style="font-family:monospace; font-weight:700;">${sagaId}</span>
            </div>
            
            <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--text-secondary);">Saga Target hours:</span>
                <input type="number" value="${sagaTarget}" id="epic-target-input-${category.id}" onchange="updateSagaTargetHours('${category.id}', this.value)" style="width:60px; padding:3px 6px; font-size:0.75rem; border-radius:4px; border:1px solid var(--border-color); background:var(--bg-app); color:var(--text-primary); font-weight:700; text-align:center;">
              </div>
              
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--text-secondary);">Allocated Tasks Estimate:</span>
                <span style="font-weight:700;">${sagaTotalSp} SP</span>
              </div>
              
              <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--border-color); padding-top:8px;">
                <span style="color:var(--text-secondary);">Tasks Roll-up:</span>
                <span style="font-weight:600;">${doneTaskCount} of ${taskCount} complete</span>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--text-secondary);">Saga Tasks Progress:</span>
                <span style="font-weight:700; color:var(--accent);">${sagaProgressPercent}%</span>
              </div>
              
              <div style="background:var(--border-color); height:6px; border-radius:3px; overflow:hidden; margin-top:2px;">
                <div style="background:var(--accent); height:100%; width:${sagaProgressPercent}%;"></div>
              </div>
            </div>
          </div>

          <!-- Extra components target (Tasks/Playground) -->
          ${sidePanelHtml}
        </div>
      </div>
    `;

    // Make sure sandbox click handlers mount if AI Engineering
    if (catId === 'cat-ai') {
      setupPlayground();
    }
  }
}

window.createSprintTaskForEpic = function(catId, topicId) {
  const category = state.roadmap.find(c => c.id === catId);
  if (!category) return;
  const topic = category.topics.find(t => t.id === topicId);
  if (!topic) return;

  const modal = document.getElementById('task-modal');
  if (!modal) return;
  
  state.editingTaskId = null;
  document.getElementById('task-input-title').value = '';
  document.getElementById('task-input-desc').value = `Activity for Epic: ${topic.text}`;
  document.getElementById('task-input-estimate').value = '2';
  document.getElementById('task-input-priority').value = 'medium';
  document.getElementById('task-input-status').value = 'todo';
  
  const sprintSelector = document.getElementById('task-input-sprint');
  if (sprintSelector) {
    sprintSelector.innerHTML = state.sprints.map(s => `<option value="${s}">${s}</option>`).join('');
    sprintSelector.value = state.activeSprint || 'Sprint 1';
  }
  
  const catSelector = document.getElementById('task-input-cat');
  if (catSelector) {
    catSelector.innerHTML = state.roadmap.map(c => `<option value="${c.title}">${c.title}</option>`).join('');
    catSelector.value = category.title;
  }
  
  updateTaskModalEpicsDropdown(category.title, topic.id);

  const modalDeleteBtn = document.getElementById('task-delete-btn');
  if (modalDeleteBtn) modalDeleteBtn.style.display = 'none';

  document.getElementById('task-modal-title').textContent = `Create Task for Epic: ${topic.text}`;
  modal.classList.add('active');
};

window.createSprintTaskForCategory = function(categoryTitle) {
  const matchCat = state.roadmap.find(c => c.title.toLowerCase() === categoryTitle.toLowerCase());
  if (matchCat && matchCat.topics && matchCat.topics.length > 0) {
    window.createSprintTaskForEpic(matchCat.id, matchCat.topics[0].id);
  } else {
    // Fallback if no topics exist
    const modal = document.getElementById('task-modal');
    if (!modal) return;
    state.editingTaskId = null;
    document.getElementById('task-input-title').value = '';
    document.getElementById('task-input-desc').value = `Study key aspects of ${categoryTitle} path.`;
    document.getElementById('task-input-estimate').value = '2';
    document.getElementById('task-input-priority').value = 'medium';
    document.getElementById('task-input-status').value = 'todo';
    
    const sprintSelector = document.getElementById('task-input-sprint');
    if (sprintSelector) {
      sprintSelector.innerHTML = state.sprints.map(s => `<option value="${s}">${s}</option>`).join('');
      sprintSelector.value = state.activeSprint || 'Sprint 1';
    }
    
    const catSelector = document.getElementById('task-input-cat');
    if (catSelector) {
      catSelector.innerHTML = state.roadmap.map(c => `<option value="${c.title}">${c.title}</option>`).join('');
      catSelector.value = categoryTitle;
    }
    
    const epicSelector = document.getElementById('task-input-epic');
    if (epicSelector) epicSelector.innerHTML = '<option value="">No Epics Available</option>';
    
    const modalDeleteBtn = document.getElementById('task-delete-btn');
    if (modalDeleteBtn) modalDeleteBtn.style.display = 'none';

    document.getElementById('task-modal-title').textContent = 'Create Linked Sprint Task';
    modal.classList.add('active');
  }
};

window.editSprintTaskFromSagaPage = function(taskId) {
  const task = state.sprintTasks.find(t => t.id === taskId);
  if (!task) return;
  
  const modal = document.getElementById('task-modal');
  if (!modal) return;
  
  state.editingTaskId = taskId;
  document.getElementById('task-modal-title').textContent = 'Edit Task Details';
  
  // Populate category selector
  const catSel = document.getElementById('task-input-cat');
  catSel.innerHTML = state.roadmap.map(c => `<option value="${c.title}">${c.title}</option>`).join('');
  catSel.value = task.category;
  
  // Populate Epic choices
  updateTaskModalEpicsDropdown(task.category, task.epicId);

  // Populate sprint choices
  const sprintSelector = document.getElementById('task-input-sprint');
  sprintSelector.innerHTML = state.sprints.map(s => `<option value="${s}">${s}</option>`).join('');
  sprintSelector.value = task.sprint;

  // Set form inputs
  document.getElementById('task-input-title').value = task.title;
  document.getElementById('task-input-desc').value = task.desc || '';
  document.getElementById('task-input-priority').value = task.priority;
  document.getElementById('task-input-estimate').value = task.estimate;
  document.getElementById('task-input-status').value = task.status;
  const hoursInput = document.getElementById('task-input-logged-hours');
  if (hoursInput) hoursInput.value = task.hoursLogged || '';
  
  const modalDeleteBtn = document.getElementById('task-delete-btn');
  if (modalDeleteBtn) modalDeleteBtn.style.display = 'block';
  modal.classList.add('active');
};

window.updateSagaTargetHours = function(catId, value) {
  const parsed = parseInt(value);
  if (isNaN(parsed) || parsed < 0) return;
  
  const category = state.roadmap.find(c => c.id === catId);
  if (category) {
    category.sagaTargetHours = parsed;
    saveToStorage('portal_dynamic_roadmap', state.roadmap);
    updateProgressMetrics();
    showCategoryPage(catId);
    renderSprintBoard();
  }
};
window.updateEpicTargetHours = window.updateSagaTargetHours;

// Listeners for dynamic category percent sliders
document.addEventListener('input', (e) => {
  if (e.target.classList.contains('topic-percent-slider')) {
    const slider = e.target;
    const catId = slider.getAttribute('data-cat-id');
    const topicId = slider.getAttribute('data-topic-id');
    const val = parseInt(slider.value);
    
    const category = state.roadmap.find(c => c.id === catId);
    if (category) {
      const topic = category.topics.find(t => t.id === topicId);
      if (topic) {
        topic.percentComplete = val;
        topic.completed = (val === 100);
        
        // Update label text next to slider inline
        const textContainer = slider.previousElementSibling;
        if (textContainer) {
          textContainer.innerHTML = `Progress: <strong>${val}%</strong>`;
        }
      }
    }
  }
});

document.addEventListener('change', (e) => {
  if (e.target.classList.contains('topic-percent-slider')) {
    const slider = e.target;
    const catId = slider.getAttribute('data-cat-id');
    const topicId = slider.getAttribute('data-topic-id');
    const val = parseInt(slider.value);
    
    saveToStorage('portal_dynamic_roadmap', state.roadmap);
    
    // Synchronize checkboxes across other views
    document.querySelectorAll(`input[type="checkbox"][data-topic-id="${topicId}"]`).forEach(cb => {
      cb.checked = (val === 100);
      const item = cb.closest('.checklist-item');
      if (item) {
        if (val === 100) {
          item.classList.add('completed');
        } else {
          item.classList.remove('completed');
        }
      }
    });

    updateProgressMetrics();
    renderRoadmap();
    renderAiEngineeringTrack();
    showCategoryPage(catId);
  }
});

window.toggleTopicSimulation = function(topicId, catId) {
  const container = document.getElementById(`sim-container-${topicId}`);
  if (!container) return;
  
  const isHidden = container.style.display === 'none';
  
  if (typeof stopAllSandboxIntervals === 'function') {
    stopAllSandboxIntervals();
  }
  
  if (isHidden) {
    const category = state.roadmap.find(c => c.id === catId);
    const topic = category ? category.topics.find(t => t.id === topicId) : null;
    if (topic) {
      if (!topic.activeSimType) {
        topic.activeSimType = detectDefaultSimType(topic.text);
      }
      renderTopicSimulation(topicId, catId);
      container.style.display = 'block';
    }
  } else {
    container.style.display = 'none';
    container.innerHTML = '';
  }
};

window.changeTopicSimulationType = function(topicId, catId, simType) {
  const category = state.roadmap.find(c => c.id === catId);
  const topic = category ? category.topics.find(t => t.id === topicId) : null;
  if (topic) {
    topic.activeSimType = simType;
    saveToStorage('portal_dynamic_roadmap', state.roadmap);
    
    if (typeof stopAllSandboxIntervals === 'function') {
      stopAllSandboxIntervals();
    }
    
    renderTopicSimulation(topicId, catId);
  }
};

function detectDefaultSimType(text) {
  const query = text.toLowerCase();
  if (query.includes('kafka') || query.includes('stream')) return 'kafka';
  if (query.includes('redis') || query.includes('cache')) return 'redis';
  if (query.includes('rate') || query.includes('limit') || query.includes('bucket')) return 'rate-limiter';
  if (query.includes('llm') || query.includes('prompt') || query.includes('langgraph') || query.includes('crewai') || query.includes('agent')) return 'ai-prompt';
  return 'flowchart';
}

function renderTopicSimulation(topicId, catId) {
  const container = document.getElementById(`sim-container-${topicId}`);
  if (!container) return;
  
  const category = state.roadmap.find(c => c.id === catId);
  const topic = category ? category.topics.find(t => t.id === topicId) : null;
  if (!topic) return;
  
  const activeSim = topic.activeSimType || 'flowchart';
  
  const selectorHtml = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:10px; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
      <span style="font-size:0.72rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; display:flex; align-items:center; gap:4px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7l7 5-7 5z"/></svg>
        Active Simulation
      </span>
      <select onchange="changeTopicSimulationType('${topicId}', '${catId}', this.value)" style="padding:4px 8px; font-size:0.75rem; border-radius:4px; border:1px solid var(--border-color); background:var(--bg-app); color:var(--text-primary); font-weight:600; cursor:pointer; outline:none;">
        <option value="flowchart" ${activeSim === 'flowchart' ? 'selected' : ''}>Interactive Flowchart</option>
        <option value="rate-limiter" ${activeSim === 'rate-limiter' ? 'selected' : ''}>Token Bucket Rate Limiter</option>
        <option value="redis" ${activeSim === 'redis' ? 'selected' : ''}>Redis Cache-Aside Simulation</option>
        <option value="kafka" ${activeSim === 'kafka' ? 'selected' : ''}>Kafka Partition Streaming</option>
        <option value="ai-prompt" ${activeSim === 'ai-prompt' ? 'selected' : ''}>AI Prompt Sandbox Pipeline</option>
      </select>
    </div>
  `;
  
  const contentHtml = getTopicSimulationHtmlByType(activeSim, topic);
  container.innerHTML = selectorHtml + contentHtml;
  initializeTopicSimulationWidgetsByType(activeSim, topicId, topic.text);
}

function getTopicSimulationHtmlByType(simType, topic) {
  if (simType === 'kafka') {
    return getKafkaSimulationHtml(topic);
  } else if (simType === 'redis') {
    return getRedisSimulationHtml(topic);
  } else if (simType === 'ai-prompt') {
    return getPromptSimulationHtml(topic);
  } else if (simType === 'rate-limiter') {
    return getRateLimiterSimulationHtml(topic);
  } else {
    return getFlowchartSimulationHtml(topic);
  }
}

function initializeTopicSimulationWidgetsByType(simType, topicId, topicText) {
  if (simType === 'kafka') {
    initializeKafkaSimulation(topicId);
  } else if (simType === 'redis') {
    initializeRedisSimulation(topicId);
  } else if (simType === 'ai-prompt') {
    initializePromptSimulation(topicId);
  } else if (simType === 'rate-limiter') {
    initializeRateLimiterSimulation(topicId);
  }
}

function getKafkaSimulationHtml(topic) {
  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <h4 style="margin:0; font-size:0.9rem; font-weight:700; color:var(--accent);">Apache Kafka Partition Broker Simulation</h4>
      <p style="font-size:0.75rem; color:var(--text-secondary); margin:0;">Choose partition routing strategy, send test events, and watch offset markers increment.</p>
      
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; align-items:center; background:rgba(255,255,255,0.01); border:1px solid var(--border-color); border-radius:8px; padding:16px;">
        <!-- Left: Controls -->
        <div>
          <div class="control-group">
            <label class="control-label" style="font-size:0.7rem; margin-bottom: 4px;">Partition Routing Strategy</label>
            <select id="kafka-strategy-${topic.id}" class="modal-input" style="padding:6px; font-size:0.75rem; border-radius:4px; width: 100%; border: 1px solid var(--border-color); background: var(--bg-app); color: var(--text-primary);">
              <option value="round-robin">Round-Robin Balancing</option>
              <option value="key-hash">Key-based Hashing (len % 2)</option>
            </select>
          </div>
          <div id="kafka-key-group-${topic.id}" class="control-group" style="display:none; margin-top:8px;">
            <label class="control-label" style="font-size:0.7rem; margin-bottom: 4px;">Event Key</label>
            <input type="text" id="kafka-key-input-${topic.id}" class="modal-input" value="user-signup" style="padding:6px; font-size:0.75rem; border-radius:4px; width: 100%; border: 1px solid var(--border-color); background: var(--bg-app); color: var(--text-primary);">
          </div>
          <div class="control-group" style="margin-top:8px;">
            <label class="control-label" style="font-size:0.7rem; margin-bottom: 4px;">Event Payload Body</label>
            <input type="text" id="kafka-payload-${topic.id}" class="modal-input" value="Order Created" style="padding:6px; font-size:0.75rem; border-radius:4px; width: 100%; border: 1px solid var(--border-color); background: var(--bg-app); color: var(--text-primary);">
          </div>
          <button class="btn btn-primary" id="kafka-send-btn-${topic.id}" style="width:100%; padding:8px; font-size:0.8rem; font-weight:600; margin-top:12px; border-radius:4px;">Publish Event</button>
        </div>
        
        <!-- Right: Visualizer -->
        <div style="display:flex; flex-direction:column; gap:12px;">
          <!-- Partition 0 -->
          <div style="border:1px solid var(--border-color); border-radius:6px; padding:10px; background:var(--bg-app);">
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; margin-bottom:6px; font-weight:600;">
              <span>Partition 0</span>
              <span id="kafka-part0-count-${topic.id}" style="color:var(--primary);">0 msgs</span>
            </div>
            <div id="kafka-part0-queue-${topic.id}" style="display:flex; gap:6px; overflow-x:auto; min-height:34px; padding:6px; background:rgba(0,0,0,0.2); border-radius:4px; align-items:center; border: 1px solid rgba(255,255,255,0.03);">
              <span style="font-size:0.65rem; color:var(--text-muted); width:100%; text-align:center;">Empty queue</span>
            </div>
          </div>
          <!-- Partition 1 -->
          <div style="border:1px solid var(--border-color); border-radius:6px; padding:10px; background:var(--bg-app);">
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; margin-bottom:6px; font-weight:600;">
              <span>Partition 1</span>
              <span id="kafka-part1-count-${topic.id}" style="color:var(--primary);">0 msgs</span>
            </div>
            <div id="kafka-part1-queue-${topic.id}" style="display:flex; gap:6px; overflow-x:auto; min-height:34px; padding:6px; background:rgba(0,0,0,0.2); border-radius:4px; align-items:center; border: 1px solid rgba(255,255,255,0.03);">
              <span style="font-size:0.65rem; color:var(--text-muted); width:100%; text-align:center;">Empty queue</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Logs console -->
      <div style="background:#0b0f19; border:1px solid var(--border-color); border-radius:6px; padding:10px; font-family:monospace; font-size:0.7rem; color:#10b981; max-height:100px; overflow-y:auto; line-height:1.4;" id="kafka-logs-${topic.id}">
        [System] Broker online. Awaiting message streams...
      </div>
    </div>
  `;
}

function getRedisSimulationHtml(topic) {
  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <h4 style="margin:0; font-size:0.9rem; font-weight:700; color:var(--accent);">Redis Cache-Aside Pattern Simulation</h4>
      <p style="font-size:0.75rem; color:var(--text-secondary); margin:0;">Query keys to watch cache checking, DB query fallbacks, and LRU cache updates.</p>
      
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; background:rgba(255,255,255,0.01); border:1px solid var(--border-color); border-radius:8px; padding:16px; align-items:flex-start;">
        <!-- Left Side: Controls & Logs -->
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; gap:6px;">
            <select id="redis-key-select-${topic.id}" class="modal-input" style="padding:6px; font-size:0.75rem; border-radius:4px; flex:1; border: 1px solid var(--border-color); background: var(--bg-app); color: var(--text-primary);">
              <option value="user:101">user:101 (MySQL DB)</option>
              <option value="user:102">user:102 (MySQL DB)</option>
              <option value="settings">settings (MySQL DB)</option>
              <option value="auth:token">auth:token (MySQL DB)</option>
            </select>
            <button class="btn btn-primary" id="redis-query-btn-${topic.id}" style="padding:6px 12px; font-size:0.75rem; font-weight:600; border-radius:4px;">Query Key</button>
          </div>
          
          <div style="display:flex; justify-content:space-between; font-size:0.7rem; background:rgba(255,255,255,0.02); padding:6px; border-radius:4px; border: 1px solid var(--border-color);">
            <span id="redis-hits-${topic.id}" style="font-weight:600;">Hits: 0</span>
            <span id="redis-misses-${topic.id}" style="font-weight:600;">Misses: 0</span>
            <span id="redis-ratio-${topic.id}" style="font-weight:600; color: var(--primary);">Hit Ratio: 0%</span>
          </div>
          
          <div style="background:#0b0f19; border:1px solid var(--border-color); border-radius:6px; padding:8px; font-family:monospace; font-size:0.65rem; color:#10b981; min-height:75px; max-height:100px; overflow-y:auto; line-height:1.4;" id="redis-logs-${topic.id}">
            [Redis] Cluster initialized. Memory usage: 0/4 slots occupied.
          </div>
        </div>
        
        <!-- Right Side: Storages Visualization -->
        <div style="display:flex; flex-direction:column; gap:12px;">
          <!-- Cache layer -->
          <div id="redis-cache-box-${topic.id}" style="border:1.5px solid var(--border-color); border-radius:6px; padding:10px; background:var(--bg-app); transition: all 0.2s;">
            <div style="font-size:0.7rem; font-weight:700; margin-bottom:6px; text-transform:uppercase; color:var(--primary); display:flex; justify-content:space-between;">
              <span>Redis In-Memory Cache</span>
              <span style="font-size:0.65rem; color:var(--text-secondary);">max 4 items</span>
            </div>
            <div id="redis-slots-container-${topic.id}" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:6px; min-height:48px;">
              <div style="border:1px dashed var(--border-color); border-radius:4px; padding:6px; text-align:center; font-size:0.65rem; color:var(--text-muted); background: rgba(0,0,0,0.1);">slot 1 empty</div>
              <div style="border:1px dashed var(--border-color); border-radius:4px; padding:6px; text-align:center; font-size:0.65rem; color:var(--text-muted); background: rgba(0,0,0,0.1);">slot 2 empty</div>
              <div style="border:1px dashed var(--border-color); border-radius:4px; padding:6px; text-align:center; font-size:0.65rem; color:var(--text-muted); background: rgba(0,0,0,0.1);">slot 3 empty</div>
              <div style="border:1px dashed var(--border-color); border-radius:4px; padding:6px; text-align:center; font-size:0.65rem; color:var(--text-muted); background: rgba(0,0,0,0.1);">slot 4 empty</div>
            </div>
          </div>
          
          <!-- Database layer -->
          <div id="redis-db-box-${topic.id}" style="border:1px solid var(--border-color); border-radius:6px; padding:10px; background:var(--bg-app); transition: all 0.2s;">
            <div style="font-size:0.7rem; font-weight:700; margin-bottom:6px; text-transform:uppercase; color:var(--accent);">MySQL Primary DB (Disk)</div>
            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:4px; font-size:0.65rem; text-align:center;">
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:4px; padding:3px; font-weight:600;">user:101</div>
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:4px; padding:3px; font-weight:600;">user:102</div>
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:4px; padding:3px; font-weight:600;">settings</div>
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:4px; padding:3px; font-weight:600;">auth:token</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getPromptSimulationHtml(topic) {
  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <h4 style="margin:0; font-size:0.9rem; font-weight:700; color:var(--accent);">AI Prompt Sandbox Pipeline Visualizer</h4>
      <p style="font-size:0.75rem; color:var(--text-secondary); margin:0;">Execute system instruction loops and see token stages flow through check nodes.</p>
      
      <div style="display:flex; flex-direction:column; gap:12px; background:rgba(255,255,255,0.01); border:1px solid var(--border-color); border-radius:8px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; position:relative; padding:10px 0;">
          <div style="position:absolute; top:50%; left:20px; right:20px; height:2px; background:var(--border-color); z-index:1;" id="prompt-flow-line-${topic.id}"></div>
          
          <div class="prompt-node active" id="pnode-in-${topic.id}" style="z-index:2; background:var(--bg-app); border:2px solid var(--primary); border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:700; color:var(--primary); transition:all 0.3s; box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);" title="Input Prompt">IN</div>
          <div class="prompt-node" id="pnode-sys-${topic.id}" style="z-index:2; background:var(--bg-app); border:2px solid var(--border-color); border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:700; transition:all 0.3s; color: var(--text-secondary);" title="System Instruction Injector">SYS</div>
          <div class="prompt-node" id="pnode-model-${topic.id}" style="z-index:2; background:var(--bg-app); border:2px solid var(--border-color); border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:700; transition:all 0.3s; color: var(--text-secondary);" title="LLM Inference Model">LLM</div>
          <div class="prompt-node" id="pnode-guard-${topic.id}" style="z-index:2; background:var(--bg-app); border:2px solid var(--border-color); border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:700; transition:all 0.3s; color: var(--text-secondary);" title="Output Guardrails Filter">GD</div>
          <div class="prompt-node" id="pnode-out-${topic.id}" style="z-index:2; background:var(--bg-app); border:2px solid var(--border-color); border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:700; transition:all 0.3s; color: var(--text-secondary);" title="Result Output">OUT</div>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:8px;">
          <div>
            <div class="control-group">
              <label class="control-label" style="font-size:0.65rem; margin-bottom: 4px;">System Instructions</label>
              <input type="text" id="prompt-sys-input-${topic.id}" class="modal-input" value="Format responses as clean JSON objects" style="padding:6px; font-size:0.75rem; border-radius:4px; width:100%; border: 1px solid var(--border-color); background: var(--bg-app); color: var(--text-primary);">
            </div>
            <div class="control-group" style="margin-top:8px;">
              <label class="control-label" style="font-size:0.65rem; margin-bottom: 4px;">Prompt Query</label>
              <input type="text" id="prompt-query-input-${topic.id}" class="modal-input" value="Tell me about ${topic.text}" style="padding:6px; font-size:0.75rem; border-radius:4px; width:100%; border: 1px solid var(--border-color); background: var(--bg-app); color: var(--text-primary);">
            </div>
            <button class="btn btn-primary" id="prompt-run-btn-${topic.id}" style="width:100%; padding:8px; font-size:0.75rem; font-weight:700; margin-top:12px; border-radius:4px;">Run Prompt</button>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:4px;">
            <span style="font-size:0.65rem; color:var(--text-secondary); font-weight:600;">Response Stream:</span>
            <div id="prompt-output-box-${topic.id}" style="background:#0b0f19; border:1px solid var(--border-color); border-radius:6px; padding:10px; font-family:monospace; font-size:0.7rem; color:#10b981; flex:1; min-height:100px; max-height:140px; overflow-y:auto; white-space:pre-wrap; line-height:1.4;">Awaiting pipeline trigger...</div>
          </div>
        </div>
      </div>
    </div>
  `;
}
  
function getFlowchartSimulationHtml(topic) {
  const notesText = topic.notes || '';
  let flowchartNodes = [];
  
  if (notesText.includes('->')) {
    const lines = notesText.split('\n');
    lines.forEach(l => {
      if (l.includes('->')) {
        const cleanLine = l.replace(/^[\*\-\s]+/, '').trim();
        const parts = cleanLine.split('->').map(p => p.trim());
        parts.forEach((p) => {
          if (p && !flowchartNodes.includes(p)) {
            flowchartNodes.push(p);
          }
        });
      }
    });
  }
  
  if (flowchartNodes.length === 0) {
    const term = topic.text.toLowerCase();
    if (term.includes('rate') || term.includes('limit')) {
      flowchartNodes = ['Client Request', 'Rate Limiter filter', 'Token Bucket Check', 'Target Microservice', 'Rate Limit Block 429'];
    } else if (term.includes('redis') || term.includes('cache')) {
      flowchartNodes = ['API Gateway', 'Read Redis Cache', 'MySQL Primary DB', 'Update Memory Cache', 'Client Return'];
    } else if (term.includes('sprint') || term.includes('board')) {
      flowchartNodes = ['Jira Epic Target', 'Sprint Task Backlog', 'Sprint Backlog Board', 'Active In-Progress', 'Target Checked Done'];
    } else {
      flowchartNodes = ['Client Request', 'Gateway Router', `${topic.text} Handler`, 'Local Store Check', 'Complete Callback'];
    }
  }
  
  let svgNodesHtml = '';
  let svgLinesHtml = '';
  
  flowchartNodes.forEach((nodeName, index) => {
    const colWidth = 140;
    const xOffset = 30 + (index * colWidth);
    const yOffset = 40;
    
    svgNodesHtml += `
      <g class="flowchart-node-group" style="cursor:pointer;" onclick="alert('Component Details: ${nodeName}')">
        <rect x="${xOffset}" y="${yOffset}" width="110" height="40" rx="6" fill="#1e293b" stroke="var(--primary)" stroke-width="1.5" class="flow-node-rect" style="transition:all 0.3s;"></rect>
        <text x="${xOffset + 55}" y="${yOffset + 24}" fill="var(--text-primary)" font-size="9" text-anchor="middle" font-family="var(--font-sans)" font-weight="600">${nodeName}</text>
      </g>
    `;
    
    if (index < flowchartNodes.length - 1) {
      const nextX = xOffset + 110;
      const nextTargetX = 30 + ((index + 1) * colWidth);
      const lineY = yOffset + 20;
      svgLinesHtml += `
        <line x1="${nextX}" y1="${lineY}" x2="${nextTargetX}" y2="${lineY}" stroke="var(--border-color)" stroke-width="2" marker-end="url(#arrow)" stroke-dasharray="4" class="flow-line-anim"></line>
      `;
    }
  });

  return `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <h4 style="margin:0; font-size:0.9rem; font-weight:700; color:var(--accent);">Interactive Architectural Flowchart</h4>
      <p style="font-size:0.75rem; color:var(--text-secondary); margin:0;">Hover over flowchart nodes to trace architectural components and processing loops. To define custom steps, write 'A -> B -> C' inside your study notes!</p>
      
      <div style="background:rgba(255,255,255,0.01); border:1px solid var(--border-color); border-radius:8px; padding:12px; overflow-x:auto; width:100%;">
        <svg width="${100 + (flowchartNodes.length * 140)}" height="110" style="background:#0d111d; border-radius:6px;">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary)"></path>
            </marker>
          </defs>
          
          ${svgLinesHtml}
          ${svgNodesHtml}
        </svg>
      </div>
    </div>
  `;
}

function getRateLimiterSimulationHtml(topic) {
  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <h4 style="margin:0; font-size:0.9rem; font-weight:700; color:var(--accent);">Token Bucket Rate Limiter</h4>
      <p style="font-size:0.75rem; color:var(--text-secondary); margin:0;">Simulate token consumption and refill rates dynamically.</p>
      
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; background:rgba(255,255,255,0.01); border:1px solid var(--border-color); border-radius:8px; padding:16px; align-items:center;">
        <!-- Left: Controls -->
        <div>
          <div class="control-group">
            <label class="control-label" style="font-size:0.7rem; margin-bottom: 4px; color:var(--text-secondary);">Bucket Capacity: <span id="rl-cap-val-${topic.id}" style="font-weight:700; color:var(--primary);">10</span></label>
            <input type="range" id="rl-cap-input-${topic.id}" min="5" max="20" value="10" style="width:100%; accent-color:var(--primary); height:6px; border-radius:3px; background:var(--border-color); border:none; cursor:pointer;">
          </div>
          <div class="control-group" style="margin-top:8px;">
            <label class="control-label" style="font-size:0.7rem; margin-bottom: 4px; color:var(--text-secondary);">Refill Rate: <span id="rl-rate-val-${topic.id}" style="font-weight:700; color:var(--primary);">2</span>/s</label>
            <input type="range" id="rl-rate-input-${topic.id}" min="1" max="5" value="2" style="width:100%; accent-color:var(--primary); height:6px; border-radius:3px; background:var(--border-color); border:none; cursor:pointer;">
          </div>
          <button class="btn btn-primary" id="rl-consume-btn-${topic.id}" style="width:100%; padding:8px; font-size:0.8rem; font-weight:600; margin-top:12px; border-radius:4px;">Consume Token (Send Request)</button>
        </div>
        
        <!-- Right: Visualizer & Logs -->
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="text-align:center; padding:10px; background:var(--bg-app); border:1px solid var(--border-color); border-radius:6px;">
            <div style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Current Tokens</div>
            <div id="rl-tokens-display-${topic.id}" style="font-size:1.5rem; font-weight:800; color:var(--primary);">10 / 10</div>
          </div>
          <div style="background:#0b0f19; border:1px solid var(--border-color); border-radius:6px; padding:8px; font-family:monospace; font-size:0.65rem; color:#10b981; min-height:75px; max-height:100px; overflow-y:auto; line-height:1.4;" id="rl-logs-${topic.id}">
            [Rate Limiter] Online. Ready for request logs.
          </div>
        </div>
      </div>
    </div>
  `;
}

function initializeKafkaSimulation(topicId) {
  const sendBtn = document.getElementById(`kafka-send-btn-${topicId}`);
  const strategySelect = document.getElementById(`kafka-strategy-${topicId}`);
  const keyGroup = document.getElementById(`kafka-key-group-${topicId}`);
  const keyInput = document.getElementById(`kafka-key-input-${topicId}`);
  const payloadInput = document.getElementById(`kafka-payload-${topicId}`);
  const part0Queue = document.getElementById(`kafka-part0-queue-${topicId}`);
  const part1Queue = document.getElementById(`kafka-part1-queue-${topicId}`);
  const part0Count = document.getElementById(`kafka-part0-count-${topicId}`);
  const part1Count = document.getElementById(`kafka-part1-count-${topicId}`);
  const consoleLogs = document.getElementById(`kafka-logs-${topicId}`);
  
  let localMsgId = 0;
  let roundRobinToggle = 0;
  let part0Msgs = 0;
  let part1Msgs = 0;
  
  if (strategySelect) {
    strategySelect.addEventListener('change', () => {
      if (strategySelect.value === 'key-hash') {
        if (keyGroup) keyGroup.style.display = 'block';
      } else {
        if (keyGroup) keyGroup.style.display = 'none';
      }
    });
  }
  
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const payload = payloadInput ? payloadInput.value.trim() : 'Event';
      const strategy = strategySelect ? strategySelect.value : 'round-robin';
      const key = keyInput ? keyInput.value.trim() : 'key';
      
      let targetPart = 0;
      if (strategy === 'round-robin') {
        targetPart = roundRobinToggle;
        roundRobinToggle = 1 - roundRobinToggle;
      } else {
        targetPart = key.length % 2;
      }
      
      localMsgId++;
      const timestamp = new Date().toLocaleTimeString();
      let logMsg = `[${timestamp}] [Producer] Sent "${payload}" to Partition ${targetPart}`;
      if (strategy === 'key-hash') {
        logMsg = `[${timestamp}] [Producer] Keyed Event "${payload}" (Hash key: "${key}" length: ${key.length}) mapped to Partition ${targetPart}`;
      }
      if (consoleLogs) {
        consoleLogs.innerHTML += `<br>${logMsg}`;
        consoleLogs.scrollTop = consoleLogs.scrollHeight;
      }
      
      const bubble = document.createElement('span');
      bubble.className = 'badge badge-purple pulse';
      bubble.style.fontSize = '0.6rem';
      bubble.style.padding = '3px 6px';
      bubble.textContent = `offset:${localMsgId}`;
      
      if (targetPart === 0) {
        part0Msgs++;
        if (part0Count) part0Count.textContent = `${part0Msgs} msgs`;
        if (part0Queue) {
          if (part0Queue.innerHTML.includes('Empty queue')) part0Queue.innerHTML = '';
          part0Queue.appendChild(bubble);
          part0Queue.scrollLeft = part0Queue.scrollWidth;
        }
      } else {
        part1Msgs++;
        if (part1Count) part1Count.textContent = `${part1Msgs} msgs`;
        if (part1Queue) {
          if (part1Queue.innerHTML.includes('Empty queue')) part1Queue.innerHTML = '';
          part1Queue.appendChild(bubble);
          part1Queue.scrollLeft = part1Queue.scrollWidth;
        }
      }
    });
  }
}

function initializeRedisSimulation(topicId) {
  const queryBtn = document.getElementById(`redis-query-btn-${topicId}`);
  const keySelect = document.getElementById(`redis-key-select-${topicId}`);
  const hitsText = document.getElementById(`redis-hits-${topicId}`);
  const missesText = document.getElementById(`redis-misses-${topicId}`);
  const ratioText = document.getElementById(`redis-ratio-${topicId}`);
  const slotsContainer = document.getElementById(`redis-slots-container-${topicId}`);
  const consoleLogs = document.getElementById(`redis-logs-${topicId}`);
  const cacheBox = document.getElementById(`redis-cache-box-${topicId}`);
  const dbBox = document.getElementById(`redis-db-box-${topicId}`);
  
  let localCache = [];
  let hits = 0;
  let misses = 0;
  
  if (queryBtn && keySelect) {
    queryBtn.addEventListener('click', () => {
      const key = keySelect.value;
      const timestamp = new Date().toLocaleTimeString();
      
      const cacheIndex = localCache.indexOf(key);
      if (cacheIndex !== -1) {
        hits++;
        if (hitsText) hitsText.textContent = `Hits: ${hits}`;
        
        localCache.splice(cacheIndex, 1);
        localCache.push(key);
        
        if (cacheBox) {
          cacheBox.style.borderColor = '#10b981';
          cacheBox.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.3)';
          setTimeout(() => {
            cacheBox.style.borderColor = 'var(--border-color)';
            cacheBox.style.boxShadow = 'none';
          }, 500);
        }
        
        if (consoleLogs) {
          consoleLogs.innerHTML += `<br>[${timestamp}] [Redis Cache Hit] key "${key}" found in memory.`;
          consoleLogs.scrollTop = consoleLogs.scrollHeight;
        }
        
        updateCacheVisuals();
        updateHitRatio();
      } else {
        misses++;
        if (missesText) missesText.textContent = `Misses: ${misses}`;
        
        if (dbBox) {
          dbBox.style.borderColor = '#f59e0b';
          dbBox.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.3)';
          setTimeout(() => {
            dbBox.style.borderColor = 'var(--border-color)';
            dbBox.style.boxShadow = 'none';
          }, 600);
        }
        
        if (consoleLogs) {
          consoleLogs.innerHTML += `<br>[${timestamp}] [Redis Cache Miss] querying DB...`;
          consoleLogs.scrollTop = consoleLogs.scrollHeight;
        }
        
        queryBtn.disabled = true;
        setTimeout(() => {
          let evictedLog = '';
          if (localCache.length >= 4) {
            const evicted = localCache.shift();
            evictedLog = ` Evicted oldest item "${evicted}" (LRU).`;
          }
          localCache.push(key);
          
          if (consoleLogs) {
            consoleLogs.innerHTML += `<br>[${timestamp}] [DB Return] Found "${key}". Wrote to Redis.${evictedLog}`;
            consoleLogs.scrollTop = consoleLogs.scrollHeight;
          }
          
          updateCacheVisuals();
          updateHitRatio();
          queryBtn.disabled = false;
        }, 400);
      }
    });
  }
  
  function updateCacheVisuals() {
    if (!slotsContainer) return;
    slotsContainer.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const item = localCache[i];
      if (item) {
        slotsContainer.innerHTML += `
          <div style="background: rgba(99, 102, 241, 0.15); border: 1.5px solid var(--primary); border-radius:4px; padding:6px; text-align:center; font-size:0.7rem; font-weight:700; color:var(--primary);">
            ${item}
          </div>
        `;
      } else {
        slotsContainer.innerHTML += `
          <div style="border:1px dashed var(--border-color); border-radius:4px; padding:6px; text-align:center; font-size:0.65rem; color:var(--text-muted); background: rgba(0,0,0,0.1);">
            slot ${i+1} empty
          </div>
        `;
      }
    }
  }
  
  function updateHitRatio() {
    if (!ratioText) return;
    const total = hits + misses;
    const ratio = total > 0 ? Math.round((hits / total) * 100) : 0;
    ratioText.textContent = `Hit Ratio: ${ratio}%`;
  }
}

function initializePromptSimulation(topicId) {
  const runBtn = document.getElementById(`prompt-run-btn-${topicId}`);
  const sysPrompt = document.getElementById(`prompt-sys-input-${topicId}`);
  const userPrompt = document.getElementById(`prompt-query-input-${topicId}`);
  const outBox = document.getElementById(`prompt-output-box-${topicId}`);
  
  if (runBtn && outBox) {
    runBtn.addEventListener('click', () => {
      const system = sysPrompt ? sysPrompt.value.trim() : '';
      const user = userPrompt ? userPrompt.value.trim() : '';
      
      runBtn.disabled = true;
      outBox.innerHTML = 'Executing prompt pipeline context...';
      
      document.querySelectorAll('.prompt-node').forEach(node => {
        node.classList.remove('active');
        node.style.borderColor = 'var(--border-color)';
        node.style.boxShadow = 'none';
        node.style.color = 'var(--text-secondary)';
      });
      
      const nodes = ['pnode-in', 'pnode-sys', 'pnode-model', 'pnode-guard', 'pnode-out'];
      let step = 0;
      
      function runNodeVisuals() {
        if (step < nodes.length) {
          const nodeId = `${nodes[step]}-${topicId}`;
          const el = document.getElementById(nodeId);
          if (el) {
            el.classList.add('active');
            el.style.borderColor = 'var(--primary)';
            el.style.color = 'var(--primary)';
            el.style.boxShadow = '0 0 10px rgba(99, 102, 241, 0.5)';
          }
          step++;
          setTimeout(runNodeVisuals, 300);
        } else {
          const sampleJson = `{\n  "status": "success",\n  "system_instruction": "${system}",\n  "query_length": ${user.length},\n  "response": "Gemini AI simulated answer: Study checklist matches key objectives. Verified OK!"\n}`;
          let charIndex = 0;
          outBox.innerHTML = '';
          
          const typingInterval = setInterval(() => {
            if (charIndex < sampleJson.length) {
              outBox.innerHTML += sampleJson.charAt(charIndex);
              outBox.scrollTop = outBox.scrollHeight;
              charIndex++;
            } else {
              clearInterval(typingInterval);
              runBtn.disabled = false;
            }
          }, 15);
        }
      }
      
      runNodeVisuals();
    });
  }
}

function initializeRateLimiterSimulation(topicId) {
  const capInput = document.getElementById(`rl-cap-input-${topicId}`);
  const rateInput = document.getElementById(`rl-rate-input-${topicId}`);
  const capVal = document.getElementById(`rl-cap-val-${topicId}`);
  const rateVal = document.getElementById(`rl-rate-val-${topicId}`);
  const consumeBtn = document.getElementById(`rl-consume-btn-${topicId}`);
  const tokensDisplay = document.getElementById(`rl-tokens-display-${topicId}`);
  const consoleLogs = document.getElementById(`rl-logs-${topicId}`);
  
  if (!consumeBtn) return;
  
  let capacity = parseInt(capInput.value);
  let rate = parseInt(rateInput.value);
  let tokens = capacity;
  
  capInput.addEventListener('input', () => {
    capacity = parseInt(capInput.value);
    if (capVal) capVal.textContent = capacity;
    if (tokens > capacity) tokens = capacity;
    updateDisplay();
  });
  
  rateInput.addEventListener('input', () => {
    rate = parseInt(rateInput.value);
    if (rateVal) rateVal.textContent = rate;
  });
  
  function updateDisplay() {
    if (tokensDisplay) tokensDisplay.textContent = `${Math.round(tokens)} / ${capacity}`;
  }
  
  const interval = setInterval(() => {
    if (tokens < capacity) {
      tokens = Math.min(capacity, tokens + (rate / 10));
      updateDisplay();
    }
  }, 100);
  
  if (window.activeSimIntervals) {
    window.activeSimIntervals.push(interval);
  } else {
    window.activeSimIntervals = [interval];
  }
  
  consumeBtn.addEventListener('click', () => {
    const timestamp = new Date().toLocaleTimeString();
    if (tokens >= 1) {
      tokens -= 1;
      updateDisplay();
      if (consoleLogs) {
        consoleLogs.innerHTML += `<br>[${timestamp}] Request ALLOWED. 1 token consumed.`;
        consoleLogs.scrollTop = consoleLogs.scrollHeight;
      }
    } else {
      if (consoleLogs) {
        consoleLogs.innerHTML += `<br><span style="color:var(--danger)">[${timestamp}] Request BLOCKED. 0 tokens remaining.</span>`;
        consoleLogs.scrollTop = consoleLogs.scrollHeight;
      }
    }
  });
}
