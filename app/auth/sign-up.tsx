import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { Link } from 'expo-router';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleSignUp() {
    if (!isLoaded || loading) return;
    setError('');
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'errors' in err
          ? (err as { errors: { message: string }[] }).errors[0]?.message
          : 'Something went wrong.';
      setError(msg ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!isLoaded || loading) return;
    setError('');
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // AuthGate will redirect to onboarding automatically.
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'errors' in err
          ? (err as { errors: { message: string }[] }).errors[0]?.message
          : 'Something went wrong.';
      setError(msg ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.logo}>CampusLens</Text>
          <Text style={styles.subtitle}>Check your email for a verification code</Text>

          <TextInput
            style={styles.input}
            placeholder="Verification code"
            placeholderTextColor="#888"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify Email</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>CampusLens</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <Link href="/auth/sign-in" asChild>
          <TouchableOpacity style={styles.linkContainer}>
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkAccent}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#6C47FF',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#A78BFA',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    backgroundColor: '#252540',
    color: '#F0F0FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333366',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6C47FF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkContainer: {
    alignItems: 'center',
  },
  linkText: {
    color: '#888',
    fontSize: 14,
  },
  linkAccent: {
    color: '#A78BFA',
    fontWeight: '600',
  },
});
