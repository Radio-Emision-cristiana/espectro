// ========================================
// REPRODUCTOR DE RADIO - BOTÓN PLAY CORREGIDO
// ========================================

console.log('🚀 Cargando reproductor de radio con botón play corregido...');

// CONFIGURACIÓN ROBUSTA
const STREAM_CONFIG = {
    url: 'https://stream.zeno.fm/yg7bvksbfwzuv',
    maxRetries: 5,
    retryDelay: 1000,
    connectionTimeout: 10000,
    autoRecovery: true
};

// ELEMENTOS CORRECTOS SEGÚN EL HTML ACTUAL
const audio = document.getElementById('radio-audio');
const playButton = document.getElementById('play-pause-btn');
const playIcon = playButton?.querySelector('.play-icon');
const pauseIcon = playButton?.querySelector('.pause-icon');
const volumeSlider = document.querySelector('.volume-slider');

console.log('🔍 Verificando elementos:');
console.log('- Audio element:', audio ? '✅ FOUND' : '❌ NOT FOUND');
console.log('- Play button:', playButton ? '✅ FOUND' : '❌ NOT FOUND');
console.log('- Play icon:', playIcon ? '✅ FOUND' : '❌ NOT FOUND');
console.log('- Pause icon:', pauseIcon ? '✅ FOUND' : '❌ NOT FOUND');

// Elementos de metadata
const songTitle = document.getElementById('song-title');
const artistName = document.getElementById('artist-name');
const albumCover = document.getElementById('album-cover');

// VARIABLES DE ESTADO GLOBALES
let isPlaying = false;
let isLoading = false;
let playAttempts = 0;
let connectionRetries = 0;
let playPromise = null;
let recoveryTimer = null;
let healthCheckInterval = null;

// ========================================
// CONFIGURACIÓN DEL AUDIO
// ========================================

function configureAudio() {
    if (!audio) {
        console.error('❌ No se puede configurar audio: elemento no encontrado');
        return;
    }
    
    console.log('🔧 Configurando audio...');
    
    // Configurar atributos para streams de radio
    audio.crossOrigin = 'anonymous';
    audio.preload = 'none';
    audio.controls = false;
    audio.autoplay = false;
    audio.volume = 0.5; // Volumen inicial al 50%
    
    // Configurar source dinámicamente con cache busting
    audio.src = STREAM_CONFIG.url + '?t=' + Date.now();
    
    console.log('✅ Audio configurado correctamente');
}

// ========================================
// FUNCIÓN PRINCIPAL TOGGLEPLAY (CORREGIDA)
// ========================================

async function togglePlay() {
    console.log('🎵 TogglePlay llamado - Estado actual:', {
        isPlaying,
        isLoading,
        playAttempts,
        audioPaused: audio?.paused,
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

// ========================================
// FUNCIÓN DE REPRODUCCIÓN MEJORADA
// ========================================

async function startPlayback() {
    console.log('▶️ Iniciando reproducción...');
    
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
        if (!audio.paused) {
            audio.pause();
        }
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
            if (!audio.paused && audio.currentTime >= 0) {
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

// ========================================
// FUNCIÓN DE PAUSA MEJORADA
// ========================================

function stopPlayback() {
    console.log('⏸️ Pausando reproducción...');
    
    try {
        // Cancelar timers de recuperación
        if (recoveryTimer) {
            clearTimeout(recoveryTimer);
            recoveryTimer = null;
        }
        
        // Pausar audio (NO detener completamente)
        if (audio && !audio.paused) {
            audio.pause();
        }
        
        // Cancelar promesa de reproducción si existe
        if (playPromise) {
            playPromise = null;
        }
        
        isPlaying = false;
        updateUI('paused');
        
        console.log('✅ Reproducción pausada (lista para reanudar)');
        
    } catch (error) {
        console.error('❌ Error al pausar reproducción:', error);
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
// ACTUALIZACIÓN DE INTERFAZ CORREGIDA
// ========================================

function updateUI(state) {
    console.log('🔄 Actualizando UI - estado:', state);
    
    if (!playButton || !playIcon || !pauseIcon) {
        console.error('❌ No se pueden actualizar iconos: elementos no encontrados');
        return;
    }
    
    // Limpiar estados anteriores
    playButton.classList.remove('loading', 'playing', 'paused', 'error');
    
    switch (state) {
        case 'loading':
            playButton.classList.add('loading');
            playButton.disabled = true;
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'none';
            
            // Mostrar icono de carga
            playButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor" class="loading-icon">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3"/>
                    <path d="M2 12a10 10 0 0 1 10-10" stroke="currentColor" stroke-width="2" fill="none">
                        <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite"/>
                    </path>
                </svg>
            `;
            break;
            
        case 'error':
            playButton.classList.add('error');
            playButton.disabled = false;
            playButton.innerHTML = `
                <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
            `;
            break;
            
        case 'paused':
        case false:
            isPlaying = false;
            playButton.classList.add('paused');
            playButton.disabled = false;
            
            // Restaurar iconos originales si no existen
            if (!playButton.querySelector('.play-icon')) {
                playButton.innerHTML = `
                    <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                `;
            }
            
            const currentPlayIcon = playButton.querySelector('.play-icon');
            const currentPauseIcon = playButton.querySelector('.pause-icon');
            
            if (currentPlayIcon) currentPlayIcon.style.display = 'block';
            if (currentPauseIcon) currentPauseIcon.style.display = 'none';
            
            // Desactivar visualizador
            deactivateVisualizer();
            break;
            
        case true: // Reproduciendo
        case 'playing':
            isPlaying = true;
            playButton.classList.add('playing');
            playButton.disabled = false;
            
            // Restaurar iconos originales si no existen
            if (!playButton.querySelector('.play-icon')) {
                playButton.innerHTML = `
                    <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                `;
            }
            
            const currentPlayIcon2 = playButton.querySelector('.play-icon');
            const currentPauseIcon2 = playButton.querySelector('.pause-icon');
            
            if (currentPlayIcon2) currentPlayIcon2.style.display = 'none';
            if (currentPauseIcon2) currentPauseIcon2.style.display = 'block';
            
            // Activar visualizador
            activateVisualizer();
            
            // Reset contadores de error en éxito
            connectionRetries = 0;
            break;
    }
    
    console.log('✅ UI actualizada');
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

function updateMetadata(title, artist, coverUrl = 'portada.jpg') {
    console.log('📄 Actualizando metadata:', title, '-', artist);
    
    // Actualizar elementos de metadata
    if (songTitle) songTitle.textContent = title;
    if (artistName) artistName.textContent = artist;
    if (albumCover) albumCover.src = coverUrl;
    
    console.log('✅ Metadata actualizada');
}

// ========================================
// VISUALIZADOR
// ========================================

function activateVisualizer() {
    console.log('📊 Activando visualizador...');
    
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        console.log('⚠️ Canvas del visualizador no encontrado');
        return;
    }
    
    // Activar animación del canvas (si existe la lógica)
    canvas.style.opacity = '1';
    
    console.log('✅ Visualizador activado');
}

function deactivateVisualizer() {
    console.log('📊 Desactivando visualizador...');
    
    const canvas = document.getElementById('canvas');
    if (canvas) {
        canvas.style.opacity = '0.3';
    }
    
    console.log('✅ Visualizador desactivado');
}

// ========================================
// EVENT LISTENERS MEJORADOS
// ========================================

function setupAudioEventListeners() {
    if (!audio) return;
    
    console.log('🎧 Configurando event listeners...');
    
    // Evento: Reproducción iniciada exitosamente
    audio.addEventListener('playing', () => {
        console.log('▶️ Audio PLAYING confirmado');
        updateUI('playing');
        startHealthCheck();
    });
    
    // Evento: Reproducción pausada
    audio.addEventListener('pause', () => {
        console.log('⏸️ Audio PAUSE confirmado');
        updateUI('paused');
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
    
    console.log('✅ Event listeners configurados');
}

// ========================================
// MONITOREO DE SALUD
// ========================================

function startHealthCheck() {
    stopHealthCheck(); // Limpiar cualquier check anterior
    
    console.log('💗 Iniciando monitoreo de salud...');
    
    healthCheckInterval = setInterval(() => {
        if (isPlaying && audio && !audio.paused) {
            // Stream está funcionando correctamente
            console.log('💗 Stream healthy - currentTime:', audio.currentTime);
        } else if (isPlaying && audio && audio.paused) {
            console.warn('⚠️ Stream pausado inesperadamente, intentando recuperación...');
            startPlayback();
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
// FUNCIONES DE CONTROL DE VOLUMEN
// ========================================

function setVolume(value) {
    if (audio) {
        audio.volume = value / 100;
        console.log('🔊 Volumen ajustado:', value + '%');
    }
}

function toggleMute() {
    if (audio) {
        audio.muted = !audio.muted;
        console.log('🔇 Mute:', audio.muted ? 'ON' : 'OFF');
        
        // Actualizar iconos de volumen
        const volumeOnIcon = document.querySelector('.volume-on-icon');
        const volumeOffIcon = document.querySelector('.volume-off-icon');
        
        if (volumeOnIcon && volumeOffIcon) {
            if (audio.muted) {
                volumeOnIcon.style.display = 'none';
                volumeOffIcon.style.display = 'block';
            } else {
                volumeOnIcon.style.display = 'block';
                volumeOffIcon.style.display = 'none';
            }
        }
    }
}

// ========================================
// INICIALIZACIÓN
// ========================================

function initPlayer() {
    console.log('🔧 Inicializando reproductor...');
    
    // Verificar elementos críticos
    if (!audio) {
        console.error('❌ FATAL: Elemento de audio no encontrado');
        return;
    }
    
    if (!playButton) {
        console.error('❌ FATAL: Botón de play no encontrado');
        return;
    }
    
    // Configurar audio
    configureAudio();
    
    // Configurar event listeners
    setupAudioEventListeners();
    
    // Configurar control de volumen
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function(e) {
            setVolume(e.target.value);
        });
        
        // Establecer volumen inicial
        audio.volume = 0.5;
        volumeSlider.value = 50;
    }
    
    // Estado inicial
    updateUI('paused');
    updateMetadata('Radio En Vivo', 'Presiona play para escuchar', 'portada.jpg');
    
    console.log('✅ Reproductor inicializado correctamente');
}

// ========================================
// INICIALIZACIÓN AUTOMÁTICA
// ========================================

// Cargar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayer);
} else {
    initPlayer();
}

// ========================================
// FUNCIONES GLOBALES PARA COMPATIBILIDAD
// ========================================

// Hacer funciones disponibles globalmente
window.togglePlay = togglePlay;
window.setVolume = setVolume;
window.toggleMute = toggleMute;
window.updateMetadata = updateMetadata;
window.activateVisualizer = activateVisualizer;
window.deactivateVisualizer = deactivateVisualizer;

console.log('🚀 Reproductor de radio con botón play corregido cargado');
