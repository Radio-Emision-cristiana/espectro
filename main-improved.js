// ========================================
// REPRODUCTOR DE RADIO MEJORADO - BOTÓN PLAY ULTRA ROBUSTO
// ========================================

console.log('🚀 Cargando reproductor de radio mejorado...');

// CONFIGURACIÓN ROBUSTA
const STREAM_CONFIG = {
    url: 'https://stream.zeno.fm/yg7bvksbfwzuv',
    maxRetries: 5,
    retryDelay: 1000,
    connectionTimeout: 10000,
    autoRecovery: true
};

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

// VARIABLES DE ESTADO MEJORADAS
let isPlaying = false;
let isLoading = false;
let playAttempts = 0;
let lastPlayAttempt = 0;
let connectionRetries = 0;
let playPromise = null;
let recoveryTimer = null;
let healthCheckInterval = null;

// ========================================
// CONFIGURACIÓN ROBUSTA DEL AUDIO
// ========================================

function configureAudio() {
    if (!audio) return;
    
    console.log('🔧 Configurando audio para máxima compatibilidad...');
    
    // Configurar atributos para streams de radio
    audio.crossOrigin = 'anonymous';
    audio.preload = 'none'; // Cambiar a 'none' para streams
    audio.controls = false;
    audio.autoplay = false;
    
    // Configurar source dinámicamente
    audio.src = STREAM_CONFIG.url + '?t=' + Date.now();
    
    console.log('✅ Audio configurado correctamente');
}

// ========================================
// FUNCIÓN DE PLAY/PAUSE ULTRA ROBUSTA
// ========================================

async function togglePlayStop() {
    console.log('🎵 Toggle play/stop - Estado actual:', {
        isPlaying,
        isLoading,
        playAttempts,
        audioReady: audio?.readyState
    });
    
    // Prevenir múltiples clics simultáneos
    if (isLoading) {
        console.log('⚠️ Ya hay una operación en progreso, ignorando clic');
        return;
    }
    
    if (isPlaying) {
        stopPlayback();
    } else {
        await startPlayback();
    }
}

async function startPlayback() {
    console.log('▶️ Iniciando reproducción robusta...');
    
    isLoading = true;
    updateUI('loading');
    
    try {
        // Verificar conexión a internet
        if (!navigator.onLine) {
            throw new Error('Sin conexión a internet');
        }
        
        // Configurar audio si es necesario
        configureAudio();
        
        // Cancelar cualquier promesa de reproducción anterior
        if (playPromise) {
            try {
                await playPromise;
            } catch (e) {
                console.log('🔄 Cancelando reproducción anterior');
            }
        }
        
        // Preparar audio para nueva reproducción
        await prepareAudioForPlayback();
        
        // Intentar reproducir con reintentos
        await playWithRetry();
        
        console.log('✅ Reproducción iniciada exitosamente');
        
    } catch (error) {
        console.error('❌ Error al iniciar reproducción:', error);
        handlePlaybackError(error);
    } finally {
        isLoading = false;
    }
}

async function prepareAudioForPlayback() {
    console.log('🔧 Preparando audio para reproducción...');
    
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Timeout preparando audio'));
        }, STREAM_CONFIG.connectionTimeout);
        
        // Resetear audio
        audio.pause();
        audio.currentTime = 0;
        
        // Recargar con cache busting
        const newUrl = STREAM_CONFIG.url + '?t=' + Date.now() + '&retry=' + playAttempts;
        audio.src = newUrl;
        
        // Listeners temporales para la preparación
        const onCanPlay = () => {
            clearTimeout(timeout);
            cleanup();
            console.log('✅ Audio preparado y listo');
            resolve();
        };
        
        const onError = (e) => {
            clearTimeout(timeout);
            cleanup();
            reject(new Error(`Error preparando audio: ${e.target?.error?.message || 'Desconocido'}`));
        };
        
        const cleanup = () => {
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
        };
        
        audio.addEventListener('canplay', onCanPlay, { once: true });
        audio.addEventListener('error', onError, { once: true });
        
        // Cargar el audio
        audio.load();
    });
}

async function playWithRetry() {
    const maxAttempts = STREAM_CONFIG.maxRetries;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`🎯 Intento de reproducción ${attempt}/${maxAttempts}`);
            
            // Guardar referencia a la promesa para poder cancelarla
            playPromise = audio.play();
            
            await playPromise;
            
            // Verificar que realmente está reproduciendo después de un momento
            await verifyPlaybackStarted();
            
            console.log('✅ Reproducción confirmada');
            playAttempts = 0; // Reset contador en éxito
            return;
            
        } catch (error) {
            console.error(`❌ Intento ${attempt} falló:`, error.message);
            
            playAttempts = attempt;
            
            if (attempt < maxAttempts) {
                console.log(`⏳ Esperando ${STREAM_CONFIG.retryDelay}ms antes del siguiente intento...`);
                await sleep(STREAM_CONFIG.retryDelay * attempt); // Backoff progresivo
                
                // Reconfigurar audio para el siguiente intento
                await prepareAudioForPlayback();
            } else {
                throw new Error(`Falló después de ${maxAttempts} intentos: ${error.message}`);
            }
        }
    }
}

async function verifyPlaybackStarted() {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Timeout verificando reproducción'));
        }, 3000);
        
        const checkPlayback = () => {
            if (!audio.paused && audio.currentTime > 0) {
                clearTimeout(timeout);
                resolve();
            } else if (audio.paused) {
                clearTimeout(timeout);
                reject(new Error('Audio se pausó inesperadamente'));
            } else {
                // Seguir verificando
                setTimeout(checkPlayback, 100);
            }
        };
        
        checkPlayback();
    });
}

function stopPlayback() {
    console.log('⏸️ Deteniendo reproducción...');
    
    try {
        // Cancelar timers de recuperación
        if (recoveryTimer) {
            clearTimeout(recoveryTimer);
            recoveryTimer = null;
        }
        
        // Pausar audio
        if (audio && !audio.paused) {
            audio.pause();
        }
        
        // Cancelar promesa de reproducción si existe
        if (playPromise) {
            playPromise = null;
        }
        
        isPlaying = false;
        updateUI(false);
        
        console.log('✅ Reproducción detenida');
        
    } catch (error) {
        console.error('❌ Error al detener reproducción:', error);
    }
}

function handlePlaybackError(error) {
    console.error('🚨 Error de reproducción:', error.message);
    
    isPlaying = false;
    updateUI('error');
    
    // Mostrar mensaje temporal de error
    showErrorMessage(error.message);
    
    // Intentar recuperación automática si está habilitada
    if (STREAM_CONFIG.autoRecovery && connectionRetries < 3) {
        connectionRetries++;
        console.log(`🔄 Programando recuperación automática (intento ${connectionRetries}/3)...`);
        
        recoveryTimer = setTimeout(async () => {
            console.log('🔄 Intentando recuperación automática...');
            await startPlayback();
        }, 5000 * connectionRetries); // Delay progresivo
    }
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showErrorMessage(message) {
    // Actualizar metadata con mensaje de error temporal
    updateMetadata('Error de conexión', message, 'portada.jpg');
    
    // Restaurar metadata normal después de 3 segundos
    setTimeout(() => {
        updateMetadata('Radio En Vivo', 'Presiona play para escuchar', 'portada.jpg');
    }, 3000);
}

// ========================================
// FUNCIONES DE METADATA (REUTILIZADAS)
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

// ========================================
// ACTUALIZAR ESTADO VISUAL MEJORADO
// ========================================

function updateUI(state) {
    console.log('🔄 Actualizando UI - estado:', state);
    
    const miniPlayer = document.querySelector('.mini-player');
    const miniCoverContainer = document.querySelector('.mini-cover-container');
    
    // Limpiar estados anteriores
    miniPlayButton.classList.remove('playing', 'loading', 'error');
    if (miniPlayer) miniPlayer.classList.remove('playing', 'loading', 'error');
    if (miniCoverContainer) miniCoverContainer.classList.remove('playing');
    
    switch (state) {
        case 'loading':
            miniPlayButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="25" height="25">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3"/>
                    <path d="M2 12a10 10 0 0 1 10-10" stroke="currentColor" stroke-width="2" fill="none">
                        <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite"/>
                    </path>
                </svg>
            `;
            miniPlayButton.classList.add('loading');
            if (miniPlayer) miniPlayer.classList.add('loading');
            
            // Ocultar indicador EN VIVO mientras carga
            if (liveIndicator) liveIndicator.style.display = 'none';
            break;
            
        case 'error':
            miniPlayButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="25" height="25">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            `;
            miniPlayButton.classList.add('error');
            if (miniPlayer) miniPlayer.classList.add('error');
            
            // Ocultar indicador EN VIVO en error
            if (liveIndicator) liveIndicator.style.display = 'none';
            break;
            
        case true: // Reproduciendo
            isPlaying = true;
            miniPlayButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="25" height="25">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
            `;
            miniPlayButton.classList.add('playing');
            
            if (miniPlayer) miniPlayer.classList.add('playing');
            if (miniCoverContainer) miniCoverContainer.classList.add('playing');
            
            // Activar visualizador y mostrar indicador EN VIVO
            activateVisualizer();
            if (liveIndicator) liveIndicator.style.display = 'flex';
            
            // Reset contadores de error en éxito
            connectionRetries = 0;
            break;
            
        case false: // Pausado
        default:
            isPlaying = false;
            miniPlayButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="25" height="25">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            `;
            
            // Desactivar visualizador y ocultar indicador EN VIVO
            deactivateVisualizer();
            if (liveIndicator) liveIndicator.style.display = 'none';
            break;
    }
    
    console.log('✅ UI actualizada');
}

// ========================================
// VISUALIZADOR (REUTILIZADO)
// ========================================

function activateVisualizer() {
    console.log('📊 Activando visualizador...');
    
    const bars = document.querySelectorAll('.mini-equalizer-bar');
    console.log('Barras encontradas:', bars.length);
    
    if (bars.length === 0) {
        console.error('❌ No se encontraron barras del visualizador');
        return;
    }
    
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
// EVENT LISTENERS MEJORADOS
// ========================================

function setupAudioEventListeners() {
    if (!audio) return;
    
    console.log('🎧 Configurando event listeners mejorados...');
    
    // Evento: Reproducción iniciada exitosamente
    audio.addEventListener('playing', () => {
        console.log('▶️ Audio PLAYING confirmado');
        updateUI(true);
        
        // Iniciar monitoreo de salud de la conexión
        startHealthCheck();
    });
    
    // Evento: Reproducción pausada
    audio.addEventListener('pause', () => {
        console.log('⏸️ Audio PAUSE');
        updateUI(false);
        stopHealthCheck();
    });
    
    // Evento: Error crítico
    audio.addEventListener('error', (e) => {
        const errorMsg = e.target?.error?.message || 'Error desconocido de audio';
        console.error('❌ Audio ERROR crítico:', errorMsg);
        
        handlePlaybackError(new Error(errorMsg));
        stopHealthCheck();
    });
    
    // Evento: Stream se interrumpió
    audio.addEventListener('stalled', () => {
        console.log('🛑 Audio STALLED - Stream interrumpido');
        
        if (isPlaying && STREAM_CONFIG.autoRecovery) {
            console.log('🔄 Iniciando recuperación por stall...');
            setTimeout(async () => {
                if (isPlaying) { // Solo si todavía debería estar reproduciendo
                    await startPlayback();
                }
            }, 2000);
        }
    });
    
    // Evento: Esperando datos
    audio.addEventListener('waiting', () => {
        console.log('⏳ Audio WAITING - Buffering...');
        if (isPlaying) {
            updateUI('loading');
        }
    });
    
    // Evento: Datos disponibles
    audio.addEventListener('canplay', () => {
        console.log('✅ Audio CAN PLAY - Stream listo');
    });
    
    console.log('✅ Event listeners configurados');
}

// ========================================
// MONITOREO DE SALUD DE LA CONEXIÓN
// ========================================

function startHealthCheck() {
    stopHealthCheck(); // Limpiar cualquier check anterior
    
    console.log('💗 Iniciando monitoreo de salud...');
    
    healthCheckInterval = setInterval(() => {
        if (isPlaying && audio) {
            // Verificar si el audio realmente está progresando
            const currentTime = audio.currentTime;
            
            setTimeout(() => {
                if (isPlaying && audio.currentTime === currentTime && !audio.paused) {
                    console.warn('⚠️ Stream parece congelado, intentando recuperación...');
                    startPlayback(); // Forzar reconexión
                }
            }, 5000);
        }
    }, 10000); // Check cada 10 segundos
}

function stopHealthCheck() {
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
        console.log('💗 Monitoreo de salud detenido');
    }
}

// ========================================
// INICIALIZACIÓN MEJORADA
// ========================================

function initImprovedPlayer() {
    console.log('🔧 Inicializando reproductor mejorado...');
    
    // Verificar elementos críticos
    if (!audio || !miniPlayButton) {
        console.error('❌ FATAL: Elementos críticos no encontrados');
        return;
    }
    
    // Configurar audio
    configureAudio();
    
    // Configurar event listeners
    setupAudioEventListeners();
    
    // Configurar botón de play mejorado
    if (miniPlayButton) {
        miniPlayButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            togglePlayStop();
        });
    }
    
    // Configurar control de volumen si existe
    if (miniVolumeSlider) {
        miniVolumeSlider.addEventListener('input', function(e) {
            const volume = e.target.value / 100;
            audio.volume = volume;
            console.log('🔊 Volumen ajustado:', Math.round(volume * 100) + '%');
        });
        
        // Establecer volumen inicial
        audio.volume = 0.7; // 70% por defecto
        miniVolumeSlider.value = 70;
    }
    
    // Estado inicial
    updateUI(false);
    updateMetadata('Radio En Vivo', 'Presiona play para escuchar', 'portada.jpg');
    
    console.log('✅ Reproductor mejorado inicializado');
}

// ========================================
// INICIALIZACIÓN AUTOMÁTICA
// ========================================

// Cargar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImprovedPlayer);
} else {
    initImprovedPlayer();
}

// ========================================
// FUNCIONES GLOBALES PARA COMPATIBILIDAD
// ========================================

// Hacer funciones disponibles globalmente para compatibilidad
window.togglePlayStop = togglePlayStop;
window.updateMetadata = updateMetadata;
window.activateVisualizer = activateVisualizer;
window.deactivateVisualizer = deactivateVisualizer;

console.log('🚀 Reproductor de radio mejorado cargado');
