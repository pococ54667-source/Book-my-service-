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

// 1. Initialize App Data
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

// 2. Search Experts (With Professional Validation)
document.getElementById('findBtn').onclick = async () => {
    const city = document.getElementById('citySelect').value;
    const service = document.getElementById('serviceSelect').value;

    if(!city || !service) {
        return Swal.fire({
            title: 'Action Required',
            text: 'Please select both City and Service to continue.',
            icon: 'info',
            confirmButtonColor: '#3b82f6'
        });
    }

    const { data: p } = await supabase.from('providers').select('*').eq('city_id', city).eq('service_id', service);
    
    document.getElementById('resultsSection').classList.remove('hidden');
    document.getElementById('providerList').innerHTML = p.length ? p.map(i => `
        <div class="provider-card">
            <div><i class="fas fa-user-check"></i> <b>${i.name}</b></div>
            <button class="main-btn" style="width:auto; padding:8px" onclick="window.bookProvider('${i.id}','${i.name}')">Book Now</button>
        </div>`).join('') : '<p style="padding:10px; color:#94a3b8;">No experts found in this area.</p>';
};

// 3. Booking Logic (Professional English)
window.bookProvider = async (id, name) => {
    const { value: formValues } = await Swal.fire({
        title: `Booking: ${name}`,
        html:
            `<input id="swal-input1" class="swal2-input" placeholder="Full Name">` +
            `<input id="swal-input2" class="swal2-input" placeholder="Mobile Number" type="tel">`,
        focusConfirm: false,
        confirmButtonText: 'Confirm Booking',
        confirmButtonColor: '#3b82f6',
        preConfirm: () => {
            const customer_name = document.getElementById('swal-input1').value;
            const customer_phone = document.getElementById('swal-input2').value;
            if (!customer_name || !customer_phone) {
                Swal.showValidationMessage('Please provide your name and contact number');
            }
            return { customer_name, customer_phone };
        }
    });

    if (formValues) {
        const { error } = await supabase
            .from('bookings')
            .insert([{ 
                provider_id: id, 
                customer_name: formValues.customer_name, 
                customer_phone: formValues.customer_phone,
                status: 'pending' 
            }]);

        if (error) {
            Swal.fire('Error', 'Unable to process booking. Try again.', 'error');
        } else {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Your request has been placed. An expert will contact you soon.',
                confirmButtonText: 'Understood',
                confirmButtonColor: '#3b82f6'
            });
            refreshBookings();
        }
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
    } else { 
        Swal.fire('Access Denied', 'Invalid mobile number. Please check and try again.', 'error'); 
    }
};

// 5. Provider Portal Updates
async function loadProvBookings(pid) {
    const { data: b } = await supabase.from('bookings').select('*, services(name)').eq('provider_id', pid).neq('status', 'completed');
    document.getElementById('providerBookings').innerHTML = b.length ? b.map(i => `
        <div class="provider-card" style="flex-direction:column; align-items:start;">
            <b>${i.services?.name} - ${i.customer_name}</b>
            <div style="font-size:0.8rem; margin:5px 0;">Contact: ${i.customer_phone}</div>
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button onclick="window.updStatus('${i.id}','confirmed','${pid}')" class="main-btn" style="padding:5px; background:#1e40af;">Confirm</button>
                <button onclick="window.updStatus('${i.id}','completed','${pid}')" class="main-btn" style="padding:5px; background:#16a34a;">Mark Done</button>
            </div>
        </div>`).join('') : '<p style="color:#94a3b8;">No active service requests.</p>';
}

window.updStatus = async (bid, st, pid) => {
    await supabase.from('bookings').update({ status: st }).eq('id', bid);
    if(st === 'completed') Swal.fire('Completed', 'Service has been marked as finished.', 'success');
    loadProvBookings(pid);
    refreshBookings();
};

// 6. Recent Activity (Smart Sense: Limit to 3 items only)
async function refreshBookings() {
    const { data: b } = await supabase.from('bookings')
        .select('*, services(name), providers(name)')
        .order('created_at', {ascending: false})
        .limit(3); // SIRF 3 TAK LIMIT KIYA TAKI PAGE LAMBA NA HO

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
            
