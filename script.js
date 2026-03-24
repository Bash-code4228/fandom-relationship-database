// Initialize variables
let pairings = [];
let editingId = null;
let deletingId = null;
let currentSearch = '';
let currentSlideIndex = 0;   
let activeShip = null;       

// DOM Elements
const pairingsGrid = document.getElementById('pairings-grid');
const searchInput = document.getElementById('search-input');
const addModal = document.getElementById('add-modal');
const expandedModal = document.getElementById('expanded-modal');
const pairingForm = document.getElementById('pairing-form');

// Load initial data from your GitHub JSON
document.addEventListener('DOMContentLoaded', async () => {
    await loadFromStorage();
    
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        applyFilters();
    });
});

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
        const saved = localStorage.getItem('fandomShips');
        if (saved) pairings = JSON.parse(saved);
    }
    
    // Migration: Fix old data so every "image" is treated as a list
    pairings.forEach(p => {
        if (p.image && !Array.isArray(p.image)) p.image = [p.image];
        if (!p.image) p.image = [];
    });

    renderPairings();
    updateStats();
}

function renderPairings() {
    pairingsGrid.innerHTML = '';
    const filtered = pairings.filter(p => 
        p.name.toLowerCase().includes(currentSearch) || 
        p.fandom.toLowerCase().includes(currentSearch) ||
        p.characters.toLowerCase().includes(currentSearch)
    );

    filtered.forEach(ship => {
        const card = createShipCard(ship);
        pairingsGrid.appendChild(card);
    });
}

function createShipCard(ship) {
    const card = document.createElement('div');
    card.className = 'pairing-card';
    
    // Clicking the card opens the expanded slideshow view
    card.onclick = (e) => {
        if (!e.target.closest('.action-btn')) openExpandedView(ship.id);
    };

    const hasImages = ship.image && ship.image.length > 0;
    const thumb = hasImages ? ship.image[0] : '';

    card.innerHTML = `
        <div class="image-container">
            ${hasImages ? `<img src="${thumb}" class="ship-image">` : '<div class="no-image">No Image</div>'}
            <div class="image-overlay">
                <div class="name-badge" style="background: #1976D2; color: white; padding: 5px 12px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 5px;">
                    ${ship.name}
                </div>
                <p class="pairing-characters" style="color: white; margin: 0; font-size: 0.9rem;">${ship.characters}</p>
            </div>
        </div>
        <div class="card-body">
            <div class="info-row"><strong>Fandom:</strong> ${ship.fandom}</div>
            <div class="card-actions" style="margin-top: 10px;">
                <button class="action-btn" onclick="openEditModal(${ship.id})"><i class="fas fa-edit"></i></button>
                <button class="action-btn" onclick="openDeleteModal(${ship.id}, '${ship.name.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
    return card;
}

// EXPANDED VIEW & SLIDESHOW LOGIC
function openExpandedView(id) {
    activeShip = pairings.find(p => p.id === id);
    if (!activeShip) return;
    
    currentSlideIndex = 0;
    
    document.getElementById('exp-name').textContent = activeShip.name;
    document.getElementById('exp-characters').textContent = activeShip.characters;
    document.getElementById('exp-notes').textContent = activeShip.notes || 'No notes added.';
    
    renderSlideshow();
    document.getElementById('expanded-modal').style.display = 'flex';
}

function renderSlideshow() {
    const container = document.getElementById('slideshow-images');
    const dots = document.getElementById('slide-dots');
    container.innerHTML = '';
    dots.innerHTML = '';

    const imgs = activeShip.image || [];
    
    if (imgs.length === 0) {
        container.innerHTML = '<div style="color:white;">No images available</div>';
        return;
    }

    imgs.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'slide-img' + (i === currentSlideIndex ? ' active' : '');
        img.style.display = (i === currentSlideIndex ? 'block' : 'none');
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

function closeExpandedModal() {
    document.getElementById('expanded-modal').style.display = 'none';
}

// Stats & Helpers
function updateStats() {
    document.getElementById('total-count').textContent = pairings.length;
    document.getElementById('favorite-count').textContent = pairings.filter(p => p.favorite).length;
    document.getElementById('canon-count').textContent = pairings.filter(p => p.status === 'Canon').length;
    updateFandomSidebar();
}

function applyFilters() { renderPairings(); }

function openAddModal() { addModal.style.display = 'flex'; }
function closeAddModal() { addModal.style.display = 'none'; pairingForm.reset(); }

function updateFandomSidebar() {
    const list = document.getElementById('fandom-list');
    if (!list) return;
    const fandoms = [...new Set(pairings.map(p => p.fandom))].sort();
    list.innerHTML = '<li onclick="currentSearch=\'\'; renderPairings();" style="cursor:pointer; padding:5px;">All Fandoms</li>';
    fandoms.forEach(f => {
        const li = document.createElement('li');
        li.textContent = f;
        li.style.cursor = 'pointer';
        li.onclick = () => { currentSearch = f.toLowerCase(); renderPairings(); };
        list.appendChild(li);
    });
}

// Close modals when clicking outside
window.onclick = (event) => {
    if (event.target.className === 'modal') {
        closeAddModal();
        closeExpandedModal();
    }
};
