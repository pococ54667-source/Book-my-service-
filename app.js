import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://hjpvadozhrdjugfrcffv.supabase.co";
const SUPABASE_KEY = "sb_publishable_VWRFCLxoBE75MYve7W5jhw_PedtT83O";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const citySelect = document.getElementById('citySelect');
const serviceSelect = document.getElementById('serviceSelect');
const findBtn = document.getElementById('findBtn');
const providerList = document.getElementById('providerList');
const resultsSection = document.getElementById('resultsSection');
const myBookings = document.getElementById('myBookings');

async function init() {
    const { data: cities } = await supabase.from('cities').select('*');
    const { data: services } = await supabase.from('services').select('*');
    citySelect.innerHTML = '<option value="">Select City</option>';
    cities?.forEach(c => citySelect.innerHTML += `<option value="${c.id}">${c.name}</option>`);
    serviceSelect.innerHTML = '<option value="">Select Service</option>';
    services?.forEach(s => serviceSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`);
    refreshBookings();
}

findBtn.onclick = async () => {
    const { data: providers } = await supabase.from('providers').select('*')
        .eq('city_id', citySelect.value).eq('service_id', serviceSelect.value);
    renderProviders(providers);
};

function renderProviders(providers) {
    resultsSection.classList.remove('hidden');
    providerList.innerHTML = providers.length ? '' : '<p>No experts found.</p>';
    providers.forEach(p => {
        const div = document.createElement('div');
        div.className = 'provider-card';
        div.innerHTML = `
            <div>
                <div style="font-weight:700">${p.name}</div>
                <div style="font-size:0.8rem; color:#94a3b8">${p.experience || 'N/A'} Exp</div>
            </div>
            <button class="main-btn" style="width:auto; padding:8px 16px" 
                onclick="window.bookProvider('${p.id}', '${p.name}')">Book Now</button>`;
        providerList.appendChild(div);
    });
}

window.bookProvider = async (pId, pName) => {
    const { value: formValues } = await Swal.fire({
        title: `Book ${pName}`,
        html: `<input id="swal-name" class="swal2-input" placeholder="Your Name">
               <input id="swal-phone" class="swal2-input" placeholder="WhatsApp Number">`,
        background: '#1e293b', color: '#fff',
        preConfirm: () => [document.getElementById('swal-name').value, document.getElementById('swal-phone').value]
    });

    if (formValues && formValues[0] && formValues[1]) {
        const { error } = await supabase.from('bookings').insert([{
            user_name: formValues[0], user_phone: formValues[1],
            city_id: citySelect.value, service_id: serviceSelect.value,
            provider_id: pId, status: 'pending'
        }]);
        if(!error) { 
            Swal.fire({title:'Success', icon:'success', background:'#1e293b', color:'#fff'}); 
            refreshBookings(); 
        } else {
            console.error(error);
        }
    }
};

async function refreshBookings() {
    const { data: bookings } = await supabase.from('bookings').select('*, services(name), providers(name)').order('created_at', { ascending: false });
    if(bookings?.length) {
        myBookings.innerHTML = bookings.map(b => `
            <div class="provider-card">
                <div><b>${b.services?.name}</b><br><small>${b.providers?.name}</small></div>
                <span class="badge ${b.status}">${b.status}</span>
            </div>`).join('');
    }
}
init();
     
const loginArea = document.getElementById('loginArea');
const providerDashboard = document.getElementById('providerDashboard');
const providerPhoneInput = document.getElementById('providerPhone');
const providerLoginBtn = document.getElementById('providerLoginBtn');
const providerBookingsList = document.getElementById('providerBookings');

providerLoginBtn.onclick = async () => {
    const phone = providerPhoneInput.value;
    if(!phone) return Swal.fire('Error', 'Please enter your phone number', 'error');


    const { data: provider, error } = await supabase
        .from('providers')
        .select('*')
        .eq('phone', phone)
        .single();

    if(error || !provider) {
        return Swal.fire('Error', 'Provider not found with this number', 'error');
    }

    
    loginArea.classList.add('hidden');
    providerDashboard.classList.remove('hidden');
    document.getElementById('welcomeMsg').innerText = `Welcome, ${provider.name}`;
    loadProviderBookings(provider.id);
};

async function loadProviderBookings(pId) {
    const { data: bookings } = await supabase
        .from('bookings')
        .select('*, services(name)')
        .eq('provider_id', pId)
        .order('created_at', { ascending: false });

    if(bookings.length === 0) {
        providerBookingsList.innerHTML = '<p>No bookings assigned to you.</p>';
        return;
    }

    providerBookingsList.innerHTML = bookings.map(b => `
        <div class="provider-card" style="flex-direction:column; align-items:flex-start; gap:10px;">
            <div style="width:100%; display:flex; justify-content:space-between;">
                <b>${b.services.name}</b>
                <span class="badge ${b.status}">${b.status}</span>
            </div>
            <div style="font-size:0.9rem;">
                Client: ${b.user_name} <br>
                Phone: <a href="tel:${b.user_phone}" style="color:var(--accent);">${b.user_phone}</a>
            </div>
            <div style="display:flex; gap:10px; width:100%;">
                <button onclick="updateStatus('${b.id}', 'confirmed', ${pId})" class="main-btn" style="padding:5px; font-size:0.8rem; background:#1e40af;">Confirm</button>
                <button onclick="updateStatus('${b.id}', 'completed', ${pId})" class="main-btn" style="padding:5px; font-size:0.8rem; background:#166534;">Mark Done</button>
            </div>
        </div>
    `).join('');
}

window.updateStatus = async (bookingId, newStatus, pId) => {
    const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

    if(!error) {
        Swal.fire('Updated', `Booking marked as ${newStatus}`, 'success');
        loadProviderBookings(pId); 
        refreshBookings(); 
    }
};
       
