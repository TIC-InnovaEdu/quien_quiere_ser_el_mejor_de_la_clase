#include <ArduinoBLE.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 4);  // Dirección del LCD y tamaño 16x4

BLEService botonService("180C"); // UUID del servicio
BLECharacteristic botonCharacteristic("2A57", BLEWrite | BLENotify, 20);

const int buttonPinLeft = 5;   // Botón rojo
const int buttonPinDown = 6;   // Botón verde
const int buttonPinUp = 7;     // Botón azul
const int buttonPinRight = 8;  // Botón amarillo

int buttonStateLeft = 0;
int buttonStateDown = 0;
int buttonStateUp = 0;
int buttonStateRight = 0;

void setup() {
  Serial.begin(115200);

  // Inicializando el LCD
  lcd.init();
  lcd.backlight(); // Habilitar la luz de fondo

  // Inicialización de botones
  pinMode(buttonPinLeft, INPUT_PULLUP);
  pinMode(buttonPinDown, INPUT_PULLUP);
  pinMode(buttonPinUp, INPUT_PULLUP);
  pinMode(buttonPinRight, INPUT_PULLUP);

  // Mostrar mensaje de bienvenida en LCD
  lcd.clear();
  lcd.setCursor(0,1);
  lcd.print("Bienvenidos al");
  lcd.setCursor(0,2);
  lcd.print("Selector de Opciones");
  delay(5000);
  lcd.clear();

  // Mostrar las instrucciones de los botones
  lcd.setCursor(0,0);
  lcd.print("Opcion A: Rojo");
  lcd.setCursor(0,1);
  lcd.print("Opcion B: Verde");
  lcd.setCursor(0,2);
  lcd.print("Opcion C: Azul");
  lcd.setCursor(0,3);
  lcd.print("Opcion D: Amarillo");

  // Inicializando BLE
  if (!BLE.begin()) {
    Serial.println("Error: No se pudo iniciar BLE");
    while (1);
  }

  BLE.setLocalName("Arduino_BLE");
  BLE.setAdvertisedService(botonService);
  botonService.addCharacteristic(botonCharacteristic);
  BLE.addService(botonService);

  botonCharacteristic.writeValue("Esperando...");

  BLE.advertise();
  Serial.println("Bluetooth listo.");
}

void loop() {
  BLEDevice central = BLE.central();
  
  if (central) {
    Serial.println("Dispositivo conectado");

    while (central.connected()) {
      // Enviar un "ping" cada 10 segundos para mantener la conexión
      static unsigned long lastPingTime = 0;
      unsigned long currentTime = millis();
      if (currentTime - lastPingTime >= 10000) {
        botonCharacteristic.writeValue("Ping");
        lastPingTime = currentTime;
        Serial.println("Ping enviado");
      }

      // Detectar estado de los botones
      buttonStateLeft = digitalRead(buttonPinLeft);
      buttonStateDown = digitalRead(buttonPinDown);
      buttonStateUp = digitalRead(buttonPinUp);
      buttonStateRight = digitalRead(buttonPinRight);

      // Manejo de la selección de botones y comunicación BLE
      if (buttonStateLeft == LOW) {
        mostrarOpcion("A");
        botonCharacteristic.writeValue("Boton A presionado");
        Serial.println("KEY_A");
        delay(300);  // Delay para evitar rebotes del botón
      } else if (buttonStateDown == LOW) {
        mostrarOpcion("B");
        botonCharacteristic.writeValue("Boton B presionado");
        Serial.println("KEY_B");
        delay(300);  // Delay para evitar rebotes del botón
      } else if (buttonStateUp == LOW) {
        mostrarOpcion("C");
        botonCharacteristic.writeValue("Boton C presionado");
        Serial.println("KEY_C");
        delay(300);  // Delay para evitar rebotes del botón
      } else if (buttonStateRight == LOW) {
        mostrarOpcion("D");
        botonCharacteristic.writeValue("Boton D presionado");
        Serial.println("KEY_D");
        delay(300);  // Delay para evitar rebotes del botón
      }
    }

    Serial.println("Dispositivo desconectado");
  }
}

void mostrarOpcion(String opcion) {
  lcd.clear();
  lcd.setCursor(0, 1);
  lcd.print("Opcion ");
  lcd.print(opcion);
  lcd.print(" elegida");

  // Imprimir la opción en la consola
  Serial.print("Opcion ");
  Serial.print(opcion);
  Serial.println(" elegida");

  delay(2000);  // Esperar 2 segundos

  // Volver a mostrar las instrucciones de los botones
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Opcion A: Rojo");
  lcd.setCursor(0,1);
  lcd.print("Opcion B: Verde");
  lcd.setCursor(0,2);
  lcd.print("Opcion C: Azul");
  lcd.setCursor(0,3);
  lcd.print("Opcion D: Amarillo");
}