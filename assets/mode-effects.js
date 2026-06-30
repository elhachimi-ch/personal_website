(function () {
    const DEFAULT_SETTINGS = {
        mode: 'normal',
        animation_automation_time_interval: 3,
        celebration_when_click: false
    };

    function parseBoolean(value) {
        const normalized = String(value).trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
        return null;
    }

    const VALID_MODES = new Set(['normal', 'celebrations', '7idad']);

    function parseSettingYaml(text) {
        const settings = { ...DEFAULT_SETTINGS };

        for (const line of text.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            const separator = trimmed.indexOf(':');
            if (separator === -1) continue;

            const key = trimmed.slice(0, separator).trim();
            let value = trimmed.slice(separator + 1).trim();
            value = value.replace(/^["']|["']$/g, '');

            if (key === 'mode') {
                settings.mode = value.toLowerCase();
            } else if (key === 'animation_automation_time_interval') {
                const parsed = Number(value);
                if (Number.isFinite(parsed) && parsed > 0) {
                    settings.animation_automation_time_interval = parsed;
                }
            } else if (key === 'celebration_when_click') {
                const parsed = parseBoolean(value);
                if (parsed !== null) {
                    settings.celebration_when_click = parsed;
                }
            }
        }

        return settings;
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function initCelebrations(settings) {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;

        window.addEventListener('mousemove', (event) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
        });

        const intervalSeconds = Number(settings.animation_automation_time_interval) || 3;
        const intervalMs = Math.max(intervalSeconds, 0.5) * 1000;

        function burstAt(x, y) {
            if (typeof confetti === 'function') {
                confetti({ position: { x, y } });
            }
        }

        setInterval(() => {
            burstAt(mouseX, mouseY);
        }, intervalMs);

        if (settings.celebration_when_click) {
            window.addEventListener('click', (event) => {
                burstAt(event.clientX, event.clientY);
            });
        }
    }

    async function initModeEffects() {
        let settings = { ...DEFAULT_SETTINGS };

        try {
            const response = await fetch('setting.yaml');
            if (response.ok) {
                settings = parseSettingYaml(await response.text());
            }
        } catch (error) {
            console.warn('Could not load setting.yaml; using defaults.', error);
        }

        if (!VALID_MODES.has(settings.mode)) {
            console.warn(`Unknown mode "${settings.mode}"; falling back to normal.`);
            settings.mode = 'normal';
        }

        if (settings.mode === 'celebrations') {
            try {
                await loadScript('https://cdn.jsdelivr.net/npm/@hiseb/confetti@2.1.0/dist/confetti.min.js');
                initCelebrations(settings);
            } catch (error) {
                console.error('Failed to load confetti library.', error);
            }
        }

        // 7idad mode: reserved for future effects
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModeEffects);
    } else {
        initModeEffects();
    }
})();
