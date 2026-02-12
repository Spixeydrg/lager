// Konfiguration & "Datenbank"
const APP_CONFIG = {
    user: "manager", // Ändere hier deinen Benutzernamen
    pass: "lager2024" // Ändere hier dein Passwort
};

const db = {
    get: (key) => JSON.parse(localStorage.getItem(`stockapp_${key}`)) || [],
    save: (key, data) => localStorage.setItem(`stockapp_${key}`, JSON.stringify(data))
};

// --- LOGIN SYSTEM ---
const auth = {
    login: () => {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        if(u === APP_CONFIG.user && p === APP_CONFIG.pass) {
            localStorage.setItem('stockapp_session', 'active');
            location.reload();
        } else {
            alert("Zugriff verweigert!");
        }
    },
    logout: () => {
        localStorage.removeItem('stockapp_session');
        location.reload();
    },
    init: () => {
        if(localStorage.getItem('stockapp_session')) {
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('main-app').style.display = 'flex';
            ui.showSection('dashboard');
        }
    }
};

// --- UI ENGINE ---
const ui = {
    showSection: (id) => {
        document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
        document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
        
        document.getElementById(id).style.display = 'block';
        event?.currentTarget?.classList.add('active'); // Markiert aktiven Menüpunkt

        if(id === 'inventory') inventory.render();
        if(id === 'customers') customers.render();
        if(id === 'orders') orders.render();
        ui.updateStats();
    },
    updateStats: () => {
        const items = db.get('items');
        const low = items.filter(i => Number(i.stock) <= Number(i.minStock)).length;
        document.getElementById('stat-items').innerText = items.length;
        document.getElementById('stat-low-stock').innerText = low;
        document.getElementById('stat-customers').innerText = db.get('customers').length;
        document.getElementById('stat-orders').innerText = db.get('orders').length;
    }
};

// --- INVENTAR ---
const inventory = {
    render: () => {
        const items = db.get('items');
        const html = items.map((item, i) => {
            const isLow = Number(item.stock) <= Number(item.minStock);
            return `
            <tr>
                <td><strong>${item.sku}</strong></td>
                <td>${item.name}</td>
                <td><span class="badge" style="background:#e2e8f0">${item.category}</span></td>
                <td><span class="badge ${isLow ? 'badge-low' : 'badge-ok'}">${item.stock} / ${item.minStock}</span></td>
                <td>${item.location}</td>
                <td><button class="btn-danger" onclick="inventory.delete(${i})"><i class="fas fa-trash"></i></button></td>
            </tr>`;
        }).join('');
        document.getElementById('inventory-body').innerHTML = html || '<tr><td colspan="6" style="text-align:center">Keine Artikel im Lager</td></tr>';
    },
    showModal: () => {
        document.getElementById('modal-form-content').innerHTML = `
            <h2 style="margin-bottom:1rem">Neuer Artikel</h2>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
                <input id="inv-name" placeholder="Artikelname">
                <input id="inv-sku" placeholder="SKU / Barcode">
                <input id="inv-cat" placeholder="Kategorie">
                <input id="inv-loc" placeholder="Lagerort (Regal A1)">
                <input type="number" id="inv-stock" placeholder="Aktueller Bestand">
                <input type="number" id="inv-min" placeholder="Mindestbestand">
            </div>
            <div style="margin-top:1.5rem; display:flex; gap:10px">
                <button class="btn-primary" onclick="inventory.add()">Hinzufügen</button>
                <button onclick="document.getElementById('modal-container').style.display='none'">Abbrechen</button>
            </div>
        `;
        document.getElementById('modal-container').style.display = 'block';
    },
    add: () => {
        const items = db.get('items');
        const newItem = {
            name: document.getElementById('inv-name').value,
            sku: document.getElementById('inv-sku').value,
            category: document.getElementById('inv-cat').value,
            location: document.getElementById('inv-loc').value,
            stock: document.getElementById('inv-stock').value,
            minStock: document.getElementById('inv-min').value
        };
        if(!newItem.name || !newItem.sku) return alert("Name und SKU sind Pflicht!");
        items.push(newItem);
        db.save('items', items);
        document.getElementById('modal-container').style.display = 'none';
        inventory.render();
        ui.updateStats();
    },
    delete: (i) => {
        if(confirm("Artikel wirklich löschen?")) {
            const items = db.get('items');
            items.splice(i, 1);
            db.save('items', items);
            inventory.render();
            ui.updateStats();
        }
    }
};

// --- KUNDEN & BESTELLUNGEN (Kurzform für Übersicht) ---
const customers = {
    render: () => {
        const data = db.get('customers');
        document.getElementById('customers-body').innerHTML = data.map((c, i) => `
            <tr>
                <td>${c.name}</td>
                <td>${c.email}</td>
                <td>${c.phone}</td>
                <td>${c.address}</td>
                <td><button class="btn-danger" onclick="customers.delete(${i})">X</button></td>
            </tr>`).join('');
    },
    showModal: () => {
        document.getElementById('modal-form-content').innerHTML = `
            <h2>Kunde hinzufügen</h2>
            <input id="c-n" placeholder="Vollständiger Name">
            <input id="c-e" placeholder="Email">
            <input id="c-p" placeholder="Telefon">
            <input id="c-a" placeholder="Anschrift">
            <button class="btn-primary" onclick="customers.save()">Speichern</button>
        `;
        document.getElementById('modal-container').style.display = 'block';
    },
    save: () => {
        const d = db.get('customers');
        d.push({name:document.getElementById('c-n').value, email:document.getElementById('c-e').value, phone:document.getElementById('c-p').value, address:document.getElementById('c-a').value});
        db.save('customers', d);
        document.getElementById('modal-container').style.display='none';
        customers.render();
    },
    delete: (i) => {
        const d = db.get('customers'); d.splice(i,1); db.save('customers', d); customers.render();
    }
};

const orders = {
    render: () => {
        const data = db.get('orders');
        document.getElementById('orders-list').innerHTML = data.map(o => `
            <div class="stat-card">
                <div style="display:flex; justify-content:space-between">
                    <strong>${o.customer}</strong>
                    <span class="text-muted">${o.date}</span>
                </div>
                <p style="font-size:1rem; margin-top:10px">Artikel: ${o.items.join(', ')}</p>
            </div>
        `).join('');
    },
    showModal: () => {
        const items = db.get('items');
        const custs = db.get('customers');
        if(custs.length === 0) return alert("Bitte erstelle zuerst einen Kunden!");
        document.getElementById('modal-form-content').innerHTML = `
            <h2>Neue Bestellung aufgeben</h2>
            <label>Kunde auswählen:</label>
            <select id="o-c">${custs.map(c => `<option>${c.name}</option>`)}</select>
            <label style="margin-top:10px; display:block">Artikel wählen (STRG für Mehrfachwahl):</label>
            <select id="o-i" multiple style="height:120px">
                ${items.map(i => `<option value="${i.sku}">${i.name} (Lager: ${i.stock})</option>`)}
            </select>
            <button class="btn-primary" style="margin-top:1rem" onclick="orders.process()">Bestellung abschließen</button>
        `;
        document.getElementById('modal-container').style.display = 'block';
    },
    process: () => {
        const selected = Array.from(document.getElementById('o-i').selectedOptions).map(o => o.value);
        if(selected.length === 0) return alert("Keine Artikel gewählt!");
        
        // Lager abziehen
        let inv = db.get('items');
        selected.forEach(sku => {
            let item = inv.find(x => x.sku === sku);
            if(item && item.stock > 0) item.stock--;
        });
        db.save('items', inv);

        const ord = db.get('orders');
        ord.unshift({ customer: document.getElementById('o-c').value, items: selected, date: new Date().toLocaleString() });
        db.save('orders', ord);

        document.getElementById('modal-container').style.display = 'none';
        orders.render();
        ui.updateStats();
    }
};

// Start
auth.init();
