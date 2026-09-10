(function () {
    const DEFAULT_SETTINGS = {
        mode: 'normal',
        genre: 'no',
        audio_name: '',
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
    const AUDIOS_CSV_PATHS = ['assets/data/audios.csv', './assets/data/audios.csv', '/assets/data/audios.csv', '../assets/data/audios.csv'];

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
            } else if (key === 'audio_name') {
                settings.audio_name = value;
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

    function extractYouTubeId(link) {
        if (typeof link !== 'string') {
            return '';
        }

        const match = link.trim().match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
        return match ? match[1] : '';
    }

    function parseAudiosCSV(text) {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (!lines.length) return [];

        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const columns = ['name', 'genre', 'link', 'start_time', 'end_time'].map(col => header.indexOf(col));
        if (columns.some(index => index === -1)) {
            console.warn('audios.csv is missing required columns (name, genre, link, start_time, end_time).');
            return [];
        }

        const [nameIndex, genreIndex, linkIndex, startIndex, endIndex] = columns;
        const tracks = [];

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            const name = (cols[nameIndex] || '').trim();
            const genre = (cols[genreIndex] || '').trim().toLowerCase();
            const link = (cols[linkIndex] || '').trim();
            const startRaw = (cols[startIndex] || '').trim();
            const endRaw = (cols[endIndex] || '').trim();
            const startTime = startRaw === '' ? 0 : Number(startRaw);
            // Empty end_time means play through to the video's natural end.
            const endTime = endRaw === '' ? null : Number(endRaw);
            const videoId = extractYouTubeId(link);

            if (!videoId || !Number.isFinite(startTime) || startTime < 0 || (endTime !== null && (!Number.isFinite(endTime) || endTime <= startTime))) {
                console.warn(`Skipping invalid audios.csv row: "${lines[i]}"`);
                continue;
            }

            tracks.push({ name, genre, link, videoId, start_time: startTime, end_time: endTime });
        }

        return tracks;
    }

    async function loadAudiosCatalog() {
        for (const path of AUDIOS_CSV_PATHS) {
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    continue;
                }

                return parseAudiosCSV(await response.text());
            } catch (error) {
                continue;
            }
        }

        console.warn('Could not load assets/data/audios.csv; audio disabled.');
        return [];
    }

    function resolveAudioSelection(settings, catalog) {
        if (isFridayLocalTime()) {
            const fridayTrack = pickRandom(catalog.filter(track => track.genre === 'anachid'));
            if (!fridayTrack) {
                return { enabled: false, genre: 'anachid' };
            }

            return { enabled: true, ...fridayTrack };
        }

        const audioName = typeof settings.audio_name === 'string' ? settings.audio_name.trim().toLowerCase() : '';
        if (audioName) {
            const namedTrack = catalog.find(track => track.name.toLowerCase() === audioName);
            if (namedTrack) {
                return { enabled: true, ...namedTrack };
            }
            console.warn(`No track named "${settings.audio_name}" found in audios.csv.`);
        }

        const genre = settings.genre;
        if (genre === 'no') {
            return { enabled: false, genre };
        }

        const track = pickRandom(catalog.filter(t => t.genre === genre));
        if (!track) {
            return { enabled: false, genre };
        }

        return { enabled: true, ...track };
    }

    let ytApiPromise = null;

    function ensureYouTubeApiLoaded() {
        if (window.YT && window.YT.Player) {
            return Promise.resolve();
        }

        if (!ytApiPromise) {
            ytApiPromise = new Promise((resolve) => {
                const previousCallback = window.onYouTubeIframeAPIReady;
                window.onYouTubeIframeAPIReady = () => {
                    if (typeof previousCallback === 'function') previousCallback();
                    resolve();
                };
                loadScript('https://www.youtube.com/iframe_api').catch(() => resolve());
            });
        }

        return ytApiPromise;
    }

    const audioController = {
        player: null,
        selection: null,
        loopIntervalId: null,
        gestureListenersBound: false,
        buttonBound: false,
        visibilityBound: false,
        shouldBePlaying: false
    };

    function updateAudioBtn() {
        const audioBtn = document.getElementById('audioToggleBtn');
        const player = audioController.player;
        if (!audioBtn || !player || typeof player.getPlayerState !== 'function') return;

        const isPlaying = player.getPlayerState() === YT.PlayerState.PLAYING;
        const isMuted = player.isMuted();

        if (!isPlaying) {
            audioBtn.textContent = '▶';
            audioBtn.setAttribute('aria-label', 'Play audio');
            audioBtn.title = 'Play audio';
        } else {
            audioBtn.textContent = isMuted ? '🔇' : '⏸';
            audioBtn.setAttribute('aria-label', isMuted ? 'Unmute audio' : 'Pause audio');
            audioBtn.title = isMuted ? 'Unmute audio' : 'Pause audio';
        }
    }

    function bindUnmuteOnGesture() {
        if (audioController.gestureListenersBound) return;
        audioController.gestureListenersBound = true;

        function unmuteOnGesture() {
            const player = audioController.player;
            if (player) {
                player.unMute();
                if (audioController.shouldBePlaying && player.getPlayerState() !== YT.PlayerState.PLAYING) {
                    player.playVideo();
                }
            }
            updateAudioBtn();
            document.removeEventListener('click', unmuteOnGesture);
            document.removeEventListener('keydown', unmuteOnGesture);
            document.removeEventListener('touchstart', unmuteOnGesture);
            document.removeEventListener('scroll', unmuteOnGesture);
            document.removeEventListener('mousemove', unmuteOnGesture);
        }

        document.addEventListener('click', unmuteOnGesture, { once: true });
        document.addEventListener('keydown', unmuteOnGesture, { once: true });
        document.addEventListener('touchstart', unmuteOnGesture, { once: true });
        document.addEventListener('scroll', unmuteOnGesture, { once: true });
        document.addEventListener('mousemove', unmuteOnGesture, { once: true });
    }

    function startLoopCheck() {
        stopLoopCheck();
        audioController.loopIntervalId = setInterval(() => {
            const player = audioController.player;
            const selection = audioController.selection;
            if (!player || !selection || typeof player.getCurrentTime !== 'function') return;

            const state = player.getPlayerState();
            if (audioController.shouldBePlaying && state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.BUFFERING) {
                player.playVideo();
                return;
            }

            if (state === YT.PlayerState.PLAYING && selection.end_time !== null && player.getCurrentTime() >= selection.end_time) {
                player.seekTo(selection.start_time, true);
            }
        }, 500);
    }

    function stopLoopCheck() {
        if (audioController.loopIntervalId !== null) {
            clearInterval(audioController.loopIntervalId);
            audioController.loopIntervalId = null;
        }
    }

    function bindAudioButton() {
        if (audioController.buttonBound) return;
        audioController.buttonBound = true;

        const audioBtn = document.getElementById('audioToggleBtn');
        if (!audioBtn) return;

        audioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const player = audioController.player;
            if (!player) return;

            if (player.getPlayerState() === YT.PlayerState.PLAYING) {
                audioController.shouldBePlaying = false;
                player.pauseVideo();
            } else {
                audioController.shouldBePlaying = true;
                player.unMute();
                player.playVideo();
            }
            updateAudioBtn();
        });
    }

    // Browsers/YouTube can force-pause playback in background tabs; resume as soon as it's visible again.
    function bindVisibilityResume() {
        if (audioController.visibilityBound) return;
        audioController.visibilityBound = true;

        document.addEventListener('visibilitychange', () => {
            const player = audioController.player;
            if (!document.hidden && audioController.shouldBePlaying && player && player.getPlayerState() !== YT.PlayerState.PLAYING) {
                player.playVideo();
            }
        });
    }

    async function configurePlayer(selection) {
        const audioBtn = document.getElementById('audioToggleBtn');

        if (!selection.enabled) {
            audioController.shouldBePlaying = false;
            if (audioController.player) {
                audioController.player.pauseVideo();
            }
            stopLoopCheck();
            if (audioBtn) audioBtn.hidden = true;
            return;
        }

        audioController.selection = selection;
        audioController.shouldBePlaying = true;
        await ensureYouTubeApiLoaded();

        if (audioBtn) audioBtn.hidden = false;
        bindAudioButton();

        if (!audioController.player) {
            audioController.player = new YT.Player('siteAudioPlayer', {
                width: '2',
                height: '2',
                videoId: selection.videoId,
                playerVars: {
                    autoplay: 1,
                    mute: 1,
                    controls: 0,
                    disablekb: 1,
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    start: selection.start_time,
                    // No end_time: loop the whole video natively instead of cutting it off.
                    ...(selection.end_time === null ? { loop: 1, playlist: selection.videoId } : {})
                },
                events: {
                    onReady: () => {
                        audioController.player.mute();
                        audioController.player.playVideo();
                        bindUnmuteOnGesture();
                        bindVisibilityResume();
                        startLoopCheck();
                        updateAudioBtn();
                    },
                    onStateChange: (event) => {
                        if (event.data === YT.PlayerState.ENDED && audioController.selection && audioController.selection.end_time === null) {
                            audioController.player.seekTo(audioController.selection.start_time, true);
                            audioController.player.playVideo();
                        } else if (audioController.shouldBePlaying && event.data === YT.PlayerState.PAUSED) {
                            audioController.player.playVideo();
                        }
                        updateAudioBtn();
                    }
                }
            });
            return;
        }

        audioController.player.loadVideoById({ videoId: selection.videoId, startSeconds: selection.start_time });
        audioController.player.mute();
        audioController.player.playVideo();
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
            const settingPaths = ['setting.yaml', './setting.yaml', '/setting.yaml', '../setting.yaml'];

            for (const path of settingPaths) {
                const response = await fetch(path);
                if (!response.ok) {
                    continue;
                }

                settings = parseSettingYaml(await response.text());
                break;
            }
        } catch (error) {
            console.warn('Could not load setting.yaml; using defaults.', error);
        }

        if (!VALID_MODES.has(settings.mode)) {
            console.warn(`Unknown mode "${settings.mode}"; falling back to normal.`);
            settings.mode = 'normal';
        }

        const catalog = await loadAudiosCatalog();
        const validGenres = new Set([...catalog.map(track => track.genre), 'no']);

        if (!validGenres.has(settings.genre)) {
            console.warn(`Unknown genre "${settings.genre}"; falling back to no audio.`);
            settings.genre = 'no';
        }

        await configurePlayer(resolveAudioSelection(settings, catalog));

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
