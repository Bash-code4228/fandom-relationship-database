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
    const previewImg = document.getElementById('preview-img');
    const loadingEl = document.getElementById('image-loading');
    
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
    
    const previewImg = document.getElementById('preview-img');
    const loadingEl = document.getElementById('image-loading');
    
    loadingEl.style.display = 'block';
    previewImg.style.display = 'none';
    
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

// Load from GitHub/WordPress JSON file
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
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <i class="fas fa-heart-broken" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
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

// Create ship card element
function createShipCard(ship) {
    const card = document.createElement('div');
    card.className = 'pairing-card';
    
    const statusClass = ship.status.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
    const relClass = ship.relationship.toLowerCase().replace('/', '-').replace(/\s+/g, '-');
    
    let cardHTML = '';
    
    if (ship.favorite) {
        cardHTML += `<div class="favorite-star" style="position:absolute; top:10px; left:10px; color:gold; z-index:5;"><i class="fas fa-star"></i></div>`;
    }

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
            <img src="${ship.image}" alt="${ship.name}" class="ship-image" onerror="handleImageError(this)">
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
    
    cardHTML += `
    <div class="card-body">
        <div class="info-row"><span class="info-label">Fandom:</span><span class="info-value">${ship.fandom}</span></div>
        ${ship.media ? `<div class="info-row"><span class="info-label">Media:</span><span class="info-value">${ship.media}</span></div>` : ''}
        ${ship.dynamic && ship.dynamic !== 'NA' ? `<div class="info-row"><span class="info-label">Dynamic:</span><span class="info-value">${ship.dynamic}</span></div>` : ''}
        ${ship.notes ? `<div class="info-row"><span class="info-label">Notes:</span><span class="info-value">${ship.notes}</span></div>` : ''}
        
        <div class="tags-container" style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
            <span class="tag ${statusClass}"><i class="fas fa-info-circle"></i>${ship.status}</span>
            <span class="tag ${relClass}"><i class="fas fa-heart"></i>${ship.relationship}</span>
        </div>
    </div>`;
    
    card.innerHTML = cardHTML;
    return card;
}

// Handle image errors
function handleImageError(img) {
    if (img.getAttribute('data-error-handled')) return;
    img.setAttribute('data-error-handled', 'true');
    
    const container = img.closest('.image-container');
    if (container) {
        // Hide the image container and rely on the background style of a fallback if needed
        container.style.display = 'none';
        // Add a class to the card to show text-based header instead
        const card = img.closest('.pairing-card');
        const header = document.createElement('div');
        header.className = 'card-header';
        // Re-inject the title and characters since they were in the overlay
        const name = img.alt;
        header.innerHTML = `<h3 class="pairing-name">${name}</h3>`;
        card.prepend(header);
    }
}

function escapeString(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function getFilteredPairings() {
    let filtered = [...pairings];
    
    // 1. Apply search filter
    if (currentSearch) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(currentSearch) ||
            p.characters.toLowerCase().includes(currentSearch) ||
            p.fandom.toLowerCase().includes(currentSearch)
        );
    }

    // 2. Sort alphabetically by Ship Name
    filtered.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

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
    updateFandomSidebar();
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
    updateFandomSidebar();
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
    saveToStorage(); applyFilters(); updateStats(); updateFandomSidebar(); closeConfirmModal();
}

function openExportModal() { 
    const exportText = document.getElementById('export-text');
    if (exportText) {
        exportText.value = JSON.stringify(pairings, null, 2);
    }
    exportModal.style.display = 'flex';
}

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

    const sortedFandoms = Object.keys(counts).sort();

    fandomList.innerHTML = sortedFandoms.map(fandom => `
        <li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 0.9rem;">
            <span style="font-weight: 500;">${fandom}</span>
            <span class="tag" style="background: #eee; color: #333; margin: 0; padding: 2px 8px; border-radius: 10px;">
                ${counts[fandom]}
            </span>
        </li>
    `).join('');
}

function importData() {
    const file = document.getElementById('import-file').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            pairings = JSON.parse(e.target.result);
            saveToStorage(); applyFilters(); updateStats(); updateFandomSidebar(); closeImportModal();
            showToast('Data imported successfully!', 'success');
        } catch (err) {
            showToast('Invalid JSON file', 'error');
        }
    };
    reader.readAsText(file);
}

window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
        closeAddModal(); closeExportModal(); closeImportModal(); closeConfirmModal();
    }
};

// Function to update the fandom list in the sidebar
function updateFandomSidebar() {
    const fandomList = document.getElementById('fandom-list');
    if (!fandomList) return;

    // Get unique fandom names and sort them alphabetically
    const uniqueFandoms = [...new Set(pairings.map(p => p.fandom))].sort();

    // Clear the current list
    fandomList.innerHTML = '';

    // Add "All Fandoms" option
    const allLi = document.createElement('li');
    allLi.style.cssText = 'padding: 8px 12px; cursor: pointer; border-radius: 4px; margin-bottom: 5px; background: #f0f0f0;';
    allLi.innerHTML = `<i class="fas fa-globe" style="margin-right: 8px;"></i> All Fandoms`;
    allLi.onclick = () => {
        searchInput.value = '';
        currentSearch = '';
        applyFilters();
    };
    fandomList.appendChild(allLi);

    // Add each unique fandom to the list
    uniqueFandoms.forEach(fandom => {
        if (!fandom) return;
        const li = document.createElement('li');
        li.style.cssText = 'padding: 8px 12px; cursor: pointer; border-radius: 4px; margin-bottom: 5px; transition: background 0.2s;';
        li.innerHTML = `<i class="fas fa-tag" style="margin-right: 8px; font-size: 0.8em; color: #D32F2F;"></i> ${fandom}`;
        
        // Hover effect
        li.onmouseover = () => li.style.background = '#fdecea';
        li.onmouseout = () => li.style.background = 'transparent';
        
        // Click to filter by this fandom
        li.onclick = () => {
            searchInput.value = fandom;
            currentSearch = fandom.toLowerCase();
            applyFilters();
        };
        
        fandomList.appendChild(li);
    });
}



