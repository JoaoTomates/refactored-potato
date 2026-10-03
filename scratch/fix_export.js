const fs = require('fs');
let c = fs.readFileSync('src/app/invite3/page.tsx', 'utf8');
c += `
export default function Invite3PageWrapper() {
    return (
        <Suspense fallback={<div className="w-full h-screen bg-black" />}>
            <InviteFlow3 />
        </Suspense>
    );
}
`;
fs.writeFileSync('src/app/invite3/page.tsx', c);
