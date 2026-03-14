import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { WebView } from 'react-native-webview';

interface GraphContextType {
    webViewRef: React.RefObject<WebView | null>;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

export function GraphProvider({ children }: { children: ReactNode }) {
    const webViewRef = useRef<WebView>(null);

    return (
        <GraphContext.Provider value={{ webViewRef }}>
            {children}
        </GraphContext.Provider>
    );
}

export function useGraph() {
    const context = useContext(GraphContext);
    if (context === undefined) {
        throw new Error('useGraph must be used within a GraphProvider');
    }
    return context;
}
