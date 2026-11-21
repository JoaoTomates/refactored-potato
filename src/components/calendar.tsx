"use client";

import React from 'react';
import F1WorldScheduleMap from '@/components/f1-world-schedule-map';

interface CalendarProps {
    onBack?: () => void;
    accentColor?: string;
}

export default function Calendar({ onBack, accentColor }: CalendarProps) {
    return <F1WorldScheduleMap onBack={onBack} accentColor={accentColor} />;
}
