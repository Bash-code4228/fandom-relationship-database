let pairings = JSON.parse(localStorage.getItem('fandom_pairings')) || [];

function saveToStorage() {
    localStorage.setItem('fandom_pairings', JSON.stringify(pairings));
    renderShips();
    updateStats();
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
                <p class="notes">${ship.notes || ''}</p>
            </div>
            <div class="card-actions" style="padding:10px; display:flex; justify-content:flex-end; gap:10px;">
                <button onclick="openEditModal(${index})" class="action-icon"><i class="fas fa-edit"></i></button>
                <button onclick="deletePairing(${index})" class="action-icon"><i class="fas fa-trash"></i></button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openEditModal(index) {
    const ship = pairings[index];
    document.getElementById('modal-title').innerText = "Edit Pairing";
    document.getElementById('edit-index').value = index;
    document.getElementById('char1').value = ship.char1;
    document.getElementById('char2').value = ship.char2;
    document.getElementById('fandom').value = ship.fandom;
    document.getElementById('status').value = ship.status;
    document.getElementById('notes').value = ship.notes;
    document.getElementById('add-modal').style.display = 'flex';
}

function savePairing() {
    const idx = document.getElementById('edit-index').value;
    const ship = {
        char1: document.getElementById('char1').value,
        char2: document.getElementById('char2').value,
        fandom: document.getElementById('fandom').value,
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value
    };
    if (idx === "") pairings.push(ship);
    else pairings[idx] = ship;
    saveToStorage();
    closeAddModal();
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pairings));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "pairings.json");
    dlAnchorElem.click();
}

function openExportModal() { document.getElementById('export-modal').style.display = 'flex'; }
function closeExportModal() { document.getElementById('export-modal').style.display = 'none'; }
function openImportModal() { document.getElementById('import-modal').style.display = 'flex'; }
function closeImportModal() { document.getElementById('import-modal').style.display = 'none'; }
function openAddModal() { 
    document.getElementById('modal-title').innerText = "Add New Pairing";
    document.getElementById('edit-index').value = ""; 
    document.getElementById('add-modal').style.display = 'flex'; 
}
function closeAddModal() { document.getElementById('add-modal').style.display = 'none'; }

window.onload = () => { renderShips(); updateStats(); };
