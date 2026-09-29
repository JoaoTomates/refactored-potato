"use client";

import React, { useState } from 'react';

export default function NewsInteractions({ newsId }: { newsId: string }) {
    // Local state for UI demonstration. In the future, this can be synced to Supabase via newsId (URL or GUID)
    const [likes, setLikes] = useState(0);
    const [fires, setFires] = useState(0);
    const [surprises, setSurprises] = useState(0);
    const [dislikes, setDislikes] = useState(0);

    const [userReaction, setUserReaction] = useState<'like' | 'fire' | 'surprise' | 'dislike' | null>(null);

    const handleReact = (type: 'like' | 'fire' | 'surprise' | 'dislike') => {
        // Toggle off if clicking the same reaction
        if (userReaction === type) {
            if (type === 'like') setLikes(prev => prev - 1);
            if (type === 'fire') setFires(prev => prev - 1);
            if (type === 'surprise') setSurprises(prev => prev - 1);
            if (type === 'dislike') setDislikes(prev => prev - 1);
            setUserReaction(null);
            return;
        }

        // Remove previous reaction if any
        if (userReaction === 'like') setLikes(prev => prev - 1);
        if (userReaction === 'fire') setFires(prev => prev - 1);
        if (userReaction === 'surprise') setSurprises(prev => prev - 1);
        if (userReaction === 'dislike') setDislikes(prev => prev - 1);

        // Add new reaction
        if (type === 'like') setLikes(prev => prev + 1);
        if (type === 'fire') setFires(prev => prev + 1);
        if (type === 'surprise') setSurprises(prev => prev + 1);
        if (type === 'dislike') setDislikes(prev => prev + 1);
        
        setUserReaction(type);
    };

    return (
        <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
            <button 
                onClick={(e) => { e.preventDefault(); handleReact('like'); }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold transition-all ${userReaction === 'like' ? 'bg-[#fbaa19]/20 text-[#fbaa19]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                title="Like"
            >
                <span className={`text-base ${userReaction === 'like' ? 'scale-110' : 'grayscale opacity-70'}`}>👍</span>
                {likes > 0 && <span>{likes}</span>}
            </button>
            
            <button 
                onClick={(e) => { e.preventDefault(); handleReact('fire'); }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold transition-all ${userReaction === 'fire' ? 'bg-orange-500/20 text-orange-500' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                title="Fire"
            >
                <span className={`text-base ${userReaction === 'fire' ? 'scale-110' : 'grayscale opacity-70'}`}>🔥</span>
                {fires > 0 && <span>{fires}</span>}
            </button>

            <button 
                onClick={(e) => { e.preventDefault(); handleReact('surprise'); }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold transition-all ${userReaction === 'surprise' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                title="Surprise"
            >
                <span className={`text-base ${userReaction === 'surprise' ? 'scale-110' : 'grayscale opacity-70'}`}>😲</span>
                {surprises > 0 && <span>{surprises}</span>}
            </button>

            <button 
                onClick={(e) => { e.preventDefault(); handleReact('dislike'); }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold transition-all ${userReaction === 'dislike' ? 'bg-red-500/20 text-red-500' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                title="Dislike"
            >
                <span className={`text-base ${userReaction === 'dislike' ? 'scale-110' : 'grayscale opacity-70'}`}>👎</span>
                {dislikes > 0 && <span>{dislikes}</span>}
            </button>
        </div>
    );
}
