// Konfiguration
const CONFIG = { user: "admin", pass: "admin123" };

const db = {
    get: (k) => JSON.parse(localStorage.getItem(`sm_${k}`)) || [],
    save: (k, d) => localStorage.setItem(`sm_${k}`, JSON.stringify(d))
};

// Initial-Daten (falls leer)
if(db.get('categories').length === 0) db.save('categories', ['Elektronik', 'Werkzeug', 'Büro']);
if(db.get('locations').length === 0) db.save('locations', ['Hauptlager', 'Regal A1', 'Versandbox']);

const auth = {
    login: () => {
        if(document.getElementById('login-user').value === CONFIG.user && 
           document.getElementById('login-pass').value === CONFIG.pass) {
            localStorage.setItem('sm_auth', 'true');
            location.reload();
        } else { alert("Falsche Daten!"); }
    },
    logout: () => { localStorage.removeItem('sm_auth'); location.reload(); },
    check: () => {
        if(localStorage.getItem('sm_auth')) {
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('main-app').style.display = 'flex';
            ui.showSection('dashboard');
        }
    }
};

const ui = {
    showSection: (id) => {
        document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
        document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
        document.getElementById(id).style.display = 'block';
        document.getElementById(`nav-${id}`).classList.add('active');
        
        if(id === 'inventory') inventory.render();
        if(id === 'settings') settings.render();
        if(id === 'customers') customers.render();
        if(id === 'orders') orders.render();
        ui.updateStats();
    },
    updateStats: () => {
        const items = db.get('items');
        document.getElementById('stat-items').innerText = items.length;
        document.getElementById('stat-low-stock').innerText = items.filter(i => Number(i.stock) <= Number(i.min)).length;
        document.getElementById('stat-customers').innerText = db.get('customers').length;
        document.getElementById('stat-orders').innerText = db.get('orders').length;
    }
};

const settings = {
    render: () => {
        ['categories', 'locations'].forEach(key => {
            const list = document.getElementById(`list-${key}`);
            list.innerHTML = db.get(key).map((item, i) => `
                <li>${item} <i class="fas fa-trash text-danger" style="cursor:pointer" onclick="settings.remove('${key}', ${i})"></i></li>
            `).join('');
        });
    },
    add: (key, inputId) => {
        const val = document.getElementById(inputId).value.trim();
        if(!val) return;
        const data = db.get(key);
        data.push(val);
        db.save(key, data);
        document.getElementById(inputId).value = '';
        settings.render();
    },
    remove: (key, i) => {
        const data = db.get(key);
        data.splice(i, 1);
        db.save(key, data);
        settings.render();
    }
};

const inventory = {
    render: () => {
        const items = db.get('items');
        document.getElementById('inventory-body').innerHTML = items.map((item, i) => `
            <tr>
                <td><strong>${item.sku}</strong></td>
                <td>${item.name}</td>
                <td><span class="badge">${item.category}</span></td>
                <td>${item.location}</td>
                <td class="${Number(item.stock) <= Number(item.min) ? 'text-danger' : ''}">${item.stock} / ${item.min}</td>
                <td><button onclick="inventory.delete(${i})" class="btn-danger">Löschen</button></td>
            </tr>
        `).join('');
    },
    showModal: () => {
        const cats = db.get('categories');
        const locs = db.get('locations');
        document.getElementById('modal-form-content').innerHTML = `
            <h2>Artikel hinzufügen</h2>
            <input id="in-sku" placeholder="SKU">
            <input id="in-name" placeholder="Artikelname">
            <label>Kategorie</label>
            <select id="in-cat">${cats.map(c => `<option>${c}</option>`).join('')}</select>
            <label>Lagerort</label>
            <select id="in-loc">${locs.map(l => `<option>${l}</option>`).join('')}</select>
            <input type="number" id="in-stock" placeholder="Bestand">
            <input type="number" id="in-min" placeholder="Mindestbestand">
            <div style="margin-top:20px">
                <button class="btn-primary" onclick="inventory.save()">Speichern</button>
                <button onclick="document.getElementById('modal-container').style.display='none'">Abbrechen</button>
            </div>
        `;
        document.getElementById('modal-container').style.display = 'block';
    },
    save: () => {
        const items = db.get('items');
        items.push({
            sku: document.getElementById('in-sku').value,
            name: document.getElementById('in-name').value,
            category: document.getElementById('in-cat').value,
            location: document.getElementById('in-loc').value,
            stock: document.getElementById('in-stock').value,
            min: document.getElementById('in-min').value
        });
        db.save('items', items);
        document.getElementById('modal-container').style.display = 'none';
        inventory.render();
    },
    delete: (i) => { if(confirm("Löschen?")) { const d = db.get('items'); d.splice(i,1); db.save('items', d); inventory.render(); } }
};

// Dummy-Funktionen für Kunden/Bestellungen (ähnliches Schema wie oben)
const customers = {
    render: () => {
        const d = db.get('customers');
        document.getElementById('customers-body').innerHTML = d.map((c, i) => `<tr><td>${c.name}</td><td>${c.email}</td><td>${c.phone}</td><td><button onclick="customers.delete(${i})">X</button></td></tr>`).join('');
    },
    showModal: () => {
        document.getElementById('modal-form-content').innerHTML = `<h2>Neuer Kunde</h2><input id="c-n" placeholder="Name"><input id="c-e" placeholder="Email"><input id="c-p" placeholder="Tel"><button class="btn-primary" onclick="customers.save()">Speichern</button>`;
        document.getElementById('modal-container').style.display = 'block';
    },
    save: () => {
        const d = db.get('customers');
        d.push({name:document.getElementById('c-n').value, email:document.getElementById('c-e').value, phone:document.getElementById('c-p').value});
        db.save('customers', d); document.getElementById('modal-container').style.display = 'none'; customers.render();
    },
    delete: (i) => { const d = db.get('customers'); d.splice(i,1); db.save('customers', d); customers.render(); }
};

const orders = {
    render: () => {
        const d = db.get('orders');
        document.getElementById('orders-list').innerHTML = d.map(o => `<div class="stat-card"><strong>${o.cust}</strong><p>${o.items.length} Artikel</p><small>${o.date}</small></div>`).join('');
    },
    showModal: () => {
        const c = db.get('customers');
        const i = db.get('items');
        document.getElementById('modal-form-content').innerHTML = `<h2>Neue Bestellung</h2><select id="o-c">${c.map(x => `<option>${x.name}</option>`)}</select><select id="o-i" multiple>${i.map(x => `<option value="${x.sku}">${x.name}</option>`)}</select><button class="btn-primary" onclick="orders.save()">Abschluss</button>`;
        document.getElementById('modal-container').style.display = 'block';
    },
    save: () => {
        const d = db.get('orders');
        d.push({cust: document.getElementById('o-c').value, items: Array.from(document.getElementById('o-i').selectedOptions).map(x => x.value), date: new Date().toLocaleString()});
        db.save('orders', d); document.getElementById('modal-container').style.display = 'none'; orders.render();
    }
}

// Start
auth.check();
