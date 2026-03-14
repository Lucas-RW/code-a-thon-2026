import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { aiBootstrapBuilding, saveAIBootstrap, AIBootstrapBuildingResponse, SaveAIBootstrapRequest } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import LoadingState from '@/components/LoadingState';

export default function AIBootstrapDevScreen() {
  const [campusName, setCampusName] = useState("University of Florida");
  const [buildingName, setBuildingName] = useState("");
  const [buildingUrl, setBuildingUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AIBootstrapBuildingResponse | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  const handleGenerate = async () => {
    if (!buildingName.trim()) {
      showToast('Building name is required', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await aiBootstrapBuilding({
        campus_name: campusName.trim(),
        building_name: buildingName.trim(),
        building_url: buildingUrl.trim() || undefined,
      });
      setResult(res);
      showToast('AI building proposal generated', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to generate building with AI', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const payload: SaveAIBootstrapRequest = {
        building: result.building,
        opportunities: result.opportunities,
      };
      const res = await saveAIBootstrap(payload);
      showToast(
        `Saved building (id=${res.building_id}), opportunities=${res.inserted_opportunities}`,
        'success'
      );
    } catch (e: any) {
      showToast(e.message || 'Failed to save AI building to database', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Dev AI Bootstrap</Text>
            <Text style={styles.subtitle}>Generate building data with AI</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Campus Name</Text>
              <TextInput
                style={styles.input}
                placeholder="University of Florida"
                placeholderTextColor="#666"
                value={campusName}
                onChangeText={setCampusName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Building Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Malachowsky Hall"
                placeholderTextColor="#666"
                value={buildingName}
                onChangeText={setBuildingName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Building URL (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor="#666"
                value={buildingUrl}
                onChangeText={setBuildingUrl}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={[styles.generateButton, loading && styles.buttonDisabled]} 
              onPress={handleGenerate}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Generating...' : 'Generate with AI'}</Text>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.resultSection}>
              <Text style={styles.sectionTitle}>Preview JSON</Text>
              <View style={styles.jsonContainer}>
                <ScrollView nestedScrollEnabled style={styles.jsonScroll}>
                  <Text style={styles.jsonText}>{JSON.stringify(result, null, 2)}</Text>
                </ScrollView>
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.buttonDisabled]} 
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save to Database'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {(loading || saving) && <LoadingState message={loading ? "Generating..." : "Saving..."} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    color: '#aaa',
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  generateButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#44ff44',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  resultSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  jsonContainer: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    height: 300,
    padding: 12,
  },
  jsonScroll: {
    flex: 1,
  },
  jsonText: {
    color: '#0f0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
});
