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

  React.useEffect(() => {
    if (path && path.length > 0) {
      const payload = JSON.stringify({ type: 'UPDATE_DATA', path, alternatives });
      
      if (Platform.OS === 'web' && iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(payload, '*');
      } else if (webViewRef?.current) {
        webViewRef.current.postMessage(payload);
      }
    }
  }, [path, alternatives, webViewRef]);

  if (Platform.OS === 'web') {
    const uri = 'uri' in source ? source.uri : undefined;
    const html = 'html' in source ? (source.html || undefined) : undefined;

    // Listen for messages from iframe
    React.useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (onMessage) {
                // Wrap in a format compatible with WebView's onMessage
                onMessage({ nativeEvent: { data: event.data } });
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [onMessage]);

    return (
      <View style={styles.container}>
        <iframe
          ref={iframeRef}
          src={uri}
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'transparent' }}
          title="Star Map"
          onLoad={() => {
            if (path && path.length > 0) {
                const payload = JSON.stringify({ type: 'UPDATE_DATA', path, alternatives });
                iframeRef.current?.contentWindow?.postMessage(payload, '*');
            }
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={source}
        onMessage={onMessage}
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
