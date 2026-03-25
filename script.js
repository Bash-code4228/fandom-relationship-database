// Initialize variables
let pairings = [];
let editingId = null;
let deletingId = null;
let currentFilter = 'all';
let currentSearch = '';
let uploadMethod = 'file'; // 'file' or 'url'
let selectedFile = null;
let selectedImageUrl = '';
let currentFandomFilter = ''; // New variable for fandom filtering

// DOM Elements
const pairingsGrid = document.getElementById('pairings-grid');
const searchInput = document.getElementById('search-input');
const addModal = document.getElementById('add-modal');
const exportModal = document.getElementById('export-modal');
const importModal = document.getElementById('import-modal');
const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const pairingForm = document.getElementById('pairing-form');
const fandomList = document.getElementById('fandom-list');

// Load initial data
document.addEventListener('DOMContentLoaded', async () => {
    await loadFromStorage();
    
    // Initialize upload method toggle
    setUploadMethod('file');
    
    // URL input listener
    document.getElementById('input-image-url').addEventListener('input', function() {
        selectedImageUrl = this.value;
        previewImageUrl(this.value);
    });
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        applyFilters();
    });
});

// Render Fandom Sidebar
function renderFandoms() {
    if (!fandomList) return;
    
    // Get unique fandoms from pairings
    const fandoms = [...new Set(pairings.map(p => p.fandom))].filter(f => f && f.trim() !== '').sort();
    
    let html = `<li class="fandom-item ${currentFandomFilter === '' ? 'active' : ''}" onclick="filterByFandom('')">
        <i class="fas fa-globe"></i> All Fandoms
    </li>`;
    
    html += fandoms.map(f => `
        <li class="fandom-item ${currentFandomFilter === f ? 'active' : ''}" onclick="filterByFandom('${escapeString(f)}')">
            <i class="fas fa-tag"></i> ${escapeHtml(f)}
        </li>
    `).join('');
    
    fandomList.innerHTML = html;
}

// Filter by fandom
function filterByFandom(fandom) {
    currentFandomFilter = fandom;
    renderFandoms();
    applyFilters();
}

// Get filtered pairings with fandom filter
function getFilteredPairings() {
    let filtered = [...pairings];
    
    // Apply fandom filter
    if (currentFandomFilter && currentFandomFilter !== '') {
        filtered = filtered.filter(p => p.fandom === currentFandomFilter);
    }
    
    // Apply search filter
    if (currentSearch) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(currentSearch) ||
            p.characters.toLowerCase().includes(currentSearch) ||
            p.fandom.toLowerCase().includes(currentSearch)
        );
    }

    // Sort alphabetically by Ship Name
    filtered.sort((a, b) => {
        const nameA = a.name.toLowerCase();
       
