import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://hjpvadozhrdjugfrcffv.supabase.co";
const SUPABASE_KEY = "sb_publishable_VWRFCLxoBE75MYve7W5jhw_PedtT83O";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const icons = {
    "Carpenter": "fa-hammer",
    "Electrician": "fa-bolt",
    "Plumber": "fa-faucet",
    "Cleaner": "fa-broom",
    "Painter": "fa-paint-roller"
};

// 1. App Load hote hi Data lao
async function init() {
    try {
        const { data: c } = await supabase.from('cities').select('*');
        const { data: s } = await supabase.from('services').select('*');
        
        document.getElementById('citySelect').innerHTML = '<option value="">Select City</option>' + 
            c.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
        
        document.getElementById('serviceSelect').innerHTML = '<option value="">Select Service</option>' + 
            s.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
        
        refreshBookings();
    } catch (e) { console.error("Load Error:", e); }
}

// 2. Expert Dhundo (Validation ke sath)
document.getElementById('findBtn').onclick = async () => {
    const city = document.getElementById('citySelect').value;
    const service = document.getElementById('serviceSelect').value;

    if(!city || !service) return Swal.fire('Ruko!', 'City aur Service dono select karo.', 'warning');

    const { data: p } = await supabase.from('providers').select('*').eq('city_id', city).eq('service_id', service);
    
    document.getElementById('resultsSection').classList.remove('hidden');
    document.getElementById('providerList').innerHTML = p.length ? p.map(i => `
        <div class="provider-card">
            <div><i class="fas fa-user-check"></i> <b>${i.name}</b></div>
            <button class="main-btn" style="width:auto; padding:8px" onclick="window.bookProvider('${i.id}','${i.name}')">Book Now</button>
        </div>`).join('') : '<p>Koi expert nahi mila.</p>';
};

// 3. Booking Logic
window.bookProvider = async (id, name) => {
    const { value: f } = await Swal.fire({
        title: 'Booking: ' + name,
        html: '<input id="n" class="swal2-input" placeholder="Aapka Naam"><input id="p" class="swal2-input" placeholder="Mobile Number" maxlength="10">',
        preConfirm: () => {
            const n = document.getElementById('n').value;
            const p = document.getElementById('p').value;
            if(!n || p.length < 10) return Swal.showValidationMessage('Naam aur 10-digit Phone sahi se dalo');
            return [n, p];
        }
    });

    if (f) {
        await supabase.from('bookings').insert([{ 
            user_name: f[0], user_phone: f[1], 
            city_id: document.getElementById('citySelect').value, 
            service_id: document.getElementById('serviceSelect').value, 
            provider_id: id, status: 'pending' 
        }]);
        Swal.fire('Done!', 'Expert aapko call karega.', 'success');
        refreshBookings();
    }
};

// 4. Provider Dashboard Login
document.getElementById('providerLoginBtn').onclick = async () => {
    const ph = document.getElementById('providerPhone').value.trim();
    const { data: pList } = await supabase.from('providers').select('*').eq('phone', ph);
    
    if(pList && pList.length > 0) {
        document.getElementById('loginArea').classList.add('hidden');
        document.getElementById('providerDashboard').classList.remove('hidden');
        document.getElementById('welcomeMsg').innerText = "Welcome, " + pList[0].name;
        loadProvBookings(pList[0].id);
    } else { Swal.fire('Error', 'Mobile number galat hai.', 'error'); }
};

// 5. Status Update (Professional Logic)
async function loadProvBookings(pid) {
    const { data: b } = await supabase.from('bookings').select('*, services(name)').eq('provider_id', pid).neq('status', 'completed');
    document.getElementById('providerBookings').innerHTML = b.length ? b.map(i => `
        <div class="provider-card" style="flex-direction:column; align-items:start;">
            <b>${i.services?.name} - ${i.user_name}</b>
            <div style="font-size:0.8rem; margin:5px 0;">Phone: ${i.user_phone}</div>
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button onclick="window.updStatus('${i.id}','confirmed','${pid}')" class="main-btn" style="padding:5px; background:#1e40af;">Confirm</button>
                <button onclick="window.updStatus('${i.id}','completed','${pid}')" class="main-btn" style="padding:5px; background:#16a34a;">Done</button>
            </div>
        </div>`).join('') : '<p>Abhi koi naya kaam nahi hai.</p>';
}

window.updStatus = async (bid, st, pid) => {
    await supabase.from('bookings').update({ status: st }).eq('id', bid);
    if(st === 'completed') Swal.fire('Mubarak Ho!', 'Kaam khatam ho gaya.', 'success');
    loadProvBookings(pid);
    refreshBookings();
};

// 6. Recent Activity Refresh
async function refreshBookings() {
    const { data: b } = await supabase.from('bookings').select('*, services(name), providers(name)').order('created_at', {ascending: false}).limit(5);
    if(b) {
        document.getElementById('myBookings').innerHTML = b.map(i => {
            const icon = icons[i.services?.name] || "fa-tools";
            return `<div class="provider-card">
                <div><i class="fas ${icon}" style="margin-right:10px; color:#3b82f6;"></i><b>${i.services?.name}</b><br><small>${i.providers?.name}</small></div>
                <span class="badge ${i.status}">${i.status}</span>
            </div>`;
        }).join('');
    }
}

init();
    
