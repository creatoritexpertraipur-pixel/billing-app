let menu = JSON.parse(localStorage.getItem('hotelMenu')) || [];
let currentBill = [];

window.onload = function() {
    loadHotelSettings();
    updateMenuUI();
};

// --- Page Switching Logic (Tabs Change Karna) ---
function switchPage(pageId, element) {
    // Sabhi pages ko chupao
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    // Sabhi nav-items se active class hatao
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    // Sahi page dikhao aur tab highlight karo
    document.getElementById(pageId).classList.add('active');
    element.classList.add('active');
}

// 1. Hotel Settings Save aur Load
function saveHotelSettings() {
    const hotelDetails = {
        name: document.getElementById('hotelName').value.trim(),
        address: document.getElementById('hotelAddress').value.trim(),
        upi: document.getElementById('hotelUPI').value.trim()
    };
    
    if(!hotelDetails.name) {
        alert('Kripya Hotel ka naam zaroor dalein!');
        return;
    }
    
    localStorage.setItem('hotelDetails', JSON.stringify(hotelDetails));
    document.getElementById('displayShopName').innerText = hotelDetails.name;
    
    alert('Settings Save Ho Gayi! Ab aap Billing Page par ja sakte hain.');
    
    // Automatic billing page par redirect kar dega save hote hi
    switchPage('billing-page', document.querySelectorAll('.nav-item')[0]);
}

function loadHotelSettings() {
    const details = JSON.parse(localStorage.getItem('hotelDetails'));
    if (details) {
        document.getElementById('hotelName').value = details.name || '';
        document.getElementById('hotelAddress').value = details.address || '';
        document.getElementById('hotelUPI').value = details.upi || '';
        document.getElementById('displayShopName').innerText = details.name || 'Hotel Billing App';
    }
}

// 2. Menu Management (Add/Delete Items)
function addMenuItem() {
    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value);

    if (!name || isNaN(price) || price <= 0) {
        alert('Kripya Sahi Name aur Price dalein!');
        return;
    }

    menu.push({ name, price });
    localStorage.setItem('hotelMenu', JSON.stringify(menu));
    
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    
    updateMenuUI();
}

function updateMenuUI() {
    const menuList = document.getElementById('menuList');
    const billSelect = document.getElementById('billItemSelect');
    
    menuList.innerHTML = '';
    billSelect.innerHTML = '<option value="">-- Item Select Karen --</option>';

    menu.forEach((item, index) => {
        menuList.innerHTML += `<li><span>${item.name} (₹${item.price})</span> <button class="btn-danger" onclick="deleteMenuItem(${index})">X</button></li>`;
        billSelect.innerHTML += `<option value="${index}">${item.name} (₹${item.price})</option>`;
    });
}

function deleteMenuItem(index) {
    if(confirm("Kya aap is item ko menu se hatana chahte hain?")) {
        menu.splice(index, 1);
        localStorage.setItem('hotelMenu', JSON.stringify(menu));
        updateMenuUI();
    }
}

// 3. Billing Section
function addItemToCurrentBill() {
    const select = document.getElementById('billItemSelect');
    const qty = parseInt(document.getElementById('billItemQty').value);
    const itemIndex = select.value;

    if (itemIndex === "" || isNaN(qty) || qty <= 0) {
        alert('Kripya pehle koi item aur quantity chunein!');
        return;
    }

    const selectedItem = menu[itemIndex];
    const existingItem = currentBill.find(b => b.name === selectedItem.name);
    
    if (existingItem) {
        existingItem.qty += qty;
        existingItem.total = existingItem.qty * existingItem.price;
    } else {
        currentBill.push({
            name: selectedItem.name,
            price: selectedItem.price,
            qty: qty,
            total: selectedItem.price * qty
        });
    }

    document.getElementById('billItemQty').value = 1;
    updateBillTable();
}

function updateBillTable() {
    const tbody = document.querySelector('#currentBillTable tbody');
    tbody.innerHTML = '';
    let grandTotal = 0;

    currentBill.forEach(item => {
        grandTotal += item.total;
        tbody.innerHTML += `<tr>
            <td>${item.name}</td>
            <td>₹${item.price}</td>
            <td>${item.qty}</td>
            <td>₹${item.total}</td>
        </tr>`;
    });

    document.getElementById('finalTotal').innerText = grandTotal;
}

// 4. Bluetooth Share & Dynamic UPI QR Code Generation
function printBill() {
    const details = JSON.parse(localStorage.getItem('hotelDetails'));
    if (!details || !details.name) {
        alert('Pehle Settings page par jaakar Hotel details save karein!');
        return;
    }

    if (currentBill.length === 0) {
        alert('Bill me koi item nahi joda gaya hai!');
        return;
    }

    let total = document.getElementById('finalTotal').innerText;

    // Standard UPI Link banana jisse scanner automatic payment le sake
    // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR
    let upiString = "";
    if(details.upi) {
        upiString = `upi://pay?pa=${encodeURIComponent(details.upi)}&pn=${encodeURIComponent(details.name)}&am=${total}&cu=INR`;
    }

    // Bill Text Format for Thermal Bluetooth Printer
    let billText = `==============================\n`;
    billText += `      ${details.name.toUpperCase()}      \n`;
    if(details.address) billText += `   ${details.address}   \n`;
    if(details.upi)     billText += `UPI ID: ${details.upi}\n`;
    billText += `==============================\n`;
    billText += `Item          Qty  Rate   Total\n`;
    billText += `------------------------------\n`;

    currentBill.forEach(item => {
        let nameField = item.name.substring(0, 12).padEnd(12, ' ');
        let qtyField = item.qty.toString().padEnd(4, ' ');
        let priceField = item.price.toString().padEnd(6, ' ');
        let totalField = item.total.toString();
        billText += `${nameField} ${qtyField} ${priceField} ${totalField}\n`;
    });

    billText += `------------------------------\n`;
    billText += `GRAND TOTAL:            Rs.${total}\n`;
    billText += `==============================\n`;
    
    if(details.upi) {
        billText += `  Scan QR in Printer App to Pay \n`;
        billText += `UPI Link: ${upiString}\n`;
        billText += `==============================\n`;
    }
    
    billText += `   Thank You! Visit Again 🙏   \n`;
    billText += `==============================\n\n\n`;

    // Mobile share handle karna
    if (navigator.share) {
        navigator.share({
            title: `${details.name} Bill`,
            text: billText
        }).then(() => {
            currentBill = [];
            updateBillTable();
        }).catch((error) => console.log('Sharing failed', error));
    } else {
        alert("Aapka bill text format:\n\n" + billText);
    }
}
