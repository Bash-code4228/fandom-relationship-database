let pairings = [];
let currentSearch = '';
let activeShip = null;
let currentSlideIndex = 0;

const pairingsGrid = document.getElementById('pairings-grid');
const searchInput = document.getElementById('search-input');
const fandomList = document.getElementById('fandom-list');

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            renderPairings();
        });
    }
});

async function loadData() {
    try {
        const response = await fetch('https://bash-code4228.github.io/fandom-relationship-database/pairings.json');
        pairings = await response.json();
    } catch (e) {
        const saved = localStorage.getItem('fandomShips');
        if (saved) pairings = JSON.parse(saved);
    }

    pairings.forEach(p => {
        if (p.image) {
            let imgArray = Array.isArray(p.image) ? p.image : [p.image];
            p.image = imgArray.map(img => {
                if (!img.includes('.') && !img.startsWith('http')) {
                    return `image/${img}.jpg`;
                }
                return img;
            });
        } else {
            p.image = [];
        }
    });

    renderPairings();
    renderFandoms();
    updateStats();
}

function renderFandoms() {
    if (!fandomList) return;
    const fandoms = [...new Set(pairings.map(p => p.fandom))].filter(f => f).sort();
    
    let html = `<li class="fandom-item" style="background:#D4AF37; color:#333;" onclick="filterByFandom('')">All Fandoms</li>`;
    html += fandoms.map(f => `
        <li class="fandom-item" onclick="filterByFandom('${f.replace(/'/g, "\\'")}')">${f}</li>
    `).join('');
    fandomList.innerHTML = html;
}

function filterByFandom(f) {
    searchInput.value = f;
    currentSearch = f.toLowerCase();
    renderPairings();
}

function renderPairings() {
    pairingsGrid.innerHTML = '';
    const filtered = pairings.filter(p => 
        p.name.toLowerCase().includes(currentSearch) || 
        p.fandom.toLowerCase().includes(currentSearch) ||
        p.characters.toLowerCase().includes(currentSearch)
    );

    filtered.forEach(ship => {
        const card = document.createElement('div');
        card.className = 'pairing-card';
        card.onclick = () => openExpandedView(ship.id);
        
        const img = ship.image.length > 0 ? ship.image[0] : '';
        
        card.innerHTML = `
            <div class="pairing-name">${ship.name}</div>
            <div class="image-container">
                ${img ? `<img src="${img}" class="ship-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">` : ''}
            </div>
            <div class="card-body">
                <p class="pairing-characters">${ship.characters}</p>
                <p><small>Fandom: ${ship.fandom}</small></p>
            </div>
        `;
        pairingsGrid.appendChild(card);
    });
}

function updateStats() {
    document.getElementById('total-count').textContent = pairings.length;
}

function openExpandedView(id) {
    activeShip = pairings.find(p => p.id === id);
    document.getElementById('exp-name').textContent = activeShip.name;
    document.getElementById('exp-characters').textContent = activeShip.characters;
    document.getElementById('exp-notes').textContent = activeShip.notes || "No notes.";
    document.getElementById('expanded-modal').style.display = 'flex';
}

function closeExpandedModal() {
    document.getElementById('expanded-modal').style.display = 'none';
}
