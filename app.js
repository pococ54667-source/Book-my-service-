import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://hjpvadozhrdjugfrcffv.supabase.co";
const SUPABASE_KEY = "sb_publishable_VWRFCLxoBE75MYve7W5jhw_PedtT83O";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const citySelect = document.getElementById('citySelect');
const serviceSelect = document.getElementById('serviceSelect');
const providerList = document.getElementById('providerList');

async function init() {
    const { data: c } = await supabase.from('cities').select('*');
    const { data: s } = await supabase.from('services').select('*');
    
    if(citySelect) citySelect.innerHTML = '<option value="">Select City</option>' + 
        c.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
    
    if(serviceSelect) serviceSelect.innerHTML = '<option value="">Select Service</option>' + 
        s.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
    
    refreshBookings();
}

document.getElementById('findBtn').onclick = async () => {
    const { data: p } = await supabase.from('providers').select('*')
        .eq('city_id', citySelect.value)
        .eq('service_id', serviceSelect.value);
    
    document.getElementById('resultsSection').classList.remove('hidden');
    providerList.innerHTML = p.length ? p.map(i => `
        <div class="provider-card">
            <div><b>${i.name}</b></div>
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
    const ph = document.getElementById('providerPhone').value.trim();
    const { data: pList } = await supabase.from('providers').select('*').eq('phone', ph);
    
    if(pList && pList.length > 0) {
        document.getElementById('loginArea').classList.add('hidden');
        document.getElementById('providerDashboard').classList.remove('hidden');
        document.getElementById('welcomeMsg').innerText = "Welcome, " + pList[0].name;
        loadProvBookings(pList[0].id);
    } else { 
        Swal.fire('Error', 'Provider Not Found', 'error'); 
    }
};

async function loadProvBookings(pid) {
    const { data: b } = await supabase.from('bookings').select('*, services(name)')
        .eq('provider_id', pid)
        .neq('status', 'completed');

    const list = document.getElementById('providerBookings');
    list.innerHTML = b.length ? b.map(i => `
        <div class="provider-card" style="flex-direction:column; align-items:start;">
            <b>${i.services?.name} - ${i.user_name}</b>
            <div style="font-size:0.8rem; margin:5px 0;">Phone: ${i.user_phone}</div>
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button onclick="window.updStatus('${i.id}','confirmed','${pid}')" class="main-btn" style="padding:5px; background:#1e40af;">Confirm</button>
                <button onclick="window.updStatus('${i.id}','completed','${pid}')" class="main-btn" style="padding:5px; background:#16a34a;">Done</button>
            </div>
        </div>`).join('') : '<p>No active bookings.</p>';
}

window.updStatus = async (bid, st, pid) => {
    await supabase.from('bookings').update({ status: st }).eq('id', bid);
    loadProvBookings(pid);
    refreshBookings();
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
            
