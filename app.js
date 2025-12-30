import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_KEY = "YOUR_PUBLIC_ANON_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const citySelect = document.getElementById('citySelect');
const serviceSelect = document.getElementById('serviceSelect');
const findBtn = document.getElementById('findBtn');
const providerList = document.getElementById('providerList');
const resultsSection = document.getElementById('resultsSection');
const myBookings = document.getElementById('myBookings');

// Initialize Data
async function init() {
    const { data: cities } = await supabase.from('cities').select('*');
    const { data: services } = await supabase.from('services').select('*');

    cities?.forEach(c => citySelect.innerHTML += `<option value="${c.id}">${c.name}</option>`);
    services?.forEach(s => serviceSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`);
    
    refreshBookings();
}

// Search Logic
findBtn.onclick = async () => {
    const cityId = citySelect.value;
    const serviceId = serviceSelect.value;

    if(!cityId || !serviceId) return alert("Select both City and Service");

    const { data: providers } = await supabase
        .from('providers')
        .select('*')
        .eq('city_id', cityId)
        .eq('service_id', serviceId);

    renderProviders(providers);
};

function renderProviders(providers) {
    resultsSection.classList.remove('hidden');
    providerList.innerHTML = providers.length ? '' : '<p>No providers found in this city.</p>';
    
    providers.forEach(p => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div>
                <strong>${p.name}</strong>
                <p>Exp: ${p.experience} | ⭐ ${p.rating}</p>
            </div>
            <button onclick="createBooking('${p.id}')">Book Now</button>
        `;
        providerList.appendChild(card);
    });
}

// Create Booking
window.createBooking = async (providerId) => {
    const name = prompt("Enter your name:");
    const phone = prompt("Enter your WhatsApp/Phone:");

    if(!name || !phone) return;

    const { error } = await supabase.from('bookings').insert([{
        user_name: name,
        user_phone: phone,
        city_id: citySelect.value,
        service_id: serviceSelect.value,
        provider_id: providerId,
        status: 'pending'
    }]);

    if(!error) {
        alert("Booking Placed! Provider will contact you.");
        refreshBookings();
    }
};

// Tracking Logic
async function refreshBookings() {
    const { data: bookings } = await supabase
        .from('bookings')
        .select('*, services(name), providers(name)')
        .order('created_at', { ascending: false });

    if(bookings?.length) {
        myBookings.innerHTML = bookings.map(b => `
            <div class="item-card">
                <div>
                    <strong>${b.services.name}</strong><br>
                    <small>Provider: ${b.providers.name}</small>
                </div>
                <span class="badge ${b.status}">${b.status}</span>
            </div>
        `).join('');
    }
}

init();
