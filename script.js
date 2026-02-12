// --- DATEN-STRUKTUR & INITIALISIERUNG ---
const db = {
    get: (key) => JSON.parse(localStorage.getItem(key)) || [],
    save: (key, data) => localStorage.setItem(key, JSON.stringify(data))
};

// --- AUTHENTIFIZIERUNG ---
const auth = {
    login: () => {
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;
        if(user === 'admin' && pass === 'admin') {
            localStorage.setItem('isLoggedIn', 'true');
            location.reload();
        } else { alert('Falsche Zugangsdaten!'); }
    },
    logout: () => {
        localStorage.removeItem('isLoggedIn');
        location.reload();
    },
    check: () => {
        if(localStorage.getItem('isLoggedIn')) {
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('main-app').style.display = 'flex';
            ui.updateDashboard();
        }
    }
};

// --- UI CONTROLLER ---
const ui = {
    showSection: (id) => {
        document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        if(id === 'inventory') inventory.render();
        if(id === 'customers') customers.render();
        if(id === 'orders') orders.render();
        ui.updateDashboard();
    },
    updateDashboard: () => {
        const items = db.get('items');
        const lowStock = items.filter(i => parseInt(i.stock) <= parseInt(i.minStock)).length;
        document.getElementById('stat-items').innerText = items.length;
        document.getElementById('stat-low-stock').innerText = lowStock;
        document.getElementById('stat-customers').innerText = db.get('customers').length;
        document.getElementById('stat-orders').innerText = db.get('orders').length;
    }
};

// --- LAGER VERWALTUNG ---
const inventory = {
    render: () => {
        const items = db.get('items');
        const body = document.getElementById('inventory-body');
        body.innerHTML = items.map((item, index) => `
            <tr>
                <td>${item.sku}</td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td class="${parseInt(item.stock) <= parseInt(item.minStock) ? 'low-stock' : ''}">${item.stock}</td>
                <td>${item.location}</td>
                <td>
                    <button onclick="inventory.delete(${index})">Löschen</button>
                </td>
            </tr>
        `).join('');
    },
    showModal: () => {
        const modal = document.getElementById('modal-container');
        document.getElementById('modal-form-content').innerHTML = `
            <h2>Artikel hinzufügen</h2>
            <input id="inv-name" placeholder="Name">
            <input id="inv-sku" placeholder="SKU">
            <input id="inv-cat" placeholder="Kategorie">
            <input type="number" id="inv-stock" placeholder="Bestand">
            <input type="number" id="inv-min" placeholder="Mindestbestand">
            <input id="inv-loc" placeholder="Lagerort">
            <button onclick="inventory.add()">Speichern</button>
            <button onclick="document.getElementById('modal-container').style.display='none'">Abbrechen</button>
        `;
        modal.style.display = 'block';
    },
    add: () => {
        const items = db.get('items');
        items.push({
            name: document.getElementById('inv-name').value,
            sku: document.getElementById('inv-sku').value,
            category: document.getElementById('inv-cat').value,
            stock: document.getElementById('inv-stock').value,
            minStock: document.getElementById('inv-min').value,
            location: document.getElementById('inv-loc').value
        });
        db.save('items', items);
        document.getElementById('modal-container').style.display = 'none';
        inventory.render();
    },
    delete: (index) => {
        const items = db.get('items');
        items.splice(index, 1);
        db.save('items', items);
        inventory.render();
    }
};

// --- KUNDEN VERWALTUNG ---
const customers = {
    render: () => {
        const data = db.get('customers');
        document.getElementById('customers-body').innerHTML = data.map((c, i) => `
            <tr>
                <td>${c.name}</td>
                <td>${c.email}</td>
                <td>${c.phone}</td>
                <td>${c.address}</td>
                <td><button onclick="customers.delete(${i})">X</button></td>
            </tr>
        `).join('');
    },
    showModal: () => {
        document.getElementById('modal-form-content').innerHTML = `
            <h2>Kunde hinzufügen</h2>
            <input id="cust-name" placeholder="Name">
            <input id="cust-email" placeholder="Email">
            <input id="cust-phone" placeholder="Telefon">
            <input id="cust-addr" placeholder="Adresse">
            <button onclick="customers.add()">Speichern</button>
        `;
        document.getElementById('modal-container').style.display = 'block';
    },
    add: () => {
        const data = db.get('customers');
        data.push({
            name: document.getElementById('cust-name').value,
            email: document.getElementById('cust-email').value,
            phone: document.getElementById('cust-phone').value,
            address: document.getElementById('cust-addr').value
        });
        db.save('customers', data);
        document.getElementById('modal-container').style.display = 'none';
        customers.render();
    },
    delete: (i) => {
        const data = db.get('customers');
        data.splice(i, 1);
        db.save('customers', data);
        customers.render();
    }
};

// --- BESTELLUNGEN ---
const orders = {
    render: () => {
        const data = db.get('orders');
        document.getElementById('orders-list').innerHTML = data.map(o => `
            <div class="stat-card" style="margin-bottom:10px;">
                <strong>Bestellung für: ${o.customer}</strong><br>
                Artikel: ${o.items.join(', ')} | Status: Abgeschlossen
            </div>
        `).join('');
    },
    showModal: () => {
        const items = db.get('items');
        const custs = db.get('customers');
        document.getElementById('modal-form-content').innerHTML = `
            <h2>Neue Bestellung</h2>
            <select id="ord-cust">${custs.map(c => `<option>${c.name}</option>`)}</select>
            <p>Wähle Artikel (STRG halten für Mehrfachwahl):</p>
            <select id="ord-items" multiple style="height:100px;">
                ${items.map(i => `<option value="${i.sku}">${i.name} (Bestand: ${i.stock})</option>`)}
            </select>
            <button onclick="orders.create()">Bestellung aufgeben</button>
        `;
        document.getElementById('modal-container').style.display = 'block';
    },
    create: () => {
        const selectedSkus = Array.from(document.getElementById('ord-items').selectedOptions).map(o => o.value);
        const customer = document.getElementById('ord-cust').value;
        
        // Lagerbestand reduzieren
        let inventoryData = db.get('items');
        selectedSkus.forEach(sku => {
            const item = inventoryData.find(i => i.sku === sku);
            if(item && item.stock > 0) item.stock--;
        });
        
        db.save('items', inventoryData);

        const orderData = db.get('orders');
        orderData.push({ customer, items: selectedSkus, date: new Date().toLocaleDateString() });
        db.save('orders', orderData);

        document.getElementById('modal-container').style.display = 'none';
        orders.render();
    }
};

// Init
auth.check();
