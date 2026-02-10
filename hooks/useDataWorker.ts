
import { useEffect, useRef, useCallback } from 'react';
import { workerCode } from '../workers/dataWorker';
import { WorkerMessage, WorkerResponse } from '../types';

export const useDataWorker = () => {
    const workerRef = useRef<Worker | null>(null);
    const callbackRef = useRef<((data: any) => void) | null>(null);

    useEffect(() => {
        // Create worker from Blob
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        workerRef.current = new Worker(url);

        workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
            if (callbackRef.current) {
                callbackRef.current(e.data.payload);
            }
        };

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
            URL.revokeObjectURL(url);
        };
    }, []);

    const postMessage = useCallback((message: WorkerMessage, callback: (data: any) => void) => {
        if (workerRef.current) {
            callbackRef.current = callback;
            workerRef.current.postMessage(message);
        }
    }, []);

    return { postMessage };
};
