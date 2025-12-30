import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://hjpvadozhrdjugfrcffv.supabase.co";
const SUPABASE_KEY = "sb_publishable_VWRFCLxoBE75MYve7W5jhw_PedtT83O";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Service Icons Map (Sense: Users ko dekhne mein achha lagega)
const icons = {
    "Carpenter": "fa-hammer",
    "Electrician": "fa-bolt",
    "Plumber": "fa-faucet",
    "Cleaner": "fa-broom",
    "Painter": "fa-paint-roller"
};

async function init() {
    try {
        const { data: c } = await supabase.from('cities').select('*');
        const { data: s } = await supabase.from('services').select('*');
        
        if(c) document.getElementById('citySelect').innerHTML = '<option value="">Select City</option>' + c.map(i=>`<option value="${i.id}">${i.name}</option>`).join('');
        if(s) document.getElementById('serviceSelect').innerHTML = '<option value="">Select Service</option>' + s.map(i=>`<option value="${i.id}">${i.name}</option>`).join('');
        
        refreshBookings();
    } catch (e) { console.error("Init Error:", e); }
}

// 2. Search Experts (Sense: Bina select kiye 'Find' dabaoge toh warning aayegi)
document.getElementById('findBtn').onclick = async () => {
    const city = document.getElementById('citySelect').value;
    const service = document.getElementById('serviceSelect').value;

    if(!city || !service) {
        return Swal.fire('Hey!', 'Please select City and Service first.', 'info');
    }

    const { data: p } = await supabase.from('providers').select('*').eq('city_id', city).eq('service_id', service);
    
    document.getElementById('resultsSection').classList.remove('hidden');
    document.getElementById('providerList').innerHTML = p.length ? p.map(i => `
        <div class="provider-card">
            <div><i class="fas fa-user-check" style="color:#3b82f6; margin-right:10px;"></i><b>${i.name}</b></div>
            <button class="main-btn" style="width:auto; padding:8px" onclick="window.bookProvider('${i.id}','${i.name}')">Book Now</button>
        </div>`).join('') : '<p>No experts found in this area.</p>';
};

// 3. Booking Logic (Sense: Phone number validation add kiya hai)
window.bookProvider = async (id, name) => {
    const { value: f } = await Swal.fire({
        title: 'Booking: ' + name,
        html: '<input id="n" class="swal2-input" placeholder="Your Name"><input id="p" class="swal2-input" placeholder="10 Digit Phone" maxlength="10">',
        preConfirm: () => {
            const name = document.getElementById('n').value;
            const phone = document.getElementById('p').value;
            if(!name || phone.length < 10) {
                Swal.showValidationMessage('Please enter valid Name and 10-digit Phone');
            }
            return [name, phone];
        }
    });

    if (f) {
        await supabase.from('bookings').insert([{ 
            user_name: f[0], user_phone: f[1], 
            city_id: document.getElementById('citySelect').value, 
            service_id: document.getElementById('serviceSelect').value, 
            provider_id: id, status: 'pending' 
        }]);
        Swal.fire('Success', 'Provider will contact you soon.', 'success');
        refreshBookings();
    }
};

// 4. Provider Dashboard Login
document.getElementById('providerLoginBtn').onclick = async () => {
    const ph = document.getElementById('providerPhone').value.trim();
    const { data: pList } = await supabase.from('providers').select('*').eq('phone', ph);
    
    if(pList && pList.length > 0) {
        const p = pList[0];
        document.getElementById('loginArea').classList.add('hidden');
        document.getElementById('providerDashboard').classList.remove('hidden');
        document.getElementById('welcomeMsg').innerText = "Dashboard: " + p.name;
        loadProvBookings(p.id);
    } else { 
        Swal.fire('Error', 'Mobile number not registered.', 'error'); 
    }
};

// 5. Provider Tasks (Sense: Status update ke baad list auto-refresh hogi)
async function loadProvBookings(pid) {
    const { data: b } = await supabase.from('bookings').select('*, services(name)')
        .eq('provider_id', pid).neq('status', 'completed');

    document.getElementById('providerBookings').innerHTML = b.length ? b.map(i => `
        <div class="provider-card" style="flex-direction:column; align-items:start;">
            <b>${i.services?.name} - ${i.user_name}</b>
            <div style="font-size:0.85rem; margin-top:5px;">Customer: ${i.user_phone}</div>
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

// 6. Recent Activity (Sense: Icons add kiye taaki user ko service pehchanne mein aasani ho)
async function refreshBookings() {
    const { data: b } = await supabase.from('bookings').select('*, services(name), providers(name)')
        .order('created_at', {ascending: false}).limit(5);
    
    if(b) {
        document.getElementById('myBookings').innerHTML = b.map(i => {
            const iconClass = icons[i.services?.name] || "fa-tools";
            return `
            <div class="provider-card">
                <div><i class="fas ${iconClass}" style="margin-right:12px; color:#3b82f6;"></i><b>${i.services?.name}</b><br><small>${i.providers?.name}</small></div>
                <span class="badge ${i.status}">${i.status}</span>
            </div>`;
        }).join('');
    }
}

init();
            
