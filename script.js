// Initialize variables
let pairings = [];
let currentSearch = '';
let currentSlideIndex = 0;   
let activeShip = null;       

// DOM Elements
const pairingsGrid = document.getElementById('pairings-grid');
const searchInput = document.getElementById('search-input');
const fandomList = document.getElementById('fandom-list');

document.addEventListener('DOMContentLoaded', async () => {
    await loadFromStorage();
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            renderPairings();
        });
    }
});

async function loadFromStorage() {
    try {
        const response = await fetch('https://bash-code4228.github.io/fandom-relationship-database/pairings.json');
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
    
    // Path Logic: Folder is "image" and extension is ".jpg" (all lowercase)
    pairings.forEach(p => {
        if (!p.image) {
            p.image = [];
        } else {
            let imgArray = Array.isArray(p.image) ? p.image : [p.image];
            p.image = imgArray.map(img => {
                // If it's just a name like "shinoi", point to ./image/shinoi.jpg
                if (!img.includes('.') && !img.includes('/') && !img.startsWith('http')) {
                    return `./image/${img}.jpg`; 
                }
                return img;
            });
        }
    });

    renderPairings();
    renderFandoms(); 
    updateStats();
}

function renderFandoms() {
    if (!fandomList) return;
    const fandoms = [...new Set(pairings.map(p => p.fandom))].filter(f => f).sort();
    
    let listHTML = `
        <li class="fandom-item" style="background: #D4AF37; color: #333; margin-bottom: 15px; font-weight: bold;" onclick="filterByFandom('')">
            <i class="fas fa-border-all"></i> Display All
        </li>
    `;
    
    listHTML += fandoms.map(fandom => `
        <li class="fandom-item" onclick="filterByFandom('${fandom.replace(/'/g, "\\'")}')">
            ${fandom}
        </li>
    `).join('');
    
    fandomList.innerHTML = listHTML;
}

function filterByFandom(fandom) {
    if (searchInput) {
        searchInput.value = fandom;
        currentSearch = fandom.toLowerCase();
        renderPairings();
    }
}

function renderPairings() {
    if (!pairingsGrid) return;
    pairingsGrid.innerHTML = '';
    
    const filtered = pairings.filter(p => 
        (p.name && p.name.toLowerCase().includes(currentSearch)) || 
        (p.fandom && p.fandom.toLowerCase().includes(currentSearch)) ||
        (p.characters && p.characters.toLowerCase().includes(currentSearch))
    );

    filtered.forEach(ship => {
        const card = createShipCard(ship);
        pairingsGrid.appendChild(card);
    });
}

function createShipCard(ship) {
    const card = document.createElement('div');
    card.className = 'pairing-card';
    
    card.onclick = (e) => {
        if (!e.target.closest('.action-btn')) openExpandedView(ship.id);
    };

    const hasImages = ship.image && ship.image.length > 0;
    const thumb = hasImages ? ship.image[0] : '';

    card.innerHTML = `
        <div class="card-header">
            <div class="pairing-name">${ship.name}</div>
            <div class="favorite-badge">${ship.favorite ? '<i class="fas fa-star"></i>' : ''}</div>
        </div>
        
        <div class="image-container">
            ${hasImages ? 
                `<img src="${thumb}" class="ship-image" alt="${ship.name}" onerror="this.src='https://via.placeholder.com/350x250?text=Image+Not+Found'">` 
                : `<div style="padding:40px; text-align:center; color:#999;">No image set</div>`
            }
        </div>

        <div class="card-body">
            <p class="pairing-characters">${ship.characters || 'Unknown'}</p>
            <div class="info-row"><span class="info-label">Fandom:</span> ${ship.fandom || 'General'}</div>
            <div class="card-actions">
                <button class="action-btn" onclick="event.stopPropagation();"><i class="fas fa-edit"></i></button>
                <button class="action-btn" onclick="event.stopPropagation();"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
    return card;
}

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
    if (!activeShip || !activeShip.image) return;
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
