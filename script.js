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

// Load from local storage
function loadFromStorage() {
    const saved = localStorage.getItem('fandomShips');
    if (saved) {
        try {
            pairings = JSON.parse(saved);
        } catch (e) {
            pairings = [];
        }
    }
    renderFandoms();
    renderPairings(getFilteredPairings());
    updateStats();
}

function saveToStorage() {
    localStorage.setItem('fandomShips', JSON.stringify(pairings));
}

// Lightbox with Category inclusion
function openLightbox(imageUrl, shipName, characters, fandom, media, dynamic, status, relationship, yearStarted, artist, notes, category) {
    const overlay = document.getElementById('lightbox-overlay');
    const img = document.getElementById('lightbox-img');
    const shipNameEl = document.getElementById('lightbox-ship-name');
    const charactersEl = document.getElementById('lightbox-characters');
    const detailsEl = document.getElementById('lightbox-details');
    
    if (!overlay) return;
    
    img.src = imageUrl;
    img.onerror = function() { img.src = 'https://via.placeholder.com/400x300?text=No+Image+Available'; };
    
    shipNameEl.innerHTML = `<i class="fas fa-heart"></i> ${escapeHtml(shipName)}`;
    charactersEl.innerHTML = escapeHtml(characters);
    
    let detailsHtml = '';
    
    if (fandom) detailsHtml += `<div class="ship-detail"><span class="detail-label">Fandom:</span><span class="detail-value">${escapeHtml(fandom)}</span></div>`;
    if (media && media !== 'NA') detailsHtml += `<div class="ship-detail"><span class="detail-label">Media:</span><span class="detail-value">${escapeHtml(media)}</span></div>`;
    if (category) detailsHtml += `<div class="ship-detail"><span class="detail-label">Category:</span><span class="detail-value">${escapeHtml(category)}</span></div>`;
    if (dynamic && dynamic !== 'NA') detailsHtml += `<div class="ship-detail"><span class="detail-label">Dynamic:</span><span class="detail-value">${escapeHtml(dynamic)}</span></div>`;
    if (status) detailsHtml += `<div class="ship-detail"><span class="detail-label">Status:</span><span class="detail-value">${escapeHtml(status)}</span></div>`;
    if (relationship) detailsHtml += `<div class="ship-detail"><span class="detail-label">Type:</span><span class="detail-value">${escapeHtml(relationship)}</span></div>`;
    if (yearStarted) detailsHtml += `<div class="ship-detail"><span class="detail-label">Since:</span><span class="detail-value">${escapeHtml(yearStarted)}</span></div>`;
    if (artist) detailsHtml += `<div class="ship-detail"><span class="detail-label">Artist:</span><span class="detail-value">${escapeHtml(artist)}</span></div>`;
    if (notes) detailsHtml += `<div class="ship-detail"><span class="detail-label">Notes:</span><span class="detail-value">${escapeHtml(notes)}</span></div>`;
    
    detailsEl.innerHTML = detailsHtml || '<div class="ship-detail"><span class="detail-value">No additional details available</span></div>';
    overlay.style.display = 'flex';
}

function closeLightbox() {
    const overlay = document.getElementById('lightbox-overlay');
    if (overlay) overlay.style.display = 'none';
}

function renderPairings(pairingsToRender = getFilteredPairings()) {
    if (!pairingsGrid) return;
    pairingsGrid.innerHTML = '';
    
    if (pairingsToRender.length === 0) {
        pairingsGrid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 50px;"><i class="fas fa-heart-broken" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i><h3>No ships found</h3></div>`;
        return;
    }
    
    pairingsToRender.forEach(ship => {
        pairingsGrid.appendChild(createShipCard(ship));
    });
}

function formatFandomsForDisplay(fandomString) {
    if (!fandomString) return '';
    return parseFandoms(fandomString).join(', ');
}

// FIXED createShipCard function - removed white overlay buttons from top right
function createShipCard(ship) {
    const card = document.createElement('div');
    card.className = 'ship-card';
    
    let imagePath = ship.image || `images/${ship.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.jpg`;
    const formattedFandoms = formatFandomsForDisplay(ship.fandom);
    const isCrossover = parseFandoms(ship.fandom).length > 1 || ship.universe === 'Crossover';

    let cardHTML = '';
    if (ship.favorite) {
        cardHTML += `<div style="position: absolute; top: 12px; left: 12px; background: #B71C1C; padding: 5px 12px; border-radius: 20px; color: #FFD700; font-size: 11px; font-weight: bold; z-index: 10;">
            <i class="fas fa-star"></i> ACTIVE
        </div>`;
    }
    if (isCrossover) {
        cardHTML += `<div style="position: absolute; top: 12px; right: 12px; background: #B71C1C; padding: 5px 12px; border-radius: 20px; color: white; font-size: 11px; font-weight: bold; z-index: 10;">
            <i class="fas fa-code-branch"></i> CROSSOVER
        </div>`;
    }

    cardHTML += `
    <div class="ship-image-container" style="position: relative; height: 200px; cursor: pointer;" 
         onclick="openLightbox('${escapeString(imagePath)}', '${escapeString(ship.name)}', '${escapeString(ship.characters)}', '${escapeString(formattedFandoms)}', '${escapeString(ship.media || '')}', '${escapeString(ship.dynamic || '')}', '${escapeString(ship.status || '')}', '${escapeString(ship.relationship || '')}', '${escapeString(ship.yearStarted || '')}', '${escapeString(ship.artist || '')}', '${escapeString(ship.notes || '')}', '${escapeString(ship.category || '')}')">
        <img src="${imagePath}" alt="${ship.name}" class="ship-image" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.parentElement.querySelector('.image-fallback').style.display='flex';">
        <div class="image-fallback" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #ffe6e6, #ffcccc); align-items: center; justify-content: center; flex-direction: column; color: #B71C1C;">
            <i class="fas fa-heart" style="font-size: 40px;"></i>
        </div>
        <div class="image-overlay">
            <h3 class="pairing-name">${escapeHtml(ship.name)}</h3>
            <p class="pairing-characters">${escapeHtml(ship.characters)}</p>
        </div>
    </div>
    <div class="ship-info">
        ${ship.artist ? `<div style="text-align: center; margin-bottom: 10px; font-size: 0.8rem; color: #0992C2;">☆ art by ${escapeHtml(ship.artist)}</div>` : ''}
        <span class="fandom-tag">${escapeHtml(formattedFandoms)}</span>
        <h3 class="ship-name">${escapeHtml(ship.name)}</h3>
        <div class="characters">${escapeHtml(ship.characters)}</div>
        <div class="ship-meta">
            <span class="meta-item"><i class="fas fa-info-circle"></i> ${escapeHtml(ship.status || 'Fanon')}</span>
            <span class="meta-item"><i class="fas fa-heart"></i> ${escapeHtml(ship.relationship || 'Romantic')}</span>
            <span class="meta-item"><i class="fas fa-venus-mars"></i> ${escapeHtml(ship.category || 'f/m')}</span>
            ${ship.yearStarted ? `<span class="meta-item"><i class="fas fa-calendar"></i> ${escapeHtml(ship.yearStarted)}</span>` : ''}
        </div>
        ${ship.notes ? `<div class="notes">${escapeHtml(ship.notes)}</div>` : ''}
    </div>
    <div class="card-actions">
        <button class="action-btn btn-edit" onclick="event.stopPropagation(); toggleFavorite(${ship.id})"><i class="${ship.favorite ? 'fas' : 'far'} fa-star"></i></button>
        <button class="action-btn btn-edit" onclick="event.stopPropagation(); openEditModal(${ship.id})"><i class="fas fa-edit"></i></button>
        <button class="action-btn btn-delete" onclick="event.stopPropagation(); openDeleteModal(${ship.id}, '${escapeString(ship.name)}')"><i class="fas fa-trash"></i></button>
    </div>`;
    
    card.innerHTML = cardHTML;
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
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
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
    const total = document.getElementById('total-count');
    const fav = document.getElementById('favorite-count');
    const canon = document.getElementById('canon-count');
    if (total) total.textContent = pairings.length;
    if (fav) fav.textContent = pairings.filter(p => p.favorite).length;
    if (canon) canon.textContent = pairings.filter(p => p.status === 'Canon').length;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function openAddModal() { document.getElementById('add-modal').style.display = 'flex'; }
function closeAddModal() { document.getElementById('add-modal').style.display = 'none'; resetForm(); }

function openExportModal() { document.getElementById('export-modal').style.display = 'flex'; }
function closeExportModal() { document.getElementById('export-modal').style.display = 'none'; }

function openImportModal() { document.getElementById('import-modal').style.display = 'flex'; }
function closeImportModal() { document.getElementById('import-modal').style.display = 'none'; }

function openEditModal(id) {
    const pairing = pairings.find(p => p.id === id);
    if (!pairing) return;
    editingId = id;
    document.getElementById('input-name').value = pairing.name || '';
    document.getElementById('input-characters').value = pairing.characters || '';
    document.getElementById('input-fandom').value = pairing.fandom || '';
    document.getElementById('input-status').value = pairing.status || 'Fanon';
    document.getElementById('input-universe').value = pairing.universe || 'From universe';
    document.getElementById('input-relationship').value = pairing.relationship || 'Romantic';
    document.getElementById('input-category').value = pairing.category || 'f/m';
    document.getElementById('input-year').value = pairing.yearStarted || '';
    document.getElementById('input-media').value = pairing.media || 'Literature/Books';
    document.getElementById('input-dynamic').value = pairing.dynamic || 'NA';
    document.getElementById('input-trope').value = pairing.trope || 'NA';
    document.getElementById('input-notes').value = pairing.notes || '';
    document.getElementById('input-favorite').checked = pairing.favorite || false;
    document.getElementById('input-artist').value = pairing.artist || '';
    
    if (pairing.image) {
        setUploadMethod('url');
        document.getElementById('input-image-url').value = pairing.image;
        previewImageUrl(pairing.image);
    }
    openAddModal();
}

function resetForm() {
    editingId = null; selectedFile = null;
    if (pairingForm) pairingForm.reset();
    clearImagePreview();
}

function setUploadMethod(method) {
    uploadMethod = method;
    document.getElementById('upload-option-file').classList.toggle('active', method === 'file');
    document.getElementById('upload-option-url').classList.toggle('active', method === 'url');
    document.getElementById('file-upload-container').style.display = method === 'file' ? 'block' : 'none';
    document.getElementById('url-upload-container').style.display = method === 'url' ? 'block' : 'none';
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) previewImageFile(file);
}

function previewImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const prev = document.getElementById('preview-img');
        prev.src = e.target.result;
        prev.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function previewImageUrl(url) {
    const prev = document.getElementById('preview-img');
    prev.src = url;
    prev.style.display = 'block';
}

function clearImagePreview() {
    const prev = document.getElementById('preview-img');
    prev.src = ''; prev.style.display = 'none';
}

function addNewPairing() {
    let imagePath = null;
    if (uploadMethod === 'url') {
        imagePath = document.getElementById('input-image-url').value;
    } else if (uploadMethod === 'file' && !editingId) {
        imagePath = `images/${document.getElementById('input-name').value.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    }
    completeSubmission(imagePath);
}

function completeSubmission(imagePath) {
    const pairingData = {
        id: editingId || Date.now(),
        name: document.getElementById('input-name').value,
        characters: document.getElementById('input-characters').value,
        fandom: document.getElementById('input-fandom').value,
        status: document.getElementById('input-status').value,
        universe: document.getElementById('input-universe').value,
        relationship: document.getElementById('input-relationship').value,
        category: document.getElementById('input-category').value,
        yearStarted: document.getElementById('input-year').value,
        media: document.getElementById('input-media').value,
        dynamic: document.getElementById('input-dynamic').value,
        trope: document.getElementById('input-trope').value,
        notes: document.getElementById('input-notes').value,
        favorite: document.getElementById('input-favorite').checked,
        image: imagePath || (editingId ? pairings.find(p => p.id === editingId).image : null),
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
    document.getElementById('confirm-message').textContent = `Delete "${name}"?`;
    document.getElementById('confirm-modal').style.display = 'flex';
}
function closeConfirmModal() { document.getElementById('confirm-modal').style.display = 'none'; }
function confirmDelete() {
    pairings = pairings.filter(p => p.id !== deletingId);
    saveToStorage();
    renderFandoms();
    applyFilters();
    updateStats();
    closeConfirmModal();
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pairings));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "pairings.json");
    dlAnchorElem.click();
}

function importData() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    if (!file) {
        showToast('Please select a file first', 'info');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                pairings = importedData;
                saveToStorage();
                renderFandoms();
                applyFilters();
                updateStats();
                closeImportModal();
                showToast('Import successful!', 'success');
            }
        } catch (err) {
            showToast('Invalid JSON file', 'error');
        }
    };
    reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    const searchInputElem = document.getElementById('search-input');
    if (searchInputElem) {
        searchInputElem.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            applyFilters();
        });
    }
    
    const overlay = document.getElementById('lightbox-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLightbox(); });
    }
    document.getElementById('lightbox-close-btn').addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
});
