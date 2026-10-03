const fs = require('fs');

function fixTypewriter(filePath) {
    let c = fs.readFileSync(filePath, 'utf8');

    const oldTypewriter = `function TypewriterLine({ text, onComplete, onReadyForNext, startDelay = 300 }: { text: string, onComplete?: () => void, onReadyForNext?: () => void, startDelay?: number }) {
    const [displayed, setDisplayed] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    
    useEffect(() => {
        let i = 0;
        let timeoutId: NodeJS.Timeout;
        let isCancelled = false;
        
        const typeNext = () => {
            if (isCancelled) return;
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1));
                const char = text.charAt(i);
                i++;
                
                // organic typing speed (slower)
                let delay = 50 + Math.random() * 30; // 50-80ms
                
                // pauses for punctuation
                if (char === '.' || char === '!' || char === '?') delay = 600;
                else if (char === ',') delay = 300;
                
                timeoutId = setTimeout(typeNext, delay);
            } else {
                setIsTyping(false);
                if (onReadyForNext) onReadyForNext();
                if (onComplete) {
                    setTimeout(onComplete, 1500); 
                }
            }
        };
        
        timeoutId = setTimeout(typeNext, startDelay); // initial delay before starting
        
        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [text, onComplete, onReadyForNext, startDelay]);`;

    const newTypewriter = `function TypewriterLine({ text, onComplete, onReadyForNext, startDelay = 300 }: { text: string, onComplete?: () => void, onReadyForNext?: () => void, startDelay?: number }) {
    const [displayed, setDisplayed] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    const callbacksRef = useRef({ onComplete, onReadyForNext });

    useEffect(() => {
        callbacksRef.current = { onComplete, onReadyForNext };
    }, [onComplete, onReadyForNext]);
    
    useEffect(() => {
        let i = 0;
        let timeoutId: NodeJS.Timeout;
        let isCancelled = false;
        
        const typeNext = () => {
            if (isCancelled) return;
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1));
                const char = text.charAt(i);
                i++;
                
                // organic typing speed (slower)
                let delay = 50 + Math.random() * 30; // 50-80ms
                
                // pauses for punctuation
                if (char === '.' || char === '!' || char === '?') delay = 600;
                else if (char === ',') delay = 300;
                
                timeoutId = setTimeout(typeNext, delay);
            } else {
                setIsTyping(false);
                if (callbacksRef.current.onReadyForNext) callbacksRef.current.onReadyForNext();
                if (callbacksRef.current.onComplete) {
                    setTimeout(callbacksRef.current.onComplete, 1500); 
                }
            }
        };
        
        timeoutId = setTimeout(typeNext, startDelay); // initial delay before starting
        
        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [text, startDelay]);`;

    if (c.includes(oldTypewriter)) {
        c = c.replace(oldTypewriter, newTypewriter);
        fs.writeFileSync(filePath, c, 'utf8');
        console.log("Fixed " + filePath);
    } else {
        console.log("Could not find TypewriterLine in " + filePath);
    }
}

fixTypewriter('src/app/invite/page.tsx');
fixTypewriter('src/app/invite2/page.tsx');
