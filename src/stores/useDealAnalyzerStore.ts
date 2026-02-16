import { create } from "zustand";
import type { AnalyzerContextType, AnalyzerPayload } from "@/types/deal-analyzer-types";

interface DealAnalyzerState {
    isOpen: boolean;
    contextType: AnalyzerContextType | null;
    dataPayload: AnalyzerPayload | null;
    openDealAnalyzer: (contextType: AnalyzerContextType, dataPayload: AnalyzerPayload) => void;
    closeDealAnalyzer: () => void;
}

export const useDealAnalyzerStore = create<DealAnalyzerState>((set) => ({
    isOpen: false,
    contextType: null,
    dataPayload: null,
    openDealAnalyzer: (contextType, dataPayload) =>
        set({ isOpen: true, contextType, dataPayload }),
    closeDealAnalyzer: () =>
        set({ isOpen: false, contextType: null, dataPayload: null }),
}));
