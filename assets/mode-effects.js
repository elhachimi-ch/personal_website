(function () {
    const DEFAULT_SETTINGS = {
        mode: 'normal',
        genre: 'no',
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
    const AUDIO_LIBRARY = {
        anachid: [
            'anachid_madih_sama3_borda.mp3',
            'anachid_madih_sama3_hamzia.mp3',
            'anachid_madih_tachawa9at.mp3',
            'anachid_naciri_douaa.mp3',
            'anachid_nejma_fo9ara.mp3',
            'anachid_sama3_madih_matbo3.mp3',
            'anachid_ssoufi_allah_mawlana.mp3'
        ],
        chaabi_fez: [
            'tarab_andaloussi_ya_man_malakni.mp3'
        ],
        modern_morocco: [
            'hassani.mp3',
            'maalich_dystinct.mp3'
        ],
        classic_morocco: [
            'bladi_ya_zin_bldan_nouaman.mp3',
            'maghribi_classic_lghiwan_zin_mdihak.mp3',
            'maghribi_classic_mana_ila_bachar_ahmed_alaoui_classic_morocco.mp3',
            'maghribi_classic_yemkn_fayetli_cheftk_ossama.mp3',
            'mana_ila_bachar_doukkali.mp3',
            'nostalgie_ngoulek.mp3'
        ],
        ta9to9a: [
            'ta9to9a_bin_ljbal.mp3'
        ],
        tarab: [
            'tarab_sabah_fakhri_yamali_cham.m4a'
        ],
        '3ayta': [
            '3awniyat.mp3',
            '3aytat_lghzal.mp3',
            '3ayta_alwa_bhala.mp3',
            '3ayta_alwa_l3aydi.mp3',
            '3ayta_alwa_La3bari.mp3',
            '3ayta_alwa_wald_9addour.mp3',
            '3ayta_alwa_wald_aouni.mp3',
            '3ayta_alwa_wal_aouni.mp3',
            '3ayta_dami_bnthoucine.mp3',
            '3ayta_kebet_elkhayl_safi.mp3',
            '3ayta_kharboucha.mp3',
            '3ayta_lwad_lwad.mp3',
            '3ayta_nejma_dahi.mp3',
            '3ayta_nostalgie_wald_9adour.mp3',
            '3ayta_settat_bladi_wald_aouni.mp3',
            '3ayta_swaken_taleb.mp3',
            '3ayta_tkbt_lkhayl_najm_chaabi.mp3',
            '3ayta_wald_9addour_brawl.mp3',
            'swakn_talab_ya_lf9ih.m4a'
        ]
    };
    const VALID_GENRES = new Set([...Object.keys(AUDIO_LIBRARY), 'no']);

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
            } else if (key === 'genre') {
                settings.genre = value.toLowerCase();
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

    function pickRandom(items) {
        if (!Array.isArray(items) || items.length === 0) {
            return null;
        }

        return items[Math.floor(Math.random() * items.length)];
    }

    function isFridayLocalTime(now = new Date()) {
        return now.getDay() === 5;
    }

    function resolveAudioSelection(settings) {
        const genre = isFridayLocalTime() ? 'anachid' : settings.genre;

        if (genre === 'no') {
            return { enabled: false, genre, src: '' };
        }

        const track = pickRandom(AUDIO_LIBRARY[genre]);
        if (!track) {
            return { enabled: false, genre, src: '' };
        }

        return {
            enabled: true,
            genre,
            src: `assets/media/audio/${genre}/${track}`
        };
    }

    function applyAudioSelection(selection) {
        const audio = document.getElementById('siteAudio');
        const audioBtn = document.getElementById('audioToggleBtn');

        if (audio) {
            if (selection.enabled) {
                audio.src = selection.src;
                audio.dataset.audioEnabled = 'true';
                audio.dataset.audioGenre = selection.genre;
            } else {
                audio.pause();
                audio.removeAttribute('src');
                audio.load();
                audio.dataset.audioEnabled = 'false';
                delete audio.dataset.audioGenre;
            }
        }

        if (audioBtn) {
            audioBtn.hidden = !selection.enabled;
        }

        document.dispatchEvent(new CustomEvent('siteaudio:config', {
            detail: selection
        }));
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

        if (!VALID_GENRES.has(settings.genre)) {
            console.warn(`Unknown genre "${settings.genre}"; falling back to no audio.`);
            settings.genre = 'no';
        }

        applyAudioSelection(resolveAudioSelection(settings));

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
