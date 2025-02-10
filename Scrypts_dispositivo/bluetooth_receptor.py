import asyncio
from bleak import BleakScanner, BleakClient
from pynput.keyboard import Controller

UUID_SERVICIO = "180C"
UUID_CARACTERISTICA = "2A57"

# Inicializa el controlador del teclado
keyboard = Controller()

async def recibir_datos():
    while True:
        print("Escaneando dispositivos BLE...")
        dispositivos = await BleakScanner.discover()
        
        for dispositivo in dispositivos:
            print(f"Dispositivo encontrado: {dispositivo.name} - {dispositivo.address}")
            if "Arduino_BLE" in dispositivo.name:
                print(f"Conectando a {dispositivo.name} - {dispositivo.address}")
                try:
                    async with BleakClient(dispositivo.address) as client:
                        print("Conexión exitosa.")
                        
                        def callback(sender, data):
                            mensaje = data.decode('utf-8').strip()
                            print(f"Mensaje recibido: {mensaje}")
                            
                            # Verifica si el mensaje corresponde a un botón
                            if "Boton A presionado" in mensaje:
                                letra = "A"
                            elif "Boton B presionado" in mensaje:
                                letra = "B"
                            elif "Boton C presionado" in mensaje:
                                letra = "C"
                            elif "Boton D presionado" in mensaje:
                                letra = "D"
                            else:
                                letra = None  # No escribir nada si no es un mensaje de botón
                            
                            if letra:
                                print(f"Escribiendo letra: {letra}")
                                keyboard.press(letra)
                                keyboard.release(letra)
                        
                        await client.start_notify(UUID_CARACTERISTICA, callback)
                        print("Notificaciones activadas.")
                        await asyncio.sleep(60)  # Mantener la conexión activa 60s
                        await client.stop_notify(UUID_CARACTERISTICA)
                        print("Notificaciones detenidas.")
                except Exception as e:
                    print(f"Error durante la conexión: {e}")
                break
        await asyncio.sleep(5)  # Espera antes de intentar reconectar

asyncio.run(recibir_datos())