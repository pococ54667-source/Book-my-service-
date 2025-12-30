import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://hjpvadozhrdjugfrcffv.supabase.co";
const SUPABASE_KEY = "sb_publishable_VWRFCLxoBE75MYve7W5jhw_PedtT83O";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const citySelect = document.getElementById('citySelect');
const serviceSelect = document.getElementById('serviceSelect');
const providerList = document.getElementById('providerList');
const resultsSection = document.getElementById('resultsSection');

async function init() {
    const { data: c } = await supabase.from('cities').select('*');
    const { data: s } = await supabase.from('services').select('*');
    citySelect.innerHTML = '<option value="">Select City</option>' + c.map(i=>`<option value="${i.id}">${i.name}</option>`).join('');
    serviceSelect.innerHTML = '<option value="">Select Service</option>' + s.map(i=>`<option value="${i.id}">${i.name}</option>`).join('');
    refreshBookings();
}

document.getElementById('findBtn').onclick = async () => {
    const { data: p } = await supabase.from('providers').select('*').eq('city_id', citySelect.value).eq('service_id', serviceSelect.value);
    resultsSection.classList.remove('hidden');
    providerList.innerHTML = p.length ? p.map(i => `
        <div class="provider-card">
            <div><b>${i.name}</b><br><small>${i.experience || 'N/A'} Exp</small></div>
            <button class="main-btn" style="width:auto; padding:8px" onclick="window.bookProvider('${i.id}','${i.name}')">Book</button>
        </div>`).join('') : '<p>No experts found.</p>';
};

window.bookProvider = async (id, name) => {
    const { value: f } = await Swal.fire({
        title: 'Book ' + name,
        html: '<input id="n" class="swal2-input" placeholder="Name"><input id="p" class="swal2-input" placeholder="Phone">',
        preConfirm: () => [document.getElementById('n').value, document.getElementById('p').value]
    });
    if (f && f[0] && f[1]) {
        await supabase.from('bookings').insert([{ user_name: f[0], user_phone: f[1], city_id: citySelect.value, service_id: serviceSelect.value, provider_id: id, status: 'pending' }]);
        Swal.fire('Success', 'Booking Done', 'success');
        refreshBookings();
    }
};

document.getElementById('providerLoginBtn').onclick = async () => {
    const ph = document.getElementById('providerPhone').value;
    const { data: p } = await supabase.from('providers').select('*').eq('phone', ph).single();
    if(p) {
        document.getElementById('loginArea').classList.add('hidden');
        document.getElementById('providerDashboard').classList.remove('hidden');
        document.getElementById('welcomeMsg').innerText = "Welcome, " + p.name;
        loadProvBookings(p.id);
    } else { Swal.fire('Error', 'Not Found', 'error'); }
};
async function loadProvBookings(pid) {
    const { data: b } = await supabase.from('bookings').select('*, services(name)')
        .eq('provider_id', pid).neq('status', 'completed');

    const list = document.getElementById('providerBookings');
    if (b && b.length > 0) {
        list.innerHTML = b.map(i => `
            <div class="provider-card" style="flex-direction:column; align-items:start;">
                <b>${i.services?.name} - ${i.user_name}</b>
                <div style="font-size:0.8rem; margin:5px 0;">Phone: ${i.user_phone}</div>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button onclick="window.updStatus('${i.id}','confirmed','${pid}')" class="main-btn" style="padding:5px; background:#1e40af;">Confirm</button>
                    <button onclick="window.updStatus('${i.id}','completed','${pid}')" class="main-btn" style="padding:5px; background:#16a34a;">Done</button>
                </div>
            </div>`).join('');
    } else {
        list.innerHTML = '<p>No active bookings.</p>';
    }
}

window.updStatus = async (bid, st, pid) => {
    const { error } = await supabase.from('bookings').update({ status: st }).eq('id', bid);
    if(!error) {
        Swal.fire({title: 'Updated!', icon: 'success', background: '#1e293b', color: '#fff'});
        loadProvBookings(pid);
        refreshBookings();
    }
};

async function refreshBookings() {
    const { data: b } = await supabase.from('bookings').select('*, services(name), providers(name)')
        .order('created_at', {ascending: false}).limit(5);
    
    const activityList = document.getElementById('myBookings');
    if(activityList && b) {
        activityList.innerHTML = b.map(i => `
            <div class="provider-card">
                <div><b>${i.services?.name}</b><br><small>${i.providers?.name}</small></div>
                <span class="badge ${i.status}">${i.status}</span>
            </div>`).join('');
    }
}
init();
    
                
