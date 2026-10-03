const fs = require('fs');

const fixBackground = (filePath) => {
    if (!fs.existsSync(filePath)) return;
    let c = fs.readFileSync(filePath, 'utf8');

    // Replace the div-based background with img
    const oldBgDiv = `{/* Pixel Art Background V2 (VoltGrid Mature) */}
            <div 
                className="fixed inset-0 z-0 bg-cover bg-center opacity-60 md:opacity-80"
                style={{ 
                    backgroundImage: 'url("/pixel_invite_bg_v2.jpg")',
                    imageRendering: 'pixelated'
                }}
            ></div>`;
            
    const newBgImg = `{/* Pixel Art Background V2 (VoltGrid Mature) */}
            <img 
                src="/pixel_invite_bg_v2.jpg"
                alt=""
                className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 opacity-60 md:opacity-80 pointer-events-none"
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />`;

    // Try to replace, it might have slightly different names like pixel_invite_bg.jpg in invite/page.tsx
    // Let's do a regex to catch it
    const bgRegex = /\{\/\* Pixel Art Background.*?\*\/\}[\s\S]*?<\/div>/;
    
    // Check if the file has it
    const match = c.match(bgRegex);
    if (match) {
        // Extract the image name from the old style
        const imgMatch = match[0].match(/url\(['"]([^'"]+)['"]\)/);
        const imgSrc = imgMatch ? imgMatch[1] : "/pixel_invite_bg_v2.jpg";
        
        const replacement = `{/* Pixel Art Background (Fixed Jitter) */}
            <img 
                src="${imgSrc}"
                alt=""
                className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 opacity-60 md:opacity-80 pointer-events-none"
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />`;
            
        c = c.replace(match[0], replacement);
    }

    // Replace CRT Overlay Effects
    const oldCrt = `{/* CRT Overlay Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-30 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]"></div>
            <div className="fixed inset-0 z-0 pointer-events-none bg-radial-gradient from-transparent via-black/40 to-black/90"></div>`;

    const newCrt = `{/* CRT Overlay Effects */}
            <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none opacity-30 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]" style={{ transform: 'translateZ(0)' }}></div>
            <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none bg-radial-gradient from-transparent via-black/40 to-black/90" style={{ transform: 'translateZ(0)' }}></div>`;
            
    if (c.includes(oldCrt)) {
        c = c.replace(oldCrt, newCrt);
    }

    fs.writeFileSync(filePath, c);
    console.log('Fixed bg jitter in', filePath);
};

fixBackground('src/app/invite/page.tsx');
fixBackground('src/app/invite2/page.tsx');
