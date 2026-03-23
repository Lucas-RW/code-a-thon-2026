import React from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface SimpleWebViewProps {
  source: { html: string } | { uri: string };
  webViewRef?: React.RefObject<WebView | null>;
  onMessage?: (event: any) => void;
  path?: any[];
  alternatives?: any[];
}

export default function SimpleWebView({ 
  source, 
  webViewRef, 
  onMessage, 
  path,
  alternatives = [] 
}: SimpleWebViewProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const internalWebViewRef = React.useRef<WebView | null>(null);
  const resolvedWebViewRef = webViewRef ?? internalWebViewRef;
  const isGraphReadyRef = React.useRef(false);
  const queuedPayloadRef = React.useRef<string | null>(null);

  const rawPayload = React.useMemo(
    () => JSON.stringify({ type: 'UPDATE_DATA', path: path ?? [], alternatives }),
    [alternatives, path]
  );

  const postPayload = React.useCallback((payload: string) => {
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(payload, '*');
      return;
    }

    resolvedWebViewRef.current?.postMessage(payload);
  }, [resolvedWebViewRef]);

  const flushGraphData = React.useCallback(() => {
    queuedPayloadRef.current = rawPayload;
    if (!isGraphReadyRef.current) return;
    postPayload(rawPayload);
  }, [postPayload, rawPayload]);

  React.useEffect(() => {
    flushGraphData();
  }, [flushGraphData]);

  const handleGraphMessage = React.useCallback((event: any) => {
    let parsed: any = null;
    try {
      parsed =
        typeof event?.nativeEvent?.data === 'string'
          ? JSON.parse(event.nativeEvent.data)
          : event?.nativeEvent?.data;
    } catch {
      parsed = null;
    }

    if (parsed?.type === 'GRAPH_READY') {
      isGraphReadyRef.current = true;
      if (queuedPayloadRef.current) {
        postPayload(queuedPayloadRef.current);
      }
      return;
    }

    onMessage?.(event);
  }, [onMessage, postPayload]);

  if (Platform.OS === 'web') {
    const uri = 'uri' in source ? source.uri : undefined;
    const html = 'html' in source ? (source.html || undefined) : undefined;

    // Listen for messages from iframe
    React.useEffect(() => {
        const handler = (event: MessageEvent) => {
            handleGraphMessage({ nativeEvent: { data: event.data } });
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [handleGraphMessage]);

    return (
      <View style={styles.container}>
        <iframe
          ref={iframeRef}
          src={uri}
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'transparent' }}
          title="Star Map"
          onLoad={() => {
            isGraphReadyRef.current = false;
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={resolvedWebViewRef}
        source={source}
        onMessage={handleGraphMessage}
        onLoadStart={() => {
          isGraphReadyRef.current = false;
        }}
        style={styles.webview}
        scrollEnabled={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#FFD700" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
