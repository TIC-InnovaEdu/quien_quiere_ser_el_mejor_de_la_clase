from graphviz import Digraph

# Crear el grafo para el diagrama ER
dot = Digraph()

# Definir las entidades (nodos)
dot.node('Usuario', 'Usuario\n(id, nombre_usuario, contraseña, correo, rol)')
dot.node('Partida', 'Partida\n(id, puntuacion, fecha)')
dot.node('Pregunta', 'Pregunta\n(id, pregunta, opcion_correcta)')
dot.node('Respuesta', 'Respuesta\n(id, respuesta)')

# Definir las relaciones entre las entidades

# Usuario (gestiona) Pregunta: 1:N
dot.edge('Usuario', 'Pregunta', label='gestiona (1:N)', dir='none')

# Usuario (juega) Partida: 1:N
dot.edge('Usuario', 'Partida', label='juega (1:N)', dir='none')

# Pregunta (participa en) Partida: M:N
dot.edge('Pregunta', 'Partida', label='participa en (M:N)', dir='none')

# Estudiante responde Pregunta en Partida: M:N a través de Respuesta
dot.edge('Usuario', 'Respuesta', label='responde (M:N)', dir='none')
dot.edge('Pregunta', 'Respuesta', label='es respondida en (M:N)', dir='none')
dot.edge('Partida', 'Respuesta', label='incluye (1:N)', dir='none')

# Relación de la puntuación de Estudiante en Partida: 1:N
dot.edge('Usuario', 'Partida', label='tiene puntuación en (1:N)', dir='none')

# Generar el archivo PNG
dot.render('diagrama_ER_completo', format='png', cleanup=True)

# Mostrar el diagrama
dot.view('diagrama_ER_completo')
