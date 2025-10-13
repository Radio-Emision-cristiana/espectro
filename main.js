// ========================================
// REPRODUCTOR ULTRA SIMPLE - SOLO LO ESENCIAL
// ========================================

console.log('🚀 Cargando reproductor ultra simple...');

// VERIFICAR QUE LOS ELEMENTOS EXISTAN
const audio = document.getElementById('audio-player');
const miniPlayButton = document.getElementById('mini-play-button');
const miniVolumeSlider = document.getElementById('mini-volume-slider');
const miniEqualizerContainer = document.querySelector('.mini-equalizer-container');
const liveIndicator = document.querySelector('.live-indicator');

console.log('🔍 Audio element:', audio ? 'FOUND' : 'NOT FOUND');
console.log('🔍 Play button:', miniPlayButton ? 'FOUND' : 'NOT FOUND');
console.log('🔍 Volume slider:', miniVolumeSlider ? 'FOUND' : 'NOT FOUND');

// Elementos de metadata
const songTitle = document.getElementById('song-title');
const artistName = document.getElementById('artist-name');
const albumCover = document.getElementById('album-cover');
const miniSongTitle = document.getElementById('mini-song-title');
const miniArtistName = document.getElementById('mini-artist-name');
const miniAlbumCover = document.getElementById('mini-album-cover');

console.log('🔍 Song title element:', songTitle ? 'FOUND' : 'NOT FOUND');
console.log('🔍 Artist element:', artistName ? 'FOUND' : 'NOT FOUND');

let isPlaying = false;
let playlist = [];
let currentSongIndex = 0;

// ========================================
// FUNCIONES DE METADATA
// ========================================

function updateMetadata(title, artist, coverUrl = 'portada.jpg') {
    console.log('📄 Actualizando metadata:', title, '-', artist);
    
    // Actualizar reproductor principal
    if (songTitle) songTitle.textContent = title;
    if (artistName) artistName.textContent = artist;
    if (albumCover) albumCover.src = coverUrl;
    
    // Actualizar mini reproductor
    if (miniSongTitle) miniSongTitle.textContent = title;
    if (miniArtistName) miniArtistName.textContent = artist;
    if (miniAlbumCover) miniAlbumCover.src = coverUrl;
    
    console.log('✅ Metadata actualizada');
}

function fetchItunesData(artist, title) {
    const itunesApiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist + ' ' + title)}&entity=song&limit=1`;
    
    console.log('🍎 Buscando carátula en iTunes para:', artist, '-', title);
    
    return fetch(itunesApiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                console.log('✅ Carátula encontrada en iTunes');
                return data.results[0];
            }
            console.log('⚠️ No se encontró carátula en iTunes');
            return {};
        })
        .catch(error => {
            console.error('❌ Error fetching iTunes data:', error);
            return {};
        });
}

function fetchAlbumCover(artist, title) {
    fetchItunesData(artist, title).then(data => {
        if (data.artworkUrl100) {
            const albumCoverUrl = data.artworkUrl100.replace('100x100', '600x600');
            console.log('🖼️ Actualizando carátula:', albumCoverUrl);
            updateMetadata(title, artist, albumCoverUrl);
        } else {
            console.log('📷 Usando carátula por defecto');
            updateMetadata(title, artist, 'portada.jpg');
        }
    });
}

function startMetadataUpdates() {
    console.log('📡 Iniciando conexión a metadata en tiempo real...');
    
    const eventSource = new EventSource('https://api.zeno.fm/mounts/metadata/subscribe/yg7bvksbfwzuv');

    eventSource.onmessage = function(event) {
        console.log('📨 Metadata recibida:', event.data);
        
        try {
            const data = JSON.parse(event.data);
            if (data.streamTitle) {
                console.log('🎵 Nueva canción:', data.streamTitle);
                
                const parts = data.streamTitle.split(' - ');
                if (parts.length >= 2) {
                    const artist = parts.pop();
                    const title = parts.join(' - ');
                    
                    console.log('🎤 Artista:', artist);
                    console.log('🎵 Título:', title);
                    
                    // Agregar a playlist si es nueva
                    const newSong = { artist, title };
                    if (!playlist.some(song => song.artist === artist && song.title === title)) {
                        playlist.push(newSong);
                        console.log('➕ Canción agregada a playlist');
                    }
                    
                    currentSongIndex = playlist.findIndex(song => song.artist === artist && song.title === title);
                    
                    // Actualizar metadata inmediatamente
                    updateMetadata(title, artist);
                    
                    // Buscar carátula
                    fetchAlbumCover(artist, title);
                    
                } else {
                    console.log('🎵 Título simple:', data.streamTitle);
                    updateMetadata(data.streamTitle, 'Artista desconocido', 'portada.jpg');
                }
            }
        } catch (error) {
            console.error('❌ Error procesando metadata:', error);
        }
    };

    eventSource.onerror = function(error) {
        console.error('❌ Error en la conexión EventSource:', error);
        eventSource.close();
        
        // Reintentar después de 5 segundos
        setTimeout(() => {
            console.log('🔄 Reintentando conexión de metadata...');
            startMetadataUpdates();
        }, 5000);
    };
    
    console.log('✅ Conexión de metadata configurada');
}

// ========================================
// FUNCIÓN DE TEMA (MODO CLARO/OSCURO)
// ========================================

function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    
    if (!themeToggle) {
        console.log('⚠️ Botón de tema no encontrado');
        return;
    }
    
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    
    body.classList.toggle('dark-theme');
    
    if (body.classList.contains('dark-theme')) {
        // Cambiar a modo oscuro
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'block';
        localStorage.setItem('theme', 'dark');
        console.log('🌙 Cambiado a modo oscuro');
    } else {
        // Cambiar a modo claro
        if (sunIcon) sunIcon.style.display = 'block';
        if (moonIcon) moonIcon.style.display = 'none';
        localStorage.setItem('theme', 'light');
        console.log('☀️ Cambiado a modo claro');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    
    if (!themeToggle) {
        console.log('⚠️ Elementos de tema no encontrados');
        return;
    }
    
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'block';
        console.log('🌙 Tema oscuro cargado');
    } else {
        // Modo claro por defecto
        body.classList.remove('dark-theme');
        if (sunIcon) sunIcon.style.display = 'block';
        if (moonIcon) moonIcon.style.display = 'none';
        console.log('☀️ Tema claro cargado');
    }
}

// ========================================
// FUNCIÓN PRINCIPAL: PLAY/PAUSE
// ========================================
function togglePlayStop() {
    console.log('🎵 Toggle play/stop - isPlaying:', isPlaying);
    
    if (isPlaying) {
        // PAUSAR
        console.log('⏸️ Pausando...');
        audio.pause();
    } else {
        // REPRODUCIR
        console.log('▶️ Reproduciendo...');
        audio.play()
            .then(() => {
                console.log('✅ Audio started successfully');
            })
            .catch(error => {
                console.error('❌ Audio error:', error);
            });
    }
}

// ========================================
// ANIMACIÓN SIMPLE DEL VISUALIZADOR
// ========================================
function activateVisualizer() {
    console.log('📊 Activando visualizador...');
    
    const bars = document.querySelectorAll('.mini-equalizer-bar');
    console.log('Barras encontradas:', bars.length);
    
    if (bars.length === 0) {
        console.error('❌ No se encontraron barras del visualizador');
        return;
    }
    
    // Activar animación CSS simple
    bars.forEach((bar, index) => {
        bar.style.animation = `fallbackEqualize ${0.8 + (index % 3) * 0.2}s ease-in-out infinite`;
        bar.style.animationDelay = `${(index * 0.03)}s`;
        bar.style.height = '';
    });
    
    console.log('✅ Visualizador activado');
}

function deactivateVisualizer() {
    console.log('📊 Desactivando visualizador...');
    
    const bars = document.querySelectorAll('.mini-equalizer-bar');
    
    bars.forEach(bar => {
        bar.style.animation = 'none';
        bar.style.height = '10%';
    });
    
    console.log('✅ Visualizador desactivado');
}

// ========================================
// ACTUALIZAR ESTADO VISUAL
// ========================================
function updateUI(playing) {
    console.log('🔄 Actualizando UI - playing:', playing);
    
    isPlaying = playing;
    
    // Obtener elementos del mini reproductor para efectos visuales
    const miniPlayer = document.querySelector('.mini-player');
    const miniCoverContainer = document.querySelector('.mini-cover-container');
    
    if (playing) {
        // ESTADO: REPRODUCIENDO
        miniPlayButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="25" height="25">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
        `;
        miniPlayButton.classList.add('playing');
        
        // Agregar clases CSS para efectos visuales elegantes
        if (miniPlayer) {
            miniPlayer.classList.add('playing');
        }
        if (miniCoverContainer) {
            miniCoverContainer.classList.add('playing');
        }
        
        // Activar visualizador
        activateVisualizer();
        
        // Mostrar indicador EN VIVO
        if (liveIndicator) {
            liveIndicator.style.display = 'flex';
        }
        
        console.log('✅ UI actualizada - REPRODUCIENDO con efectos visuales');
        
    } else {
        // ESTADO: PAUSADO
        miniPlayButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="25" height="25">
                <path d="M8 5v14l11-7z"/>
            </svg>
        `;
        miniPlayButton.classList.remove('playing');
        
        // Remover clases CSS para efectos visuales
        if (miniPlayer) {
            miniPlayer.classList.remove('playing');
        }
        if (miniCoverContainer) {
            miniCoverContainer.classList.remove('playing');
        }
        
        // Desactivar visualizador
        deactivateVisualizer();
        
        // Ocultar indicador EN VIVO
        if (liveIndicator) {
            liveIndicator.style.display = 'none';
        }
        
        console.log('✅ UI actualizada - PAUSADO');
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

// Click en botón de play
if (miniPlayButton) {
    miniPlayButton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('🖱️ Click en botón de play detectado');
        togglePlayStop();
    });
    console.log('✅ Event listener del botón configurado');
} else {
    console.error('❌ No se encontró el botón de play');
}

// ========================================
// CONTROL DE VOLUMEN FLOTANTE
// ========================================

const volumeToggleBtn = document.getElementById('volume-toggle-btn');
const volumeSliderContainer = document.getElementById('volume-slider-container');
const volumePercentage = document.getElementById('volume-percentage');

let isVolumeVisible = false;

// Función para actualizar el ícono de volumen
function updateVolumeIcon(volume) {
    if (!volumeToggleBtn) return;
    
    const svg = volumeToggleBtn.querySelector('svg');
    if (!svg) return;
    
    let iconPath = '';
    
    if (volume === 0) {
        // Mudo
        iconPath = 'M3 9v6h4l5 5V4L7 9H3zm7-.17v6.34L7.83 13H5v-2h2.83L10 8.83zM16 12c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1z';
    } else if (volume < 0.5) {
        // Volumen bajo
        iconPath = 'M3 9v6h4l5 5V4L7 9H3zm7-.17v6.34L7.83 13H5v-2h2.83L10 8.83zM16.5 12A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z';
    } else {
        // Volumen alto
        iconPath = 'M3 9v6h4l5 5V4L7 9H3zm7-.17v6.34L7.83 13H5v-2h2.83L10 8.83zM16.5 12A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z';
    }
    
    svg.querySelector('path').setAttribute('d', iconPath);
}

// Control de volumen - RESTAURADO A ORIGINAL
if (miniVolumeSlider) {
    miniVolumeSlider.addEventListener('input', function() {
        if (audio) {
            audio.volume = this.value;
            const percentage = Math.round(this.value * 100);
            if (volumePercentage) {
                volumePercentage.textContent = `${percentage}%`;
            }
            
            // Actualizar ícono según el volumen
            updateVolumeIcon(this.value);
        }
    });
    
    // Inicializar ícono
    updateVolumeIcon(miniVolumeSlider.value);
} else {
    console.log('⚠️ Control de volumen no encontrado');
}

// Toggle del botón de volumen - RESTAURADO A ORIGINAL
if (volumeToggleBtn && volumeSliderContainer) {
    volumeToggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (isVolumeVisible) {
            // Ocultar
            volumeSliderContainer.classList.remove('visible');
            isVolumeVisible = false;
        } else {
            // Mostrar
            volumeSliderContainer.classList.add('visible');
            isVolumeVisible = true;
        }
    });
    
    // Cerrar al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (isVolumeVisible && 
            !volumeToggleBtn.contains(e.target) && 
            !volumeSliderContainer.contains(e.target)) {
            volumeSliderContainer.classList.remove('visible');
            isVolumeVisible = false;
        }
    });
    
    // Inicializar porcentaje
    if (volumePercentage && miniVolumeSlider) {
        const initialPercentage = Math.round(miniVolumeSlider.value * 100);
        volumePercentage.textContent = `${initialPercentage}%`;
    }
} else {
    console.log('⚠️ Elementos del control flotante no encontrados');
}

// ========================================
// SISTEMA DE RECONEXIÓN AUTOMÁTICA
// ========================================

// Variables para el sistema de reconexión
let reconnectionAttempts = 0;
let maxReconnectionAttempts = 5;
let reconnectionDelay = 2000; // 2 segundos inicial
let reconnectionTimer = null;
let isReconnecting = false;
let wasPlayingBeforeError = false;
let originalStreamUrl = 'https://stream.zeno.fm/yg7bvksbfwzuv';
let connectionLostTime = null;

// Monitor de conexión a internet
let isOnline = navigator.onLine;
let offlineStartTime = null;

/**
 * Función para mostrar estado de conexión al usuario
 */
function showConnectionStatus(status, message) {
    console.log(`🌐 Estado de conexión: ${status} - ${message}`);
    
    // Actualizar UI según el estado
    const songTitle = document.getElementById('song-title');
    const artistName = document.getElementById('artist-name');
    const connectionStatus = document.getElementById('connection-status');
    const connectionText = connectionStatus?.querySelector('.connection-text');
    const connectionIcon = connectionStatus?.querySelector('.connection-icon');
    
    if (connectionStatus) {
        // Limpiar clases anteriores
        connectionStatus.className = 'connection-status show';
        
        // Agregar clase según el estado
        connectionStatus.classList.add(status);
        
        // Actualizar texto e icono
        if (connectionText) {
            connectionText.textContent = message;
        }
        
        if (connectionIcon) {
            switch(status) {
                case 'reconnecting':
                    connectionIcon.textContent = '🔄';
                    break;
                case 'offline':
                    connectionIcon.textContent = '📶';
                    break;
                case 'error':
                    connectionIcon.textContent = '❌';
                    break;
                case 'online':
                    connectionIcon.textContent = '✅';
                    break;
                default:
                    connectionIcon.textContent = '🌐';
            }
        }
        
        // Mostrar el indicador
        connectionStatus.style.display = 'flex';
        
        // Ocultar automáticamente después de un tiempo para estados exitosos
        if (status === 'online') {
            setTimeout(() => {
                hideConnectionStatus();
            }, 3000);
        }
    }
    
    // No mostrar mensajes de estado en la metadata
}

/**
 * Función para ocultar el indicador de estado
 */
function hideConnectionStatus() {
    const connectionStatus = document.getElementById('connection-status');
    if (connectionStatus) {
        connectionStatus.classList.remove('show');
        setTimeout(() => {
            connectionStatus.style.display = 'none';
        }, 300);
    }
}

/**
 * Función para intentar reconectar el streaming
 */
function attemptReconnection() {
    if (isReconnecting) {
        console.log('⚠️ Ya hay una reconexión en progreso');
        return;
    }
    
    if (!navigator.onLine) {
        console.log('📶 Sin conexión a internet, esperando...');
        showConnectionStatus('offline', 'Sin conexión a internet');
        return;
    }
    
    if (reconnectionAttempts >= maxReconnectionAttempts) {
        console.error('❌ Máximo de intentos de reconexión alcanzado');
        showConnectionStatus('error', 'No se pudo reconectar');
        resetReconnectionState();
        return;
    }
    
    isReconnecting = true;
    reconnectionAttempts++;
    
    console.log(`🔄 Intento de reconexión ${reconnectionAttempts}/${maxReconnectionAttempts}`);
    showConnectionStatus('reconnecting', 'Intentando reconectar...');
    
    if (audio) {
        // Pausar el audio actual
        audio.pause();
        
        // Limpiar el src y volverlo a establecer para forzar una nueva conexión
        audio.src = '';
        audio.load();
        
        // Pequeña pausa antes de establecer la nueva URL
        setTimeout(() => {
            audio.src = originalStreamUrl + '?t=' + Date.now(); // Cache busting
            audio.load();
            
            // Intentar reproducir después de un momento
            setTimeout(() => {
                if (wasPlayingBeforeError) {
                    audio.play()
                        .then(() => {
                            console.log('✅ Reconexión exitosa!');
                            resetReconnectionState();
                            
                            // Mostrar estado exitoso
                            showConnectionStatus('online', 'Conexión restaurada');
                            
                            // Restaurar metadata normal después de un momento
                            setTimeout(() => {
                                updateMetadata('Radio En Vivo', 'Música en Directo');
                            }, 1000);
                        })
                        .catch(error => {
                            console.error('❌ Error en reconexión:', error);
                            scheduleNextReconnectionAttempt();
                        });
                } else {
                    console.log('✅ Stream reconectado (en pausa)');
                    resetReconnectionState();
                }
            }, 500);
        }, 1000);
    }
}

/**
 * Programar el siguiente intento de reconexión
 */
function scheduleNextReconnectionAttempt() {
    isReconnecting = false;
    
    if (reconnectionAttempts < maxReconnectionAttempts) {
        const delay = Math.min(reconnectionDelay * Math.pow(2, reconnectionAttempts - 1), 30000); // Backoff exponencial, máximo 30s
        console.log(`⏰ Próximo intento en ${delay/1000} segundos`);
        
        reconnectionTimer = setTimeout(() => {
            attemptReconnection();
        }, delay);
    }
}

/**
 * Resetear el estado de reconexión
 */
function resetReconnectionState() {
    reconnectionAttempts = 0;
    isReconnecting = false;
    wasPlayingBeforeError = false;
    connectionLostTime = null;
    
    if (reconnectionTimer) {
        clearTimeout(reconnectionTimer);
        reconnectionTimer = null;
    }
}

/**
 * Manejar eventos de conexión/desconexión de internet
 */
function handleConnectionChange() {
    const wasOnline = isOnline;
    isOnline = navigator.onLine;
    
    console.log(`🌐 Cambio de conexión: ${wasOnline ? 'online' : 'offline'} → ${isOnline ? 'online' : 'offline'}`);
    
    if (!wasOnline && isOnline) {
        // Se recuperó la conexión
        console.log('✅ Conexión a internet recuperada');
        
        if (offlineStartTime) {
            const offlineDuration = Date.now() - offlineStartTime;
            console.log(`📊 Tiempo sin conexión: ${offlineDuration/1000} segundos`);
            offlineStartTime = null;
        }
        
        // Intentar reconectar el stream si estaba reproduciéndose
        if (wasPlayingBeforeError || (audio && !audio.paused)) {
            setTimeout(() => {
                attemptReconnection();
            }, 1000);
        }
    } else if (wasOnline && !isOnline) {
        // Se perdió la conexión
        console.log('❌ Conexión a internet perdida');
        offlineStartTime = Date.now();
        showConnectionStatus('offline', 'Sin conexión a internet');
        
        // Recordar si estaba reproduciéndose
        if (audio && !audio.paused) {
            wasPlayingBeforeError = true;
        }
    }
}

// Event listeners para conexión de internet
window.addEventListener('online', handleConnectionChange);
window.addEventListener('offline', handleConnectionChange);

// ========================================
// AUDIO EVENTS MEJORADOS CON RECONEXIÓN
// ========================================

// Audio events
if (audio) {
    audio.addEventListener('play', () => {
        console.log('🎵 Audio PLAY event');
        updateUI(true);
        resetReconnectionState(); // Reset porque está funcionando
    });
    
    audio.addEventListener('pause', () => {
        console.log('⏸️ Audio PAUSE event');
        updateUI(false);
    });
    
    audio.addEventListener('error', (e) => {
        console.error('❌ Audio ERROR:', e.type, e.target?.error?.message || 'Error desconocido');
        
        // Recordar si estaba reproduciéndose antes del error
        if (!audio.paused) {
            wasPlayingBeforeError = true;
        }
        
        updateUI(false);
        
        // Solo intentar reconectar si hay conexión a internet
        if (navigator.onLine) {
            connectionLostTime = Date.now();
            showConnectionStatus('error', 'Error de stream');
            
            // Esperar un momento antes de intentar reconectar
            setTimeout(() => {
                attemptReconnection();
            }, 2000);
        } else {
            showConnectionStatus('offline', 'Sin conexión a internet');
        }
    });
    
    audio.addEventListener('canplay', () => {
        console.log('✅ Audio CAN PLAY');
        // Si se había perdido la conexión, esto indica que se recuperó
        if (connectionLostTime) {
            const reconnectionTime = Date.now() - connectionLostTime;
            console.log(`📈 Stream recuperado en ${reconnectionTime/1000} segundos`);
        }
    });
    
    audio.addEventListener('loadstart', () => {
        console.log('📥 Audio LOAD START');
    });
    
    audio.addEventListener('waiting', () => {
        console.log('⏳ Audio WAITING for data');
        // Solo mostrar 'cargando' si no estamos en proceso de reconexión
        if (!isReconnecting) {
            showConnectionStatus('reconnecting', 'Cargando...');
        }
    });
    
    audio.addEventListener('playing', () => {
        console.log('▶️ Audio PLAYING (really playing)');
        // Stream está funcionando correctamente
        resetReconnectionState();
        
        // Ocultar indicador de conexión si está visible
        setTimeout(() => {
            hideConnectionStatus();
        }, 1000);
    });
    
    // Evento para detectar cuando se interrumpe el stream
    audio.addEventListener('stalled', () => {
        console.log('🛑 Audio STALLED - Stream interrumpido');
        if (navigator.onLine && !isReconnecting) {
            wasPlayingBeforeError = !audio.paused;
            setTimeout(() => {
                attemptReconnection();
            }, 3000);
        }
    });
    
    // Evento para detectar cuando no hay datos suficientes
    audio.addEventListener('suspend', () => {
        console.log('⏸️ Audio SUSPEND - Descarga suspendida');
    });
    
    // Evento cuando el stream se queda sin datos
    audio.addEventListener('emptied', () => {
        console.log('🗂️ Audio EMPTIED - Buffer vacío');
    });
    
    console.log('✅ Event listeners del audio configurados con reconexión automática');
} else {
    console.error('❌ CRÍTICO: No se encontró el elemento de audio');
}

// ========================================
// INICIALIZACIÓN
// ========================================
function initPlayer() {
    console.log('🔧 Inicializando reproductor...');
    
    // Verificar elementos críticos
    if (!audio) {
        console.error('❌ FATAL: No se puede inicializar sin elemento de audio');
        return;
    }
    
    if (!miniPlayButton) {
        console.error('❌ FATAL: No se puede inicializar sin botón de play');
        return;
    }
    
    // Cargar tema guardado
    console.log('🎨 Cargando tema...');
    loadTheme();
    
    // Estado inicial
    updateUI(false);
    
    // Inicializar metadata por defecto
    console.log('📄 Configurando metadata inicial...');
    updateMetadata('Cargando título...', 'Cargando artista...', 'portada.jpg');
    
    // Iniciar conexión de metadata
    console.log('📡 Iniciando sistema de metadata...');
    startMetadataUpdates();
    
    // Test inmediato del visualizador
    console.log('🧪 Probando visualizador inmediatamente...');
    activateVisualizer();
    
    setTimeout(() => {
        deactivateVisualizer();
        console.log('✅ Test del visualizador completado');
    }, 2000);
    
    // Intentar autoplay después de un momento
    setTimeout(() => {
        console.log('🚀 Intentando autoplay...');
        
        audio.play()
            .then(() => {
                console.log('✅ Autoplay exitoso');
            })
            .catch(error => {
                console.log('⚠️ Autoplay bloqueado (normal):', error.message);
            });
    }, 3000);
    
    console.log('✅ Reproductor inicializado');
}

// Función de inicialización más segura
function safeInit() {
    console.log('📋 Estado del documento:', document.readyState);
    
    // Esperar a que todos los elementos estén cargados
    if (document.readyState === 'complete') {
        initPlayer();
    } else {
        console.log('⏳ Esperando a que el documento se complete...');
        window.addEventListener('load', initPlayer);
    }
}

// Cargar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
} else {
    safeInit();
}

// ========================================
// FUNCIONES PARA REDES SOCIALES
// ========================================

// Función para detectar si está en móvil
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Función para Facebook
function openFacebook() {
    console.log('📱 Abriendo Facebook...');
    if (isMobile()) {
        // Intenta abrir la app de Facebook primero
        window.location.href = 'fb://page/61566380133969';
        // Fallback a la web después de un timeout
        setTimeout(() => {
            window.open('https://www.facebook.com/profile.php?id=61566380133969', '_blank');
        }, 1000);
    } else {
        // En desktop, abre la web directamente
        window.open('https://www.facebook.com/profile.php?id=61566380133969', '_blank');
    }
}

// Función para Instagram
function openInstagram() {
    console.log('📱 Abriendo Instagram...');
    if (isMobile()) {
        // Intenta abrir la app de Instagram primero
        window.location.href = 'instagram://user?username=tucu.gram';
        // Fallback a la web después de un timeout
        setTimeout(() => {
            window.open('https://www.instagram.com/tucu.gram/', '_blank');
        }, 1000);
    } else {
        // En desktop, abre la web directamente
        window.open('https://www.instagram.com/tucu.gram/', '_blank');
    }
}

// Función para Twitter
function openTwitter() {
    console.log('📱 Abriendo Twitter...');
    if (isMobile()) {
        // Intenta abrir la app de Twitter primero
        window.location.href = 'twitter://user?screen_name=tucudev';
        // Fallback a la web después de un timeout
        setTimeout(() => {
            window.open('https://twitter.com/tucudev', '_blank');
        }, 1000);
    } else {
        // En desktop, abre la web directamente
        window.open('https://twitter.com/tucudev', '_blank');
    }
}

// Función para Gmail
function openGmail() {
    console.log('📱 Abriendo Gmail...');
    if (isMobile()) {
        // En móvil, usa mailto para abrir la app de correo predeterminada
        window.location.href = 'mailto:?subject=Reproductor Radio&body=¡Escucha nuestra radio en vivo!';
    } else {
        // En desktop, abre Gmail web
        window.open('https://mail.google.com/', '_blank');
    }
}

// ========================================
// ========================================
// FUNCIONES DE COMPARTIR INTELIGENTE
// ========================================

const shareUrl = 'https://radioemisioncristiana.blogspot.com/';
const shareTitle = 'Radio Emisión Cristiana';
const shareDescription = '¡Escucha nuestra radio cristiana en vivo!';

/**
 * Función principal de compartir inteligente
 * Detecta el dispositivo y usa Web Share API en móviles o modal en PC
 */
function intelligentShare() {
    console.log('📤 Iniciando compartir inteligente...');
    
    // Detectar si es dispositivo móvil
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Verificar si Web Share API está disponible
    const hasWebShareAPI = 'share' in navigator;
    
    console.log('📱 Dispositivo móvil:', isMobileDevice);
    console.log('🔗 Web Share API disponible:', hasWebShareAPI);
    
    if (isMobileDevice && hasWebShareAPI) {
        // Usar Web Share API nativa en móviles
        useNativeShare();
    } else {
        // Usar modal tradicional en PC o si Web Share API no está disponible
        toggleShareModal();
    }
}

/**
 * Función para usar la API nativa de compartir en móviles
 */
function useNativeShare() {
    console.log('📲 Usando Web Share API nativa...');
    
    // Agregar clase visual al botón
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.classList.add('sharing');
    }
    
    // Obtener información actual de la canción si está disponible
    const songTitle = document.getElementById('song-title')?.textContent || shareTitle;
    const artistName = document.getElementById('artist-name')?.textContent || '';
    
    // Crear mensaje personalizado con la canción actual
    let customTitle = shareTitle;
    let customText = shareDescription;
    
    if (songTitle && songTitle !== 'Cargando título...' && !songTitle.includes('Reconectando') && !songTitle.includes('Sin conexión')) {
        if (artistName && artistName !== 'Cargando artista...' && !artistName.includes('Intento')) {
            customTitle = `🎵 ${songTitle} - ${artistName}`;
            customText = `¡Escucha "${songTitle}" de ${artistName} en nuestra radio cristiana en vivo! 🙏`;
        } else {
            customTitle = `🎵 ${songTitle}`;
            customText = `¡Escucha "${songTitle}" en nuestra radio cristiana en vivo! 🙏`;
        }
    }
    
    const shareData = {
        title: customTitle,
        text: customText,
        url: shareUrl
    };
    
    console.log('📋 Datos para compartir:', shareData);
    
    navigator.share(shareData)
        .then(() => {
            console.log('✅ Contenido compartido exitosamente');
            
            // Efecto visual de éxito
            if (shareBtn) {
                shareBtn.classList.remove('sharing');
                shareBtn.classList.add('success');
                
                // Quitar clase de éxito después de la animación
                setTimeout(() => {
                    shareBtn.classList.remove('success');
                }, 1000);
            }
            
            // Mostrar mensaje de éxito
            showTemporaryMessage('✅ ¡Compartido exitosamente!', 'success');
        })
        .catch((error) => {
            console.log('❌ Error al compartir o cancelado por el usuario:', error);
            
            // Quitar clase de sharing
            if (shareBtn) {
                shareBtn.classList.remove('sharing');
            }
            
            // Si falla la API nativa, usar modal como fallback
            if (error.name !== 'AbortError') {
                console.log('🔄 Fallback: usando modal tradicional...');
                showTemporaryMessage('📱 Abriendo opciones de compartir...', 'info');
                setTimeout(() => {
                    toggleShareModal();
                }, 500);
            } else {
                // Usuario canceló el compartir
                console.log('🚫 Usuario canceló el compartir');
            }
        });
}

/**
 * Función para mostrar mensajes temporales al usuario
 */
function showTemporaryMessage(message, type = 'info') {
    const songTitle = document.getElementById('song-title');
    const artistName = document.getElementById('artist-name');
    
    if (songTitle) {
        const originalTitle = songTitle.textContent;
        const originalArtist = artistName?.textContent || '';
        
        // Mostrar mensaje
        songTitle.textContent = message;
        if (artistName) artistName.textContent = '';
        
        // Restaurar después de 2 segundos
        setTimeout(() => {
            songTitle.textContent = originalTitle;
            if (artistName) artistName.textContent = originalArtist;
        }, 2000);
    }
}

// Función para mostrar/ocultar el modal de compartir (mantenida para compatibilidad)
function toggleShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
        console.log('📱 Modal de compartir:', modal.style.display === 'block' ? 'mostrado' : 'ocultado');
    }
}

// Función para compartir en Facebook
function shareOnFacebook() {
    console.log('📱 Compartiendo en Facebook...');
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&t=${encodeURIComponent(shareTitle)}`;
    window.open(url, '_blank', 'width=600,height=400');
    toggleShareModal();
}

// Función para compartir en Twitter
function shareOnTwitter() {
    console.log('📱 Compartiendo en Twitter...');
    const text = `${shareTitle} - ${shareDescription}`;
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
    toggleShareModal();
}

// Función para compartir en WhatsApp
function shareOnWhatsApp() {
    console.log('📱 Compartiendo en WhatsApp...');
    const text = `${shareTitle} - ${shareDescription} ${shareUrl}`;
    if (isMobile()) {
        // En móvil, usa la app de WhatsApp
        window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
    } else {
        // En desktop, usa WhatsApp Web
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
    toggleShareModal();
}

// Función para "compartir" en Instagram (realmente abre Instagram)
function shareOnInstagram() {
    console.log('📱 Abriendo Instagram...');
    // Instagram no permite compartir enlaces directamente, así que abrimos la app/web
    if (isMobile()) {
        // Intenta abrir la app de Instagram
        window.location.href = 'instagram://camera';
        // Fallback a la web después de un timeout
        setTimeout(() => {
            window.open('https://www.instagram.com/', '_blank');
        }, 1000);
    } else {
        // En desktop, abre Instagram web
        window.open('https://www.instagram.com/', '_blank');
    }
    toggleShareModal();
}

// Event listeners para el modal de compartir
document.addEventListener('DOMContentLoaded', function() {
    const shareBtn = document.getElementById('share-btn');
    const closeShareModal = document.getElementById('close-share-modal');
    const shareModal = document.getElementById('share-modal');
    
    // Abrir modal con función inteligente
    if (shareBtn) {
        shareBtn.addEventListener('click', intelligentShare);
    }
    
    // Cerrar modal con botón X
    if (closeShareModal) {
        closeShareModal.addEventListener('click', toggleShareModal);
    }
    
    // Cerrar modal al hacer clic fuera de él
    if (shareModal) {
        shareModal.addEventListener('click', function(e) {
            if (e.target === shareModal) {
                toggleShareModal();
            }
        });
    }
    
    console.log('✅ Event listeners de compartir agregados');
});

// ========================================
// FUNCIONALIDAD WHATSAPP
// ========================================

// WhatsApp Message Functionality
document.addEventListener('DOMContentLoaded', function() {
    const whatsappMessage = document.getElementById('whatsapp-message');
    const whatsappMessageClose = document.getElementById('whatsapp-message-close');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    
    if (whatsappMessage && whatsappMessageClose && whatsappBtn) {
        let messageTimer;
        let hideTimer;
        
        // Función para mostrar el mensaje
        function showWhatsAppMessage() {
            console.log('📱 Mostrando mensaje de WhatsApp');
            whatsappMessage.classList.add('show');
            
            // Ocultar después de 10 segundos
            hideTimer = setTimeout(() => {
                hideWhatsAppMessage();
            }, 10000);
        }
        
        // Función para ocultar el mensaje
        function hideWhatsAppMessage() {
            console.log('📱 Ocultando mensaje de WhatsApp');
            whatsappMessage.classList.remove('show');
            if (hideTimer) {
                clearTimeout(hideTimer);
            }
        }
        
        // Configurar timer para mostrar mensaje cada 5 minutos
        function startMessageTimer() {
            // Mostrar el primer mensaje después de 5 minutos
            messageTimer = setTimeout(() => {
                showWhatsAppMessage();
                
                // Configurar intervalo para cada 5 minutos después del primero
                setInterval(() => {
                    showWhatsAppMessage();
                }, 5 * 60 * 1000); // 5 minutos
            }, 5 * 60 * 1000); // 5 minutos para el primer mensaje
        }
        
        // Event listener para cerrar el mensaje
        whatsappMessageClose.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hideWhatsAppMessage();
        });
        
        // Event listener para el botón de WhatsApp (se mantiene por compatibilidad)
        whatsappBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // La nueva función openWhatsAppIntelligent() se maneja desde el onclick del HTML
            console.log('📱 Click en WhatsApp detectado (función legacy)');
        });
        
        // Iniciar el timer
        startMessageTimer();
        
        console.log('✅ Funcionalidad de WhatsApp inicializada');
    } else {
        console.error('❌ No se encontraron elementos de WhatsApp');
    }
});

// ========================================
// FUNCIÓN INTELIGENTE DE WHATSAPP
// ========================================

/**
 * Función inteligente para abrir WhatsApp
 * Detecta automáticamente si es móvil o PC y redirige correctamente
 */
function openWhatsAppIntelligent() {
    console.log('📱 Abriendo WhatsApp de forma inteligente...');
    
    // Número de teléfono y mensaje
    const phoneNumber = '8494033515'; // Número sin el '+' ni espacios
    const message = 'Hola! Vengo del reproductor de radio. Envíanos tu petición y estaremos orando por ti 🙏';
    
    // Detectar si es dispositivo móvil
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Detectar si es iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Detectar si es Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    console.log('📱 Dispositivo detectado:');
    console.log('  - Es móvil:', isMobileDevice);
    console.log('  - Es iOS:', isIOS);
    console.log('  - Es Android:', isAndroid);
    console.log('  - User Agent:', navigator.userAgent);
    
    if (isMobileDevice) {
        // DISPOSITIVO MÓVIL: Intentar abrir la app de WhatsApp
        console.log('📱 Dispositivo móvil detectado - Intentando abrir app de WhatsApp...');
        
        const encodedMessage = encodeURIComponent(message);
        let whatsappAppUrl;
        
        if (isIOS) {
            // iOS: Usar protocolo whatsapp://
            whatsappAppUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`;
            console.log('🍎 iOS detectado - URL:', whatsappAppUrl);
        } else {
            // Android: Usar protocolo whatsapp://
            whatsappAppUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`;
            console.log('🤖 Android detectado - URL:', whatsappAppUrl);
        }
        
        // Intentar abrir la app de WhatsApp
        const startTime = Date.now();
        
        // Crear un enlace temporal y hacer click
        const tempLink = document.createElement('a');
        tempLink.href = whatsappAppUrl;
        tempLink.target = '_blank';
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        
        console.log('✅ Intento de abrir app de WhatsApp realizado');
        
        // Fallback: Si la app no se abre en 2.5 segundos, abrir WhatsApp Web
        setTimeout(() => {
            const timeElapsed = Date.now() - startTime;
            console.log('⏱️ Tiempo transcurrido:', timeElapsed, 'ms');
            
            // Si el usuario sigue en la página, probablemente la app no se abrió
            if (document.hasFocus() || timeElapsed < 2000) {
                console.log('⚠️ App de WhatsApp no disponible - Abriendo WhatsApp Web como fallback...');
                const webUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
                window.open(webUrl, '_blank');
                console.log('🌐 WhatsApp Web abierto:', webUrl);
            } else {
                console.log('✅ App de WhatsApp probablemente se abrió correctamente');
            }
        }, 2500);
        
    } else {
        // DISPOSITIVO PC/DESKTOP: Abrir WhatsApp Web directamente
        console.log('🖥️ Dispositivo PC/Desktop detectado - Abriendo WhatsApp Web...');
        
        const encodedMessage = encodeURIComponent(message);
        const webUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        window.open(webUrl, '_blank');
        console.log('🌐 WhatsApp Web abierto:', webUrl);
    }
}

// Función auxiliar para verificar si WhatsApp está instalado (solo para referencia)
function checkWhatsAppInstalled() {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = 'whatsapp://send';
        
        const timeout = setTimeout(() => {
            resolve(false);
            document.body.removeChild(iframe);
        }, 1000);
        
        iframe.onload = () => {
            clearTimeout(timeout);
            resolve(true);
            document.body.removeChild(iframe);
        };
        
        document.body.appendChild(iframe);
    });
}

console.log('📱 Script ultra simple cargado completamente');
