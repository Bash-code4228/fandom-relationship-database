let pairings = [];
let deleteIndex = null;

window.onload = () => {
    loadFromStorage();
};

async function loadFromStorage() {
    const localData = localStorage.getItem('fandom_pairings');
    if (localData) {
        pairings = JSON.parse(localData);
        finishInit();
    } else {
        try {
            // Updated to fetch from your GitHub repository URL
            const response = await fetch('https://bash-code4228.github.io/Ship-Tracker/pairings.json');
            if (response.ok) {
                pairings = await response.json();
                saveToStorage();
                finishInit();
            }
        } catch (e) {
            console.log("Starting fresh database.");
        }
    }
}

function finishInit() {
    renderShips();
    updateStats();
    updateFilters();
}

function saveToStorage() {
    localStorage.setItem('fandom_pairings', JSON.stringify(pairings));
}

function renderShips(data = pairings) {
    const grid = document.getElementById('ship-grid');
    grid.innerHTML = '';
    
    data.forEach((ship, index) => {
        const card = document.createElement('div');
        card.className = 'ship-card';
        card.innerHTML = `
            <span class="status-badge status-${ship.status}">${ship.status}</span>
            <div class="card-content">
                <span class="fandom-tag">${ship.fandom}</span>
                <div class="pairing-names">${ship.char1} & ${ship.char2}</div>
                <div class="meta-info">
                    <span><i class="fas fa-venus-mars"></i> ${ship.type}</span>
                    <span><i class="fas fa-book"></i> ${ship.fanfics || 0} fics</span>
                </div>
                <div class="tags-list">
                    ${(ship.tags || '').split(',').map(tag => tag.trim() ? `<span class="tag">${tag.trim()}</span>` : '').join('')}
                </div>
                <p class="notes">${ship.notes || 'No special notes added.'}</p>
                <div class="rating-stars">${'★'.repeat(ship.rating || 0)}${'☆'.repeat(5 - (ship.rating || 0))}</div>
            </div>
            <div class="card-actions">
                <div class="action-icon" title="Edit"><i class="fas fa-edit"></i></div>
                <div class="action-icon delete-icon" onclick="openConfirmModal(${index})" title="Delete"><i class="fas fa-trash-alt"></i></div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function updateStats() {
    document.getElementById('total-pairings').innerText = pairings.length;
    document.getElementById('total-fandoms').innerText = [...new Set(pairings.map(s => s.fandom))].length;
    document.getElementById('total-fanfics').innerText = pairings.reduce((sum, s) => sum + parseInt(s.fanfics || 0), 0);
}

function updateFilters() {
    const fandomSelect = document.getElementById('fandom-filter');
    const fandoms = [...new Set(pairings.map(s => s.fandom))].sort();
    let options = '<option value="all">All Fandoms</option>';
    fandoms.forEach(f => { options += `<option value="${f}">${f}</option>`; });
    fandomSelect.innerHTML = options;
}

function applyFilters() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const fandom = document.getElementById('fandom-filter').value;
    const status = document.getElementById('status-filter').value;
    const type = document.getElementById('type-filter').value;

    const filtered = pairings.filter(ship => {
        const matchesSearch = ship.char1.toLowerCase().includes(search) || 
                            ship.char2.toLowerCase().includes(search) || 
                            ship.fandom.toLowerCase().includes(search) ||
                            (ship.tags && ship.tags.toLowerCase().includes(search));
        const matchesFandom = fandom === 'all' || ship.fandom === fandom;
        const matchesStatus = status === 'all' || ship.status === status;
        const matchesType = type === 'all' || ship.type === type;
        return matchesSearch && matchesFandom && matchesStatus && matchesType;
    });
    renderShips(filtered);
}

function openAddModal() { document.getElementById('add-modal').style.display = 'flex'; }
function closeAddModal() { document.getElementById('add-modal').style.display = 'none'; }

function savePairing() {
    const ship = {
        char1: document.getElementById('char1').value,
        char2: document.getElementById('char2').value,
        fandom: document.getElementById('fandom').value,
        type: document.getElementById('type').value,
        status: document.getElementById('status').value,
        fanfics: document.getElementById('fanfics').value,
        rating: document.getElementById('rating').value,
        tags: document.getElementById('tags').value,
        notes: document.getElementById('notes').value
    };
    pairings.push(ship);
    saveToStorage();
    finishInit();
    closeAddModal();
}

function openConfirmModal(index) { deleteIndex = index; document.getElementById('confirm-modal').style.display = 'flex'; }
function closeConfirmModal() { document.getElementById('confirm-modal').style.display = 'none'; }
function confirmDelete() { 
    pairings.splice(deleteIndex, 1); 
    saveToStorage(); finishInit(); closeConfirmModal(); 
}

function openExportModal() { document.getElementById('export-modal').style.display = 'flex'; }
function closeExportModal() { document.getElementById('export-modal').style.display = 'none'; }
function exportData() {
    const dataStr = JSON.stringify(pairings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'pairings.json');
    linkElement.click();
    closeExportModal();
}

function openImportModal() { document.getElementById('import-modal').style.display = 'flex'; }
function closeImportModal() { document.getElementById('import-modal').style.display = 'none'; }
function importData() {
    const file = document.getElementById('import-file').files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        pairings = JSON.parse(e.target.result);
        saveToStorage(); finishInit(); closeImportModal();
    };
    reader.readAsText(file);
}

window.onclick = (event) => {
    if (event.target.className === 'modal') {
        closeAddModal(); closeExportModal(); closeImportModal(); closeConfirmModal();
    }
};
