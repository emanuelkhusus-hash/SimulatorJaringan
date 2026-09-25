// --- Global Add Device & Preset Insertion Functions ---
let lastAddTimestamp = 0;
let activeKeypadInput = null;

window.handleAddDevice = function(type, e) {
    const now = Date.now();
    if (now - lastAddTimestamp < 200) return;
    lastAddTimestamp = now;

    if (e && e.stopPropagation) e.stopPropagation();
    
    const ws = document.getElementById('workspace');
    if (!ws) return;
    
    const rect = ws.getBoundingClientRect();
    const w = ws.clientWidth || rect.width || 500;
    const h = ws.clientHeight || rect.height || 400;
    
    const x = Math.max(15, Math.min(w - 75, (w / 2) - 32 + (Math.random() * 80 - 40)));
    const y = Math.max(15, Math.min(h - 75, (h / 2) - 32 + (Math.random() * 80 - 40)));
    
    if (typeof createNode === 'function') {
        createNode(type, x, y);
    }
};

window.insertPreset = function(presetText) {
    if (activeKeypadInput) {
        activeKeypadInput.value = presetText;
        activeKeypadInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
};

function selectKeypadInput(input) {
    if (!input) return;
    document.querySelectorAll('.keypad-input').forEach(el => el.classList.remove('active-input'));
    activeKeypadInput = input;
    input.classList.add('active-input');
    // Ensure virtual keyboard on mobile never pops up
    input.setAttribute('inputmode', 'none');
    input.setAttribute('readonly', 'readonly');
}

// Global click delegation for keypad-inputs
document.addEventListener('click', (e) => {
    const input = e.target.closest('.keypad-input');
    if (input) {
        selectKeypadInput(input);
    }
});

// --- Background Canvas Particle Animation ---
const canvas = document.getElementById('network-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
    }
    draw() {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }
}
for (let i = 0; i < 40; i++) particles.push(new Particle());

let particleAnimId = null;
let isParticlesRunning = false;

function animateParticles() {
    if (!isParticlesRunning) return;
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => { p.update(); p.draw(); });
    particleAnimId = requestAnimationFrame(animateParticles);
}

function startParticles() {
    if (isParticlesRunning) return;
    isParticlesRunning = true;
    canvas.style.display = 'block';
    animateParticles();
}

function stopParticles() {
    isParticlesRunning = false;
    if (particleAnimId) {
        cancelAnimationFrame(particleAnimId);
        particleAnimId = null;
    }
    canvas.style.display = 'none';
}

// --- Performance Mode (Lite vs Standard) ---
let currentPerfMode = localStorage.getItem('simulatorPerfMode') || 'standard';

function setPerfMode(mode, silent = false) {
    currentPerfMode = mode;
    localStorage.setItem('simulatorPerfMode', mode);
    
    const perfBtn = document.getElementById('btn-toggle-perf');
    const perfText = document.getElementById('perf-text');
    const fsPerfBtn = document.getElementById('fs-perf-btn');
    const fsPerfText = document.getElementById('fs-perf-text');
    
    if (mode === 'lite') {
        document.body.classList.add('lite-mode');
        stopParticles();
        if (perfText) perfText.textContent = 'Mode: Lite (Ringan)';
        if (perfBtn) {
            perfBtn.classList.add('active-lite');
            const icon = perfBtn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-feather';
        }
        if (fsPerfText) fsPerfText.textContent = 'Lite';
        if (fsPerfBtn) {
            fsPerfBtn.classList.add('active-lite');
            const icon = fsPerfBtn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-feather';
        }
        if (!silent && typeof addLog === 'function') {
            addLog('info', 'Mode Lite aktif: Animasi latar & efek grafis berat dimatikan untuk performa optimal di HP.');
        }
    } else {
        document.body.classList.remove('lite-mode');
        startParticles();
        if (perfText) perfText.textContent = 'Mode: Standar';
        if (perfBtn) {
            perfBtn.classList.remove('active-lite');
            const icon = perfBtn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-bolt';
        }
        if (fsPerfText) fsPerfText.textContent = 'Standar';
        if (fsPerfBtn) {
            fsPerfBtn.classList.remove('active-lite');
            const icon = fsPerfBtn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-bolt';
        }
        if (!silent && typeof addLog === 'function') {
            addLog('info', 'Mode Standar aktif: Efek visual penuh dan partikel grafis aktif.');
        }
    }
}

// --- Area Kerja Full Screen & Dock Management ---
let isFullscreenMode = false;
let isDockMinimized = false;

function toggleFullscreenMode(forceState) {
    isFullscreenMode = forceState !== undefined ? forceState : !isFullscreenMode;
    const fsTopBar = document.getElementById('fs-top-bar');
    const fsText = document.getElementById('fs-text');
    const fsBtn = document.getElementById('btn-toggle-fullscreen');
    const expandDockBtn = document.getElementById('btn-expand-dock');
    
    if (isFullscreenMode) {
        document.body.classList.add('fullscreen-mode');
        if (fsTopBar) fsTopBar.style.display = 'flex';
        if (fsText) fsText.textContent = 'Keluar Layar Penuh';
        if (fsBtn) {
            const icon = fsBtn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-compress';
        }
        
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
        if (typeof addLog === 'function') addLog('info', 'Area Kerja Layar Penuh diaktifkan.');
    } else {
        document.body.classList.remove('fullscreen-mode');
        document.body.classList.remove('dock-minimized');
        isDockMinimized = false;
        if (fsTopBar) fsTopBar.style.display = 'none';
        if (fsText) fsText.textContent = 'Layar Penuh';
        if (fsBtn) {
            const icon = fsBtn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-expand';
        }
        if (expandDockBtn) expandDockBtn.style.display = 'none';
        
        const logSection = document.querySelector('.log-section');
        if (logSection) logSection.classList.remove('fs-log-open');

        if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
        if (typeof addLog === 'function') addLog('info', 'Keluar dari Area Kerja Layar Penuh.');
    }
    
    setTimeout(() => {
        if (typeof updateConnections === 'function') updateConnections();
    }, 150);
}

function setDockMinimized(minimized) {
    isDockMinimized = minimized;
    const expandDockBtn = document.getElementById('btn-expand-dock');
    if (minimized) {
        document.body.classList.add('dock-minimized');
        if (expandDockBtn) expandDockBtn.style.display = 'inline-flex';
    } else {
        document.body.classList.remove('dock-minimized');
        if (expandDockBtn) expandDockBtn.style.display = 'none';
    }
}

// Inisialisasi Mode Performa awal
setPerfMode(currentPerfMode, true);

// Event Listeners Kontrol Header & Dock
document.getElementById('btn-toggle-perf')?.addEventListener('click', () => {
    setPerfMode(currentPerfMode === 'lite' ? 'standard' : 'lite');
});
document.getElementById('fs-perf-btn')?.addEventListener('click', () => {
    setPerfMode(currentPerfMode === 'lite' ? 'standard' : 'lite');
});

document.getElementById('btn-toggle-fullscreen')?.addEventListener('click', () => {
    toggleFullscreenMode();
});
document.getElementById('fs-exit-btn')?.addEventListener('click', () => {
    toggleFullscreenMode(false);
});

document.getElementById('btn-minimize-dock')?.addEventListener('click', () => {
    setDockMinimized(true);
});
document.getElementById('btn-expand-dock')?.addEventListener('click', () => {
    setDockMinimized(false);
});

document.getElementById('fs-log-btn')?.addEventListener('click', () => {
    document.querySelector('.log-section')?.classList.toggle('fs-log-open');
});
document.getElementById('fs-close-log-btn')?.addEventListener('click', () => {
    document.querySelector('.log-section')?.classList.remove('fs-log-open');
});

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isFullscreenMode) {
        toggleFullscreenMode(false);
    }
});

// --- Network Simulator Core State ---
const workspace = document.getElementById('workspace');
const svgLayer = document.getElementById('connection-layer');
const logContent = document.getElementById('log-content');
const nodeContextMenu = document.getElementById('node-context-menu');
const ctxNodeName = document.getElementById('ctx-node-name');
const ctxCloseBtn = document.getElementById('ctx-close');

let activeContextMenuNode = null;
let relocatingNodeId = null;

// Modals
const configModal = document.getElementById('config-modal');
const pingModal = document.getElementById('ping-modal');
const interfaceModal = document.getElementById('interface-modal');

const closeModalBtn = document.getElementById('close-modal');
const closePingModalBtn = document.getElementById('close-ping-modal');
const closeInterfaceModalBtn = document.getElementById('close-interface-modal');

const saveConfigBtn = document.getElementById('save-config');
const btnStartPing = document.getElementById('btn-start-ping');
const saveInterfaceBtn = document.getElementById('save-interface-btn');

const ipInput = document.getElementById('config-ip');
const subnetInput = document.getElementById('config-subnet');
const gatewayInput = document.getElementById('config-gateway');
const pingTargetInput = document.getElementById('ping-target-input');
const routerInterfacesContainer = document.getElementById('router-interfaces-container');
const routerStaticRoutesContainer = document.getElementById('router-static-routes-container');
const staticRoutesList = document.getElementById('static-routes-list');
const addStaticRouteBtn = document.getElementById('add-static-route-btn');
const interfaceSelect = document.getElementById('interface-select');

let activeNodeId = null;
let activePingNodeId = null;
let pendingConnection = null;

let nodes = {}; // Store node data
let links = []; // Store links: { n1: id1, n2: id2, element }
let nodeCounter = 0;

let currentMode = 'select'; // 'select' or 'connect'
let connectingNode = null;
let draggedNode = null;
let offset = { x: 0, y: 0 };

let tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
tempLine.setAttribute('class', 'cable temp-cable');
tempLine.style.display = 'none';
svgLayer.appendChild(tempLine);

// --- Mode Toggle Handlers ---
const modeSelectBtn = document.getElementById('mode-select');
const modeConnectBtn = document.getElementById('mode-connect');

modeSelectBtn.addEventListener('click', () => {
    currentMode = 'select';
    modeSelectBtn.classList.add('active');
    modeConnectBtn.classList.remove('active');
    if (connectingNode && nodes[connectingNode]) {
        nodes[connectingNode].element.classList.remove('connecting');
    }
    connectingNode = null;
    tempLine.style.display = 'none';
    addLog('info', 'Mode Pilih / Geser diaktifkan.');
});

modeConnectBtn.addEventListener('click', () => {
    currentMode = 'connect';
    modeConnectBtn.classList.add('active');
    modeSelectBtn.classList.remove('active');
    hideContextMenu();
    if (relocatingNodeId && nodes[relocatingNodeId]) {
        nodes[relocatingNodeId].element.classList.remove('connecting');
        relocatingNodeId = null;
    }
    addLog('info', 'Mode Sambung Kabel diaktifkan. Klik perangkat sumber lalu perangkat tujuan.');
});

// Clear Workspace
document.getElementById('clear-workspace').addEventListener('click', () => {
    if (Object.keys(nodes).length === 0) return;
    if (confirm('Bersihkan semua perangkat dan koneksi pada area kerja?')) {
        nodes = {};
        links = [];
        workspace.querySelectorAll('.node').forEach(n => n.remove());
        workspace.querySelectorAll('.cable-port-badge').forEach(b => b.remove());
        svgLayer.innerHTML = '';
        svgLayer.appendChild(tempLine);
        addLog('info', 'Area kerja telah dibersihkan.');
        saveTopology();
    }
});

// Export TXT Report
document.getElementById('export-config').addEventListener('click', () => {
    let output = "=== NETWORK TOPOLOGY CONFIGURATION REPORT ===\n";
    output += `Generated: ${new Date().toLocaleString('id-ID')}\n\n`;
    
    output += "--- PERANGKAT & KONFIGURASI ---\n";
    let deviceCount = 0;
    for (const key in nodes) {
        deviceCount++;
        const node = nodes[key];
        output += `[${node.name}] (${node.type.toUpperCase()})\n`;
        if (node.type === 'pc') {
            output += `  IP Address   : ${node.ip || 'Belum diatur'}\n`;
            output += `  Subnet Mask  : ${node.subnet || 'Belum diatur'}\n`;
            output += `  Default GW   : ${node.gateway || 'Belum diatur'}\n`;
        } else if (node.type === 'router') {
            output += `  Interfaces   :\n`;
            let hasIntf = false;
            for (const eth in node.interfaces) {
                const intf = node.interfaces[eth];
                const targetName = nodes[intf.targetId] ? nodes[intf.targetId].name : 'Unknown';
                output += `    - ${eth}: ${intf.ipPrefix || 'No IP'} -> terhubung ke ${targetName}\n`;
                hasIntf = true;
            }
            if (!hasIntf) output += `    - Belum ada interface terhubung\n`;
            
            output += `  Static Routes:\n`;
            if (node.staticRoutes && node.staticRoutes.length > 0) {
                node.staticRoutes.forEach((r, idx) => {
                    output += `    ${idx+1}. Dest: ${r.dest} via ${r.nextHop}\n`;
                });
            } else {
                output += `    - Tidak ada rute statis\n`;
            }
        }
        output += "\n";
    }
    
    if (deviceCount === 0) {
        output += "Tidak ada perangkat pada topologi.\n\n";
    }
    
    output += "--- KONEKSI KABEL ---\n";
    let connCount = 0;
    links.forEach(link => {
        connCount++;
        const n1 = nodes[link.n1];
        const n2 = nodes[link.n2];
        output += `Link ${connCount}: ${n1 ? n1.name : link.n1} <====> ${n2 ? n2.name : link.n2}\n`;
    });
    
    if (connCount === 0) {
        output += "Tidak ada koneksi kabel aktif.\n";
    }
    
    output += "\n============================================\n";
    
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_topologi_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog('success', 'Laporan topologi TXT berhasil diunduh.');
});

// Export JSON Backup
document.getElementById('export-json').addEventListener('click', () => {
    saveTopology();
    const data = localStorage.getItem('networkTopology');
    if (!data) {
        addLog('error', 'Tidak ada data topologi untuk diexport.');
        return;
    }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topologi_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog('success', 'Backup JSON berhasil disimpan.');
});

// Import JSON Restore
const importFileBtn = document.getElementById('import-file');
document.getElementById('import-json-btn').addEventListener('click', () => {
    importFileBtn.click();
});

importFileBtn.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = JSON.parse(evt.target.result);
            if (data && data.nodes) {
                localStorage.setItem('networkTopology', evt.target.result);
                loadTopology();
                addLog('success', 'Topologi berhasil dipulihkan dari file JSON.');
            } else {
                addLog('error', 'Format file JSON tidak valid.');
            }
        } catch (err) {
            addLog('error', 'Gagal membaca file JSON.');
        }
        importFileBtn.value = '';
    };
    reader.readAsText(file);
});

// Logging System
function addLog(type, message) {
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<strong>[${time}]</strong> ${message}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

document.getElementById('clear-logs').addEventListener('click', () => {
    logContent.innerHTML = '';
});

// Desktop Drag-and-Drop setup
document.querySelectorAll('.tool-item').forEach(item => {
    item.setAttribute('draggable', 'true');
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('type', item.dataset.type);
    });
});

workspace.addEventListener('dragover', e => {
    e.preventDefault();
});

workspace.addEventListener('drop', e => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    if (type) {
        const rect = workspace.getBoundingClientRect();
        const x = Math.max(10, Math.min(rect.width - 74, e.clientX - rect.left - 32));
        const y = Math.max(10, Math.min(rect.height - 74, e.clientY - rect.top - 32));
        createNode(type, x, y);
    }
});

function createNode(type, x, y) {
    nodeCounter++;
    const id = `node-${nodeCounter}`;
    
    let iconClass = 'fa-solid fa-network-wired';
    let defaultName = `Switch${nodeCounter}`;
    if (type === 'pc') {
        iconClass = 'fa-solid fa-desktop';
        defaultName = `PC${nodeCounter}`;
    } else if (type === 'router') {
        iconClass = 'fa-solid fa-server';
        defaultName = `Router${nodeCounter}`;
    }
    const name = defaultName;
    
    const el = document.createElement('div');
    el.className = 'node newly-added';
    el.dataset.id = id;
    el.dataset.type = type;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    const label = document.createElement('div');
    label.className = 'node-label';
    label.innerText = name;
    label.id = `label-${id}`;

    if (type === 'router') {
        el.innerHTML = `
            <svg class="router-cisco-icon" viewBox="0 0 40 40" width="28" height="28">
                <path d="M 8 8 L 17 17 M 17 17 L 11 16 M 17 17 L 16 11" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <path d="M 23 23 L 32 32 M 32 32 L 26 31 M 32 32 L 31 26" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <path d="M 8 32 L 17 23 M 17 23 L 16 29 M 17 23 L 11 24" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <path d="M 23 17 L 32 8 M 32 8 L 31 14 M 32 8 L 26 9" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
            <span class="router-inner-name">${name}</span>
        `;
    } else {
        const icon = document.createElement('i');
        icon.className = iconClass;
        el.appendChild(icon);
    }
    el.appendChild(label);
    workspace.appendChild(el);

    setTimeout(() => {
        el.classList.remove('newly-added');
    }, 400);

    nodes[id] = {
        id,
        type,
        name,
        element: el,
        x,
        y,
        ip: '',
        subnet: '',
        gateway: '',
        connections: [],
        interfaces: {},
        staticRoutes: []
    };
    
    if (type === 'pc') {
        nodes[id].ip = `192.168.1.${nodeCounter}`;
        nodes[id].subnet = `255.255.255.0`; 
        nodes[id].gateway = '';
        updateLabel(id);
    } else if (type === 'router') {
        updateLabel(id);
    }

    setupNodeInteractions(el);
    saveTopology();
    addLog('success', `Perangkat ${name} berhasil ditambahkan.`);
}

function updateLabel(id) {
    const node = nodes[id];
    if (!node) return;
    const label = document.getElementById(`label-${id}`);
    if (label) {
        if (node.type === 'pc') {
            label.innerText = `${node.name} (${node.ip || 'No IP'})`;
        } else {
            label.innerText = node.name;
        }
    }

    // Tampilkan informasi IP interface di atas icon Router & update nama di dalam icon
    if (node.type === 'router') {
        const innerName = node.element.querySelector('.router-inner-name');
        if (innerName) {
            innerName.innerText = node.name;
        }

        let ipBadge = document.getElementById(`router-ips-${id}`);
        if (!ipBadge) {
            ipBadge = document.createElement('div');
            ipBadge.className = 'router-ip-badge';
            ipBadge.id = `router-ips-${id}`;
            node.element.appendChild(ipBadge);
        }

        const interfaces = Object.keys(node.interfaces || {}).sort();
        const configuredList = [];
        interfaces.forEach(eth => {
            const intf = node.interfaces[eth];
            if (intf && intf.ipPrefix) {
                configuredList.push({ eth, ipPrefix: intf.ipPrefix });
            }
        });

        if (configuredList.length === 0) {
            if (interfaces.length > 0) {
                ipBadge.innerHTML = `<span class="router-ip-item no-ip">Belum ada IP</span>`;
                ipBadge.style.display = 'flex';
            } else {
                ipBadge.style.display = 'none';
            }
        } else {
            ipBadge.innerHTML = configuredList.map(item => 
                `<span class="router-ip-item"><span class="rip-eth">${item.eth}:</span> <span class="rip-val">${item.ipPrefix}</span></span>`
            ).join('');
            ipBadge.style.display = 'flex';
        }
    }
}

// --- Node Interactions (Drag, Tap, Context Menu) ---
function setupNodeInteractions(el) {
    let startPoint = { x: 0, y: 0 };
    let isTouchActive = false;

    function handleStart(e) {
        const isTouch = e.type.startsWith('touch');
        isTouchActive = isTouch;
        const point = isTouch ? e.touches[0] : e;
        startPoint = { x: point.clientX, y: point.clientY };

        if (currentMode === 'select') {
            draggedNode = el;
            const rect = el.getBoundingClientRect();
            offset.x = point.clientX - rect.left;
            offset.y = point.clientY - rect.top;
            el.style.cursor = 'grabbing';
            e.stopPropagation();
        } else if (currentMode === 'connect') {
            if (connectingNode && connectingNode !== el.dataset.id) {
                createConnection(connectingNode, el.dataset.id);
                if (nodes[connectingNode]) nodes[connectingNode].element.classList.remove('connecting');
                connectingNode = null;
                tempLine.style.display = 'none';
                e.stopPropagation();
                return;
            }

            if (!connectingNode) {
                connectingNode = el.dataset.id;
                el.classList.add('connecting');
                const rect = workspace.getBoundingClientRect();
                tempLine.setAttribute('x1', nodes[connectingNode].x + 32);
                tempLine.setAttribute('y1', nodes[connectingNode].y + 32);
                tempLine.setAttribute('x2', point.clientX - rect.left);
                tempLine.setAttribute('y2', point.clientY - rect.top);
                tempLine.style.display = 'block';
            }
            e.stopPropagation();
        }
    }

    el.addEventListener('mousedown', handleStart);
    el.addEventListener('touchstart', handleStart, { passive: false });

    function handleEnd(e) {
        if (currentMode === 'connect' && connectingNode) {
            const targetId = el.dataset.id;
            if (connectingNode !== targetId) {
                createConnection(connectingNode, targetId);
                if (nodes[connectingNode]) nodes[connectingNode].element.classList.remove('connecting');
                connectingNode = null;
                tempLine.style.display = 'none';
                e.stopPropagation();
            }
            return;
        }

        if (currentMode === 'select') {
            const point = e.changedTouches ? e.changedTouches[0] : e;
            const dist = Math.hypot(point.clientX - startPoint.x, point.clientY - startPoint.y);
            if (dist < 8) {
                e.stopPropagation();
                if (relocatingNodeId) return;
                showContextMenu(el.dataset.id, point.clientX, point.clientY);
            }
        }
    }

    el.addEventListener('touchend', handleEnd);

    el.addEventListener('click', (e) => {
        if (!isTouchActive && currentMode === 'select' && !relocatingNodeId) {
            e.stopPropagation();
            showContextMenu(el.dataset.id, e.clientX, e.clientY);
        }
    });

    el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (currentMode === 'select') {
            openConfigModal(el.dataset.id);
        }
    });

    el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showContextMenu(el.dataset.id, e.clientX, e.clientY);
    });
}

function showContextMenu(id, clientX, clientY) {
    const node = nodes[id];
    if (!node) return;
    
    activeContextMenuNode = id;
    if (ctxNodeName) {
        let iconHtml = '<i class="fa-solid fa-network-wired"></i>';
        if (node.type === 'pc') iconHtml = '<i class="fa-solid fa-desktop"></i>';
        if (node.type === 'router') iconHtml = '<i class="fa-solid fa-server"></i>';
        ctxNodeName.innerHTML = `${iconHtml} ${node.name}`;
    }

    const pingBtn = document.getElementById('ctx-ping');
    if (pingBtn) {
        if (node.type === 'pc' || node.type === 'router') {
            pingBtn.style.display = 'flex';
        } else {
            pingBtn.style.display = 'none';
        }
    }

    const menuWidth = 200;
    const menuHeight = 200;
    let posX = clientX + 8;
    let posY = clientY + 8;

    if (posX + menuWidth > window.innerWidth) {
        posX = window.innerWidth - menuWidth - 12;
    }
    if (posY + menuHeight > window.innerHeight) {
        posY = window.innerHeight - menuHeight - 12;
    }
    if (posX < 10) posX = 10;
    if (posY < 10) posY = 10;

    nodeContextMenu.style.left = `${posX}px`;
    nodeContextMenu.style.top = `${posY}px`;
    nodeContextMenu.style.display = 'flex';
}

function hideContextMenu() {
    if (nodeContextMenu) {
        nodeContextMenu.style.display = 'none';
        activeContextMenuNode = null;
    }
}

if (ctxCloseBtn) {
    ctxCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideContextMenu();
    });
}

// Global Move Handler (Mouse & Touch)
function handleGlobalMove(e) {
    if (!draggedNode && !connectingNode) return;
    
    const isTouch = e.type.startsWith('touch');
    const point = isTouch ? e.touches[0] : e;
    
    if (isTouch && (draggedNode || connectingNode)) {
        e.preventDefault();
    }

    if (draggedNode && currentMode === 'select') {
        const rect = workspace.getBoundingClientRect();
        let x = point.clientX - rect.left - offset.x;
        let y = point.clientY - rect.top - offset.y;
        
        x = Math.max(0, Math.min(x, rect.width - 64));
        y = Math.max(26, Math.min(y, rect.height - 64));

        draggedNode.style.left = `${x}px`;
        draggedNode.style.top = `${y}px`;
        
        const id = draggedNode.dataset.id;
        if (nodes[id]) {
            nodes[id].x = x;
            nodes[id].y = y;
        }
        
        updateConnections();
    } else if (currentMode === 'connect' && connectingNode) {
        const rect = workspace.getBoundingClientRect();
        let mouseX = point.clientX - rect.left;
        let mouseY = point.clientY - rect.top;
        tempLine.setAttribute('x2', mouseX);
        tempLine.setAttribute('y2', mouseY);
    }
}

window.addEventListener('mousemove', handleGlobalMove);
window.addEventListener('touchmove', handleGlobalMove, { passive: false });

function handleGlobalEnd() {
    if (draggedNode) {
        draggedNode.style.cursor = 'grab';
        draggedNode = null;
        saveTopology();
    }
}

window.addEventListener('mouseup', handleGlobalEnd);
window.addEventListener('touchend', handleGlobalEnd);

// Workspace Click / Relocate Handler
workspace.addEventListener('click', (e) => {
    hideContextMenu();

    if (relocatingNodeId && nodes[relocatingNodeId]) {
        const rect = workspace.getBoundingClientRect();
        let x = e.clientX - rect.left - 32;
        let y = e.clientY - rect.top - 32;
        
        x = Math.max(0, Math.min(x, rect.width - 64));
        y = Math.max(26, Math.min(y, rect.height - 64));
        
        const node = nodes[relocatingNodeId];
        node.x = x;
        node.y = y;
        node.element.style.left = `${x}px`;
        node.element.style.top = `${y}px`;
        node.element.classList.remove('connecting');
        
        updateConnections();
        saveTopology();
        addLog('success', `Posisi perangkat ${node.name} berhasil dipindahkan.`);
        
        relocatingNodeId = null;
        return;
    }

    if (currentMode === 'connect' && connectingNode && e.target === workspace) {
        if (nodes[connectingNode]) nodes[connectingNode].element.classList.remove('connecting');
        connectingNode = null;
        tempLine.style.display = 'none';
        addLog('info', 'Penyambungan kabel dibatalkan.');
    }
});

// Context Menu Action Listeners
document.getElementById('ctx-ping').addEventListener('click', (e) => {
    e.stopPropagation();
    const id = activeContextMenuNode;
    hideContextMenu();
    if (id) openPingModal(id);
});

document.getElementById('ctx-config').addEventListener('click', (e) => {
    e.stopPropagation();
    const id = activeContextMenuNode;
    hideContextMenu();
    if (id) openConfigModal(id);
});

document.getElementById('ctx-move').addEventListener('click', (e) => {
    e.stopPropagation();
    const id = activeContextMenuNode;
    hideContextMenu();
    if (id && nodes[id]) {
        relocatingNodeId = id;
        nodes[relocatingNodeId].element.classList.add('connecting');
        addLog('info', `Mode Pindah: Tap pada area kerja untuk menempatkan ${nodes[relocatingNodeId].name}.`);
    }
});

document.getElementById('ctx-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    const id = activeContextMenuNode;
    hideContextMenu();
    if (id && nodes[id]) {
        if (nodes[id].connections.length > 0) {
            alert(`Perangkat "${nodes[id].name}" masih terhubung dengan ${nodes[id].connections.length} kabel. Silakan putuskan sambungan kabelnya terlebih dahulu!`);
            return;
        }
        if (confirm(`Hapus perangkat "${nodes[id].name}"?`)) {
            deleteNode(id);
        }
    }
});

function deleteNode(id) {
    const node = nodes[id];
    if (!node) return;
    
    if (workspace.contains(node.element)) {
        workspace.removeChild(node.element);
    }
    
    if (activeNodeId === id) closeModal();
    if (activePingNodeId === id) closePingModal();
    
    delete nodes[id];
    saveTopology();
    addLog('info', `Perangkat ${node.name} telah dihapus.`);
}

// --- Connections (Cables) ---
function promptForRouterInterface(routerId, otherId, isSecondPromptPending = false) {
    pendingConnection = { routerId, otherId, isSecondPromptPending };
    interfaceSelect.innerHTML = '';
    
    const routerTitle = document.getElementById('interface-modal-title');
    if (routerTitle) routerTitle.innerText = `Port Interface ${nodes[routerId].name}`;
    
    const router = nodes[routerId];
    const usedInterfaces = Object.keys(router.interfaces);
    
    let hasAvailable = false;
    for (let i = 1; i <= 8; i++) {
        const ethName = `eth${i}`;
        if (!usedInterfaces.includes(ethName)) {
            const opt = document.createElement('option');
            opt.value = ethName;
            opt.innerText = `${ethName} (Port ${i})`;
            interfaceSelect.appendChild(opt);
            hasAvailable = true;
        }
    }
    
    if (!hasAvailable) {
        addLog('error', `Router ${router.name} sudah tidak memiliki port ethernet yang tersedia.`);
        pendingConnection = null;
        return;
    }
    
    interfaceModal.classList.add('active');
}

closeInterfaceModalBtn.addEventListener('click', () => {
    interfaceModal.classList.remove('active');
    pendingConnection = null;
    addLog('info', 'Penyambungan port dibatalkan.');
});

saveInterfaceBtn.addEventListener('click', () => {
    if (pendingConnection) {
        const { routerId, otherId, isSecondPromptPending } = pendingConnection;
        const selectedEth = interfaceSelect.value;
        
        nodes[routerId].interfaces[selectedEth] = { targetId: otherId, ipPrefix: '' };
        updateLabel(routerId);
        
        interfaceModal.classList.remove('active');
        pendingConnection = null;
        
        if (isSecondPromptPending) {
            setTimeout(() => {
                promptForRouterInterface(otherId, routerId, false);
            }, 300);
        } else {
            createConnection(routerId, otherId, true);
        }
    }
});

function createConnection(id1, id2, skipInterfacePrompt = false) {
    if (id1 === id2) return;
    
    if (nodes[id1].connections.includes(id2)) {
        addLog('warning', `Perangkat ${nodes[id1].name} dan ${nodes[id2].name} sudah tersambung.`);
        return;
    }
    
    const isRouter1 = nodes[id1].type === 'router';
    const isRouter2 = nodes[id2].type === 'router';
    
    if (!skipInterfacePrompt && (isRouter1 || isRouter2)) {
        if (isRouter1 && isRouter2) {
            promptForRouterInterface(id1, id2, true);
        } else {
            const routerId = isRouter1 ? id1 : id2;
            const otherId = isRouter1 ? id2 : id1;
            promptForRouterInterface(routerId, otherId, false);
        }
        return;
    }

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'cable');
    
    const handleDeleteCable = (e) => {
        e.stopPropagation();
        if (e.type === 'touchstart') e.preventDefault();
        if (currentMode === 'select') {
            const name1 = nodes[id1] ? nodes[id1].name : id1;
            const name2 = nodes[id2] ? nodes[id2].name : id2;
            if (confirm(`Putuskan sambungan kabel antara ${name1} dan ${name2}?`)) {
                deleteConnection(id1, id2);
            }
        }
    };
    line.addEventListener('click', handleDeleteCable);
    line.addEventListener('touchstart', handleDeleteCable, { passive: false });

    svgLayer.appendChild(line);

    links.push({ n1: id1, n2: id2, element: line });
    nodes[id1].connections.push(id2);
    nodes[id2].connections.push(id1);

    updateConnections();
    saveTopology();
    addLog('success', `Kabel tersambung antara ${nodes[id1].name} dan ${nodes[id2].name}.`);
}

function updateConnections() {
    links.forEach(link => {
        const n1 = nodes[link.n1];
        const n2 = nodes[link.n2];
        if (n1 && n2) {
            const x1 = n1.x + 32;
            const y1 = n1.y + 32;
            const x2 = n2.x + 32;
            const y2 = n2.y + 32;

            link.element.setAttribute('x1', x1);
            link.element.setAttribute('y1', y1);
            link.element.setAttribute('x2', x2);
            link.element.setAttribute('y2', y2);

            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.hypot(dx, dy);

            // Tampilkan badge port interface & IP jika n1 adalah router
            updatePortBadge(link, 1, n1, n2, x1, y1, dx, dy, dist);

            // Tampilkan badge port interface & IP jika n2 adalah router
            updatePortBadge(link, 2, n2, n1, x2, y2, -dx, -dy, dist);
        }
    });
}

function updatePortBadge(link, badgeIdx, routerNode, otherNode, rx, ry, dx, dy, dist) {
    const badgeKey = `badge${badgeIdx}`;
    
    if (routerNode.type !== 'router') {
        if (link[badgeKey]) {
            if (workspace.contains(link[badgeKey])) {
                workspace.removeChild(link[badgeKey]);
            }
            link[badgeKey] = null;
        }
        return;
    }

    // Cari interface mana pada router yang terhubung ke otherNode.id
    let matchedEth = null;
    let ipPrefix = '';
    for (const eth in routerNode.interfaces) {
        if (routerNode.interfaces[eth].targetId === otherNode.id) {
            matchedEth = eth;
            ipPrefix = routerNode.interfaces[eth].ipPrefix || '';
            break;
        }
    }

    if (!matchedEth) {
        if (link[badgeKey]) {
            if (workspace.contains(link[badgeKey])) {
                workspace.removeChild(link[badgeKey]);
            }
            link[badgeKey] = null;
        }
        return;
    }

    // Hitung posisi pangkal kabel dekat router (offset ~50px dari tengah router)
    let bx = rx;
    let by = ry;
    if (dist > 0) {
        const offset = Math.min(50, dist * 0.38);
        bx = rx + (dx / dist) * offset;
        by = ry + (dy / dist) * offset;
    }

    if (!link[badgeKey]) {
        const badge = document.createElement('div');
        badge.className = 'cable-port-badge';
        workspace.appendChild(badge);
        link[badgeKey] = badge;
    }

    const badge = link[badgeKey];
    badge.style.left = `${bx}px`;
    badge.style.top = `${by}px`;

    badge.className = 'cable-port-badge';
    badge.innerHTML = `<span class="badge-eth">${matchedEth}</span>`;
    badge.title = `${routerNode.name} ${matchedEth}${ipPrefix ? ': ' + ipPrefix : ' (Belum ada IP)'}`;
}

function deleteConnection(id1, id2) {
    const linkIndex = links.findIndex(l => (l.n1 === id1 && l.n2 === id2) || (l.n1 === id2 && l.n2 === id1));
    if (linkIndex === -1) return;
    
    const link = links[linkIndex];
    if (svgLayer.contains(link.element)) {
        svgLayer.removeChild(link.element);
    }
    if (link.badge1 && workspace.contains(link.badge1)) {
        workspace.removeChild(link.badge1);
    }
    if (link.badge2 && workspace.contains(link.badge2)) {
        workspace.removeChild(link.badge2);
    }
    links.splice(linkIndex, 1);
    
    if (nodes[id1]) {
        nodes[id1].connections = nodes[id1].connections.filter(id => id !== id2);
        if (nodes[id1].type === 'router') {
            for (const eth in nodes[id1].interfaces) {
                if (nodes[id1].interfaces[eth].targetId === id2) {
                    delete nodes[id1].interfaces[eth];
                    break;
                }
            }
            updateLabel(id1);
        }
    }
    
    if (nodes[id2]) {
        nodes[id2].connections = nodes[id2].connections.filter(id => id !== id1);
        if (nodes[id2].type === 'router') {
            for (const eth in nodes[id2].interfaces) {
                if (nodes[id2].interfaces[eth].targetId === id1) {
                    delete nodes[id2].interfaces[eth];
                    break;
                }
            }
            updateLabel(id2);
        }
    }
    
    saveTopology();
    addLog('info', `Kabel antara ${nodes[id1] ? nodes[id1].name : id1} dan ${nodes[id2] ? nodes[id2].name : id2} telah dilepas.`);
}

// --- On-Screen Virtual IP Keypad Setup ---
function setupKeypad(keypadId) {
    const kp = document.getElementById(keypadId);
    if (!kp) return;
    
    kp.addEventListener('click', (e) => {
        const btn = e.target.closest('.kp-btn');
        if (!btn || !activeKeypadInput) return;
        
        e.preventDefault();
        e.stopPropagation();
        const val = btn.textContent.trim();
        const input = activeKeypadInput;
        
        if (btn.classList.contains('kp-del')) {
            input.value = input.value.slice(0, -1);
        } else if (btn.classList.contains('kp-clear')) {
            input.value = '';
        } else {
            input.value += val;
        }
        
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
}
setupKeypad('config-keypad');
setupKeypad('ping-keypad');

// --- Configuration Modal Logic ---
function renderStaticRoutes(routes) {
    staticRoutesList.innerHTML = '';
    routes.forEach((route, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '6px';
        row.innerHTML = `
            <input type="text" class="route-dest keypad-input" placeholder="Dest: 192.168.2.0/24" value="${route.dest || ''}" style="flex:1;" inputmode="none" readonly>
            <input type="text" class="route-nexthop keypad-input" placeholder="Next-Hop: 10.0.0.2" value="${route.nextHop || ''}" style="flex:1;" inputmode="none" readonly>
            <button class="remove-route-btn" data-idx="${idx}" type="button" style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #ef4444; border-radius: 6px; cursor: pointer; padding: 0 10px;"><i class="fa-solid fa-trash"></i></button>
        `;
        staticRoutesList.appendChild(row);
    });
    
    document.querySelectorAll('.remove-route-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.idx);
            const currentRoutes = getStaticRoutesFromUI();
            currentRoutes.splice(idx, 1);
            renderStaticRoutes(currentRoutes);
        });
    });
}

function getStaticRoutesFromUI() {
    const routes = [];
    staticRoutesList.querySelectorAll('div').forEach(row => {
        const dest = row.querySelector('.route-dest').value.trim();
        const nextHop = row.querySelector('.route-nexthop').value.trim();
        routes.push({ dest, nextHop });
    });
    return routes;
}

addStaticRouteBtn.addEventListener('click', () => {
    const currentRoutes = getStaticRoutesFromUI();
    currentRoutes.push({ dest: '', nextHop: '' });
    renderStaticRoutes(currentRoutes);
    const lastInput = staticRoutesList.querySelector('div:last-child .route-dest');
    if (lastInput) selectKeypadInput(lastInput);
});

function openConfigModal(id) {
    activeNodeId = id;
    const node = nodes[id];
    if (!node) return;
    
    document.getElementById('modal-title').innerText = `Konfigurasi ${node.name}`;
    document.getElementById('delete-node-btn').style.display = 'inline-flex';
    
    if (node.type === 'switch') {
        document.getElementById('ip-config-group').style.display = 'none';
        document.getElementById('subnet-config-group').style.display = 'none';
        document.getElementById('gateway-config-group').style.display = 'none';
        routerInterfacesContainer.style.display = 'none';
        routerStaticRoutesContainer.style.display = 'none';
        document.querySelector('.quick-chips-section').style.display = 'none';
        document.getElementById('config-keypad').style.display = 'none';
    } else if (node.type === 'router') {
        document.getElementById('ip-config-group').style.display = 'none';
        document.getElementById('subnet-config-group').style.display = 'none';
        document.getElementById('gateway-config-group').style.display = 'none';
        document.querySelector('.quick-chips-section').style.display = 'block';
        document.getElementById('config-keypad').style.display = 'grid';
        
        routerInterfacesContainer.style.display = 'block';
        routerStaticRoutesContainer.style.display = 'block';
        routerInterfacesContainer.innerHTML = '';
        
        const interfaces = Object.keys(node.interfaces).sort();
        if (interfaces.length === 0) {
            routerInterfacesContainer.innerHTML = '<p style="color:var(--text-secondary); margin-bottom: 10px; font-size:0.9rem;">Belum ada kabel perangkat yang tersambung ke port Router ini.</p>';
        } else {
            interfaces.forEach(eth => {
                const targetName = nodes[node.interfaces[eth].targetId] ? nodes[node.interfaces[eth].targetId].name : 'Unknown';
                const grp = document.createElement('div');
                grp.className = 'config-group';
                grp.innerHTML = `
                    <label><i class="fa-solid fa-network-wired"></i> Port ${eth} (terhubung ke ${targetName})</label>
                    <input type="text" id="config-router-${eth}" class="keypad-input" value="${node.interfaces[eth].ipPrefix || ''}" placeholder="e.g. 192.168.1.1/24" inputmode="none" readonly>
                `;
                routerInterfacesContainer.appendChild(grp);
            });
        }
        
        if (!node.staticRoutes) node.staticRoutes = [];
        renderStaticRoutes(node.staticRoutes);
        
        const firstInput = routerInterfacesContainer.querySelector('input') || staticRoutesList.querySelector('input');
        if (firstInput) selectKeypadInput(firstInput);
        
    } else {
        document.getElementById('ip-config-group').style.display = 'flex';
        document.getElementById('subnet-config-group').style.display = 'flex';
        document.getElementById('gateway-config-group').style.display = 'flex';
        routerInterfacesContainer.style.display = 'none';
        routerStaticRoutesContainer.style.display = 'none';
        document.querySelector('.quick-chips-section').style.display = 'block';
        document.getElementById('config-keypad').style.display = 'grid';
        
        ipInput.value = node.ip || '';
        subnetInput.value = node.subnet || '255.255.255.0';
        gatewayInput.value = node.gateway || '';
        selectKeypadInput(ipInput);
    }
    
    configModal.classList.add('active');
}

function closeModal() {
    configModal.classList.remove('active');
    activeNodeId = null;
    activeKeypadInput = null;
}
closeModalBtn.addEventListener('click', closeModal);

document.getElementById('delete-node-btn').addEventListener('click', () => {
    if (activeNodeId) {
        const id = activeNodeId;
        if (nodes[id].connections.length > 0) {
            alert(`Perangkat "${nodes[id].name}" masih memiliki sambungan kabel aktif. Putuskan kabelnya terlebih dahulu sebelum menghapus!`);
            return;
        }
        if (confirm(`Hapus perangkat "${nodes[id].name}"?`)) {
            deleteNode(id);
            closeModal();
        }
    }
});

// IP Validation Helpers
function ipToInt(ipStr) {
    if (!ipStr) return 0;
    return ipStr.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
}

function validateIpAndSubnet(ip, subnet) {
    const ipInt = ipToInt(ip);
    const maskInt = ipToInt(subnet);
    
    const inverseMask = (~maskInt) >>> 0;
    const networkAddress = (ipInt & maskInt) >>> 0;
    const broadcastAddress = (networkAddress | inverseMask) >>> 0;
    
    if (ipInt === networkAddress) {
        return { valid: false, reason: "IP address tidak boleh menggunakan Alamat Network (Network Address)." };
    }
    if (ipInt === broadcastAddress) {
        return { valid: false, reason: "IP address tidak boleh menggunakan Alamat Broadcast (Broadcast Address)." };
    }
    return { valid: true };
}

function parsePrefix(prefixStr) {
    if (!prefixStr) return null;
    const parts = prefixStr.split('/');
    if (parts.length !== 2) return null;
    const ipStr = parts[0];
    const cidr = parseInt(parts[1], 10);
    
    if (isNaN(cidr) || cidr < 0 || cidr > 32) return null;
    if (!ipStr.match(/^(\d{1,3}\.){3}\d{1,3}$/)) return null;

    let maskInt = 0;
    if (cidr > 0) {
        maskInt = (0xFFFFFFFF << (32 - cidr)) >>> 0;
    }
    return { ipStr, ipInt: ipToInt(ipStr), maskInt, cidr };
}

saveConfigBtn.addEventListener('click', () => {
    if (activeNodeId) {
        const node = nodes[activeNodeId];
        if (node.type === 'pc') {
            const newIp = ipInput.value.trim();
            const newSubnet = subnetInput.value.trim();
            const newGateway = gatewayInput.value.trim();
            
            if (newIp && newSubnet) {
                const validation = validateIpAndSubnet(newIp, newSubnet);
                if (!validation.valid) {
                    alert(`Error: ${validation.reason}`);
                    addLog('error', `Konfigurasi Error untuk ${node.name}: ${validation.reason}`);
                    return;
                }
            }

            node.ip = newIp;
            node.subnet = newSubnet;
            node.gateway = newGateway;
            updateLabel(activeNodeId);
            addLog('success', `Konfigurasi tersimpan untuk ${node.name}. IP: ${node.ip}, Gateway: ${node.gateway}`);
        } else if (node.type === 'router') {
            const interfaces = Object.keys(node.interfaces);
            let hasError = false;
            interfaces.forEach(eth => {
                const input = document.getElementById(`config-router-${eth}`);
                if (input) {
                    const val = input.value.trim();
                    if (val) {
                        const parsed = parsePrefix(val);
                        if (!parsed) {
                            alert(`Error pada ${eth}: Format Prefix tidak valid. Gunakan format IP/Prefix, contoh: 192.168.1.1/24`);
                            hasError = true;
                        } else {
                            node.interfaces[eth].ipPrefix = val;
                        }
                    } else {
                        node.interfaces[eth].ipPrefix = '';
                    }
                }
            });
            if (hasError) return;
            
            const uiRoutes = getStaticRoutesFromUI();
            const validRoutes = [];
            for (let i = 0; i < uiRoutes.length; i++) {
                const r = uiRoutes[i];
                if (!r.dest && !r.nextHop) continue;
                if (!parsePrefix(r.dest)) {
                    alert(`Error pada Static Route ke-${i+1}: Format Destination Network tidak valid. Gunakan IP/Prefix, contoh: 192.168.2.0/24`);
                    hasError = true;
                    break;
                }
                if (!r.nextHop.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
                    alert(`Error pada Static Route ke-${i+1}: Format Next-Hop IP tidak valid.`);
                    hasError = true;
                    break;
                }
                validRoutes.push(r);
            }
            if (hasError) return;
            node.staticRoutes = validRoutes;
            updateLabel(activeNodeId);

            addLog('success', `Konfigurasi Router ${node.name} berhasil diperbarui.`);
        }
        updateConnections();
        saveTopology();
    }
    closeModal();
});

// Helper to resolve effective source IP for PC or Router
function getNodeSourceIp(node, targetIpStr) {
    if (!node) return '';
    if (node.type === 'pc') {
        return node.ip || '';
    }
    if (node.type === 'router') {
        const targetIpInt = targetIpStr ? ipToInt(targetIpStr) : 0;
        // 1. If target matches an interface subnet directly, use that interface's IP
        if (targetIpInt) {
            for (const eth in node.interfaces) {
                const parsed = parsePrefix(node.interfaces[eth].ipPrefix);
                if (parsed && ((targetIpInt & parsed.maskInt) === (parsed.ipInt & parsed.maskInt))) {
                    return parsed.ipStr;
                }
            }
            // 2. If target matches a static route, find interface that connects to next-hop
            for (const r of node.staticRoutes || []) {
                const parsedDest = parsePrefix(r.dest);
                if (parsedDest && ((targetIpInt & parsedDest.maskInt) === (parsedDest.ipInt & parsedDest.maskInt))) {
                    const nextHopInt = ipToInt(r.nextHop);
                    for (const eth in node.interfaces) {
                        const parsedIntf = parsePrefix(node.interfaces[eth].ipPrefix);
                        if (parsedIntf && ((nextHopInt & parsedIntf.maskInt) === (parsedIntf.ipInt & parsedIntf.maskInt))) {
                            return parsedIntf.ipStr;
                        }
                    }
                }
            }
        }
        // 3. Fallback: return the first configured interface IP
        for (const eth in node.interfaces) {
            const parsed = parsePrefix(node.interfaces[eth].ipPrefix);
            if (parsed && parsed.ipStr) {
                return parsed.ipStr;
            }
        }
    }
    return '';
}

// --- Dedicated Ping Modal Logic ---
function openPingModal(id) {
    activePingNodeId = id;
    const node = nodes[id];
    if (!node) return;

    document.getElementById('ping-modal-title').innerText = `Tes Ping dari ${node.name}`;
    document.getElementById('ping-source-name').innerText = node.name;
    
    if (node.type === 'pc') {
        document.getElementById('ping-source-ip').innerText = node.ip || 'No IP';
    } else if (node.type === 'router') {
        const configuredIps = Object.entries(node.interfaces || {})
            .map(([eth, intf]) => {
                const parsed = parsePrefix(intf.ipPrefix);
                return parsed ? `${eth}: ${parsed.ipStr}` : null;
            })
            .filter(Boolean);
        document.getElementById('ping-source-ip').innerText = configuredIps.length > 0 ? configuredIps.join(' | ') : 'Belum ada IP interface';
    } else {
        document.getElementById('ping-source-ip').innerText = '-';
    }
    
    pingTargetInput.value = '';
    selectKeypadInput(pingTargetInput);

    // Generate quick target chips for other reachable/configured nodes
    const chipsContainer = document.getElementById('quick-target-chips');
    chipsContainer.innerHTML = '';
    let targetCount = 0;

    for (const key in nodes) {
        if (key !== id) {
            const target = nodes[key];
            if (target.type === 'pc' && target.ip) {
                targetCount++;
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'chip-btn';
                chip.innerHTML = `<i class="fa-solid fa-desktop"></i> ${target.name} (${target.ip})`;
                chip.addEventListener('click', () => {
                    pingTargetInput.value = target.ip;
                });
                chipsContainer.appendChild(chip);
            } else if (target.type === 'router') {
                for (const eth in target.interfaces) {
                    const parsed = parsePrefix(target.interfaces[eth].ipPrefix);
                    if (parsed) {
                        targetCount++;
                        const chip = document.createElement('button');
                        chip.type = 'button';
                        chip.className = 'chip-btn';
                        chip.innerHTML = `<i class="fa-solid fa-server"></i> ${target.name} ${eth} (${parsed.ipStr})`;
                        chip.addEventListener('click', () => {
                            pingTargetInput.value = parsed.ipStr;
                        });
                        chipsContainer.appendChild(chip);
                    }
                }
            }
        }
    }

    if (targetCount === 0) {
        chipsContainer.innerHTML = '<span style="color:var(--text-muted); font-size:0.8rem;">Belum ada perangkat tujuan yang memiliki IP.</span>';
    }

    pingModal.classList.add('active');
}

function closePingModal() {
    pingModal.classList.remove('active');
    activePingNodeId = null;
    activeKeypadInput = null;
}
closePingModalBtn.addEventListener('click', closePingModal);

// Start Ping execution
btnStartPing.addEventListener('click', () => {
    const targetIp = pingTargetInput.value.trim();
    if (!targetIp) {
        alert("Silakan masukkan Target IP Address terlebih dahulu!");
        return;
    }
    
    const sourceNode = nodes[activePingNodeId];
    if (!sourceNode) return;

    const sourceIp = getNodeSourceIp(sourceNode, targetIp);
    if (!sourceIp) {
        if (sourceNode.type === 'router') {
            alert("Router sumber belum memiliki IP Address pada port ethernet manapun! Silakan konfigurasi IP interface router terlebih dahulu.");
        } else {
            alert("Perangkat sumber belum memiliki IP Address!");
        }
        return;
    }

    addLog('info', `Pinging ${targetIp} dari ${sourceNode.name} (${sourceIp}) dengan 32 byte data:`);
    
    const result = traceL3Path(sourceNode, targetIp);
    closePingModal();

    if (result.error) {
        triggerFailedPing(sourceNode.id, result.error, targetIp, sourceIp);
    } else {
        executeHopByHopAnimation(result.paths, targetIp);
    }
});

function getRouterNodeByIp(ipInt) {
    for (const key in nodes) {
        if (nodes[key].type === 'router') {
            for (const eth in nodes[key].interfaces) {
                const parsed = parsePrefix(nodes[key].interfaces[eth].ipPrefix);
                if (parsed && parsed.ipInt === ipInt) return nodes[key];
            }
        }
    }
    return null;
}

function traceL3Path(sourceNode, targetIp) {
    const targetIpInt = ipToInt(targetIp);
    const paths = [];
    
    let targetNode = null;
    for (const key in nodes) {
        if (nodes[key].type === 'pc' && nodes[key].ip === targetIp) {
            targetNode = nodes[key];
            break;
        } else if (nodes[key].type === 'router') {
            for (const eth in nodes[key].interfaces) {
                const parsed = parsePrefix(nodes[key].interfaces[eth].ipPrefix);
                if (parsed && parsed.ipStr === targetIp) {
                    targetNode = nodes[key];
                    break;
                }
            }
            if (targetNode) break;
        }
    }

    if (!targetNode) {
        return { error: "Destination net unreachable" };
    }

    let currentNode = sourceNode;
    const visitedRouters = new Set();
    
    while (true) {
        if (currentNode.id === targetNode.id) break;

        let isDirectlyConnected = false;
        if (currentNode.type === 'pc') {
            const maskInt = ipToInt(currentNode.subnet || '255.255.255.0');
            const ipInt = ipToInt(currentNode.ip);
            if ((ipInt & maskInt) === (targetIpInt & maskInt)) {
                isDirectlyConnected = true;
            }
        } else if (currentNode.type === 'router') {
            for (const eth in currentNode.interfaces) {
                const parsed = parsePrefix(currentNode.interfaces[eth].ipPrefix);
                if (parsed && ((targetIpInt & parsed.maskInt) === (parsed.ipInt & parsed.maskInt))) {
                    isDirectlyConnected = true;
                    break;
                }
            }
        }

        if (isDirectlyConnected) {
            const l2Path = findPath(currentNode.id, targetNode.id);
            if (!l2Path) return { error: "RTO" };
            paths.push(l2Path);
            break;
        }

        let nextHopIpInt = null;
        if (currentNode.type === 'pc') {
            if (!currentNode.gateway) return { error: "Destination host unreachable" };
            nextHopIpInt = ipToInt(currentNode.gateway);
        } else if (currentNode.type === 'router') {
            for (const r of currentNode.staticRoutes || []) {
                const parsedDest = parsePrefix(r.dest);
                if (parsedDest && ((targetIpInt & parsedDest.maskInt) === (parsedDest.ipInt & parsedDest.maskInt))) {
                    nextHopIpInt = ipToInt(r.nextHop);
                    break;
                }
            }
            if (nextHopIpInt === null) {
                return { error: "Destination net unreachable" };
            }
        }

        const nextRouter = getRouterNodeByIp(nextHopIpInt);
        if (!nextRouter) return { error: "Destination host unreachable" };

        if (visitedRouters.has(nextRouter.id)) {
             return { error: "TTL expired in transit" };
        }
        visitedRouters.add(nextRouter.id);

        const l2Path = findPath(currentNode.id, nextRouter.id);
        if (!l2Path) return { error: "RTO" };

        paths.push(l2Path);
        currentNode = nextRouter;
    }
    
    return { paths };
}

function triggerFailedPing(sourceId, reasonStr, targetIp, sourceIpOverride) {
    let count = 0;
    const sourceNode = nodes[sourceId];
    const sourceIp = sourceIpOverride || (sourceNode ? getNodeSourceIp(sourceNode, targetIp) || sourceNode.name : sourceId);
    let interval = setInterval(() => {
        count++;
        animateFailedPacket(sourceId, reasonStr === "RTO" ? "RTO" : "Unreachable");
        addLog('error', `Reply from ${sourceIp}: ${reasonStr}.`);
        if (count >= 4) {
            clearInterval(interval);
            addLog('info', `Statistik Ping untuk ${targetIp}: Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)`);
        }
    }, 1000);
}

// --- 60 FPS Real-Time SVG Packet Data Animation ---
function executeHopByHopAnimation(paths, targetIp) {
    let pingCount = 0;
    
    function animateSegments(segmentList, type, callback) {
        let segIdx = 0;
        
        function nextSegment() {
            if (segIdx >= segmentList.length) {
                if (callback) callback();
                return;
            }
            const path = segmentList[segIdx];
            let stepIdx = 0;

            function nextStep() {
                if (stepIdx >= path.length - 1) {
                    segIdx++;
                    setTimeout(nextSegment, 30);
                    return;
                }
                const n1 = nodes[path[stepIdx]];
                const n2 = nodes[path[stepIdx + 1]];
                if (!n1 || !n2) {
                    segIdx++;
                    nextSegment();
                    return;
                }

                const link = links.find(l => (l.n1 === n1.id && l.n2 === n2.id) || (l.n2 === n1.id && l.n1 === n2.id));
                if (link) link.element.classList.add('active');

                animatePacketAcrossLink(n1, n2, type, 480, () => {
                    if (link) link.element.classList.remove('active');
                    stepIdx++;
                    nextStep();
                });
            }
            nextStep();
        }
        nextSegment();
    }

    function runSinglePing() {
        if (pingCount >= 4) {
            addLog('info', `Statistik Ping untuk ${targetIp}: Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`);
            return;
        }

        if (!paths || paths.length === 0) {
            addLog('success', `Reply from ${targetIp}: bytes=32 time<1ms TTL=128`);
            pingCount++;
            setTimeout(runSinglePing, 300);
            return;
        }
        
        animateSegments(paths, 'request', () => {
            const reversePaths = paths.map(p => [...p].reverse()).reverse();
            setTimeout(() => {
                animateSegments(reversePaths, 'reply', () => {
                    const ttl = 129 - paths.length;
                    addLog('success', `Reply from ${targetIp}: bytes=32 time=${paths.length * 10}ms TTL=${ttl}`);
                    pingCount++;
                    setTimeout(runSinglePing, 350); 
                });
            }, 60);
        });
    }
    runSinglePing();
}

function animatePacketAcrossLink(n1, n2, type, durationMs, onComplete) {
    const startX = n1.x + 32;
    const startY = n1.y + 32;
    const endX = n2.x + 32;
    const endY = n2.y + 32;

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    halo.setAttribute('r', '15');
    halo.setAttribute('fill', type === 'request' ? 'rgba(56, 189, 248, 0.45)' : 'rgba(52, 211, 153, 0.45)');
    halo.setAttribute('cx', startX);
    halo.setAttribute('cy', startY);

    const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    core.setAttribute('r', '7');
    core.setAttribute('fill', type === 'request' ? '#38bdf8' : '#34d399');
    core.setAttribute('stroke', '#ffffff');
    core.setAttribute('stroke-width', '2');
    core.setAttribute('cx', startX);
    core.setAttribute('cy', startY);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', startX);
    label.setAttribute('y', startY - 14);
    label.setAttribute('fill', type === 'request' ? '#38bdf8' : '#34d399');
    label.setAttribute('font-size', '10px');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('font-family', 'sans-serif');
    label.setAttribute('text-anchor', 'middle');
    label.textContent = type === 'request' ? 'ECHO' : 'REPLY';

    group.appendChild(halo);
    group.appendChild(core);
    group.appendChild(label);
    svgLayer.appendChild(group);

    const startTime = performance.now();

    function frame(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);

        const currentX = startX + (endX - startX) * progress;
        const currentY = startY + (endY - startY) * progress;

        halo.setAttribute('cx', currentX);
        halo.setAttribute('cy', currentY);
        core.setAttribute('cx', currentX);
        core.setAttribute('cy', currentY);
        label.setAttribute('x', currentX);
        label.setAttribute('y', currentY - 14);

        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            if (svgLayer.contains(group)) {
                svgLayer.removeChild(group);
            }
            if (onComplete) onComplete();
        }
    }
    requestAnimationFrame(frame);
}

function animateFailedPacket(nodeId, reasonText = "RTO") {
    const node = nodes[nodeId];
    if (!node) return;

    const startX = node.x + 32;
    const startY = node.y + 32;

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    halo.setAttribute('r', '14');
    halo.setAttribute('fill', 'rgba(239, 68, 68, 0.4)');
    halo.setAttribute('cx', startX);
    halo.setAttribute('cy', startY);

    const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    core.setAttribute('r', '7');
    core.setAttribute('fill', '#ef4444');
    core.setAttribute('stroke', '#ffffff');
    core.setAttribute('stroke-width', '2');
    core.setAttribute('cx', startX);
    core.setAttribute('cy', startY);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', startX);
    text.setAttribute('y', startY - 14);
    text.setAttribute('fill', '#ef4444');
    text.setAttribute('font-size', '11px');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('font-family', 'sans-serif');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = `❌ ${reasonText}`;

    group.appendChild(halo);
    group.appendChild(core);
    group.appendChild(text);
    svgLayer.appendChild(group);

    const startTime = performance.now();
    const durationMs = 800;

    function frame(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);

        const currentY = startY - (progress * 30);
        const opacity = 1 - progress;

        halo.setAttribute('cy', currentY);
        core.setAttribute('cy', currentY);
        text.setAttribute('y', currentY - 14);
        group.setAttribute('opacity', opacity);

        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            if (svgLayer.contains(group)) {
                svgLayer.removeChild(group);
            }
        }
    }
    requestAnimationFrame(frame);
}

function findPath(startId, endId) {
    const queue = [[startId]];
    const visited = new Set();
    visited.add(startId);

    while (queue.length > 0) {
        const path = queue.shift();
        const currentId = path[path.length - 1];

        if (currentId === endId) return path;

        const node = nodes[currentId];
        if (node) {
            for (const neighborId of node.connections) {
                if (!visited.has(neighborId)) {
                    visited.add(neighborId);
                    queue.push([...path, neighborId]);
                }
            }
        }
    }
    return null;
}

// --- Topology Storage ---
function saveTopology() {
    const data = {
        nodeCounter: nodeCounter,
        nodes: {}
    };
    for (const id in nodes) {
        data.nodes[id] = {
            id: nodes[id].id,
            type: nodes[id].type,
            name: nodes[id].name,
            x: nodes[id].x,
            y: nodes[id].y,
            ip: nodes[id].ip,
            subnet: nodes[id].subnet,
            gateway: nodes[id].gateway,
            connections: nodes[id].connections,
            interfaces: nodes[id].interfaces,
            staticRoutes: nodes[id].staticRoutes || []
        };
    }
    localStorage.setItem('networkTopology', JSON.stringify(data));
}

function loadTopology() {
    const saved = localStorage.getItem('networkTopology');
    if (!saved) return;
    
    try {
        const data = JSON.parse(saved);
        nodeCounter = data.nodeCounter || 0;
        
        nodes = {};
        links = [];
        workspace.querySelectorAll('.node').forEach(n => n.remove());
        workspace.querySelectorAll('.cable-port-badge').forEach(b => b.remove());
        svgLayer.innerHTML = '';
        svgLayer.appendChild(tempLine);
        
        for (const id in data.nodes) {
            const n = data.nodes[id];
            const el = document.createElement('div');
            el.className = 'node';
            el.dataset.id = id;
            el.dataset.type = n.type;
            el.style.left = `${n.x}px`;
            el.style.top = `${n.y}px`;

            const label = document.createElement('div');
            label.className = 'node-label';
            label.innerText = n.type === 'pc' ? `${n.name} (${n.ip || 'No IP'})` : n.name;
            label.id = `label-${id}`;

            if (n.type === 'router') {
                el.innerHTML = `
                    <svg class="router-cisco-icon" viewBox="0 0 40 40" width="28" height="28">
                        <path d="M 8 8 L 17 17 M 17 17 L 11 16 M 17 17 L 16 11" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                        <path d="M 23 23 L 32 32 M 32 32 L 26 31 M 32 32 L 31 26" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                        <path d="M 8 32 L 17 23 M 17 23 L 16 29 M 17 23 L 11 24" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                        <path d="M 23 17 L 32 8 M 32 8 L 31 14 M 32 8 L 26 9" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    </svg>
                    <span class="router-inner-name">${n.name}</span>
                `;
            } else {
                const icon = document.createElement('i');
                if (n.type === 'pc') icon.className = 'fa-solid fa-desktop';
                else icon.className = 'fa-solid fa-network-wired';
                el.appendChild(icon);
            }
            el.appendChild(label);
            workspace.appendChild(el);

            nodes[id] = {
                id: id,
                type: n.type,
                name: n.name,
                element: el,
                x: n.x,
                y: n.y,
                ip: n.ip || '',
                subnet: n.subnet || '',
                gateway: n.gateway || '',
                connections: [],
                interfaces: n.interfaces || {},
                staticRoutes: n.staticRoutes || []
            };
            
            setupNodeInteractions(el);
            updateLabel(id);
        }
        
        const createdLinks = new Set();
        for (const id in data.nodes) {
            if (Array.isArray(data.nodes[id].connections)) {
                for (const targetId of data.nodes[id].connections) {
                    if (data.nodes[targetId]) {
                        const linkKey = id < targetId ? `${id}-${targetId}` : `${targetId}-${id}`;
                        if (!createdLinks.has(linkKey)) {
                            createConnection(id, targetId, true);
                            createdLinks.add(linkKey);
                        }
                    }
                }
            }
        }
        
        updateConnections();
        addLog('success', 'Topologi berhasil dimuat kembali dari penyimpanan lokal.');
    } catch (e) {
        console.error('Error loading topology:', e);
    }
}

// Automatically load saved topology on startup
loadTopology();
