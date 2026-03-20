import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';
import { WebView } from 'react-native-webview';

interface GraphContextType {
    webViewRef: React.RefObject<WebView | null>;
    pathData: any[];
    setPathData: (data: any[]) => void;
    goalText: string;
    setGlobalGoalText: (text: string) => void;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

export function GraphProvider({ children }: { children: ReactNode }) {
    const webViewRef = useRef<WebView>(null);
    const [pathData, setPathData] = useState<any[]>([]);
    const [goalText, setGlobalGoalText] = useState<string>('');

    return (
        <GraphContext.Provider value={{ 
            webViewRef, 
            pathData, 
            setPathData, 
            goalText, 
            setGlobalGoalText 
        }}>
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
