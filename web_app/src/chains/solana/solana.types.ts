export type StepUpdateCallback = (stepIndex: number, updates: { 
    status?: 'pending' | 'processing' | 'success' | 'error', 
    description?: string, 
    error?: string 
}) => void;
