import { useEffect, useState } from "react";
import { dayNumber, msUntilNextDay } from "./schedule";

/** Today's day number. Updates at UTC midnight if the tab stays open. */
export function useDay() {
    const [day, setDay] = useState(() => dayNumber());

    useEffect(() => {
        const timer = setTimeout(
            () => setDay(dayNumber()),
            msUntilNextDay() + 1000
        );
        return () => clearTimeout(timer);
    }, [day]);

    return day;
}

/** "5h 12m" until the next bug, refreshed every 30 seconds. */
export function useCountdown() {
    const [ms, setMs] = useState(() => msUntilNextDay());

    useEffect(() => {
        const timer = setInterval(() => setMs(msUntilNextDay()), 30_000);
        return () => clearInterval(timer);
    }, []);

    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);

    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}
