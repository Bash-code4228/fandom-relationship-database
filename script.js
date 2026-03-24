// Initialize variables
let pairings = [];
let currentSearch = '';
let currentSlideIndex = 0;   
let activeShip = null;       

// DOM Elements
const pairingsGrid = document.getElementById('pairings-grid');
const searchInput = document.getElementById('search-input');

document.addEventListener('DOMContentLoaded', async () => {
    await loadFromStorage();
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            renderPairings();
        });
    }
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
    
    // Ensure every "image" is a list for the slideshow
    pairings.forEach(p => {
        if (!p.image) p.image = [];
        else if (!Array.isArray(p.image)) p.image = [p.image];
    });

    renderPairings();
    updateStats();
}

function renderPairings() {
    if (!pairingsGrid) return;
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
    
    // Open slideshow when clicking the card (but not buttons)
    card.onclick = (e) => {
        if (!e.target.closest('.action-btn')) openExpandedView(ship.id);
    };

    const hasImages = ship.image && ship.image.length > 0;
    const thumb = hasImages ? ship.image[0] : '';

    // Structure matches your CSS classes exactly
    card.innerHTML = `
        <div class="card-header">
            <div class="pairing-name">${ship.name}</div>
            <div class="favorite-badge">${ship.favorite ? '<i class="fas fa-star"></i>' : ''}</div>
        </div>
        
        ${hasImages ? `
        <div class="image-container">
            <img src="${thumb}" class="ship-image">
        </div>
        ` : ''}

        <div class="card-body">
            <p class="pairing-characters">${ship.characters}</p>
            <div class="info-row"><span class="info-label">Fandom:</span> ${ship.fandom}</div>
            <div class="card-actions">
                <button class="action-btn" onclick="event.stopPropagation(); openEditModal(${ship.id})"><i class="fas fa-edit"></i></button>
                <button class="action-btn" onclick="event.stopPropagation(); openDeleteModal(${ship.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
    return card;
}

// Slideshow / Expanded View Logic
function openExpandedView(id) {
    activeShip = pairings.find(p => p.id === id);
    if (!activeShip) return;
    currentSlideIndex = 0;
    
    document.getElementById('exp-name').textContent = activeShip.name;
    document.getElementById('exp-characters').textContent = activeShip.characters;
    document.getElementById('exp-notes').textContent = activeShip.notes || 'No notes.';
    
    renderSlideshow();
    document.getElementById('expanded-modal').style.display = 'flex';
}

function renderSlideshow() {
    const container = document.getElementById('slideshow-images');
    container.innerHTML = '';
    const imgs = activeShip.image || [];
    
    if (imgs.length === 0) {
        container.innerHTML = '<p style="color:white; padding:20px;">No images available.</p>';
        return;
    }

    imgs.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'slide-img' + (i === currentSlideIndex ? ' active' : '');
        img.style.display = (i === currentSlideIndex ? 'block' : 'none');
        container.appendChild(img);
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

function updateStats() {
    const countEl = document.getElementById('total-count');
    if (countEl) countEl.textContent = pairings.length;
}
