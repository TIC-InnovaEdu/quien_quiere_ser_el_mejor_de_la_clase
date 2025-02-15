import asyncio
from bleak import BleakScanner, BleakClient
from pynput.keyboard import Controller

UUID_SERVICIO = "180C"
UUID_CARACTERISTICA = "2A57"
ARDUINO_NOMBRE = "Arduino_BLE"

# Inicializa el controlador del teclado
keyboard = Controller()

# Almacena la dirección MAC del Arduino para evitar escaneo repetitivo
arduino_mac = None

def callback(sender, data):
    try:
        mensaje = data.decode('utf-8').strip()
        print(f"Mensaje recibido: {mensaje}")
        
        letras = {
            "Boton A presionado": "A",
            "Boton B presionado": "B",
            "Boton C presionado": "C",
            "Boton D presionado": "D"
        }
        
        letra = letras.get(mensaje)
        if letra:
            print(f"Escribiendo letra: {letra}")
            keyboard.press(letra)
            keyboard.release(letra)
    except Exception as e:
        print(f"Error en callback: {e}")

async def conectar_a_arduino():
    global arduino_mac
    while True:
        try:
            # Si no tenemos la dirección MAC, realizamos un escaneo
            if not arduino_mac:
                print("Escaneando dispositivos BLE...")
                dispositivos = await BleakScanner.discover()
                for dispositivo in dispositivos:
                    if dispositivo.name and ARDUINO_NOMBRE in dispositivo.name:
                        arduino_mac = dispositivo.address
                        print(f"Dispositivo encontrado: {arduino_mac}")
                        break
                
                if not arduino_mac:
                    print("No se encontró el dispositivo. Reintentando...")
                    await asyncio.sleep(5)
                    continue
            
            async with BleakClient(arduino_mac) as client:
                print("Conexión exitosa.")
                await client.start_notify(UUID_CARACTERISTICA, callback)
                print("Notificaciones activadas.")
                
                while True:
                    if not client.is_connected:
                        print("Conexión perdida. Reintentando...")
                        break
                    await asyncio.sleep(1)
        except Exception as e:
            print(f"Error en la conexión: {e}. Reintentando en 5s...")
            await asyncio.sleep(5)  # Espera antes de intentar reconectar

asyncio.run(conectar_a_arduino())
