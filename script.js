let pairings = [];

window.onload = () => {
    loadFromStorage();
};

function loadFromStorage() {
    const localData = localStorage.getItem('fandom_pairings');
    if (localData) {
        pairings = JSON.parse(localData);
        renderShips();
    } else {
        // Fallback to sample if empty
        addSampleData();
    }
}

function addSampleData() {
    pairings = [{
        char1: "Sample Character A",
        char2: "Sample Character B",
        fandom: "Example Fandom",
        type: "M/M",
        status: "OTP",
        fanfics: 0
    }];
    renderShips();
}

function renderShips() {
    const grid = document.getElementById('ship-grid');
    grid.innerHTML = '';
    
    pairings.forEach((ship, index) => {
        const card = document.createElement('div');
        card.className = 'ship-card';
        card.innerHTML = `
            <h4>${ship.char1} & ${ship.char2}</h4>
            <p><strong>Fandom:</strong> ${ship.fandom}</p>
            <p><strong>Status:</strong> ${ship.status}</p>
        `;
        grid.appendChild(card);
    });
    updateStats();
}

function updateStats() {
    document.getElementById('total-pairings').innerText = pairings.length;
}

function openAddModal() { document.getElementById('add-modal').style.display = 'flex'; }
function closeAddModal() { document.getElementById('add-modal').style.display = 'none'; }

function savePairing() {
    const newShip = {
        char1: document.getElementById('char1').value,
        char2: document.getElementById('char2').value,
        fandom: document.getElementById('fandom').value,
        type: document.getElementById('type').value,
        status: document.getElementById('status').value,
    };
    pairings.push(newShip);
    localStorage.setItem('fandom_pairings', JSON.stringify(pairings));
    renderShips();
    closeAddModal();
}