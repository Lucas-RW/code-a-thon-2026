export type GraphMessage =
  | {
      type: "HIGHLIGHT_PATH";
      skillNodeIds?: string[];
      networkNodeIds?: string[];
      orderedStepIds?: string[]; // optional order reference
    }
  | {
      type: "CLEAR_HIGHLIGHT";
    };

/**
 * Sends a message to a WebView ref for graph highlighting/control.
 * Assume you are using react-native-webview and its standard postMessage protocol.
 */
export function sendGraphMessage(
  webViewRef: React.RefObject<any>,
  message: GraphMessage
) {
  if (!webViewRef.current) return;
  const payload = JSON.stringify(message);
  webViewRef.current.postMessage(payload);
}

/**
 * TODO: Document expected behavior inside WebView:
 * 
 * When receiving a HIGHLIGHT_PATH message:
 * - Highlight nodes whose IDs are in skillNodeIds and networkNodeIds.
 * - Dim non-path nodes.
 * 
 * When receiving CLEAR_HIGHLIGHT:
 * - Restore default graph appearance.
 */
