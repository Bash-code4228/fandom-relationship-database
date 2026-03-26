// Initialize variables
let pairings = [];
let editingId = null;
let deletingId = null;
let currentFilter = 'all';
let currentSearch = '';
let uploadMethod = 'file';
let selectedFile = null;
let selectedImageUrl = '';
let currentFandomFilter = '';

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

// Helper function to parse fandoms
function parseFandoms(fandomString) {
    if (!fandomString) return [];
    return fandomString.split(',').map(f => f.trim()).filter(f => f);
}

// Get all unique fandoms
function getAllUniqueFandoms() {
    const fandomsSet = new Set();
    pairings.forEach(p => {
        const fandoms = parseFandoms(p.fandom);
        fandoms.forEach(f => {
            if (f) fandomsSet.add(f);
        });
    });
    return Array.from(fandomsSet).sort();
}

// Get count of ships for a specific fandom
function getFandomCount(fandom) {
    return pairings.filter(p => {
        const fandoms = parseFandoms(p.fandom);
        return fandoms.includes(fandom);
    }).length;
}

// Check if a ship matches the current fandom filter
function shipMatchesFandomFilter(ship) {
    if (!currentFandomFilter) return true;
    const fandoms = parseFandoms(ship.fandom);
    return fandoms.includes(currentFandomFilter);
}

// Render Fandom Sidebar
function renderFandoms() {
    if (!fandomList) return;
    
    const fandoms = getAllUniqueFandoms();
    
    let html = `<li class="fandom-item ${currentFandomFilter === '' ? 'active' : ''}" onclick="filterByFandom('')">
        <i class="fas fa-globe"></i> All Fandoms (${pairings.length})
    </li>`;
    
    fandoms.forEach(f => {
        const count = getFandomCount(f);
        html += `<li class="fandom-item ${currentFandomFilter === f ? 'active' : ''}" onclick="filterByFandom('${escapeString(f)}')">
            <i class="fas fa-tag"></i> ${escapeHtml(f)} (${count})
        </li>`;
    });
    
    fandomList.innerHTML = html;
}

// Filter by fandom
function filterByFandom(fandom) {
    currentFandomFilter = fandom;
    renderFandoms();
    applyFilters();
}

// Get filtered pairings
function getFilteredPairings() {
    let filtered = [...pairings];
    
    if (currentFandomFilter && currentFandomFilter !== '') {
        filtered = filtered.filter(p => shipMatchesFandomFilter(p));
    }
    
    if (currentSearch) {
        filtered = filtered.filter(p => 
            (p.name && p.name.toLowerCase().includes(currentSearch)) ||
            (p.characters && p.characters.toLowerCase().includes(currentSearch)) ||
            (p.fandom && p.fandom.toLowerCase().includes(currentSearch))
        );
    }

    filtered.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

    return filtered;
}

function applyFilters() {
    renderPairings(getFilteredPairings());
}

// Load from pairings.json
async function loadFromStorage() {
    try {
        const response = await fetch('pairings.json');
        if (response.ok) {
            pairings = await response.json();
            console.log('Loaded from pairings.json:', pairings.length, 'ships');
        } else {
            throw new Error('Failed to fetch pairings.json');
        }
    } catch (e) {
        console.error('Error loading data:', e);
        pairings = [];
        const saved = localStorage.getItem('fandomShips');
        if (saved && saved !== '[]') {
            try {
                pairings = JSON.parse(saved);
                console.log('Loaded from localStorage:', pairings.length, 'ships');
            } catch (parseErr) {
                console.error('Error parsing localStorage:', parseErr);
                pairings = [];
            }
        }
    }
    
    renderFandoms();
    renderPairings(getFilteredPairings());
    updateStats();
}

// Save to localStorage
function saveToStorage() {
    localStorage.setItem('fandomShips', JSON.stringify(pairings));
}

// Lightbox functions - compact version with ship details
function openLightbox(imageUrl, shipName, characters, fandom, media, dynamic, status, relationship, yearStarted, artist, notes) {
    const overlay = document.getElementById('lightbox-overlay');
    const img = document.getElementById('lightbox-img');
    const shipNameEl = document.getElementById('lightbox-ship-name');
    const charactersEl = document.getElementById('lightbox-characters');
    const detailsEl = document.getElementById('lightbox-details');
    
    if (!overlay) return;
    
    // Set image
    img.src = imageUrl;
    
    // Handle image error
    img.onerror = function() {
        img.src = 'https://via.placeholder.com/400x300?text=No+Image+Available';
    };
    
    // Set ship name in header
    shipNameEl.innerHTML = `<i class="fas fa-heart"></i> ${escapeHtml(shipName)}`;
    
    // Set characters
    charactersEl.innerHTML = `<i class="fas fa-users"></i> ${escapeHtml(characters)}`;
    
    // Build details HTML
    let detailsHtml = '';
    
    if (fandom && fandom !== '') {
        detailsHtml += `<div class="ship-detail"><span class="detail-label">Fandom:</span><span class="detail-value">${escapeHtml(fandom)}</span></div>`;
    }
    if (media && media !== '' && media !== 'NA') {
        detailsHtml += `<div class="ship-detail"><span class="detail-label">Media:</span><span class="detail-value">${escapeHtml(media)}</span></div>`;
    }
    if (dynamic && dynamic !== '' && dynamic !== 'NA') {
        detailsHtml += `<div class="ship-detail"><span class="detail-label">Dynamic:</span><span class="detail-value">${escapeHtml(dynamic)}</span></div>`;
    }
    if (status && status !== '') {
        detailsHtml += `<div class="ship-detail"><span class="detail-label">Status:</span><span class="detail-value">${escapeHtml(status)}</span></div>`;
    }
    if (relationship && relationship !== '') {
        detailsHtml += `<div class="ship-detail"><span class="detail-label">Type:</span><span class="detail-value">${escapeHtml(relationship)}</span></div>`;
    }
    if (yearStarted && yearStarted !== '') {
        detailsHtml += `<div class="ship-detail"><span class="detail-label">Since:</span><span class="detail-value">${escapeHtml(yearStarted)}</span></div>`;
    }
    if (artist && artist !== '') {
        detailsHtml += `<div class="ship-detail"><span class="detail-label">Artist:</span><span class="detail-value">✨ ${escapeHtml(artist)}</span></div>`;
    }
    if (notes && notes !== '') {
        detailsHtml += `<div class="ship-detail"><span class="detail-label">Notes:</span><span class="detail-value">💭 ${escapeHtml(notes)}</span></div>`;
    }
    
    if (detailsHtml === '') {
        detailsHtml = '<div class="ship-detail"><span class="detail-value">No additional details available</span></div>';
    }
    
    detailsEl.innerHTML = detailsHtml;
    
    // Show overlay
    overlay.style.display = 'flex';
}

function closeLightbox() {
    const overlay = document.getElementById('lightbox-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Render pairings
function renderPairings(pairingsToRender = getFilteredPairings()) {
    if (!pairingsGrid) return;
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

// Format fandoms for display
function formatFandomsForDisplay(fandomString) {
    if (!fandomString) return '';
    const fandoms = parseFandoms(fandomString);
    return fandoms.join(', ');
}

// Create ship card element
function createShipCard(ship) {
    const card = document.createElement('div');
    card.className = 'pairing-card';
    
    // Get image path
    let imagePath = ship.image;
    if (!imagePath || imagePath === 'null' || imagePath === '') {
        const possibleName = ship.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        imagePath = `images/${possibleName}.jpg`;
    }
    
    const imageUrl = imagePath && imagePath !== 'null' ? imagePath : null;
    const formattedFandoms = formatFandomsForDisplay(ship.fandom);
    
    let cardHTML = '';
    
    // Favorite/Active badge
    if (ship.favorite) {
        cardHTML += `<div style="position: absolute; top: 12px; left: 12px; background: #B71C1C; padding: 5px 12px; border-radius: 20px; color: #FFD700; font-size: 11px; font-weight: bold; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <i class="fas fa-star"></i> ACTIVE
        </div>`;
    }

    // Crossover badge
    const fandomsList = parseFandoms(ship.fandom);
    const isCrossover = fandomsList.length > 1 || ship.universe === 'Crossover';
    
    if (isCrossover) {
        cardHTML += `<div style="position: absolute; top: 12px; right: 12px; background: #B71C1C; padding: 5px 12px; border-radius: 20px; color: white; font-size: 11px; font-weight: bold; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <i class="fas fa-code-branch"></i> CROSSOVER
        </div>`;
    }

    // Image section with click handler for lightbox
    if (imageUrl) {
        cardHTML += `
        <div class="image-container" style="position: relative; height: 200px; cursor: pointer;" onclick="openLightbox('${escapeString(imageUrl)}', '${escapeString(ship.name)}', '${escapeString(ship.characters)}', '${escapeString(formattedFandoms)}', '${escapeString(ship.media || '')}', '${escapeString(ship.dynamic || '')}', '${escapeString(ship.status || '')}', '${escapeString(ship.relationship || '')}', '${escapeString(ship.yearStarted || '')}', '${escapeString(ship.artist || '')}', '${escapeString(ship.notes || '')}')">
            <div class="card-actions" style="position: absolute; top: 12px; right: 12px; z-index: 10; display: flex; gap: 8px; opacity: 1;">
                <button class="action-btn favorite-btn" onclick="event.stopPropagation(); toggleFavorite(${ship.id})" style="background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 35px; height: 35px; color: ${ship.favorite ? '#ffd700' : '#999'}; cursor: pointer;">
                    <i class="${ship.favorite ? 'fas' : 'far'} fa-star"></i>
                </button>
                <button class="action-btn edit-btn" onclick="event.stopPropagation(); openEditModal(${ship.id})" style="background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 35px; height: 35px; color: #1A237E; cursor: pointer;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="event.stopPropagation(); openDeleteModal(${ship.id}, '${escapeString(ship.name)}')" style="background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 35px; height: 35px; color: #7f8c8d; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <img src="${imageUrl}" alt="${ship.name}" class="ship-image" style="width: 100%; height: 100%; object-fit: cover;" 
                onerror="this.onerror=null; this.src='https://via.placeholder.com/400x200?text=No+Image'; this.style.display='none'; this.parentElement.querySelector('.image-fallback').style.display='flex';">
            <div class="image-fallback" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #ffe6e6, #ffcccc); align-items: center; justify-content: center; flex-direction: column; color: #B71C1C;">
                <i class="fas fa-heart" style="font-size: 40px;"></i>
                <p style="margin-top: 8px; font-size: 12px;">No Image</p>
            </div>
            <div class="image-overlay">
                <h3 class="pairing-name">${escapeHtml(ship.name)}</h3>
                <p class="pairing-characters">${escapeHtml(ship.characters)}</p>
            </div>
        </div>`;
    } else {
        cardHTML += `
        <div class="card-header">
            <div class="card-actions" style="position: absolute; top: 12px; right: 12px; display: flex; gap: 8px;">
                <button class="action-btn favorite-btn" onclick="event.stopPropagation(); toggleFavorite(${ship.id})" style="background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 35px; height: 35px; color: ${ship.favorite ? '#ffd700' : '#999'}; cursor: pointer;">
                    <i class="${ship.favorite ? 'fas' : 'far'} fa-star"></i>
                </button>
                <button class="action-btn edit-btn" onclick="event.stopPropagation(); openEditModal(${ship.id})" style="background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 35px; height: 35px; color: #1A237E; cursor: pointer;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="event.stopPropagation(); openDeleteModal(${ship.id}, '${escapeString(ship.name)}')" style="background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 35px; height: 35px; color: #7f8c8d; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <h3 class="pairing-name">${escapeHtml(ship.name)}</h3>
            <p class="pairing-characters">${escapeHtml(ship.characters)}</p>
        </div>`;
    }
    
    // Card body with info rows
    cardHTML += `
    <div class="card-body">
        ${ship.artist && ship.artist !== '' && ship.artist !== null ? `
        <div style="text-align: center; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0;">
            <span style="color: #0992C2; font-style: italic;">☆ art by ${escapeHtml(ship.artist)}</span>
        </div>` : ''}
        
        <div class="info-row">
            <span class="info-label">Fandom${isCrossover ? 's' : ''}:</span>
            <span class="info-value">${escapeHtml(formattedFandoms)}</span>
        </div>
        ${ship.media ? `
        <div class="info-row">
            <span class="info-label">Media:</span>
            <span class="info-value">${escapeHtml(ship.media)}</span>
        </div>` : ''}
        ${ship.dynamic && ship.dynamic !== 'NA' ? `
        <div class="info-row">
            <span class="info-label">Dynamic:</span>
            <span class="info-value">${escapeHtml(ship.dynamic)}</span>
        </div>` : ''}
        ${ship.notes ? `
        <div class="info-row">
            <span class="info-label">Notes:</span>
            <span class="info-value">${escapeHtml(ship.notes)}</span>
        </div>` : ''}
        
        <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
            <span class="tag">
                <i class="fas fa-info-circle"></i> ${escapeHtml(ship.status || 'Fanon')}
            </span>
            <span class="tag">
                <i class="fas fa-heart"></i> ${escapeHtml(ship.relationship || 'Romantic')}
            </span>
            ${ship.yearStarted ? `
            <span class="tag">
                <i class="fas fa-calendar"></i> ${escapeHtml(ship.yearStarted)}
            </span>` : ''}
        </div>
    </div>`;
    
    card.innerHTML = cardHTML;
    
    const img = card.querySelector('img');
    if (img) {
        img.onerror = function() {
            this.style.display = 'none';
            const fallback = this.parentElement.querySelector('.image-fallback');
            if (fallback) fallback.style.display = 'flex';
        };
    }
    
    return card;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeString(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

function toggleFavorite(id) {
    const index = pairings.findIndex(p => p.id === id);
    if (index !== -1) {
        pairings[index].favorite = !pairings[index].favorite;
        saveToStorage();
        applyFilters();
        updateStats();
        renderFandoms();
    }
}

function updateStats() {
    const totalCountElem = document.getElementById('total-count');
    const favoriteCountElem = document.getElementById('favorite-count');
    const canonCountElem = document.getElementById('canon-count');
    
    if (totalCountElem) totalCountElem.textContent = pairings.length;
    if (favoriteCountElem) favoriteCountElem.textContent = pairings.filter(p => p.favorite).length;
    if (canonCountElem) canonCountElem.textContent = pairings.filter(p => p.status === 'Canon').length;
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function openAddModal() { if (addModal) addModal.style.display = 'flex'; }
function closeAddModal() { if (addModal) addModal.style.display = 'none'; resetForm(); }

function openEditModal(id) {
    const pairing = pairings.find(p => p.id === id);
    if (!pairing) return;
    editingId = id;
    document.getElementById('input-name').value = pairing.name || '';
    document.getElementById('input-characters').value = pairing.characters || '';
    document.getElementById('input-fandom').value = pairing.fandom || '';
    document.getElementById('input-universe').value = pairing.universe || 'From universe';
    document.getElementById('input-status').value = pairing.status || 'Fanon';
    document.getElementById('input-relationship').value = pairing.relationship || 'Romantic';
    document.getElementById('input-year').value = pairing.yearStarted || '';
    document.getElementById('input-media').value = pairing.media || 'Literature/Books';
    document.getElementById('input-dynamic').value = pairing.dynamic || 'NA';
    document.getElementById('input-trope').value = pairing.trope || 'NA';
    document.getElementById('input-notes').value = pairing.notes || '';
    document.getElementById('input-favorite').checked = pairing.favorite || false;
    document.getElementById('input-artist').value = pairing.artist || '';
    
    if (pairing.image && pairing.image !== 'null' && pairing.image !== '') {
        setUploadMethod('url');
        document.getElementById('input-image-url').value = pairing.image;
        previewImageUrl(pairing.image);
    }
    
    openAddModal();
}

function resetForm() {
    editingId = null; 
    selectedFile = null; 
    selectedImageUrl = '';
    if (pairingForm) pairingForm.reset();
    clearImagePreview();
}

function setUploadMethod(method) {
    uploadMethod = method;
    
    const fileOption = document.getElementById('upload-option-file');
    const urlOption = document.getElementById('upload-option-url');
    const fileContainer = document.getElementById('file-upload-container');
    const urlContainer = document.getElementById('url-upload-container');
    
    if (fileOption) fileOption.classList.toggle('active', method === 'file');
    if (urlOption) urlOption.classList.toggle('active', method === 'url');
    if (fileContainer) fileContainer.style.display = method === 'file' ? 'block' : 'none';
    if (urlContainer) urlContainer.style.display = method === 'url' ? 'block' : 'none';
    
    clearImagePreview();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    selectedFile = file;
    previewImageFile(file);
}

function previewImageFile(file) {
    const reader = new FileReader();
    const previewImg = document.getElementById('preview-img');
    const loadingEl = document.getElementById('image-loading');
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (previewImg) previewImg.style.display = 'none';
    
    reader.onload = function(e) {
        if (previewImg) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
        }
        if (loadingEl) loadingEl.style.display = 'none';
    };
    
    reader.readAsDataURL(file);
}

function previewImageUrl(url) {
    if (!url) {
        clearImagePreview();
        return;
    }
    
    const previewImg = document.getElementById('preview-img');
    const loadingEl = document.getElementById('image-loading');
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (previewImg) previewImg.style.display = 'none';
    
    const testImg = new Image();
    testImg.onload = function() {
        if (previewImg) {
            previewImg.src = url;
            previewImg.style.display = 'block';
        }
        if (loadingEl) loadingEl.style.display = 'none';
    };
    
    testImg.onerror = function() {
        if (loadingEl) loadingEl.style.display = 'none';
        if (previewImg) previewImg.style.display = 'none';
    };
    
    testImg.src = url;
}

function clearImagePreview() {
    const previewImg = document.getElementById('preview-img');
    const loadingEl = document.getElementById('image-loading');
    
    if (previewImg) {
        previewImg.src = '';
        previewImg.style.display = 'none';
    }
    if (loadingEl) loadingEl.style.display = 'none';
    selectedFile = null;
    selectedImageUrl = '';
    const fileInput = document.getElementById('input-file');
    const urlInput = document.getElementById('input-image-url');
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
}

function addNewPairing() {
    let imagePath = null;
    
    if (uploadMethod === 'url') {
        imagePath = document.getElementById('input-image-url').value;
    } else if (uploadMethod === 'file' && selectedFile) {
        const shipName = document.getElementById('input-name').value;
        const filename = shipName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '.jpg';
        imagePath = `images/${filename}`;
        showToast(`Suggested filename: ${filename}. Please save your image with this name in the images folder.`, 'info');
    }
    
    completeSubmission(imagePath);
}

function completeSubmission(imagePath) {
    let fandomValue = document.getElementById('input-fandom').value;
    
    const pairingData = {
        id: editingId || Date.now(),
        name: document.getElementById('input-name').value,
        characters: document.getElementById('input-characters').value,
        fandom: fandomValue,
        universe: document.getElementById('input-universe').value,
        status: document.getElementById('input-status').value,
        relationship: document.getElementById('input-relationship').value,
        yearStarted: document.getElementById('input-year').value,
        media: document.getElementById('input-media').value,
        dynamic: document.getElementById('input-dynamic').value,
        trope: document.getElementById('input-trope').value,
        notes: document.getElementById('input-notes').value,
        favorite: document.getElementById('input-favorite').checked,
        image: imagePath && imagePath !== '' ? imagePath : null,
        artist: document.getElementById('input-artist').value || '',
        addedDate: new Date().toISOString().split('T')[0]
    };
    
    if (editingId) {
        const index = pairings.findIndex(p => p.id === editingId);
        if (index !== -1) pairings[index] = pairingData;
    } else {
        pairings.unshift(pairingData);
    }
    
    saveToStorage();
    renderFandoms();
    applyFilters();
    updateStats();
    closeAddModal();
    showToast('Ship saved successfully!', 'success');
}

function openDeleteModal(id, name) {
    deletingId = id;
    if (confirmMessage) confirmMessage.textContent = `Delete "${name}"?`;
    if (confirmModal) confirmModal.style.display = 'flex';
}
function closeConfirmModal() { if (confirmModal) confirmModal.style.display = 'none'; }
function confirmDelete() {
    pairings = pairings.filter(p => p.id !== deletingId);
    saveToStorage();
    renderFandoms();
    applyFilters();
    updateStats();
    closeConfirmModal();
    showToast('Ship deleted successfully', 'success');
}

function openExportModal() { 
    const exportText = document.getElementById('export-text');
    if (exportText) {
        exportText.value = JSON.stringify(pairings, null, 2);
    }
    if (exportModal) exportModal.style.display = 'flex';
}

function closeExportModal() { if (exportModal) exportModal.style.display = 'none'; }
function openImportModal() { if (importModal) importModal.style.display = 'flex'; }
function closeImportModal() { if (importModal) importModal.style.display = 'none'; }

function exportData() {
    const dataStr = JSON.stringify(pairings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'pairings.json');
    linkElement.click();
    closeExportModal();
    showToast('Data exported successfully!', 'success');
}

function importData() {
    const file = document.getElementById('import-file').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            pairings = JSON.parse(e.target.result);
            saveToStorage();
            renderFandoms();
            applyFilters();
            updateStats();
            closeImportModal();
            showToast('Data imported successfully!', 'success');
        } catch (err) {
            showToast('Invalid JSON file', 'error');
        }
    };
    reader.readAsText(file);
}

// Close modals when clicking outside
window.onclick = (event) => {
    if (event.target.classList && event.target.classList.contains('modal')) {
        closeAddModal();
        closeExportModal();
        closeImportModal();
        closeConfirmModal();
    }
};

// Close lightbox when clicking outside or pressing ESC
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    
    const searchInputElem = document.getElementById('search-input');
    if (searchInputElem) {
        searchInputElem.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            applyFilters();
        });
    }
    
    // Lightbox close handlers
    const overlay = document.getElementById('lightbox-overlay');
    const closeBtn = document.getElementById('lightbox-close-btn');
    
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeLightbox();
            }
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
    }
    
    // ESC key to close lightbox
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });
    
    console.log('Fandom Relationship Tracker initialized!');
});
