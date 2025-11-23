export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export const sfx = {
    playTone: (freq, type, dur, vol=0.1, time=audioCtx.currentTime) => {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.start(time);
        osc.stop(time + dur);
    },
    shoot: () => sfx.playTone(300 + Math.random()*100, 'square', 0.1, 0.05),
    hit: () => sfx.playTone(100 + Math.random()*50, 'sawtooth', 0.1, 0.05),
    explode: () => {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator(); 
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'square'; 
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    },
    xp: () => sfx.playTone(800 + Math.random()*200, 'sine', 0.1, 0.03),
    powerup: () => {
        sfx.playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => sfx.playTone(1200, 'sine', 0.3, 0.1), 100);
    },
    levelup: () => [440,554,659,880].forEach((f,i)=>setTimeout(()=>sfx.playTone(f,'triangle',0.4,0.1),i*100)),
    overdrive: () => {
        sfx.playTone(200, 'sawtooth', 0.1, 0.2);
        [400, 600, 800, 1200].forEach((f,i) => setTimeout(() => sfx.playTone(f, 'square', 0.2, 0.1), i*50));
    }
};

export const bgm = {
    isPlaying: false,
    nextNoteTime: 0,
    beat: 0,
    tempo: 135,
    onBeat: null, // Callback
    schedule: () => {
        if (!bgm.isPlaying) return;
        const secondsPerBeat = 60.0 / bgm.tempo;
        const lookahead = 0.1;
        while (bgm.nextNoteTime < audioCtx.currentTime + lookahead) {
            if (bgm.onBeat) bgm.onBeat(bgm.nextNoteTime, bgm.beat);
            bgm.nextNoteTime += secondsPerBeat / 4;
            bgm.beat = (bgm.beat + 1) % 16;
        }
        bgm.timerID = requestAnimationFrame(bgm.schedule);
    },
    start: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        if (bgm.isPlaying) return;
        bgm.isPlaying = true; bgm.nextNoteTime = audioCtx.currentTime; bgm.schedule();
    },
    stop: () => { bgm.isPlaying = false; cancelAnimationFrame(bgm.timerID); }
};
