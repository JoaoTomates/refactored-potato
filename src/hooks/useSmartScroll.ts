"use client";

import { useState, useEffect, useRef } from "react";

interface SmartScrollOptions {
    threshold?: number;
    topTolerance?: number;
}

export function useSmartScroll({ threshold = 15, topTolerance = 50 }: SmartScrollOptions = {}) {
    const [isVisible, setIsVisible] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const updateScroll = () => {
            const currentScrollY = Math.max(0, window.scrollY);

            // Is scrolled past top tolerance
            setIsScrolled(currentScrollY > topTolerance);

            // Always show navbar near top of the page
            if (currentScrollY <= topTolerance) {
                setIsVisible(true);
                lastScrollY.current = currentScrollY;
                ticking.current = false;
                return;
            }

            const diff = currentScrollY - lastScrollY.current;

            // Only trigger state change if difference exceeds threshold
            if (Math.abs(diff) >= threshold) {
                if (diff > 0) {
                    // Scrolling DOWN -> Hide
                    setIsVisible(false);
                } else {
                    // Scrolling UP -> Show
                    setIsVisible(true);
                }
                lastScrollY.current = currentScrollY;
            }

            ticking.current = false;
        };

        const handleScroll = () => {
            if (!ticking.current) {
                window.requestAnimationFrame(updateScroll);
                ticking.current = true;
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [threshold, topTolerance]);

    return { isVisible, isScrolled };
}
