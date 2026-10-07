"use client";
import { usePathname } from 'next/navigation';
import React from 'react'
import Link from 'next/link'

import Logo from './logo'

const Footer = () => {
    const pathname = usePathname();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        const t = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(t);
    }, []);

    if (pathname === '/' || pathname === '/superlicense' || pathname === '/invite') return null;

    return (
        <footer className="w-full bg-transparent border-t border-white/5 mt-16 transition-colors opacity-30 hover:opacity-100 focus-within:opacity-100">
            <div className="max-w-5xl mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <div className="scale-50 origin-left opacity-50 grayscale">
                                <div className="block dark:hidden"><Logo isOnDarkBackground={false} /></div>
                                <div className="hidden dark:block"><Logo isOnDarkBackground={true} /></div>
                            </div>
                        </Link>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                            © {new Date().getFullYear()} VoltGrid
                        </div>
                    </div>
                    
                    <nav aria-label="Legal navigation">
                        <ul className="flex flex-wrap justify-center gap-4 text-[9px] font-bold uppercase tracking-widest text-gray-500">
                            <li>
                                <span className="cursor-not-allowed opacity-50">Assets</span>
                            </li>
                            <li>
                                <Link href="/terms-conditions" className="hover:text-[#fbaa19] transition-colors">Terms</Link>
                            </li>
                            <li>
                                <Link href="/terms-conditions" className="hover:text-[#fbaa19] transition-colors">Privacy</Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </footer>
    );
};

export default Footer
