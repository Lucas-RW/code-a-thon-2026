import { WebView } from "react-native-webview";
import { useAssets } from "expo-asset";
import React, { useMemo } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useGraph } from "@/context/GraphContext";

const GRAPH_HTML = require("../../assets/graph/index.html");

export default function GraphScreen() {
  const { webViewRef } = useGraph();
  const [assets, error] = useAssets([GRAPH_HTML]);

  const source = useMemo(() => {
    if (!assets || !assets[0].localUri) return undefined;
    return { uri: assets[0].localUri };
  }, [assets]);

  if (error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  if (!source) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={source}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        allowFileAccess
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
