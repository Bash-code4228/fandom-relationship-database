let pairings = [];
let currentSearch = '';
let activeShip = null;
let currentSlideIndex = 0;

const pairingsGrid = document.getElementById('pairings-grid');
const searchInput = document.getElementById('search-input');
const fandomList = document.getElementById('fandom-list');

// Fallback data for testing
const fallbackData = [
    {
        id: 1,
        name: "Katorro",
        characters: "Kato & Torro",
        fandom: "Nusantara RDR RP",
        notes: "A dynamic duo with great chemistry",
        image: []
    },
    {
        id: 2,
        name: "Darcy",
        characters: "Fitzwilliam Darcy",
        fandom: "Jane Austen Universe",
        notes: "The iconic romantic hero",
        image: []
    },
    {
        id: 3,
        name: "Deannie",
        characters: "Dean & Annie",
        fandom: "The Iron Giant (1999)",
        notes: "A beautiful friendship",
        image: []
    },
    {
        id: 4,
        name: "Katara/El-Torro",
        characters: "Katara & El-Torro",
        fandom: "Nusantara RDR RP",
        notes: "An epic pairing",
        image: []
    },
    {
        id: 5,
        name: "Elizabeth Bennet/Fitzwilliam Darcy",
        characters: "Elizabeth Bennet & Fitzwilliam Darcy",
        fandom: "Jane Austen Universe",
        notes: "The ultimate Pride and Prejudice couple",
        image: []
    },
    {
        id: 6,
        name: "Dean McCoppine/Annie Hughes",
        characters: "Dean McCoppine & Annie Hughes",
        fandom: "The Iron Giant (1999)",
        notes: "A heartwarming relationship",
        image: []
    },
    {
        id: 7,
        name: "McGhughes",
        characters: "McG & Hughes",
        fandom: "Nusantara RDR RP",
        notes: "Interesting dynamic",
        image: []
    },
    {
        id: 8,
        name: "Gradford",
        characters: "Grad & Ford",
        fandom: "Nusantara RDR RP",
        notes: "Strong partnership",
        image: []
    }
];

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
        if (response.ok) {
            pairings = await response.json();
        } else {
            throw new Error('Failed to fetch');
        }
    } catch (e) {
        console.log('Using fallback data');
        const saved = localStorage.getItem('fandomShips');
        if (saved) {
            pairings = JSON.parse(saved);
        } else {
            pairings = fallbackData;
            saveToLocalStorage();
        }
    }

    // Process images
    pairings.forEach(p => {
        if (p.image) {
            let imgArray = Array.isArray(p.image) ? p.image : [p.image];
            p.image = imgArray.map(img => {
                if (img && !img.includes('.') && !img.startsWith('http') && img !== '') {
                    return `image/${img}.jpg`;
                }
                return img || '';
            }).filter(img => img);
        } else {
            p.image = [];
        }
        
        // Ensure all ships have required fields
        if (!p.id) p.id = Date.now() + Math.random();
        if (!p.characters) p.characters = p.name;
        if (!p.notes) p.notes = "No additional notes available.";
    });

    renderPairings();
    renderFandoms();
    updateStats();
}

function saveToLocalStorage() {
    localStorage.setItem('fandomShips', JSON.stringify(pairings));
}

function renderFandoms() {
    if (!fandomList) return;
    const fandoms = [...new Set(pairings.map(p => p.fandom))].filter(f => f).sort();
    
    let html = `<li class="fandom-item" style="background:#D4AF37; color:#333;" onclick="filterByFandom('')">All Fandoms</li>`;
    html += fandoms.map(f => `
        <li class="fandom-item" onclick="filterByFandom('${f.replace(/'/g, "\\'")}')">${escapeHtml(f)}</li>
    `).join('');
    fandomList.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function filterByFandom(f) {
    if (searchInput) {
        searchInput.value = f;
        currentSearch = f.toLowerCase();
        renderPairings();
    }
}

function renderPairings() {
    if (!pairingsGrid) return;
    pairingsGrid.innerHTML = '';
    
    const filtered = pairings.filter(p => 
        p.name.toLowerCase().includes(currentSearch) || 
        p.fandom.toLowerCase().includes(currentSearch) ||
        p.characters.toLowerCase().includes(currentSearch)
    );

    if (filtered.length === 0) {
        pairingsGrid.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">No ships found</div>';
        return;
    }

    filtered.forEach(ship => {
        const card = document.createElement('div');
        card.className = 'pairing-card';
        card.onclick = () => openExpandedView(ship.id);
        
        const img = ship.image && ship.image.length > 0 ? ship.image[0] : '';
        
        card.innerHTML = `
            <div class="pairing-name">${escapeHtml(ship.name)}</div>
            <div class="image-container">
                ${img ? `<img src="${img}" class="ship-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">` : '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">No Image Available</div>'}
            </div>
            <div class="card-body">
                <p class="pairing-characters">${escapeHtml(ship.characters)}</p>
                <p><small>Fandom: ${escapeHtml(ship.fandom)}</small></p>
            </div>
        `;
        pairingsGrid.appendChild(card);
    });
}

function updateStats() {
    const totalCountElem = document.getElementById('total-count');
    if (totalCountElem) {
        totalCountElem.textContent = pairings.length;
    }
}

function openExpandedView(id) {
    activeShip = pairings.find(p => p.id === id);
    if (!activeShip) return;
    
    document.getElementById('exp-name').textContent = activeShip.name;
    document.getElementById('exp-characters').textContent = activeShip.characters;
    document.getElementById('exp-notes').textContent = activeShip.notes || "No notes available.";
    
    // Setup slideshow
    currentSlideIndex = 0;
    setupSlideshow();
    
    document.getElementById('expanded-modal').style.display = 'flex';
}

function setupSlideshow() {
    const slideshowContainer = document.getElementById('slideshow-images');
    const dotsContainer = document.getElementById('slide-dots');
    
    if (!slideshowContainer) return;
    
    const images = activeShip.image && activeShip.image.length > 0 ? activeShip.image : [];
    
    if (images.length === 0) {
        slideshowContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">No images available for this ship</div>';
        if (dotsContainer) dotsContainer.innerHTML = '';
        return;
    }
    
    // Create slides
    slideshowContainer.innerHTML = images.map((img, idx) => `
        <div class="slide" style="display: ${idx === 0 ? 'block' : 'none'}; width: 100%; height: 100%;">
            <img src="${img}" class="slide-image" onerror="this.src='https://via.placeholder.com/800x400?text=Image+Not+Found'">
        </div>
    `).join('');
    
    // Create dots
    if (dotsContainer) {
        dotsContainer.innerHTML = images.map((_, idx) => `
            <span class="dot ${idx === 0 ? 'active' : ''}" onclick="goToSlide(${idx})"></span>
        `).join('');
    }
    
    // Show/hide navigation buttons
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    if (prevBtn && nextBtn) {
        prevBtn.style.display = images.length > 1 ? 'flex' : 'none';
        nextBtn.style.display = images.length > 1 ? 'flex' : 'none';
    }
}

function changeSlide(direction) {
    const images = activeShip.image || [];
    if (images.length === 0) return;
    
    currentSlideIndex += direction;
    
    if (currentSlideIndex >= images.length) {
        currentSlideIndex = 0;
    }
    if (currentSlideIndex < 0) {
        currentSlideIndex = images.length - 1;
    }
    
    goToSlide(currentSlideIndex);
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    if (!slides.length) return;
    
    slides.forEach((slide, i) => {
        slide.style.display = i === index ? 'block' : 'none';
    });
    
    if (dots.length) {
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    currentSlideIndex = index;
}

function closeExpandedModal() {
    document.getElementById('expanded-modal').style.display = 'none';
    activeShip = null;
    currentSlideIndex = 0;
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('expanded-modal');
    if (e.target === modal) {
        closeExpandedModal();
    }
});

// Keyboard navigation for modal
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('expanded-modal');
    if (modal.style.display === 'flex') {
        if (e.key === 'ArrowLeft') {
            changeSlide(-1);
        } else if (e.key === 'ArrowRight') {
            changeSlide(1);
        } else if (e.key === 'Escape') {
            closeExpandedModal();
        }
    }
});
