// Initialize variables
let pairings = [];
let editingId = null;
let deletingId = null;
let currentFilter = 'all';
let currentSearch = '';
let uploadMethod = 'file'; // 'file' or 'url'
let selectedFile = null;
let selectedImageUrl = '';

// DOM Elements
const pairingsGrid = document.getElementById('pairings-grid');
const searchInput = document.getElementById('search-input');
const addModal = document.getElementById('add-modal');
const exportModal = document.getElementById('export-modal');
const importModal = document.getElementById('import-modal');
const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const pairingForm = document.getElementById('pairing-form');

// Load initial data
document.addEventListener('DOMContentLoaded', async () => {
    await loadFromStorage();
    // renderPairings and updateStats are now handled inside loadFromStorage
    
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

// Set upload method
function setUploadMethod(method) {
    uploadMethod = method;
    
    // Update UI
    document.getElementById('upload-option-file').classList.toggle('active', method === 'file');
    document.getElementById('upload-option-url').classList.toggle('active', method === 'url');
    
    document.getElementById('file-upload-container').style.display = method === 'file' ? 'block' : 'none';
    document.getElementById('url-upload-container').style.display = method === 'url' ? 'block' : 'none';
    
    // Clear preview
    clearImagePreview();
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
        showToast('Please select a valid image file (JPG, PNG, GIF, WebP)', 'error');
        return;
    }
    
    if (file.size > maxSize) {
        showToast('Image size should be less than 5MB', 'error');
        return;
    }
    
    selectedFile = file;
    previewImageFile(file);
}

// Preview image from file
function previewImageFile(file) {
    const reader = new FileReader();
    const previewContainer = document.getElementById('image-preview-container');
    const loadingEl = document.getElementById('image-loading');
    const previewImg = document.getElementById('preview-img');
    
    loadingEl.style.display = 'block';
    previewImg.style.display = 'none';
    
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        loadingEl.style.display = 'none';
        previewImg.style.display = 'block';
    };
    
    reader.onerror = function() {
        loadingEl.style.display = 'none';
        showToast('Error loading image file', 'error');
    };
    
    reader.readAsDataURL(file);
}

// Preview image from URL
function previewImageUrl(url) {
    if (!url) {
        clearImagePreview();
        return;
    }
    
    const previewContainer = document.getElementById('image-preview-container');
    const loadingEl = document.getElementById('image-loading');
    const previewImg = document.getElementById('preview-img');
    
    loadingEl.style.display = 'block';
    previewImg.style.display = 'none';
    
    // Test if image loads
    const testImg = new Image();
    testImg.onload = function() {
        previewImg.src = url;
        loadingEl.style.display = 'none';
        previewImg.style.display = 'block';
    };
    
    testImg.onerror = function() {
        loadingEl.style.display = 'none';
        showToast('Could not load image from URL', 'error');
        previewImg.style.display = 'none';
    };
    
    testImg.src = url;
}

// Clear image preview
function clearImagePreview() {
    const previewImg = document.getElementById('preview-img');
    const loadingEl = document.getElementById('image-loading');
    
    previewImg.src = '';
    previewImg.style.display = 'none';
    loadingEl.style.display = 'none';
    selectedFile = null;
    selectedImageUrl = '';
    document.getElementById('input-file').value = '';
    document.getElementById('input-image-url').value = '';
}

// NEW Load from GitHub/WordPress JSON file
async function loadFromStorage() {
    try {
        const response = await fetch('https://Bash-code4228.github.io/fandom-relationship-database/pairings.json');
        if (response.ok) {
            pairings = await response.json();
        } else {
            const saved = localStorage.getItem('fandomShips');
            if (saved) pairings = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading data from server:', e);
        const saved = localStorage.getItem('fandomShips');
        if (saved) pairings = JSON.parse(saved);
    }
    
    if (pairings.length === 0) {
        addSampleData();
    } else {
        renderPairings();
        updateStats();
    }
}

// Save to localStorage (Temporary save)
function saveToStorage() {
    localStorage.setItem('fandomShips', JSON.stringify(pairings));
}

// Add sample ships data
function addSampleData() {
    const sampleShips = [
        {
            id: 1,
            name: "Stony",
            characters: "Steve Rogers x Tony Stark",
            fandom: "Marvel Cinematic Universe",
            universe: "In-universe",
            status: "Fanon",
            relationship: "Romantic/Platonic",
            media: "Film Series",
            dynamic: "Opposing Energies",
            trope: "Friends to Lovers",
            notes: "The loyalty and history between them gets me every time",
            favorite: true,
            image: null,
            addedDate: "2024-01-15"
        }
    ];
    
    pairings = sampleShips;
    saveToStorage();
    renderPairings();
    updateStats();
}

// Render pairings
function renderPairings(pairingsToRender = getFilteredPairings()) {
    pairingsGrid.innerHTML = '';
    
    if (pairingsToRender.length === 0) {
        pairingsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart-broken"></i>
                <h3>No ships found</h3>
                <p>Try a different search or add a new ship!</p>
            </div>
        `;
        return;
    }
    
    pairingsToRender.forEach(ship => {
        const card = createShipCard(ship);
        pairingsGrid.appendChild(card);
    });
}

// Create ship card element - UPDATED to display new fields
function createShipCard(ship) {
    const card = document.createElement('div');
    card.className = 'pairing-card';
    
    const statusClass = ship.status.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
    const relClass = ship.relationship.toLowerCase().replace('/', '-').replace(/\s+/g, '-');
    
    let cardHTML = '';
    
    // Image or Header Section
    if (ship.image) {
        cardHTML += `
        <div class="image-container">
            <div class="card-actions">
                <button class="action-btn favorite-btn" onclick="toggleFavorite(${ship.id})">
                    <i class="${ship.favorite ? 'fas' : 'far'} fa-star"></i>
                </button>
                <button class="action-btn edit-btn" onclick="openEditModal(${ship.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="openDeleteModal(${ship.id}, '${escapeString(ship.name)}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <img src="${ship.image}" alt="${ship.name}" class="ship-image" 
                 onerror="this.parentElement.style.display='none'">
            <div class="image-overlay">
                <h3 class="pairing-name">${ship.name}</h3>
                <p class="pairing-characters">${ship.characters}</p>
            </div>
        </div>`;
    } else {
        cardHTML += `
        <div class="card-header">
            <div class="card-actions">
                <button class="action-btn favorite-btn" onclick="toggleFavorite(${ship.id})">
                    <i class="${ship.favorite ? 'fas' : 'far'} fa-star"></i>
                </button>
                <button class="action-btn edit-btn" onclick="openEditModal(${ship.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="openDeleteModal(${ship.id}, '${escapeString(ship.name)}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <h3 class="pairing-name">${ship.name}</h3>
            <p class="pairing-characters">${ship.characters}</p>
        </div>`;
    }
    
    // Body Section
    cardHTML += `
    <div class="card-body">
        <div class="info-row"><span class="info-label">Fandom:</span><span class="info-value">${ship.fandom}</span></div>
        ${ship.media ? `<div class="info-row"><span class="info-label">Media:</span><span class="info-value">${ship.media}</span></div>` : ''}
        ${ship.dynamic && ship.dynamic !== 'NA' ? `<div class="info-row"><span class="info-label">Dynamic:</span><span class="info-value">${ship.dynamic}</span></div>` : ''}
        ${ship.trope && ship.trope !== 'NA' ? `<div class="info-row"><span class="info-label">Trope:</span><span class="info-value">${ship.trope}</span></div>` : ''}
        ${ship.notes ? `<div class="info-row"><span class="info-label">Notes:</span><span class="info-value">${ship.notes}</span></div>` : ''}
        
        <div class="tags-container" style="display: flex; gap: 10px; margin-top: 15px;">
            <span class="tag ${statusClass}">${ship.status}</span>
            <span class="tag ${relClass}">${ship.relationship}</span>
        </div>
    </div>`;
    
    card.innerHTML = cardHTML;
    return card;
}

// Handle image errors
function handleImageError(img, name, characters) {
    if (img.getAttribute('data-error-handled')) return;
    img.setAttribute('data-error-handled', 'true');
    
    const imageContainer = img.parentElement;
    imageContainer.style.display = 'none';
    // ... rest of your code ...
}

function getShipIdFromCard(imgElement) {
    const card = imgElement.closest('.pairing-card');
    if (!card) return null;
    const favoriteBtn = card.querySelector('.favorite-btn');
    if (favoriteBtn && favoriteBtn.onclick) {
        const match = favoriteBtn.onclick.toString().match(/toggleFavorite\((\d+)\)/);
        if (match) return parseInt(match[1]);
    }
    return null;
}

function escapeString(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function getFilteredPairings() {
    let filtered = [...pairings];
    if (currentSearch) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(currentSearch) ||
            p.characters.toLowerCase().includes(currentSearch) ||
            p.fandom.toLowerCase().includes(currentSearch)
        );
    }
    return filtered;
}

function applyFilters() {
    renderPairings(getFilteredPairings());
}

function toggleFavorite(id) {
    const index = pairings.findIndex(p => p.id === id);
    if (index !== -1) {
        pairings[index].favorite = !pairings[index].favorite;
        saveToStorage();
        applyFilters();
        updateStats();
    }
}

function updateStats() {
    document.getElementById('total-count').textContent = pairings.length;
    document.getElementById('favorite-count').textContent = pairings.filter(p => p.favorite).length;
    document.getElementById('canon-count').textContent = pairings.filter(p => p.status === 'Canon').length;
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-info-circle"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function openAddModal() { addModal.style.display = 'flex'; }
function closeAddModal() { addModal.style.display = 'none'; resetForm(); }

// UPDATED to load the new fields when editing
function openEditModal(id) {
    const pairing = pairings.find(p => p.id === id);
    if (!pairing) return;
    editingId = id;
    document.getElementById('input-name').value = pairing.name;
    document.getElementById('input-characters').value = pairing.characters;
    document.getElementById('input-fandom').value = pairing.fandom;
    document.getElementById('input-universe').value = pairing.universe;
    document.getElementById('input-status').value = pairing.status;
    document.getElementById('input-relationship').value = pairing.relationship;
    document.getElementById('input-year').value = pairing.yearStarted || '';
    
    // NEW FIELDS
    document.getElementById('input-media').value = pairing.media || 'Literature/Books';
    document.getElementById('input-dynamic').value = pairing.dynamic || 'NA';
    document.getElementById('input-trope').value = pairing.trope || 'NA';
    
    document.getElementById('input-notes').value = pairing.notes || '';
    document.getElementById('input-favorite').checked = pairing.favorite;
    if (pairing.image) {
        if (pairing.image.startsWith('data:')) { setUploadMethod('file'); } 
        else { setUploadMethod('url'); document.getElementById('input-image-url').value = pairing.image; }
        previewImageUrl(pairing.image);
    }
    openAddModal();
}

function resetForm() {
    editingId = null; selectedFile = null; selectedImageUrl = '';
    pairingForm.reset();
    clearImagePreview();
}

function addNewPairing() {
    if (uploadMethod === 'file' && selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => completeSubmission(e.target.result);
        reader.readAsDataURL(selectedFile);
        return;
    } 
    const imageData = uploadMethod === 'url' ? document.getElementById('input-image-url').value : null;
    completeSubmission(imageData || (editingId ? pairings.find(p => p.id === editingId).image : null));
}

// UPDATED to save new fields
function completeSubmission(imageData) {
    const pairingData = {
        id: editingId || Date.now(),
        name: document.getElementById('input-name').value,
        characters: document.getElementById('input-characters').value,
        fandom: document.getElementById('input-fandom').value,
        universe: document.getElementById('input-universe').value,
        status: document.getElementById('input-status').value,
        relationship: document.getElementById('input-relationship').value,
        yearStarted: document.getElementById('input-year').value,
        
        // NEW FIELDS
        media: document.getElementById('input-media').value,
        dynamic: document.getElementById('input-dynamic').value,
        trope: document.getElementById('input-trope').value,
        
        notes: document.getElementById('input-notes').value,
        favorite: document.getElementById('input-favorite').checked,
        image: imageData,
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
    showToast('Remember to Export and upload pairings.json to keep changes permanent!', 'info');
}

function openDeleteModal(id, name) {
    deletingId = id;
    confirmMessage.textContent = `Delete "${name}"?`;
    confirmModal.style.display = 'flex';
}
function closeConfirmModal() { confirmModal.style.display = 'none'; }
function confirmDelete() {
    pairings = pairings.filter(p => p.id !== deletingId);
    saveToStorage(); applyFilters(); updateStats(); closeConfirmModal();
}

function openExportModal() { exportModal.style.display = 'flex'; }
function closeExportModal() { exportModal.style.display = 'none'; }
function openImportModal() { importModal.style.display = 'flex'; }
function closeImportModal() { importModal.style.display = 'none'; }

function exportData() {
    const dataStr = JSON.stringify(pairings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'pairings.json');
    linkElement.click();
    closeExportModal();
}

function importData() {
    const file = document.getElementById('import-file').files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        pairings = JSON.parse(e.target.result);
        saveToStorage(); applyFilters(); updateStats(); closeImportModal();
    };
    reader.readAsText(file);
}

window.onclick = (event) => {
    if (event.target.className === 'modal') {
        closeAddModal(); closeExportModal(); closeImportModal(); closeConfirmModal();
    }
};






