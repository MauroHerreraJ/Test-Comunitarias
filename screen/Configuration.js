import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { postUserData, postToken, getPanicAppByCode } from "../util/Api";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

function Configuration() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [techData, setTechData] = useState({
    techCode: "",
    techName: "",
  });

  const handleChange = (name, value) => {
    setTechData({ ...techData, [name]: value });
  };

  const handleLogin = async () => {
    if (!techData.techCode || !techData.techName) {
      alert("Por favor, complete todos los campos");
      return;
    }

    try {
      setIsLoading(true);
      
      // Para mantenimiento usamos valores genéricos iniciales
      const data = {
        panicAppCode: techData.techCode.trim().toUpperCase(),
        targetDeviceId: "0000", 
        numberId: "0000",
        userCustomFields: {
          techName: techData.techName 
        },
      };

      const result = await postUserData(data);
      
      if (result?.licenseCreated?.code) {
        const dataToken = {
          grant_type: "authorization_code",
          client_id: "g4Qar6R9X3pPUMxWTbhZH7V5JGFf",
          license_code: result.licenseCreated.code,
        };

        const token = await postToken(dataToken);
        const panicAppData = await getPanicAppByCode(data.panicAppCode);

        // Guardamos la sesión del técnico
        await AsyncStorage.setItem(
          "@licencias",
          JSON.stringify({ result, token, panicAppData, isTech: true })
        );

        navigation.replace("Principal");
      } else {
        alert("Código de técnico inválido");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión o credenciales");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <MaterialIcons name="build" size={60} color="#222266" />
          <Text style={styles.title}>Mantenimiento Desit</Text>
          <Text style={styles.subtitle}>Panel de Control Técnico</Text>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código de Acceso</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="vpn-key" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Ej: VILLA-MARIA-TECH"
                placeholderTextColor="#999"
                onChangeText={(text) => handleChange("techCode", text)}
                value={techData.techCode}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Técnico</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Tu nombre completo"
                placeholderTextColor="#999"
                onChangeText={(text) => handleChange("techName", text)}
                value={techData.techName}
              />
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#222266" style={styles.loader} />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
              <MaterialIcons name="login" size={20} color="white" style={{marginLeft: 10}} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f9fa" },
  container: { flexGrow: 1, padding: 25, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  title: { fontSize: 28, fontWeight: "bold", color: "#222266", marginTop: 10 },
  subtitle: { fontSize: 16, color: "#666", marginTop: 5 },
  form: { backgroundColor: "white", borderRadius: 20, padding: 20, elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "bold", color: "#444", marginBottom: 8, marginLeft: 5 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f3f5", borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: "#e9ecef" },
  input: { flex: 1, padding: 15, color: "#212529", fontSize: 16 },
  button: { backgroundColor: "#222266", padding: 18, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10 },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  loader: { marginTop: 20 }
});

export default Configuration;
