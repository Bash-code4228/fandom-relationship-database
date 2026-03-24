// Initialize variables
let pairings = [];
let editingId = null;
let deletingId = null;
let currentSearch = '';
let uploadMethod = 'file'; 
let selectedFilesData = []; // NEW: Array for multiple images
let currentSlideIndex = 0;   // NEW: For slideshow
let activeShip = null;       // NEW: For expanded view

const pairingsGrid = document.getElementById('pairings-grid');
const searchInput = document.getElementById('search-input');
const addModal = document.getElementById('add-modal');
const expandedModal = document.getElementById('expanded-modal');
const pairingForm = document.getElementById('pairing-form');

// Load initial data
document.addEventListener('DOMContentLoaded', async () => {
    await loadFromStorage();
    setUploadMethod('file');
    
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        applyFilters();
    });
});

function setUploadMethod(method) {
    uploadMethod = method;
    document.getElementById('upload-option-file').classList.toggle('active', method === 'file');
    document.getElementById('upload-option-url').classList.toggle('active', method === 'url');
    document.getElementById('file-upload-container').style.display = method === 'file' ? 'block' : 'none';
    document.getElementById('url-upload-container').style.display = method === 'url' ? 'block' : 'none';
}

// NEW: Handle Multiple Files
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    selectedFilesData = [];
    document.getElementById('image-loading').style.display = 'block';

    let loaded = 0;
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedFilesData.push(e.target.result);
            loaded++;
            if (loaded === files.length) {
                document.getElementById('image-loading').style.display = 'none';
                document.getElementById('preview-img').src = selectedFilesData[0];
                document.getElementById('preview-img').style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    });
}

async function loadFromStorage() {
    const saved = localStorage.getItem('fandomShips');
    if (saved) {
        pairings = JSON.parse(saved);
        // Migration: ensure all old ships have an image array
        pairings.forEach(p => {
            if (p.image && !Array.isArray(p.image)) p.image = [p.image];
            if (!p.image) p.image = [];
        });
    }
    renderPairings();
    updateStats();
}

function saveToStorage() {
    localStorage.setItem('fandomShips', JSON.stringify(pairings));
}

function addNewPairing() {
    let images = [];
    if (uploadMethod === 'file') {
        images = selectedFilesData;
    } else {
        const urlInput = document.getElementById('input-image-url').value;
        images = urlInput.split(',').map(u => u.trim()).filter(u => u);
    }
    
    if (editingId && images.length === 0) {
        images = pairings.find(p => p.id === editingId).image || [];
    }

    const pairingData = {
        id: editingId || Date.now(),
        name: document.getElementById('input-name').value,
        characters: document.getElementById('input-characters').value,
        fandom: document.getElementById('input-fandom').value,
        universe: document.getElementById('input-universe').value,
        status: document.getElementById('input-status').value,
        relationship: document.getElementById('input-relationship').value,
        yearStarted: document.getElementById('input-year').value,
        media: document.getElementById('input-media').value,
        dynamic: document.getElementById('input-dynamic').value,
        trope: document.getElementById('input-trope').value,
        notes: document.getElementById('input-notes').value,
        favorite: document.getElementById('input-favorite').checked,
        image: images,
        addedDate: new Date().toISOString().split('T')[0]
    };
    
    if (editingId) {
        const index = pairings.findIndex(p => p.id === editingId);
        pairings[index] = pairingData;
    } else {
        pairings.unshift(pairingData);
    }
    
    saveToStorage();
    applyFilters();
    updateStats();
    closeAddModal();
}

function createShipCard(ship) {
    const card = document.createElement('div');
    card.className = 'pairing-card';
    
    // Clicking the card opens the expanded view
    card.onclick = (e) => {
        if (!e.target.closest('.action-btn')) openExpandedView(ship.id);
    };

    const hasImages = ship.image && ship.image.length > 0;
    const thumb = hasImages ? ship.image[0] : '';

    card.innerHTML = `
        ${hasImages ? `<div class="image-container"><img src="${thumb}" class="ship-image"></div>` : ''}
        <div class="card-body">
            <h3 class="pairing-name">${ship.name}</h3>
            <p class="pairing-characters">${ship.characters}</p>
            <div class="card-actions">
                <button class="action-btn edit-btn" onclick="openEditModal(${ship.id})"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" onclick="openDeleteModal(${ship.id}, '${ship.name.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
    return card;
}

// SLIDESHOW & EXPANSION LOGIC
function openExpandedView(id) {
    activeShip = pairings.find(p => p.id === id);
    currentSlideIndex = 0;
    
    document.getElementById('exp-name').textContent = activeShip.name;
    document.getElementById('exp-characters').textContent = activeShip.characters;
    document.getElementById('exp-notes').textContent = activeShip.notes || 'No notes added.';
    
    const grid = document.getElementById('exp-info-grid');
    grid.innerHTML = `
        <div class="info-item"><strong>Fandom</strong>${activeShip.fandom}</div>
        <div class="info-item"><strong>Status</strong>${activeShip.status}</div>
        <div class="info-item"><strong>Type</strong>${activeShip.relationship}</div>
        <div class="info-item"><strong>Media</strong>${activeShip.media}</div>
    `;

    renderSlideshow();
    document.getElementById('expanded-modal').style.display = 'flex';
}

function renderSlideshow() {
    const container = document.getElementById('slideshow-images');
    const dots = document.getElementById('slide-dots');
    container.innerHTML = '';
    dots.innerHTML = '';

    const imgs = activeShip.image || [];
    imgs.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'slide-img' + (i === currentSlideIndex ? ' active' : '');
        container.appendChild(img);

        const dot = document.createElement('span');
        dot.className = 'dot' + (i === currentSlideIndex ? ' active' : '');
        dot.onclick = () => { currentSlideIndex = i; renderSlideshow(); };
        dots.appendChild(dot);
    });
}

function changeSlide(n) {
    const len = activeShip.image.length;
    if (len <= 1) return;
    currentSlideIndex = (currentSlideIndex + n + len) % len;
    renderSlideshow();
}

function closeExpandedModal() { document.getElementById('expanded-modal').style.display = 'none'; }

// Remaining original helper functions
function applyFilters() { renderPairings(); }
function renderPairings() {
    pairingsGrid.innerHTML = '';
    const filtered = pairings.filter(p => p.name.toLowerCase().includes(currentSearch) || p.fandom.toLowerCase().includes(currentSearch));
    filtered.forEach(s => pairingsGrid.appendChild(createShipCard(s)));
}
function updateStats() {
    document.getElementById('total-count').textContent = pairings.length;
    document.getElementById('favorite-count').textContent = pairings.filter(p => p.favorite).length;
    document.getElementById('canon-count').textContent = pairings.filter(p => p.status === 'Canon').length;
    updateFandomSidebar();
}
function openAddModal() { document.getElementById('add-modal').style.display = 'flex'; }
function closeAddModal() { document.getElementById('add-modal').style.display = 'none'; pairingForm.reset(); editingId = null; }
function openDeleteModal(id, name) { deletingId = id; document.getElementById('confirm-message').textContent = `Delete "${name}"?`; document.getElementById('confirm-modal').style.display = 'flex'; }
function closeConfirmModal() { document.getElementById('confirm-modal').style.display = 'none'; }
function confirmDelete() { pairings = pairings.filter(p => p.id !== deletingId); saveToStorage(); applyFilters(); updateStats(); closeConfirmModal(); }

function updateFandomSidebar() {
    const list = document.getElementById('fandom-list');
    if (!list) return;
    const fandoms = [...new Set(pairings.map(p => p.fandom))].sort();
    list.innerHTML = '<li onclick="currentSearch=\'\'; applyFilters();" style="cursor:pointer; padding:5px;">All Fandoms</li>';
    fandoms.forEach(f => {
        const li = document.createElement('li');
        li.textContent = f;
        li.style.cursor = 'pointer';
        li.style.padding = '5px';
        li.onclick = () => { currentSearch = f.toLowerCase(); applyFilters(); };
        list.appendChild(li);
    });
}
