import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Vibration,
  Pressable,
  Animated,
  Platform,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";

import { GlobalStyles } from "../constans/Colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { savePost, getDeviceStatus } from "../util/Api";
import { LinearGradient } from "expo-linear-gradient";
import SecondaryButton from "../component/SecondaryButton";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AllButtons = () => {
  const [showProgressBar, setShowProgressBar] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const [altoBox, setAltoBox] = useState(screenHeight / 4);
  const [backgroundImage, setBackgroundImage] = useState("https://i.imgur.com/OGxH3he.png");
  
  // Estado para el equipo dinámico (Mantenimiento)
  const [targetDeviceId, setTargetDeviceId] = useState("");
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  useEffect(() => {
    setAltoBox(screenHeight / 7.5);
  }, [screenHeight]);

  useEffect(() => {
    const loadPanicAppData = async () => {
      try {
        const storedData = await AsyncStorage.getItem("@licencias");
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData.panicAppData?.backgroundUrl) {
            setBackgroundImage(parsedData.panicAppData.backgroundUrl);
          }
        }
      } catch (error) {
        console.error("Error al cargar datos del panicapp:", error);
      }
    };
    loadPanicAppData();
  }, []);

  const handlePressIn = () => {
    if (!targetDeviceId) {
      alert("Por favor, ingrese un ID de equipo primero");
      return;
    }
    setShowProgressBar(true);
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        enviarEvento("ALARM");
        setShowProgressBar(false);
      }
    });
  };

  const handlePressOut = () => {
    animatedValue.stopAnimation();
    setShowProgressBar(false);
  };
  
  const scaleValue = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  const opacityValue = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.9],
  });

  const enviarEvento = async (eventType) => {
    if (!targetDeviceId) {
      alert("Ingrese ID de equipo");
      return;
    }
    Vibration.vibrate(500);
    try {
      await savePost({
        eventCode: "120",
        targetDeviceId: targetDeviceId, // Envío dinámico
      });
      // Se eliminó el alert de éxito ya que el equipo brinda feedback visual/sonoro
    } catch (error) {
      console.error(error);
      alert("❌ Error al enviar pánico");
    }
  };

  // Consulta de estado técnica (con espera de 10-12 segundos)
  const handleCheckStatus = async () => {
    if (!targetDeviceId) {
      alert("Ingrese ID de equipo");
      return;
    }
    
    if (isStatusLoading) return;

    try {
      setIsStatusLoading(true);
      console.log(`Iniciando consulta de estado para el equipo: ${targetDeviceId}`);
      
      const result = await getDeviceStatus(targetDeviceId);
      console.log("Respuesta completa del servidor (getDeviceStatus):", JSON.stringify(result, null, 2));
      
      // El servidor devuelve el objeto directamente, no dentro de deviceStatus
      const deviceStatus = result;

      if (deviceStatus && deviceStatus.isOnline !== undefined) {
        if (deviceStatus.isOnline) {
          const { details } = deviceStatus;
          const signalValue = parseInt(details.signal);
          const signalQuality = signalValue > 20 ? "Excelente" : 
                               signalValue > 12 ? "Buena" : "Baja";

          const info = `✅ EQUIPO EN LÍNEA\n\n` +
                       `🔋 Voltaje: ${details.battery}\n` +
                       `📶 Señal: ${details.signal}/31 (${signalQuality})\n` +
                       `🆔 IMEI: ${details.imei}\n` +
                       `📦 Versión: ${details.version}`;
          
          alert(info);
        } else {
          alert(`❌ EQUIPO FUERA DE LÍNEA\n\n${deviceStatus.message || "El equipo no responde o no tiene comunicación activa."}`);
        }
      } else {
        alert("No se recibió información de estado del equipo.");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Error al consultar el estado técnico");
    } finally {
      setIsStatusLoading(false);
    }
  };

  const turnOnLight = async () => {
    if (!targetDeviceId) return alert("Ingrese ID de equipo");
    Vibration.vibrate(500);
    try {
      await savePost({
        eventCode: "122",
        targetDeviceId: targetDeviceId,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const turnOnSiren = async () => {
    if (!targetDeviceId) return alert("Ingrese ID de equipo");
    Vibration.vibrate(500);
    try {
      await savePost({
        eventCode: "121",
        targetDeviceId: targetDeviceId,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const disarm = async () => {
    if (!targetDeviceId) return alert("Ingrese ID de equipo");
    Vibration.vibrate(500);
    try {
      await savePost({
        eventCode: "104",
        targetDeviceId: targetDeviceId,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground
        source={{ uri: backgroundImage }}
        resizeMode="cover"
        style={styles.rootScreen}
      >
        {/* Selector de Equipo para Mantenimiento */}
        <View style={styles.maintenanceHeader}>
          <View style={styles.deviceInputContainer}>
            <MaterialIcons name="router" size={24} color="#222266" />
            <TextInput
              style={styles.deviceInput}
              placeholder="ID Equipo (ej: 1005)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={targetDeviceId}
              onChangeText={setTargetDeviceId}
              maxLength={4}
            />
            {targetDeviceId.length > 0 && (
              <Pressable onPress={() => setTargetDeviceId("")}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </Pressable>
            )}
          </View>
          <Text style={styles.maintenanceInfo}>
            {targetDeviceId ? `Testeando equipo: ${targetDeviceId}` : "Ingrese ID para comenzar"}
          </Text>
        </View>

        <View style={[styles.buttonRow, { marginTop: 4 }]}>
          <SecondaryButton
            onPress={turnOnLight}
            name="wb-sunny"
            styles={StyleSheet.flatten([
              styles.baseButtonContainer,
              { height: altoBox },
              styles.lightButton,
            ])}
            text="Reflector"
            text2=""
          />
          <SecondaryButton
            onPress={turnOnSiren}
            name="notifications-active"
            styles={StyleSheet.flatten([
              styles.baseButtonContainer,
              { height: altoBox },
              styles.sirenButton,
            ])}
            text="Sirena"
            text2=""
          />
        </View>

        <View style={[styles.buttonRow, { marginTop: 4 }]}>
          <SecondaryButton
            onPress={disarm}
            name="pause-circle"
            styles={StyleSheet.flatten([
              styles.baseButtonContainer1,
              { height: altoBox },
              styles.deactivationButton,
            ])}
            text="Desactivar Equipo"
            text2=""
          />
        </View>

        <View style={[styles.buttonRow, { marginTop: 4 }]}>
          <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <View style={styles.panicButtonWrapper}>
              <View style={[styles.panicButton, { height: altoBox + 15 }]}>
                {showProgressBar && (
                  <Animated.View 
                    style={[
                      styles.progressFillContainer,
                      {
                        transform: [{ scale: scaleValue }],
                        opacity: opacityValue,
                      }
                    ]}
                  >
                    <LinearGradient
                      colors={["#ffeb3b", "#ffc107", "#ff9800"]}
                      style={styles.progressFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  </Animated.View>
                )}
                <View style={styles.panicButtonContent}>
                  <Ionicons name="warning" size={50} color="white" />
                  <Text style={styles.textButton}>Pánico / Test</Text>
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        <View style={[styles.buttonRow, { marginTop: 4 }]}>
          <SecondaryButton
            onPress={handleCheckStatus}
            name={isStatusLoading ? "hourglass-empty" : "analytics"}
            styles={StyleSheet.flatten([
              styles.baseButtonContainer1,
              { height: altoBox, backgroundColor: "#222266" },
            ])}
            text={isStatusLoading ? "Consultando..." : "Verificar estado de Equipo"}
            text2=""
          />
        </View>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}; 

export default AllButtons;

const deviceWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  rootScreen: {
    flex: 1,
  },
  maintenanceHeader: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 10,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  deviceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f3f5",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#222266",
  },
  deviceInput: {
    flex: 1,
    padding: 12,
    color: "#222266",
    fontSize: 18,
    fontWeight: "bold",
  },
  maintenanceInfo: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  baseButtonContainer: {
    margin: 4,
    width: deviceWidth * 0.44,
    borderRadius: 20,
    overflow: Platform.OS === "android" ? "hidden" : "visible",
    elevation: 3,
    shadowColor: "black",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  baseButtonContainer1: {
    padding: 10,
    margin: 4,
    width: deviceWidth * 0.9,
    borderRadius: 20,
    overflow: Platform.OS === "android" ? "hidden" : "visible",
    elevation: 3,
    shadowColor: "black",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  lightButton: {
    backgroundColor: GlobalStyles.colors.accent500,
    opacity: 0.90,
  },
  sirenButton: {
    backgroundColor: GlobalStyles.colors.colorbuttonI,
    opacity: 0.90,
  },
  deactivationButton: {
    backgroundColor: GlobalStyles.colors.gray500,
    opacity: 0.90,
  },
  panicButtonWrapper: {
    width: deviceWidth * 0.9,
  },
  panicButton: {
    position: "relative",
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: GlobalStyles.colors.titlecolor,
    opacity: 0.90,
    elevation: 3,
    shadowColor: "black",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  progressFillContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  progressFill: {
    width: "200%",
    height: "200%",
    borderRadius: 1000,
  },
  panicButtonContent: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  textButton: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
});
