// LocalStorage se data uthana ya khali array banana
let menu = JSON.parse(localStorage.getItem('hotelMenu')) || [];
let currentBill = [];

// App khulte hi settings aur menu load ho jayenge
window.onload = function() {
    loadHotelSettings();
    updateMenuUI();
};

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
    alert('Hotel Settings successfully save ho gayi hain!');
}

function loadHotelSettings() {
    const details = JSON.parse(localStorage.getItem('hotelDetails'));
    if (details) {
        document.getElementById('hotelName').value = details.name || '';
        document.getElementById('hotelAddress').value = details.address || '';
        document.getElementById('hotelUPI').value = details.upi || '';
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
        // Menu list update
        menuList.innerHTML += `<li><span>${item.name} (₹${item.price})</span> <button class="btn-danger" onclick="deleteMenuItem(${index})">X</button></li>`;
        // Billing dropdown update
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

// 3. Billing Section (Add to bill & Calculate)
function addItemToCurrentBill() {
    const select = document.getElementById('billItemSelect');
    const qty = parseInt(document.getElementById('billItemQty').value);
    const itemIndex = select.value;

    if (itemIndex === "" || isNaN(qty) || qty <= 0) {
        alert('Kripya pehle koi item aur quantity chunein!');
        return;
    }

    const selectedItem = menu[itemIndex];
    
    // Agar item pehle se bill me hai toh sirf quantity badhao
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

    // Input reset to 1
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

// 4. Bluetooth Thermal Printer Text Format Generation
function printBill() {
    const details = JSON.parse(localStorage.getItem('hotelDetails'));
    if (!details || !details.name) {
        alert('Pehle Section 1 me Hotel ka naam daal kar Save karein!');
        return;
    }

    if (currentBill.length === 0) {
        alert('Bill me koi item nahi joda gaya hai!');
        return;
    }

    let total = document.getElementById('finalTotal').innerText;

    // Bluetooth thermal printer (58mm/80mm) ke hisab se Text Layout formatting
    let billText = `==============================\n`;
    billText += `      ${details.name.toUpperCase()}      \n`;
    if(details.address) billText += `   ${details.address}   \n`;
    if(details.upi)     billText += `UPI: ${details.upi}\n`;
    billText += `==============================\n`;
    billText += `Item          Qty  Rate   Total\n`;
    billText += `------------------------------\n`;

    currentBill.forEach(item => {
        // 58mm printer par alignment sahi rakhne ke liye padding spaces
        let nameField = item.name.substring(0, 12).padEnd(12, ' ');
        let qtyField = item.qty.toString().padEnd(4, ' ');
        let priceField = item.price.toString().padEnd(6, ' ');
        let totalField = item.total.toString();
        
        billText += `${nameField} ${qtyField} ${priceField} ${totalField}\n`;
    });

    billText += `------------------------------\n`;
    billText += `GRAND TOTAL:            Rs.${total}\n`;
    billText += `==============================\n`;
    billText += `   Thank You! Visit Again 🙏   \n`;
    billText += `==============================\n\n\n`;

    // Android aur iOS mobile share menu trigger karne ke liye
    if (navigator.share) {
        navigator.share({
            title: `${details.name} Bill`,
            text: billText
        }).then(() => {
            // Bill print dabate hi list reset ho jayegi naye customer ke liye
            currentBill = [];
            updateBillTable();
        }).catch((error) => console.log('Sharing failed', error));
    } else {
        // Computer/Desktop ke liye normal popup fallback
        alert("Mobile browser par chalayein taaki bluetooth printer me share ho sake. Aapka bill:\n\n" + billText);
    }
}