// Initialize variables
let pairings = [];
let editingId = null;
let currentSearch = '';
let currentFandomFilter = '';

// ... (Sidebar, Filter, and Storage functions same as original) ...

// Updated Lightbox function with Category
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
    // NEW: Display category in Lightbox
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

// Updated createShipCard to include the new tag
function createShipCard(ship) {
    const card = document.createElement('div');
    card.className = 'pairing-card';
    
    let imagePath = ship.image || `images/${ship.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.jpg`;
    const formattedFandoms = formatFandomsForDisplay(ship.fandom);
    
    let cardHTML = `
    <div class="image-container" style="position: relative; height: 200px; cursor: pointer;" 
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
    <div class="card-body">
        <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
            <span class="tag"><i class="fas fa-info-circle"></i> ${escapeHtml(ship.status || 'Fanon')}</span>
            <span class="tag"><i class="fas fa-heart"></i> ${escapeHtml(ship.relationship || 'Romantic')}</span>
            <span class="tag"><i class="fas fa-venus-mars"></i> ${escapeHtml(ship.category || 'f/m')}</span>
            ${ship.yearStarted ? `<span class="tag"><i class="fas fa-calendar"></i> ${escapeHtml(ship.yearStarted)}</span>` : ''}
        </div>
    </div>`;
    
    card.innerHTML = cardHTML;
    return card;
}

// Updated openEditModal to populate the new dropdown
function openEditModal(id) {
    const pairing = pairings.find(p => p.id === id);
    if (!pairing) return;
    editingId = id;
    document.getElementById('input-name').value = pairing.name || '';
    document.getElementById('input-characters').value = pairing.characters || '';
    document.getElementById('input-fandom').value = pairing.fandom || '';
    document.getElementById('input-status').value = pairing.status || 'Fanon';
    document.getElementById('input-relationship').value = pairing.relationship || 'Romantic';
    // NEW: Load category into modal
    document.getElementById('input-category').value = pairing.category || 'f/m';
    document.getElementById('input-year').value = pairing.yearStarted || '';
    document.getElementById('input-media').value = pairing.media || 'Literature/Books';
    document.getElementById('input-dynamic').value = pairing.dynamic || 'NA';
    document.getElementById('input-notes').value = pairing.notes || '';
    document.getElementById('input-favorite').checked = pairing.favorite || false;
    document.getElementById('input-artist').value = pairing.artist || '';
    
    if (pairing.image && pairing.image !== 'null') {
        setUploadMethod('url');
        document.getElementById('input-image-url').value = pairing.image;
        previewImageUrl(pairing.image);
    }
    openAddModal();
}

// Updated completeSubmission to save the new field
function completeSubmission(imagePath) {
    const pairingData = {
        id: editingId || Date.now(),
        name: document.getElementById('input-name').value,
        characters: document.getElementById('input-characters').value,
        fandom: document.getElementById('input-fandom').value,
        status: document.getElementById('input-status').value,
        relationship: document.getElementById('input-relationship').value,
        // NEW: Save category to ship object
        category: document.getElementById('input-category').value,
        yearStarted: document.getElementById('input-year').value,
        media: document.getElementById('input-media').value,
        dynamic: document.getElementById('input-dynamic').value,
        notes: document.getElementById('input-notes').value,
        favorite: document.getElementById('input-favorite').checked,
        image: imagePath || null,
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
    applyFilters();
    updateStats();
    closeAddModal();
    showToast('Ship saved successfully!', 'success');
}
