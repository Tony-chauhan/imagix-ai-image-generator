document.addEventListener('DOMContentLoaded', () => {
    // --- UI ELEMENTS ---
    const body = document.body;
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const promptInput = document.getElementById('prompt-input-field');
    const surprisePromptBtn = document.getElementById('surprise-prompt-btn');
    const charCounter = document.getElementById('char-counter');
    const stylePresets = document.querySelectorAll('.style-card');
    const aspectCards = document.querySelectorAll('.aspect-card');
    const generateBtn = document.getElementById('generate-trigger-btn');
    
    const previewFrame = document.getElementById('image-display-frame');
    const previewImage = document.getElementById('active-generated-image');
    const previewFallback = document.getElementById('preview-fallback-container');
    
    const loaderScreen = document.getElementById('interactive-loader-screen');
    const loaderStatus = document.getElementById('loader-status-text');
    const loaderSubstatus = document.getElementById('loader-substatus-text');
    
    const metadataDetails = document.getElementById('metadata-details-card');
    const metadataSeed = document.getElementById('metadata-seed');
    const metadataStyle = document.getElementById('metadata-style');
    const metadataResolution = document.getElementById('metadata-resolution');
    
    const actionDownloadBtn = document.getElementById('action-download-btn');
    const actionDeleteBtn = document.getElementById('action-delete-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const historyContainer = document.getElementById('history-items-container');
    const historyEmptyMsg = document.getElementById('history-empty-message');
    const toastPanel = document.getElementById('system-toast-panel');
    const toastText = document.getElementById('toast-message-text');

    // --- STATE VARIABLES ---
    let selectedStyle = 'none';
    let selectedRatio = '1:1';
    let selectedWidth = 1024;
    let selectedHeight = 1024;
    let currentImageId = null;
    let statusInterval = null;

    // --- CURATED PROMPTS ARRAY ---
    const surprisePrompts = [
        "A majestic space nebula, swirling purple and neon pink gases, cinematic lighting, 8k resolution, ultra detailed",
        "Steampunk library filled with ancient leather-bound books, copper pipes emitting soft steam, golden light filtering through a stained-glass window, highly detailed",
        "A gorgeous glass greenhouse containing glowing bioluminescent flowers at night, dark fantasy vibe, neon blue and emerald glow, octane render",
        "Cyberpunk street vendor stall selling glowing noodles in a rainy neo-tokyo alleyway, towering holographic advertisements, retro-futuristic atmosphere",
        "Cute fluffy baby dragon sitting on a pile of gold coins, large sparkling amber eyes, friendly cartoon 3D Pixar style, soft lighting",
        "An ancient fantasy temple carved directly out of a massive emerald cliffside, waterfalls cascading over stone stairs, mist, epic scale, photorealistic",
        "Retro 80s arcade interior with neon glowing arcade machines, synthwave aesthetic, pixelated screens, highly nostalgic, vaporwave style",
        "A surreal floating island with a single pink cherry blossom tree, roots wrapping around giant crystals, waterfalls pouring into the clouds, digital art",
        "Photorealistic close-up of a futuristic cybernetic owl, brass and chrome feathers, glowing sapphire eyes, micro-mechanics, dark background",
        "Vibrant coral reef teeming with exotic sea creatures, bioluminescent jellyfish floating above, warm sunlight beams piercing the blue ocean surface"
    ];

    const placeholderPrompts = [
        "A majestic space nebula swirling in cosmic violet...",
        "A cozy cabin in the woods surrounded by autumn trees...",
        "Cyberpunk cafe in a futuristic rain-soaked city...",
        "A fantasy castle floating on a soft cloud peak...",
        "A futuristic robot butler serving tea, digital art..."
    ];

    // --- PHASE 4A: THEME TOGGLING ---
    // Check local storage for theme
    const savedTheme = localStorage.getItem('imagix-theme');
    if (savedTheme === 'light') {
        body.classList.remove('dark-theme');
    } else {
        body.classList.add('dark-theme');
    }

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        if (body.classList.contains('dark-theme')) {
            localStorage.setItem('imagix-theme', 'dark');
            showToast('🌙 Dark mode enabled');
        } else {
            localStorage.setItem('imagix-theme', 'light');
            showToast('☀️ Light mode enabled');
        }
    });

    // --- PHASE 4B: INPUT CONTROLS ---
    // Prompt placeholder rotation
    let placeholderIdx = 0;
    setInterval(() => {
        if (!promptInput.value) {
            placeholderIdx = (placeholderIdx + 1) % placeholderPrompts.length;
            promptInput.placeholder = placeholderPrompts[placeholderIdx];
        }
    }, 4500);

    // Textarea Character Counter
    promptInput.addEventListener('input', () => {
        const len = promptInput.value.length;
        charCounter.textContent = `${len}/500`;
    });

    // Surprise Prompt Trigger
    surprisePromptBtn.addEventListener('click', () => {
        const randIdx = Math.floor(Math.random() * surprisePrompts.length);
        promptInput.value = surprisePrompts[randIdx];
        promptInput.dispatchEvent(new Event('input'));
        promptInput.focus();
        showToast('✨ Selected a highly detailed prompt!');
    });

    // Style Card Selection
    stylePresets.forEach(card => {
        card.addEventListener('click', () => {
            stylePresets.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedStyle = card.getAttribute('data-style');
        });
    });

    // Aspect Ratio Selection (Dynamic Preview Re-scaling)
    aspectCards.forEach(card => {
        card.addEventListener('click', () => {
            aspectCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            selectedRatio = card.getAttribute('data-ratio');
            selectedWidth = parseInt(card.getAttribute('data-width'));
            selectedHeight = parseInt(card.getAttribute('data-height'));

            // Animate dynamic resizing of preview panel container
            previewFrame.className = 'preview-wrapper'; // reset
            
            // Map ratio strings to classes
            const ratioClass = 'ratio-' + selectedRatio.replace(':', '-');
            previewFrame.classList.add(ratioClass);
        });
    });

    // --- PHASE 4C: TOAST NOTIFICATIONS ---
    function showToast(message, type = 'success') {
        toastText.textContent = message;
        toastPanel.className = 'toast active';
        if (type === 'error') {
            toastPanel.classList.add('toast-error');
        } else {
            toastPanel.classList.add('toast-success');
        }
        
        setTimeout(() => {
            toastPanel.classList.remove('active');
        }, 3500);
    }

    // --- PHASE 4D: AI GENERATION MECHANICS ---
    const loadingStates = [
        { status: "Synthesizing visual matrices...", sub: "Spinning deep neural connections" },
        { status: "Drafting canvas contours...", sub: "Mapping prompt vectors into pixel space" },
        { status: "Applying style preset filters...", sub: "Harmonizing HSL values and lighting keys" },
        { status: "Optimizing texture structures...", sub: "Polishing high-frequency digital details" },
        { status: "Exporting high-fidelity file...", sub: "Finalizing and encoding local database asset" }
    ];

    function startLoaderSequence() {
        loaderScreen.classList.add('active');
        let stateIdx = 0;
        
        // Immediate first state
        loaderStatus.textContent = loadingStates[0].status;
        loaderSubstatus.textContent = loadingStates[0].sub;
        
        statusInterval = setInterval(() => {
            stateIdx = (stateIdx + 1) % loadingStates.length;
            loaderStatus.textContent = loadingStates[stateIdx].status;
            loaderSubstatus.textContent = loadingStates[stateIdx].sub;
        }, 2200);
    }

    function stopLoaderSequence() {
        clearInterval(statusInterval);
        loaderScreen.classList.remove('active');
    }

    generateBtn.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            showToast('⚠️ Please enter a text prompt first!', 'error');
            promptInput.focus();
            return;
        }

        // Disable UI controls
        generateBtn.disabled = true;
        promptInput.disabled = true;
        surprisePromptBtn.disabled = true;
        
        // Hide preview elements during load
        previewImage.classList.remove('loaded');
        previewFallback.style.display = 'none';
        metadataDetails.classList.remove('active');

        startLoaderSequence();

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    style: selectedStyle,
                    aspect_ratio: selectedRatio,
                    width: selectedWidth,
                    height: selectedHeight
                })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                // Render newly generated image
                const imagePath = `/static/images/${data.filename}`;
                currentImageId = data.id;

                // Load image into DOM & fade in cleanly
                previewImage.src = imagePath;
                previewImage.onload = () => {
                    stopLoaderSequence();
                    previewImage.classList.add('loaded');
                    
                    // Show metadata card
                    metadataSeed.textContent = data.seed;
                    metadataStyle.textContent = getStyleDisplayName(data.style);
                    metadataResolution.textContent = `${data.width} x ${data.height}`;
                    metadataDetails.classList.add('active');
                    
                    // Hook up Download controls
                    actionDownloadBtn.href = `/static/images/${data.filename}`;
                    actionDownloadBtn.setAttribute('download', `imagix-${data.id}.jpg`);
                    
                    // Enable deletion
                    actionDeleteBtn.setAttribute('data-id', data.id);
                    
                    // Refresh side navigation history list
                    loadHistory();
                    showToast('🎉 Masterpiece synthesized successfully!');
                };
            } else {
                throw new Error(data.message || 'Generation server failed');
            }
        } catch (err) {
            stopLoaderSequence();
            previewFallback.style.display = 'flex';
            showToast(`❌ Error: ${err.message}`, 'error');
            console.error(err);
        } finally {
            // Restore UI controls
            generateBtn.disabled = false;
            promptInput.disabled = false;
            surprisePromptBtn.disabled = false;
        }
    });

    // Helper to get friendly style name
    function getStyleDisplayName(styleVal) {
        const styleMap = {
            'none': 'Default Style',
            'cinematic': 'Cinematic Art',
            'anime': 'Anime Illustration',
            'cyberpunk': 'Cyberpunk / Neon',
            '3d-render': '3D Render / Octane',
            'fantasy': 'Dark Fantasy Mythos',
            'oil-painting': 'Classic Oil Canvas',
            'pixel-art': 'Retro 8-Bit Pixel'
        };
        return styleMap[styleVal] || styleVal;
    }

    // --- PHASE 4E: PERSISTENT SIDEBAR HISTORY ---
    async function loadHistory() {
        try {
            const response = await fetch('/history');
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Clear old history
                const items = historyContainer.querySelectorAll('.history-item');
                items.forEach(el => el.remove());
                
                if (data.history && data.history.length > 0) {
                    historyEmptyMsg.style.display = 'none';
                    
                    data.history.forEach(item => {
                        const card = document.createElement('div');
                        card.className = 'history-item';
                        if (currentImageId === item.id) {
                            card.classList.add('active');
                        }
                        card.setAttribute('data-id', item.id);
                        
                        // Populate internal elements
                        card.innerHTML = `
                            <img src="/static/images/${item.filename}" alt="${item.prompt}" loading="lazy">
                            <div class="history-item-overlay">
                                <div class="history-item-prompt">${item.prompt}</div>
                            </div>
                        `;
                        
                        // Click thumbnail to inspect inside the main view panel
                        card.addEventListener('click', () => {
                            selectHistoryItem(item);
                        });
                        
                        historyContainer.appendChild(card);
                    });
                } else {
                    historyEmptyMsg.style.display = 'flex';
                }
            }
        } catch (err) {
            console.error('Failed to load history list:', err);
        }
    }

    // Load detailed data from a historical thumbnail
    function selectHistoryItem(item) {
        currentImageId = item.id;
        
        // Set thumbnail borders active
        const items = historyContainer.querySelectorAll('.history-item');
        items.forEach(el => {
            if (parseInt(el.getAttribute('data-id')) === item.id) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        // Hide fallback/spinner
        previewFallback.style.display = 'none';
        loaderScreen.classList.remove('active');
        previewImage.classList.remove('loaded');
        
        // Dynamic re-scaling for stored ratio
        previewFrame.className = 'preview-wrapper';
        const ratioClass = 'ratio-' + item.aspect_ratio.replace(':', '-');
        previewFrame.classList.add(ratioClass);

        // Load image & details
        previewImage.src = `/static/images/${item.filename}`;
        previewImage.onload = () => {
            previewImage.classList.add('loaded');
            
            metadataSeed.textContent = item.seed;
            metadataStyle.textContent = getStyleDisplayName(item.style);
            metadataResolution.textContent = `${item.width} x ${item.height}`;
            metadataDetails.classList.add('active');
            
            // Hook up Download controls
            actionDownloadBtn.href = `/static/images/${item.filename}`;
            actionDownloadBtn.setAttribute('download', `imagix-${item.id}.jpg`);
            
            // Enable deletion
            actionDeleteBtn.setAttribute('data-id', item.id);
        };
    }

    // --- PHASE 4F: GALLERY MANAGEMENT TRIGGERS ---
    // Individual Deletion
    actionDeleteBtn.addEventListener('click', async () => {
        const id = actionDeleteBtn.getAttribute('data-id');
        if (!id) return;

        if (confirm('Are you sure you want to delete this generated asset permanently?')) {
            try {
                const response = await fetch(`/delete/${id}`, { method: 'DELETE' });
                const data = await response.json();
                
                if (response.ok && data.success) {
                    showToast('🗑️ Asset deleted successfully!');
                    
                    // Reset preview view panel to empty state
                    previewImage.classList.remove('loaded');
                    previewImage.src = '';
                    previewFallback.style.display = 'flex';
                    metadataDetails.classList.remove('active');
                    currentImageId = null;
                    
                    // Reload Sidebar history
                    loadHistory();
                } else {
                    throw new Error(data.message || 'Deletion failed');
                }
            } catch (err) {
                showToast(`❌ Deletion Error: ${err.message}`, 'error');
            }
        }
    });

    // Clear Whole History
    clearHistoryBtn.addEventListener('click', async () => {
        if (confirm('CAUTION: Are you sure you want to delete your ENTIRE generation history? This action is irreversible.')) {
            try {
                const response = await fetch('/delete-all', { method: 'POST' });
                const data = await response.json();
                
                if (response.ok && data.success) {
                    showToast('🗑️ Entire generation history wiped!');
                    
                    // Reset preview panel
                    previewImage.classList.remove('loaded');
                    previewImage.src = '';
                    previewFallback.style.display = 'flex';
                    metadataDetails.classList.remove('active');
                    currentImageId = null;
                    
                    // Reload Sidebar history
                    loadHistory();
                } else {
                    throw new Error(data.message || 'Wiping failed');
                }
            } catch (err) {
                showToast(`❌ Wipe Error: ${err.message}`, 'error');
            }
        }
    });

    // --- INITIALIZE APPLICATION LOAD ---
    loadHistory();
});
