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
import { savePost } from "../util/Api";
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

  useEffect(() => {
    setAltoBox(screenHeight / 4 - 20);
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
      const result = await savePost({
        eventCode: "120",
        targetDeviceId: targetDeviceId, // Envío dinámico
      });
      console.log(`${eventType} enviado a ${targetDeviceId}`, result);
    } catch (error) {
      console.error(error);
      alert("Error al enviar evento");
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

        <View style={[styles.buttonRow, { marginTop: 10 }]}>
          <SecondaryButton
            onPress={turnOnLight}
            name="wb-sunny"
            styles={StyleSheet.flatten([
              styles.baseButtonContainer,
              { height: altoBox - 30 },
              styles.lightButton,
            ])}
            text="Encender"
            text2="Reflector"
          />
          <SecondaryButton
            onPress={turnOnSiren}
            name="notifications-active"
            styles={StyleSheet.flatten([
              styles.baseButtonContainer,
              { height: altoBox - 30 },
              styles.sirenButton,
            ])}
            text="Encender"
            text2="Sirena"
          />
        </View>

        <View style={[styles.buttonRow, { marginTop: 10 }]}>
          <SecondaryButton
            onPress={disarm}
            name="pause-circle"
            styles={StyleSheet.flatten([
              styles.baseButtonContainer1,
              { height: altoBox - 40 },
              styles.deactivationButton,
            ])}
            text=""
            text2="Desactivar"
          />
        </View>

        <View style={[styles.buttonRow, { marginTop: 10 }]}>
          <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <View style={styles.panicButtonWrapper}>
              <View style={[styles.panicButton, { height: altoBox - 10 }]}>
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
    padding: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
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
    margin: 8,
    width: deviceWidth * 0.42,
    borderRadius: 26,
    overflow: Platform.OS === "android" ? "hidden" : "visible",
    elevation: 4,
    shadowColor: "black",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  baseButtonContainer1: {
    padding: 30,
    margin: 8,
    width: deviceWidth * 0.9,
    borderRadius: 26,
    overflow: Platform.OS === "android" ? "hidden" : "visible",
    elevation: 4,
    shadowColor: "black",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
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
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: GlobalStyles.colors.titlecolor,
    opacity: 0.90,
    elevation: 4,
    shadowColor: "black",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 14,
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
