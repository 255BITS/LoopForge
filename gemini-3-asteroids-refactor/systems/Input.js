export const Input = {
    keys: { w: false, a: false, s: false, d: false, " ": false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false },
    mouse: { x: window.innerWidth/2, y: window.innerHeight/2 },
    actionListeners: [],

    init(canvas) {
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            this.handleAction(e.key);
        });
        
        window.addEventListener('keyup', e => {
            this.keys[e.key] = false;
        });

        window.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    },

    onAction(callback) {
        this.actionListeners.push(callback);
    },

    handleAction(key) {
        const k = key.toLowerCase();
        let action = null;
        if (k === 'escape' || k === 'p') action = 'PAUSE';
        if (k === 'e' || k === 'shift') action = 'OVERDRIVE';
        
        if (action) this.actionListeners.forEach(fn => fn(action));
    }
};
