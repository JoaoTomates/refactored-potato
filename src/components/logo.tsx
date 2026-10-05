"use client";
import React from 'react';

interface Props {
    isOnDarkBackground?: boolean;
    isPulsing?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const Logo = ({ isOnDarkBackground, isPulsing = false, size = 'md', className = '' }: Props) => {
    const sizeConfig = {
        sm: {
            outer: 'w-7 h-7 border-[2px] p-[1px]',
            inner: 'border-[1.5px]'
        },
        md: {
            outer: 'w-9 h-9 md:w-10 md:h-10 border-[2px] md:border-[3px] p-[1.5px]',
            inner: 'border-[2px] md:border-[3px]'
        },
        lg: {
            outer: 'w-14 h-14 md:w-16 md:h-16 border-[3px] md:border-[3.5px] p-[2px]',
            inner: 'border-[2.5px] md:border-[3px]'
        },
        xl: {
            outer: 'w-20 h-20 border-[4px] p-[2.5px]',
            inner: 'border-[3px]'
        }
    }[size];

    return (
        <div className={`flex shrink-0 items-center justify-center ${isPulsing ? 'animate-pulse' : ''} ${className}`}>
            {/* Outer border (Yellow) with a small gap (padding) */}
            <div className={`${sizeConfig.outer} rounded-full border-[#fbaa19] bg-transparent transition-transform`}>
                {/* Inner border (Black) and 50% Solid Gradient Background */}
                <div 
                    className={`w-full h-full rounded-full ${sizeConfig.inner} border-black flex flex-col overflow-hidden shadow-inner`}
                    style={{ background: 'linear-gradient(to bottom, #fbaa19 50%, #000000 50%)' }}
                />
            </div>
        </div>
    );
};

export default Logo;
