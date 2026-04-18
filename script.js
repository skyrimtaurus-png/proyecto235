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
const guestGreeting = document.getElementById("guestGreeting");

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



function openInvitation() {
    heroCard.classList.add("is-open");
    envelope.setAttribute("aria-expanded", "true");

    // Inicia música AQUÍ: ya hay gesto del usuario → autoplay con sonido garantizado
    startYTPlayer();

    // Oculta el texto introductorio con fade
    const intro = document.querySelector(".intro");
    if (intro) {
        intro.classList.add("hidden");
    }

    window.setTimeout(() => {
        invitationContent.classList.add("visible");
        invitationContent.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 360);

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

envelope.addEventListener("click", openInvitation, { once: true });

// --- YouTube música aleatoria ---
const YT_VIDEOS = [
    "e5bUY_e2V4U",
    "Fa36CaBfONo",
    "RXZzJi2svyg",
    "5-g2u3h2ocA",
    "Kh4lsws7GGE",
    "1DC6VKZ1QLc",
    "CKH9Qy3FDCY"
];

let ytPlayer = null;
let ytMuted = false;
let ytApiReady = false;
let ytStartPending = false;
const ytMuteBtn = document.getElementById("ytMuteBtn");

// La API llama esta función cuando está lista
function onYouTubeIframeAPIReady() {
    ytApiReady = true;
    if (ytStartPending) {
        ytStartPending = false;
        _createYTPlayer();
    }
}

// Llamar desde openInvitation() — ya hay gesto de usuario
function startYTPlayer() {
    if (ytPlayer) return; // ya iniciado
    if (ytApiReady) {
        _createYTPlayer();
    } else {
        ytStartPending = true; // esperamos a que cargue la API
    }
}

let ytCurrentId = null;

function _createYTPlayer() {
    ytCurrentId = YT_VIDEOS[Math.floor(Math.random() * YT_VIDEOS.length)];
    ytPlayer = new YT.Player("yt-player", {
        videoId: ytCurrentId,
        playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0
        },
        events: {
            onReady: function(e) {
                e.target.setVolume(60);
                e.target.playVideo();
                ytMuted = false;
                if (ytMuteBtn) {
                    ytMuteBtn.textContent = "\u{1F3B5}";
                    ytMuteBtn.setAttribute("aria-label", "Silenciar música");
                    ytMuteBtn.classList.remove("muted");
                }
            },
            onStateChange: function(e) {
                // Estado 1 = playing: quitar spinner
                if (e.data === YT.PlayerState.PLAYING) {
                    const btn = document.getElementById("ytNextBtn");
                    if (btn) btn.classList.remove("loading");
                }
                // Estado 0 = ended: reiniciar la misma canción (loop manual)
                if (e.data === YT.PlayerState.ENDED) {
                    e.target.playVideo();
                }
            }
        }
    });
}

function ytNextSong() {
    if (!ytPlayer || typeof ytPlayer.loadVideoById !== "function") return;
    // Mostrar spinner inmediatamente
    const btn = document.getElementById("ytNextBtn");
    if (btn) btn.classList.add("loading");
    // Elegir canción diferente a la actual
    let newId;
    do {
        newId = YT_VIDEOS[Math.floor(Math.random() * YT_VIDEOS.length)];
    } while (newId === ytCurrentId && YT_VIDEOS.length > 1);
    ytCurrentId = newId;
    // loadVideoById como string es más fiable entre navegadores
    ytPlayer.loadVideoById(newId);
    ytPlayer.setVolume(60);
    if (ytMuted) { ytPlayer.mute(); } else { ytPlayer.unMute(); }
    // El spinner se quita en onStateChange cuando el estado pasa a PLAYING
}

if (ytMuteBtn) {
    ytMuteBtn.addEventListener("click", function() {
        if (!ytPlayer || typeof ytPlayer.mute !== "function") return;
        if (ytMuted) {
            ytPlayer.unMute();
            ytMuted = false;
            ytMuteBtn.textContent = "\u{1F3B5}";
            ytMuteBtn.setAttribute("aria-label", "Silenciar música");
            ytMuteBtn.classList.remove("muted");
        } else {
            ytPlayer.mute();
            ytMuted = true;
            ytMuteBtn.textContent = "\u{1F507}";
            ytMuteBtn.setAttribute("aria-label", "Activar música");
            ytMuteBtn.classList.add("muted");
        }
    });
}

const ytNextBtn = document.getElementById("ytNextBtn");
if (ytNextBtn) {
    ytNextBtn.addEventListener("click", ytNextSong);
}

applyGuestName();
createButterflies();
createPetals();
initScrollReveal();
setupVideoOverlay();