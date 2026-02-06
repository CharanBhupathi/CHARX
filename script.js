// Prevent zooming
document.addEventListener('DOMContentLoaded', () => {
    // Prevent pinch zoom (but allow button clicks)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        // Don't prevent if clicking on music control button
        if (event.target.closest('.music-control')) {
            return;
        }
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Prevent double tap zoom (but allow button clicks)
    let lastTap = 0;
    document.addEventListener('touchend', function (event) {
        // Don't prevent if clicking on music control button
        if (event.target.closest('.music-control')) {
            return;
        }
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 500 && tapLength > 0) {
            event.preventDefault();
        }
        lastTap = currentTime;
    }, false);

    // Prevent wheel zoom with Ctrl/Cmd
    document.addEventListener('wheel', function (event) {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
        }
    }, { passive: false });

    // Prevent keyboard zoom (Ctrl/Cmd + Plus/Minus/0)
    document.addEventListener('keydown', function (event) {
        if ((event.ctrlKey || event.metaKey) && 
            (event.key === '+' || event.key === '-' || event.key === '=' || event.key === '0')) {
            event.preventDefault();
        }
    });

    // Disable context menu (right-click zoom on some browsers)
    document.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    });
});

// Save music state function (used before navigation)
const saveMusicStateNow = () => {
    const music = document.getElementById('backgroundMusic');
    if (music) {
        sessionStorage.setItem('musicPlaying', (!music.paused).toString());
        sessionStorage.setItem('musicTime', music.currentTime.toString());
        sessionStorage.setItem('musicVolume', music.volume.toString());
    }
};

// Intercept navigation clicks to save state immediately
document.addEventListener('DOMContentLoaded', () => {
    // Intercept all navigation links (including back links)
    const navLinks = document.querySelectorAll('a[href$=".html"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            saveMusicStateNow();
            // Use synchronous storage to ensure it's saved
            const music = document.getElementById('backgroundMusic');
            if (music) {
                sessionStorage.setItem('musicPlaying', (!music.paused).toString());
                sessionStorage.setItem('musicTime', music.currentTime.toString());
            }
        }, true); // Use capture phase for earlier execution
    });
    
    // Also intercept on mousedown for even faster response
    navLinks.forEach(link => {
        link.addEventListener('mousedown', () => {
            saveMusicStateNow();
        }, true);
    });
    
    // For touch devices
    navLinks.forEach(link => {
        link.addEventListener('touchstart', () => {
            saveMusicStateNow();
        }, true);
    });
});

// Save state on page unload/hide (for browser back button and navigation)
window.addEventListener('beforeunload', () => {
    saveMusicStateNow();
});

window.addEventListener('pagehide', () => {
    saveMusicStateNow();
});

// Restore state when page is shown (for browser back button)
window.addEventListener('pageshow', (event) => {
    // If page was loaded from cache (back/forward navigation)
    if (event.persisted) {
        const wasPlaying = sessionStorage.getItem('musicPlaying') === 'true';
        const currentTime = parseFloat(sessionStorage.getItem('musicTime') || '0');
        
        if (wasPlaying && currentTime > 0) {
            setTimeout(() => {
                const music = document.getElementById('backgroundMusic');
                if (music) {
                    music.currentTime = currentTime;
                    if (music.paused) {
                        music.play().catch(() => {});
                    }
                }
            }, 100);
        }
    }
});

// Initialize audio immediately (before DOMContentLoaded for faster start)
(function() {
    const wasPlaying = sessionStorage.getItem('musicPlaying') === 'true';
    const currentTime = parseFloat(sessionStorage.getItem('musicTime') || '0');
    
    // Try to get audio element immediately
    const tryInitAudio = () => {
        const music = document.getElementById('backgroundMusic');
        if (!music) {
            // If audio not found yet, try again soon
            if (document.readyState === 'loading') {
                setTimeout(tryInitAudio, 10);
            }
            return;
        }
        
        music.volume = 0.3;
        music.preload = 'auto';
        
        // Function to attempt seamless playback
        const attemptPlay = () => {
            if (wasPlaying) {
                // Set time immediately if possible
                if (music.readyState >= 1 && currentTime > 0) {
                    music.currentTime = currentTime;
                }
                
                // Try to play
                const playPromise = music.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        // Once playing, ensure time is correct
                        if (currentTime > 0 && Math.abs(music.currentTime - currentTime) > 0.5) {
                            music.currentTime = currentTime;
                        }
                    }).catch(() => {
                        // Autoplay blocked, will need user interaction
                    });
                }
            }
        };
        
        // Try to play on multiple events for fastest start
        const events = ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'];
        events.forEach(eventType => {
            music.addEventListener(eventType, () => {
                if (wasPlaying) {
                    if (currentTime > 0) {
                        music.currentTime = currentTime;
                    }
                    if (music.paused) {
                        music.play().then(() => {
                            // Ensure time is correct after playing starts
                            if (currentTime > 0 && Math.abs(music.currentTime - currentTime) > 0.5) {
                                music.currentTime = currentTime;
                            }
                        }).catch(() => {});
                    }
                }
            }, { once: true });
        });
        
        // Try immediately if audio is already loaded
        if (music.readyState >= 1) {
            attemptPlay();
        }
        
        // Also try after a very short delay
        setTimeout(attemptPlay, 0);
        setTimeout(attemptPlay, 50);
    };
    
    // Start trying immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInitAudio);
    } else {
        tryInitAudio();
    }
})();

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const music = document.getElementById('backgroundMusic');
    const musicControl = document.getElementById('musicControl');
    
    if (music) {
        music.volume = 0.3;
        music.preload = 'auto';
        
        const wasPlaying = sessionStorage.getItem('musicPlaying') === 'true';
        const currentTime = parseFloat(sessionStorage.getItem('musicTime') || '0');
        
        // Aggressive play function
        const playMusic = () => {
            if (wasPlaying) {
                // Set time immediately if ready
                if (music.readyState >= 1 && currentTime > 0) {
                    music.currentTime = currentTime;
                }
                
                // Try to play
                const playPromise = music.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        if (musicControl) {
                            musicControl.textContent = 'Pause';
                        }
                        sessionStorage.setItem('musicPlaying', 'true');
                        
                        // Double-check time is correct after play starts
                        if (currentTime > 0) {
                            setTimeout(() => {
                                if (Math.abs(music.currentTime - currentTime) > 0.5) {
                                    music.currentTime = currentTime;
                                }
                            }, 100);
                        }
                    }).catch(() => {
                        if (musicControl) {
                            musicControl.textContent = 'Play';
                        }
                    });
                }
            } else if (!wasPlaying && sessionStorage.getItem('musicPlaying') !== 'false') {
                // First time, try to play
                music.play().then(() => {
                    if (musicControl) {
                        musicControl.textContent = 'Pause';
                    }
                    sessionStorage.setItem('musicPlaying', 'true');
                }).catch(() => {
                    if (musicControl) {
                        musicControl.textContent = 'Play';
                    }
                });
            }
        };
        
        // Multiple attempts to start playing
        playMusic();
        
        // Try on various ready states
        if (music.readyState >= 1) {
            playMusic();
        }
        
        // Event listeners for when audio becomes ready
        const readyHandler = () => {
            if (wasPlaying) {
                if (currentTime > 0) {
                    music.currentTime = currentTime;
                }
                if (music.paused) {
                    music.play().then(() => {
                        // Ensure time is correct after playing
                        if (currentTime > 0 && Math.abs(music.currentTime - currentTime) > 0.5) {
                            music.currentTime = currentTime;
                        }
                    }).catch(() => {});
                }
            }
        };
        
        music.addEventListener('loadedmetadata', readyHandler, { once: true });
        music.addEventListener('loadeddata', readyHandler, { once: true });
        music.addEventListener('canplay', readyHandler, { once: true });
        music.addEventListener('canplaythrough', readyHandler, { once: true });
        
        // Save music state very frequently for seamless transitions
        const saveMusicState = () => {
            if (!music.paused) {
                sessionStorage.setItem('musicPlaying', 'true');
                sessionStorage.setItem('musicTime', music.currentTime.toString());
            }
        };
        
        // Save state every 50ms for ultra-smooth transitions
        setInterval(saveMusicState, 50);
        
        // Also use requestAnimationFrame for even more frequent saves during playback
        const rafSave = () => {
            if (!music.paused) {
                sessionStorage.setItem('musicPlaying', 'true');
                sessionStorage.setItem('musicTime', music.currentTime.toString());
            }
            if (!music.paused) {
                requestAnimationFrame(rafSave);
            }
        };
        if (!music.paused) {
            requestAnimationFrame(rafSave);
        }
        
        // Update button text based on music state
        music.addEventListener('play', () => {
            if (musicControl) {
                musicControl.textContent = 'Pause';
            }
            sessionStorage.setItem('musicPlaying', 'true');
            // Start RAF saving when playing
            const rafSave = () => {
                if (!music.paused) {
                    sessionStorage.setItem('musicPlaying', 'true');
                    sessionStorage.setItem('musicTime', music.currentTime.toString());
                    requestAnimationFrame(rafSave);
                }
            };
            requestAnimationFrame(rafSave);
        });
        
        music.addEventListener('pause', () => {
            if (musicControl) {
                musicControl.textContent = 'Play';
            }
            sessionStorage.setItem('musicPlaying', 'false');
            sessionStorage.setItem('musicTime', music.currentTime.toString());
        });
        
        // Toggle play/pause on button click - optimized for instant response
        if (musicControl) {
            const toggleMusic = (e) => {
                // Prevent event from bubbling to zoom prevention handlers
                e.stopPropagation();
                
                // Update button text immediately for instant feedback
                if (music.paused) {
                    musicControl.textContent = 'Pause';
                    music.play().catch(() => {
                        // If play fails, revert button text
                        musicControl.textContent = 'Play';
                    });
                    sessionStorage.setItem('musicPlaying', 'true');
                } else {
                    musicControl.textContent = 'Play';
                    music.pause();
                    sessionStorage.setItem('musicPlaying', 'false');
                    sessionStorage.setItem('musicTime', music.currentTime.toString());
                }
            };
            
            // Use both click and touchstart for fastest response
            musicControl.addEventListener('click', toggleMusic, { passive: false });
            musicControl.addEventListener('touchstart', toggleMusic, { passive: false });
        }
        
        // Enable audio on any user interaction (for browsers that block autoplay)
        const enableAudio = () => {
            if (music.paused) {
                music.play().then(() => {
                    if (musicControl) {
                        musicControl.textContent = 'Pause';
                    }
                    sessionStorage.setItem('musicPlaying', 'true');
                }).catch(() => {});
            }
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
        };
        
        document.addEventListener('click', enableAudio);
        document.addEventListener('touchstart', enableAudio);
        
        // Save state on visibility change
        document.addEventListener('visibilitychange', () => {
            saveMusicStateNow();
        });
        
        // Save state continuously while playing
        const continuousSave = () => {
            if (!music.paused) {
                saveMusicStateNow();
            }
            requestAnimationFrame(continuousSave);
        };
        requestAnimationFrame(continuousSave);
    }
});

