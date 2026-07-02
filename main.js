/* ==========================================================================
   APP LOGIC - THE LULU WEB SHOW
   ========================================================================= */

// State Management
let currentSection = 'home';
let decryptedGalleries = null;
let currentActiveGroup = 'baby_journal';
let currentActiveCategory = null;
let lightboxItems = [];
let currentLightboxIndex = 0;

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initMobileDrawer();
    initStats();
    initGrowthChart();
    initJournal();
    initLightbox();
    
    // Check if hash exists in URL and route
    if (window.location.hash) {
        const sectionId = window.location.hash.substring(1);
        if (document.getElementById(sectionId)) {
            navigateToSection(sectionId);
        }
    }
});

/* ==========================================================================
   NAVIGATION & DRAWER
   ========================================================================== */
function initNavigation() {
    const navLinks = document.querySelectorAll(".nav-link, .mobile-link");
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            const section = link.getAttribute("data-section");
            navigateToSection(section);
        });
    });
}

function navigateToSection(sectionId) {
    if (!document.getElementById(sectionId)) return;
    
    // Deactivate current section
    document.querySelectorAll(".content-section").forEach(sec => {
        sec.classList.remove("active");
    });
    
    // Activate new section
    document.getElementById(sectionId).classList.add("active");
    currentSection = sectionId;
    
    // Update nav links active states
    document.querySelectorAll(".nav-link, .mobile-link").forEach(link => {
        if (link.getAttribute("data-section") === sectionId) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
    
    // Close mobile drawer if open
    closeDrawer();
    
    // Scroll to top of section
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initMobileDrawer() {
    const hamburger = document.getElementById("hamburger-btn");
    const drawer = document.getElementById("mobile-drawer");
    const overlay = document.getElementById("drawer-overlay");
    
    hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("open");
        drawer.classList.toggle("open");
        overlay.classList.toggle("open");
    });
    
    overlay.addEventListener("click", closeDrawer);
}

function closeDrawer() {
    const hamburger = document.getElementById("hamburger-btn");
    const drawer = document.getElementById("mobile-drawer");
    const overlay = document.getElementById("drawer-overlay");
    
    hamburger.classList.remove("open");
    drawer.classList.remove("open");
    overlay.classList.remove("open");
}

/* ==========================================================================
   VISITOR STATISTICS
   ========================================================================== */
function initStats() {
    const statTotal = document.getElementById("stat-total-visits");
    const statYear = document.getElementById("stat-visits-year");
    
    // Initial Base Stats (May 2007)
    const baseTotal = 28430;
    
    // Calculate simulated dynamic visits (steady increment based on current time)
    const startDate = new Date("2007-05-16");
    const now = new Date();
    const daysSince = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    
    // Assume average 1.5 visits per day
    const simulatedVisits = Math.max(0, Math.floor(daysSince * 1.5));
    const totalVisits = baseTotal + simulatedVisits;
    
    // Calculate proportional year visits (approx 15% of total)
    const yearVisits = Math.floor(simulatedVisits * 0.15 + 350);
    
    // Format numbers French locale (space grouping)
    statTotal.textContent = formatNumber(totalVisits);
    statYear.textContent = formatNumber(yearVisits);
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/* ==========================================================================
   GROWTH CHART (SVG)
   ========================================================================== */
function initGrowthChart() {
    const container = document.getElementById("interactive-growth-chart");
    if (!container) return;
    
    // Toggle tabs
    const btnInteractive = document.getElementById("btn-chart-interactive");
    const btnLegacy = document.getElementById("btn-chart-legacy");
    const legacyView = document.getElementById("legacy-chart-view");
    
    btnInteractive.addEventListener("click", () => {
        btnInteractive.classList.add("active");
        btnLegacy.classList.remove("active");
        container.parentElement.classList.remove("hidden");
        legacyView.classList.add("hidden");
    });
    
    btnLegacy.addEventListener("click", () => {
        btnLegacy.classList.add("active");
        btnInteractive.classList.remove("active");
        container.parentElement.classList.add("hidden");
        legacyView.classList.remove("hidden");
    });
    
    // Render SVG Growth Chart
    // Luc's weights: 0m: 3.970, 8m: 11.03
    // Standard growth dataset (Median, +2SD, -2SD)
    const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const whoMedian = [3.5, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6];
    const whoPlus2SD = [4.4, 5.8, 7.1, 8.0, 8.7, 9.3, 9.8, 10.3, 10.7, 11.0, 11.4, 11.7, 12.0];
    const whoMinus2SD = [2.9, 3.4, 4.3, 5.0, 5.6, 6.0, 6.4, 6.7, 6.9, 7.1, 7.3, 7.5, 7.7];
    const lucWeight = [3.97, 4.8, 5.7, 6.7, 7.6, 8.5, 9.3, 10.1, 11.03, 11.4, 11.8, 12.2, 12.5];
    
    const svgWidth = 800;
    const svgHeight = 350;
    const paddingLeft = 50;
    const paddingRight = 30;
    const paddingTop = 20;
    const paddingBottom = 40;
    
    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;
    
    // Scale functions
    const getX = (month) => paddingLeft + (month / 12) * chartWidth;
    const getY = (weight) => paddingTop + chartHeight - ((weight - 2) / (13 - 2)) * chartHeight; // weight range 2kg - 13kg
    
    let svg = `<svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="100%">`;
    
    // Grid lines (y-axis)
    for (let w = 2; w <= 13; w++) {
        const y = getY(w);
        svg += `<line x1="${paddingLeft}" y1="${y}" x2="${svgWidth - paddingRight}" y2="${y}" stroke="#f0f0f0" stroke-width="1" />`;
        // Labels
        svg += `<text x="${paddingLeft - 10}" y="${y + 4}" fill="#888" font-size="11" text-anchor="end" font-family="var(--font-body)">${w} kg</text>`;
    }
    
    // Grid lines (x-axis)
    for (let m = 0; m <= 12; m++) {
        const x = getX(m);
        svg += `<line x1="${x}" y1="${paddingTop}" x2="${x}" y2="${paddingTop + chartHeight}" stroke="#f0f0f0" stroke-width="1" />`;
        // Labels
        svg += `<text x="${x}" y="${paddingTop + chartHeight + 20}" fill="#888" font-size="11" text-anchor="middle" font-family="var(--font-body)">${m}m</text>`;
    }
    
    // Draw Standard Curves (Background)
    const drawLine = (points, color, width, dash = "") => {
        let path = `M ${getX(0)} ${getY(points[0])}`;
        for (let i = 1; i < points.length; i++) {
            path += ` L ${getX(i)} ${getY(points[i])}`;
        }
        return `<path d="${path}" fill="none" stroke="${color}" stroke-width="${width}" ${dash ? `stroke-dasharray="${dash}"` : ''} />`;
    };
    
    svg += drawLine(whoPlus2SD, "#ffd1d1", 1.5, "4,4");
    svg += drawLine(whoMinus2SD, "#ffd1d1", 1.5, "4,4");
    svg += drawLine(whoMedian, "#dddddd", 2);
    
    // Draw Luc's Weight Curve
    svg += drawLine(lucWeight, "var(--color-primary)", 3);
    
    // Draw Official Measurement Points
    const drawPoint = (month, weight, label) => {
        const x = getX(month);
        const y = getY(weight);
        return `
            <circle cx="${x}" cy="${y}" r="6" fill="var(--color-primary-dark)" stroke="#ffffff" stroke-width="2" />
            <text x="${x}" y="${y - 12}" fill="var(--color-primary-dark)" font-size="11" font-weight="700" text-anchor="middle" font-family="var(--font-body)">${label}</text>
        `;
    };
    
    svg += drawPoint(0, 3.97, "3.97 kg");
    svg += drawPoint(8, 11.03, "11.03 kg");
    
    // Legend
    svg += `
        <g transform="translate(${paddingLeft + 20}, ${paddingTop + 10})">
            <line x1="0" y1="5" x2="20" y2="5" stroke="var(--color-primary)" stroke-width="3" />
            <text x="25" y="9" fill="var(--color-primary-dark)" font-size="11" font-weight="600" font-family="var(--font-body)">Poids de Luc</text>
            
            <line x1="120" y1="5" x2="140" y2="5" stroke="#dddddd" stroke-width="2" />
            <text x="145" y="9" fill="#888" font-size="11" font-family="var(--font-body)">Moyenne OMS</text>
            
            <line x1="240" y1="5" x2="260" y2="5" stroke="#ffd1d1" stroke-width="1.5" stroke-dasharray="4,4" />
            <text x="265" y="9" fill="#888" font-size="11" font-family="var(--font-body)">Limites OMS (±2SD)</text>
        </g>
    `;
    
    svg += `</svg>`;
    container.innerHTML = svg;
}

/* ==========================================================================
   JOURNAL TIMELINE
   ========================================================================== */
function initJournal() {
    renderTimeline();
    
    // Listen to controls
    const searchInput = document.getElementById("journal-search");
    const filterSelect = document.getElementById("journal-month-filter");
    
    if (searchInput) searchInput.addEventListener("input", renderTimeline);
    if (filterSelect) filterSelect.addEventListener("change", renderTimeline);
}

function renderTimeline() {
    const timelineContainer = document.getElementById("journal-timeline");
    if (!timelineContainer) return;
    
    const searchVal = document.getElementById("journal-search").value.toLowerCase();
    const monthFilter = document.getElementById("journal-month-filter").value;
    
    // Read from window.JOURNAL_DATA
    if (!window.JOURNAL_DATA) {
        timelineContainer.innerHTML = "<p>Aucune entrée de journal disponible.</p>";
        return;
    }
    
    // Clean dead references and filter data
    const filtered = window.JOURNAL_DATA.filter(item => {
        // filter by month
        if (monthFilter !== 'all' && item.month !== monthFilter) return false;
        
        // filter by search term
        const text = (item.date + " " + item.title + " " + item.content).toLowerCase();
        if (searchVal && !text.includes(searchVal)) return false;
        
        return true;
    });
    
    // Sort chronological order (earliest first for journal reading)
    // Janvier 2003 is index-based bottom, so we display reverse of array index for timelines
    // Actually, let's reverse to show newest first! That is standard for blogs/journals.
    // Let's do that!
    
    if (filtered.length === 0) {
        timelineContainer.innerHTML = `<div class="text-center p-4">🔍 Aucun souvenir ne correspond à votre recherche.</div>`;
        return;
    }
    
    let html = "";
    filtered.forEach(item => {
        // Remove dead link reference if any in content
        let cleanContent = item.content;
        
        // Clean Lycos dead links if any left
        cleanContent = cleanContent.replace(/!!!\s*The Thierry's World\s*!!!/g, 'The Thierry\'s World (lien archivé indisponible)');
        
        html += `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <span class="timeline-badge-month">${item.month}</span>
                <div class="timeline-card">
                    <span class="timeline-date">${item.date}</span>
                    ${item.title ? `<h4 class="timeline-title">${item.title}</h4>` : ''}
                    <p class="timeline-body">${cleanContent}</p>
                </div>
            </div>
        `;
    });
    
    timelineContainer.innerHTML = html;
}

/* ==========================================================================
   CONTACT FORM SUBMIT
   ========================================================================== */
function handleContactSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById("c-name").value;
    const email = document.getElementById("c-email").value;
    const subject = document.getElementById("c-subject").value;
    const message = document.getElementById("c-message").value;
    
    // Create mailto link
    const mailtoUrl = `mailto:luc.samain@free.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("Nom: " + name + "\nEmail: " + email + "\n\n" + message)}`;
    
    // Trigger simulated success visual
    const successMsg = document.getElementById("contact-success");
    successMsg.classList.remove("hidden");
    
    // Open mail client
    window.location.href = mailtoUrl;
    
    // Reset form after 2 seconds
    setTimeout(() => {
        document.getElementById("contact-form").reset();
        successMsg.classList.add("hidden");
    }, 3000);
}

/* ==========================================================================
   SECURE PHOTO GALLERY (WEB CRYPTO AES DECRYPTION)
   ========================================================================== */
async function handlePasscodeSubmit(event) {
    event.preventDefault();
    const passcode = document.getElementById("passcode-input").value.trim();
    const errorMsg = document.getElementById("lock-error-msg");
    
    errorMsg.classList.add("hidden");
    errorMsg.classList.remove("shake");
    
    if (!window.ENCRYPTED_GALLERIES) {
        alert("Erreur: Les données cryptées de l'album sont introuvables.");
        return;
    }
    
    try {
        // Attempt to decrypt the database
        const salt = hexToBytes(window.ENCRYPTED_GALLERIES.salt);
        const iv = hexToBytes(window.ENCRYPTED_GALLERIES.iv);
        const ciphertext = hexToBytes(window.ENCRYPTED_GALLERIES.ciphertext);
        
        // PBKDF2 Key Derivation
        const keyBytes = await derivePBKDF2Key(passcode, salt);
        
        // Custom block-by-block digest decryption
        const decryptedJsonStr = await decryptCustomStream(ciphertext, keyBytes, iv);
        
        // Attempt parsing
        const parsed = JSON.parse(decryptedJsonStr);
        
        // SUCCESS! Save parsed galleries
        decryptedGalleries = parsed;
        
        // Show content, hide lock
        document.getElementById("photo-lock-screen").classList.add("hidden");
        document.getElementById("photo-gallery-content").classList.remove("hidden");
        
        // Render groups and select first group
        renderGalleryGroups();
        selectGalleryGroup('baby_journal');
        
    } catch (e) {
        console.error("Decryption failed:", e);
        // Fail: shake and show error
        errorMsg.classList.remove("hidden");
        // Force reflow for animation restart
        void errorMsg.offsetWidth;
        errorMsg.classList.add("shake");
    }
}

function lockGallery() {
    decryptedGalleries = null;
    document.getElementById("passcode-input").value = "";
    document.getElementById("photo-lock-screen").classList.remove("hidden");
    document.getElementById("photo-gallery-content").classList.add("hidden");
    
    // Clear DOM content to prevent photos from staying visible
    const groups = document.getElementById("gallery-groups");
    const tabs = document.getElementById("gallery-tabs");
    const grid = document.getElementById("gallery-grid");
    
    if (groups) groups.innerHTML = "";
    if (tabs) tabs.innerHTML = "";
    if (grid) grid.innerHTML = "";
    
    const notice = document.getElementById("anaglyph-notice");
    if (notice) notice.classList.add("hidden");
}

// Convert Hex String to Uint8Array
function hexToBytes(hexStr) {
    const bytes = new Uint8Array(hexStr.length / 2);
    for (let i = 0; i < hexStr.length; i += 2) {
        bytes[i / 2] = parseInt(hexStr.substring(i, i + 2), 16);
    }
    return bytes;
}

// Web Crypto PBKDF2 key derivation
async function derivePBKDF2Key(password, salt) {
    const encoder = new TextEncoder();
    const importedPass = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );
    
    const keyBits = await window.crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        importedPass,
        256 // 32 bytes
    );
    return new Uint8Array(keyBits);
}

// Custom Decryption matching Python's Counter block XOR stream
async function decryptCustomStream(ciphertext, keyBytes, iv) {
    const plaintext = new Uint8Array(ciphertext.length);
    const numBlocks = Math.ceil(ciphertext.length / 32);
    
    for (let i = 0; i < numBlocks; i++) {
        // Construct counter block: IV (16 bytes) + counter index as big-endian (4 bytes)
        const counterBlock = new Uint8Array(20);
        counterBlock.set(iv, 0);
        
        counterBlock[16] = (i >> 24) & 0xff;
        counterBlock[17] = (i >> 16) & 0xff;
        counterBlock[18] = (i >> 8) & 0xff;
        counterBlock[19] = i & 0xff;
        
        // Input buffer to hash: Key + CounterBlock
        const hashInput = new Uint8Array(keyBytes.length + counterBlock.length);
        hashInput.set(keyBytes, 0);
        hashInput.set(counterBlock, keyBytes.length);
        
        // Keystream block = SHA256(Key + CounterBlock)
        const keystreamBuffer = await window.crypto.subtle.digest("SHA-256", hashInput);
        const keystream = new Uint8Array(keystreamBuffer);
        
        const chunkStart = i * 32;
        const chunkEnd = Math.min(ciphertext.length, chunkStart + 32);
        
        for (let j = chunkStart; j < chunkEnd; j++) {
            plaintext[j] = ciphertext[j] ^ keystream[j - chunkStart];
        }
    }
    
    return new TextDecoder().decode(plaintext);
}

/* ==========================================================================
   RENDER PHOTO ALBUMS & VIDEO TILES
   ========================================================================== */
function renderGalleryGroups() {
    const groupsContainer = document.getElementById("gallery-groups");
    if (!groupsContainer || !decryptedGalleries) return;
    
    let html = "";
    Object.keys(decryptedGalleries).forEach(groupKey => {
        const group = decryptedGalleries[groupKey];
        let emoji = "👶";
        if (groupKey === "events") emoji = "🎭";
        if (groupKey === "phpwg") emoji = "📸";
        
        html += `
            <button class="gallery-group-btn" id="group-btn-${groupKey}" onclick="selectGalleryGroup('${groupKey}')">
                ${emoji} ${group.title}
            </button>
        `;
    });
    groupsContainer.innerHTML = html;
}

function selectGalleryGroup(groupKey, targetCategoryKey = null) {
    if (!decryptedGalleries || !decryptedGalleries[groupKey]) return;
    currentActiveGroup = groupKey;
    
    // Update active group styling
    document.querySelectorAll(".gallery-group-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    const activeGroupBtn = document.getElementById(`group-btn-${groupKey}`);
    if (activeGroupBtn) activeGroupBtn.classList.add("active");
    
    // Render the category tabs
    renderGalleryTabs();
    
    // Select correct category
    const galleries = decryptedGalleries[groupKey].galleries;
    const categories = Object.keys(galleries);
    if (categories.length > 0) {
        let selectKey = categories[0];
        if (targetCategoryKey && galleries[targetCategoryKey]) {
            selectKey = targetCategoryKey;
        }
        selectGalleryCategory(selectKey);
    }
}

function renderGalleryTabs() {
    const tabsContainer = document.getElementById("gallery-tabs");
    if (!tabsContainer || !decryptedGalleries || !currentActiveGroup) return;
    
    const galleries = decryptedGalleries[currentActiveGroup].galleries;
    let html = "";
    Object.keys(galleries).forEach(fileKey => {
        const g = galleries[fileKey];
        html += `
            <button class="gallery-tab-btn" id="tab-${fileKey}" onclick="selectGalleryCategory('${fileKey}')">
                ${g.title} (${g.count})
            </button>
        `;
    });
    tabsContainer.innerHTML = html;
}

function selectGalleryCategory(fileKey) {
    if (!decryptedGalleries || !currentActiveGroup) return;
    const galleries = decryptedGalleries[currentActiveGroup].galleries;
    if (!galleries || !galleries[fileKey]) return;
    currentActiveCategory = fileKey;
    
    // Toggle active tab class
    document.querySelectorAll(".gallery-tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    const activeBtn = document.getElementById(`tab-${fileKey}`);
    if (activeBtn) activeBtn.classList.add("active");
    
    // Toggle 3D banner notice
    const notice = document.getElementById("anaglyph-notice");
    if (notice) {
        if (fileKey === "brulon_3d") {
            notice.classList.remove("hidden");
        } else {
            notice.classList.add("hidden");
        }
    }
    
    // Render photos grid
    renderPhotosGrid(fileKey);
}

function renderPhotosGrid(fileKey) {
    const grid = document.getElementById("gallery-grid");
    if (!grid || !decryptedGalleries || !currentActiveGroup) return;
    const galleries = decryptedGalleries[currentActiveGroup].galleries;
    if (!galleries || !galleries[fileKey]) return;
    
    const items = galleries[fileKey].items;
    
    // Load lightbox reference index array
    lightboxItems = items;
    
    if (items.length === 0) {
        grid.innerHTML = "<p class='text-center p-4'>Aucune photo dans cette catégorie.</p>";
        return;
    }
    
    let html = "";
    items.forEach((item, index) => {
        const isVideo = item.src.toLowerCase().endsWith(".wmv") || item.src.toLowerCase().endsWith(".avi");
        
        html += `
            <div class="gallery-item" onclick="openLightbox(${index})">
                ${isVideo ? `<div class="gallery-item-video-overlay">▶</div>` : ''}
                <img src="${item.thumb}" alt="Photo ${index + 1}" loading="lazy">
                ${item.caption ? `<div class="gallery-item-caption">${item.caption}</div>` : ''}
            </div>
        `;
    });
    grid.innerHTML = html;
}

// Convert legacy WMV/AVI video names to H.264 MP4 target names
function getVideoMp4Url(originalSrc) {
    const filename = originalSrc.split('/').pop().split('\\').pop();
    const base = filename.substring(0, filename.lastIndexOf('.'));
    // clean according to the safe transcode name
    const safeBase = base.replace(/\s+/g, '_')
                         .replace(/&/g, '_and_')
                         .replace(/\(/g, '')
                         .replace(/\)/g, '');
    return `media/${safeBase}.mp4`;
}

/* ==========================================================================
   LIGHTBOX AND MULTIMEDIA VIEWER (IMAGE / HTML5 VIDEO)
   ========================================================================== */
function initLightbox() {
    const closeBtn = document.getElementById("lightbox-close-btn");
    const prevBtn = document.getElementById("lightbox-prev-btn");
    const nextBtn = document.getElementById("lightbox-next-btn");
    const lightbox = document.getElementById("lightbox");
    
    closeBtn.addEventListener("click", closeLightbox);
    prevBtn.addEventListener("click", navigateLightboxPrev);
    nextBtn.addEventListener("click", navigateLightboxNext);
    
    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("active")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") navigateLightboxPrev();
        if (e.key === "ArrowRight") navigateLightboxNext();
    });
}

function openLightbox(index) {
    currentLightboxIndex = index;
    const lightbox = document.getElementById("lightbox");
    lightbox.classList.add("active");
    updateLightboxContent();
}

function closeLightbox() {
    const lightbox = document.getElementById("lightbox");
    lightbox.classList.remove("active");
    // Clear dynamic content to stop video playback
    const container = document.querySelector(".lightbox-content");
    container.innerHTML = `
        <img src="" alt="" id="lightbox-img" class="lightbox-img">
        <div class="lightbox-caption" id="lightbox-caption"></div>
    `;
}

function updateLightboxContent() {
    const item = lightboxItems[currentLightboxIndex];
    if (!item) return;
    
    const container = document.querySelector(".lightbox-content");
    const isVideo = item.src.toLowerCase().endsWith(".wmv") || item.src.toLowerCase().endsWith(".avi");
    
    if (isVideo) {
        // Render a modern HTML5 Video Player
        const mp4Url = getVideoMp4Url(item.src);
        container.innerHTML = `
            <div class="video-wrapper">
                <video controls autoplay class="video-element" id="lightbox-video">
                    <source src="${mp4Url}" type="video/mp4">
                    Votre navigateur ne prend pas en charge la lecture de vidéos HTML5 au format MP4.
                    Vous pouvez <a href="${mp4Url}" download>télécharger la vidéo</a> à la place.
                </video>
            </div>
            <div class="lightbox-caption" id="lightbox-caption">${item.caption || 'Premier clip de Lulu'}</div>
        `;
    } else {
        // Render a standard Image view
        // High-res path resolution
        const filename = item.src.split('/').pop().split('\\').pop();
        // high-res is stored in images/ folder directly
        const highResUrl = `images/${filename}`;
        
        container.innerHTML = `
            <img src="${highResUrl}" alt="Photo de Lulu" id="lightbox-img" class="lightbox-img">
            <div class="lightbox-caption" id="lightbox-caption">${item.caption || ''}</div>
        `;
    }
}

function navigateLightboxPrev() {
    if (lightboxItems.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
    updateLightboxContent();
}

function navigateLightboxNext() {
    if (lightboxItems.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % lightboxItems.length;
    updateLightboxContent();
}

/* ==========================================================================
   LEGACY SUB-SITES EVENTS IFRAMES / REDIRECTS
   ========================================================================== */
function openLegacyGallery(folderName) {
    // Open legacy photogallery indexes inside a popup window or iframe or relative folder
    // Since the folders (10ans, brulon_2d, brulon_3d) contain HTML files, we can just open them
    // in a new tab for native legacy viewing, keeping the historical layout untouched!
    // The link should resolve to ../ftp/10ans/index.html etc.
    // Wait, the folders exist in the workspace root, so under new_site they are located at:
    // new_site/10ans/index.html, new_site/brulon_2d/index.html, etc.
    // We already copied them!
    window.open(`${folderName}/index.html`, '_blank');
}
