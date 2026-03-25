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

// Get image path for a ship - tries multiple possible filenames
function getShipImagePath(ship) {
    // If ship already has an image path stored, use it
    if (ship.image && ship.image !== null && ship.image !== '') {
        return ship.image;
    }
    
    // Try to find image in images folder based on ship name
    const possibleNames = [
        ship.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        ship.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''),
        ship.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        ship.id.toString()
    ];
    
    // Check for common image extensions
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    for (let name of possibleNames) {
        for (let ext of extensions) {
            const path = `images/${name}${ext}`;
            // We can't check if file exists synchronously, but we'll return the first candidate
            // The onerror handler on the img tag will handle missing images
            return path;
        }
    }
    
    return null;
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
        const saved = localStorage.getItem('fandomShips');
        if (saved) {
            pairings = JSON.parse(saved);
            console.log('Loaded from localStorage:', pairings.length, 'ships');
        } else {
            addSampleData();
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

// Add sample ships data
function addSampleData() {
    const sampleShips = [
        {
            id: 1,
            name: "Stucky",
            characters: "Steve Rogers x Bucky Barnes",
            fandom: "Marvel Cinematic Universe",
            universe: "From universe",
            status: "Fanon",
            relationship: "Romantic",
            yearStarted: "2014",
            media: "Film Series",
            dynamic: "Opposing Energies",
            trope: "Friends to Lovers",
            notes: "The loyalty and history between them gets me every time",
            favorite: true,
            image: "images/stucky.jpg",
            addedDate: "2024-01-15"
        },
        {
            id: 2,
            name: "Dramione",
            characters: "Draco Malfoy x Hermione Granger",
            fandom: "Harry Potter",
            universe: "From universe",
            status: "Fanon",
            relationship: "Romantic",
            yearStarted: "2010",
            media: "Literature/Books",
            dynamic: "Opposing Energies",
            trope: "Enemies to Lovers",
            notes: "Enemies to lovers perfection",
            favorite: true,
            image: "images/dramione.jpg",
            addedDate: "2026-02-25"
        },
        {
            id: 3,
            name: "Superbat",
            characters: "Clark Kent x Bruce Wayne",
            fandom: "DC",
            universe: "Crossover",
            status: "Fanon",
            relationship: "Romantic",
            yearStarted: "2015",
            media: "Comics/Manga",
            dynamic: "Opposing Energies",
            trope: "Enemies to Lovers",
            notes: "The sun and the moon",
            favorite: false,
            image: "images/superbat.jpg",
            addedDate: "2026-03-20"
        }
    ];
    
    pairings = sampleShips;
    saveToStorage();
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

// Create ship card element with image from images/ folder
function createShipCard(ship) {
    const card = document.createElement('div');
    card.className = 'pairing-card';
    card.style.cssText = 'background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.2s;';
    
    // Get image path - either from ship.image or try to find it
    let imagePath = ship.image;
    if (!imagePath || imagePath === 'null' || imagePath === '') {
        // Try to auto-detect image based on ship name
        const possibleName = ship.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        imagePath = `images/${possibleName}.jpg`;
    }
    
    // Check if it's a full URL or relative path
    const imageUrl = imagePath && imagePath !== 'null' ? imagePath : null;
    
    let cardHTML = '';
    
    // Favorite badge
    if (ship.favorite) {
        cardHTML += `<div style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); padding: 6px 12px; border-radius: 20px; color: gold; font-size: 12px; z-index: 10;">
            <i class="fas fa-star"></i> Active
        </div>`;
    }

    // Crossover badge
    const fandomsList = parseFandoms(ship.fandom);
    const isCrossover = fandomsList.length > 1 || ship.universe === 'Crossover';
    
    if (isCrossover) {
        cardHTML += `<div style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); padding: 6px 12px; border-radius: 20px; color: #D4AF37; font-size: 12px; z-index: 10;">
            <i class="fas fa-code-branch"></i> Crossover
        </div>`;
    }

    // Image section
    if (imageUrl) {
        cardHTML += `
        <div style="position: relative;">
            <div style="position: absolute; top: 12px; right: 12px; z-index: 10; display: flex; gap: 8px;">
                <button class="action-btn" onclick="event.stopPropagation(); toggleFavorite(${ship.id})" style="background: rgba(0,0,0,0.6); border: none; border-radius: 50%; width: 32px; height: 32px; color: ${ship.favorite ? '#ffc107' : 'white'}; cursor: pointer;">
                    <i class="${ship.favorite ? 'fas' : 'far'} fa-star"></i>
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); openEditModal(${ship.id})" style="background: rgba(0,0,0,0.6); border: none; border-radius: 50%; width: 32px; height: 32px; color: white; cursor: pointer;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); openDeleteModal(${ship.id}, '${escapeString(ship.name)}')" style="background: rgba(0,0,0,0.6); border: none; border-radius: 50%; width: 32px; height: 32px; color: white; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <img src="${imageUrl}" alt="${ship.name}" 
                style="width: 100%; height: 200px; object-fit: cover;" 
                onerror="this.onerror=null; this.src='https://via.placeholder.com/400x200?text=No+Image'; this.parentElement.querySelector('.image-fallback').style.display='flex'; this.style.display='none';">
            <div class="image-fallback" style="display: none; width: 100%; height: 200px; background: linear-gradient(135deg, #ffe6e6, #ffcccc); align-items: center; justify-content: center; flex-direction: column; color: #c92a2a;">
                <i class="fas fa-heart" style="font-size: 48px;"></i>
                <p style="margin-top: 10px;">No Image</p>
            </div>
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); padding: 20px; color: white;">
                <h3 style="margin: 0; font-size: 1.2rem;">${escapeHtml(ship.name)}</h3>
                <p style="margin: 5px 0 0; font-size: 0.9rem;">${escapeHtml(ship.characters)}</p>
            </div>
        </div>`;
    } else {
        cardHTML += `
        <div style="padding: 20px; background: linear-gradient(135deg, #ffe6e6, #ffcccc);">
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-bottom: 10px;">
                <button class="action-btn" onclick="event.stopPropagation(); toggleFavorite(${ship.id})" style="background: none; border: none; cursor: pointer; color: ${ship.favorite ? '#ffc107' : '#999'}; font-size: 18px;">
                    <i class="${ship.favorite ? 'fas' : 'far'} fa-star"></i>
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); openEditModal(${ship.id})" style="background: none; border: none; cursor: pointer; color: #999;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); openDeleteModal(${ship.id}, '${escapeString(ship.name)}')" style="background: none; border: none; cursor: pointer; color: #999;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <h3 style="margin: 0 0 5px 0;">${escapeHtml(ship.name)}</h3>
            <p style="margin: 0; color: #666;">${escapeHtml(ship.characters)}</p>
        </div>`;
    }
    
    // Card body with details
    cardHTML += `
    <div style="padding: 15px;">
        <div style="margin-bottom: 8px;">
            <span style="font-weight: bold;">Fandom${isCrossover ? 's' : ''}:</span>
            <span style="margin-left: 8px;">${escapeHtml(formatFandomsForDisplay(ship.fandom))}</span>
        </div>
        ${ship.media ? `<div style="margin-bottom: 8px;"><span style="font-weight: bold;">Media:</span> <span>${escapeHtml(ship.media)}</span></div>` : ''}
        ${ship.dynamic && ship.dynamic !== 'NA' ? `<div style="margin-bottom: 8px;"><span style="font-weight: bold;">Dynamic:</span> <span>${escapeHtml(ship.dynamic)}</span></div>` : ''}
        ${ship.notes ? `<div style="margin-bottom: 8px;"><span style="font-weight: bold;">Notes:</span> <span>${escapeHtml(ship.notes)}</span></div>` : ''}
        
        <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
            <span style="background: #f0f0f0; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                <i class="fas fa-info-circle"></i> ${escapeHtml(ship.status || 'Fanon')}
            </span>
            <span style="background: #f0f0f0; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                <i class="fas fa-heart"></i> ${escapeHtml(ship.relationship || 'Romantic')}
            </span>
            ${ship.universe === 'Crossover' ? `<span style="background: #f0f0f0; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                <i class="fas fa-globe"></i> Crossover
            </span>` : ''}
        </div>
    </div>`;
    
    card.innerHTML = cardHTML;
    
    // Handle image fallback display
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
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
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
    toast.style.cssText = 'background: white; padding: 12px 24px; border-radius: 50px; margin-top: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);';
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}" style="color: ${type === 'success' ? '#2ecc71' : '#3498db'};"></i><span style="margin-left: 8px;">${message}</span>`;
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
        // For file upload, we'd need to save to images folder
        // For now, just show a message
        showToast('File upload will save image to images folder. For now, please use URL or manually add to images folder.', 'info');
        // Generate filename suggestion
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

window.onclick = (event) => {
    if (event.target.classList && event.target.classList.contains('modal')) {
        closeAddModal();
        closeExportModal();
        closeImportModal();
        closeConfirmModal();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    
    const searchInputElem = document.getElementById('search-input');
    if (searchInputElem) {
        searchInputElem.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            applyFilters();
        });
    }
    
    console.log('Fandom Relationship Tracker initialized!');
});
