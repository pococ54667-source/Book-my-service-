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
    const cityId = citySelect.value;
    const serviceId = serviceSelect.value;

    if(!cityId || !serviceId) {
        return Swal.fire({ icon: 'error', title: 'Oops...', text: 'Please select both city and service!', background: '#1e293b', color: '#fff' });
    }

    const { data: providers } = await supabase
        .from('providers')
        .select('*')
        .eq('city_id', cityId)
        .eq('service_id', serviceId);

    renderProviders(providers);
};
function renderProviders(providers) {
    resultsSection.classList.remove('hidden');
    providerList.innerHTML = providers.length ? '' : '<p style="color:#94a3b8">No experts found here yet.</p>';
    
    providers.forEach(p => {
        const div = document.createElement('div');
        div.className = 'provider-card';
        // Rating agar undefined hai toh 5.0 dikhane ke liye logic
        const displayRating = p.rating ? p.rating : '5.0'; 
        
        div.innerHTML = `
            <div>
                <div style="font-weight:700">${p.name}</div>
                <div style="font-size:0.8rem; color:#94a3b8">${p.experience || 'N/A'} Exp • ⭐ ${displayRating}</div>
            </div>
            <button class="main-btn" style="width:auto; padding:8px 16px" onclick="window.bookProvider('${p.id}', '${p.name}')">Book</button>
        `;
        providerList.appendChild(div);
    });
        }

