// --- Video overlay logic ---
function setupVideoOverlay() {
    const overlay = document.getElementById("videoOverlay");
    const video = document.getElementById("introVideo");
    if (!overlay || !video) return;

    const sources = ["vid2.mp4", "VID.mp4"];
    let introFinished = false;
    let endTimer;

    function hideOverlay() {
        if (introFinished) {
            return;
        }

        introFinished = true;
        window.clearTimeout(endTimer);
        overlay.classList.add("hide");
        window.setTimeout(() => {
            overlay.style.display = "none";
        }, 800);
        video.pause();
    }

    function armDurationFallback() {
        window.clearTimeout(endTimer);
        if (Number.isFinite(video.duration) && video.duration > 0) {
            endTimer = window.setTimeout(hideOverlay, Math.ceil(video.duration * 1000) + 450);
            return;
        }

        endTimer = window.setTimeout(hideOverlay, 9000);
    }

    async function trySource(index) {
        if (index >= sources.length) {
            hideOverlay();
            return;
        }

        const source = sources[index];
        video.src = source;
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute("muted", "");
        video.setAttribute("autoplay", "");
        video.setAttribute("playsinline", "");
        video.load();

        const metadataLoaded = await new Promise((resolve) => {
            let settled = false;

            const cleanup = () => {
                video.removeEventListener("loadedmetadata", onLoadedMetadata);
                video.removeEventListener("error", onError);
            };

            const onLoadedMetadata = () => {
                if (settled) {
                    return;
                }
                settled = true;
                cleanup();
                resolve(true);
            };

            const onError = () => {
                if (settled) {
                    return;
                }
                settled = true;
                cleanup();
                resolve(false);
            };

            video.addEventListener("loadedmetadata", onLoadedMetadata);
            video.addEventListener("error", onError);

            window.setTimeout(() => {
                if (settled) {
                    return;
                }
                settled = true;
                cleanup();
                resolve(false);
            }, 3500);
        });

        if (!metadataLoaded) {
            await trySource(index + 1);
            return;
        }

        try {
            await video.play();
            armDurationFallback();
        } catch {
            await trySource(index + 1);
        }
    }

    video.addEventListener("ended", hideOverlay);
    video.addEventListener("error", () => {
        if (!introFinished) {
            hideOverlay();
        }
    });

    trySource(0);
}
const heroCard = document.getElementById("heroCard");
const envelope = document.getElementById("envelope");
const invitationContent = document.getElementById("invitationContent");
const butterfliesContainer = document.getElementById("butterflies");
const petalsContainer = document.getElementById("petals");
const musicToggle = document.getElementById("musicToggle");
const guestGreeting = document.getElementById("guestGreeting");

let audioContext;
let audioMasterGain;
let musicPlaying = false;
let oscillators = [];

// Nombre personalizado por URL parameter: ?para=Nombre
function applyGuestName() {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("para");
    if (name && name.trim() !== "") {
        const safe = name.trim().replace(/[<>&"']/g, c => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", '"':'&quot;', "'":"&#x27;" })[c]);
        guestGreeting.textContent = "\u2728 Para: " + safe + " \u2728";
        guestGreeting.classList.add("visible");
    }
}

function createButterflies() {
    // Paleta nupcial ampliada
    const palette = [
        "rgba(123, 45, 66, 0.82)",
        "rgba(201, 168, 76, 0.85)",
        "rgba(242, 196, 206, 0.88)",
        "rgba(122, 158, 126, 0.80)",
        "rgba(216, 160, 176, 0.84)",
        "rgba(232, 201, 109, 0.80)",
        "rgba(160, 52, 83, 0.78)"
    ];

    for (let index = 0; index < 28; index += 1) {
        const butterfly = document.createElement("div");
        butterfly.className = "butterfly";
        // Distribucion uniforme por toda la pantalla
        butterfly.style.left = `${Math.random() * 110 - 5}%`;
        butterfly.style.top = `${Math.random() * 110 - 5}%`;
        butterfly.style.animationDuration = `${8 + Math.random() * 12}s`;
        butterfly.style.animationDelay = `${Math.random() * 8}s`;
        butterfly.style.setProperty("--butterfly-color", palette[index % palette.length]);
        // Tamanos variados para profundidad
        const scale = 0.7 + Math.random() * 0.8;
        butterfly.style.transform = `scale(${scale})`;
        butterfly.innerHTML = "<span></span>";
        butterfliesContainer.appendChild(butterfly);
    }
}

function createPetals() {
    for (let index = 0; index < 24; index += 1) {
        const petal = document.createElement("div");
        petal.className = "petal";
        petal.style.left = `${Math.random() * 100}%`;
        petal.style.top = `${-20 - Math.random() * 40}vh`;
        petal.style.animationDuration = `${10 + Math.random() * 12}s`;
        petal.style.animationDelay = `${Math.random() * 12}s`;
        petal.style.opacity = `${0.35 + Math.random() * 0.4}`;
        petalsContainer.appendChild(petal);
    }
}

function stopMusic() {
    oscillators.forEach(({ oscillator, gainNode, lfo }) => {
        gainNode.gain.cancelScheduledValues(audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 0.6);
        oscillator.stop(audioContext.currentTime + 0.7);
        lfo.stop(audioContext.currentTime + 0.7);
    });

    oscillators = [];
    musicPlaying = false;
    musicToggle.textContent = "Activar melodia";
    musicToggle.setAttribute("aria-pressed", "false");
}

function playMusic() {
    if (!audioContext) {
        audioContext = new window.AudioContext();
        audioMasterGain = audioContext.createGain();
        audioMasterGain.gain.value = 0.08;
        audioMasterGain.connect(audioContext.destination);
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const notes = [261.63, 329.63, 392.0, 523.25];
    const now = audioContext.currentTime;

    oscillators = notes.map((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();

        oscillator.type = index % 2 === 0 ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(frequency, now);

        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(0.05 / (index + 1), now + 1.6);

        lfo.type = "sine";
        lfo.frequency.value = 0.12 + index * 0.03;
        lfoGain.gain.value = 8 + index * 1.5;

        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);

        oscillator.connect(gainNode);
        gainNode.connect(audioMasterGain);

        oscillator.start(now + index * 0.08);
        lfo.start(now + index * 0.08);

        return { oscillator, gainNode, lfo };
    });

    musicPlaying = true;
    musicToggle.textContent = "Silenciar melodia";
    musicToggle.setAttribute("aria-pressed", "true");
}

function toggleMusic() {
    if (musicPlaying) {
        stopMusic();
        return;
    }

    playMusic();
}

function openInvitation() {
    heroCard.classList.add("is-open");
    envelope.setAttribute("aria-expanded", "true");

    // Oculta el texto introductorio con fade
    const intro = document.querySelector(".intro");
    if (intro) {
        intro.classList.add("hidden");
    }

    window.setTimeout(() => {
        invitationContent.classList.add("visible");
        invitationContent.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 360);

    if (!musicPlaying) {
        playMusic();
    }
}

function initScrollReveal() {
    // Asigna clases de animacion a cada elemento
    const map = [
        { selector: ".invitation-panel h2",          classes: ["reveal", "reveal-drop"] },
        { selector: ".location",                     classes: ["reveal", "reveal-rise"] },
        { selector: ".location-note",                classes: ["reveal", "reveal-rise"] },
        { selector: ".divider-floral",               classes: ["reveal", "reveal-pop"] },
        { selector: ".detail-grid article",          classes: ["reveal", "reveal-card"], stagger: 130 },
        { selector: "blockquote",                    classes: ["reveal", "reveal-left"] },
        { selector: ".rsvp-box",                     classes: ["reveal", "reveal-scale"] },
        { selector: ".closing",                      classes: ["reveal", "reveal-glow"] }
    ];

    map.forEach(({ selector, classes, stagger }) => {
        document.querySelectorAll(selector).forEach((el, index) => {
            classes.forEach(c => el.classList.add(c));
            if (stagger) {
                el.style.transitionDelay = `${index * stagger}ms`;
            }
        });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

musicToggle.addEventListener("click", toggleMusic);
envelope.addEventListener("click", openInvitation, { once: true });

applyGuestName();
createButterflies();
createPetals();
initScrollReveal();
setupVideoOverlay();