/* RANGO · guía: técnica de cada ejercicio, tutorial y ayuda */
(function (R) {
  'use strict';
  /* mu: músculos (el primero es el principal) · mis: errores comunes · tip: consejo clave */
  R.GUIDE = {
    banca: { mu: ['Pectoral', 'Tríceps', 'Hombro frontal'], mis: ['Rebotar la barra en el pecho', 'Despegar la cadera del banco', 'Abrir los codos a 90° del cuerpo'], tip: 'Inspira al bajar y suelta el aire al empujar. Baja en 2 segundos y sube en 1.' },
    bancadb: { mu: ['Pectoral', 'Tríceps', 'Hombro frontal'], mis: ['Chocar las mancuernas arriba', 'Bajar demasiado y cargar el hombro', 'Arquear la zona lumbar'], tip: 'Las mancuernas dejan bajar más que la barra: aprovecha para estirar el pecho sin dolor.' },
    inclinado: { mu: ['Pectoral superior', 'Hombro frontal', 'Tríceps'], mis: ['Banco demasiado inclinado (más de 45°)', 'Subir los hombros hacia las orejas', 'Rebotar abajo'], tip: 'Un banco de 30° trabaja la parte alta del pecho sin robarle todo al hombro.' },
    pressmaq: { mu: ['Pectoral', 'Tríceps', 'Hombro frontal'], mis: ['Asiento mal ajustado', 'Despegar la espalda del respaldo', 'Estirar los codos de golpe'], tip: 'Ajusta el asiento para que las asas queden a la altura de la mitad del pecho.' },
    pecdeck: { mu: ['Pectoral', 'Hombro frontal'], mis: ['Usar demasiado peso y hacer press', 'Encogerse de hombros', 'Dejar caer el peso al abrir'], tip: 'Piensa en juntar los codos, no las manos. Aprieta 1 segundo cuando estén cerca.' },
    cruces: { mu: ['Pectoral', 'Hombro frontal'], mis: ['Estirar los brazos del todo', 'Balancear el cuerpo para mover el peso', 'Cerrar sin apretar el pecho'], tip: 'Mantén una ligera flexión de codos fija durante todo el movimiento.' },
    flexiones: { mu: ['Pectoral', 'Tríceps', 'Core'], mis: ['Hundir o subir la cadera', 'Bajar solo la mitad del recorrido', 'Abrir los codos en cruz'], tip: 'Si cuestan, apoya las manos en un banco. Si son fáciles, pon los pies elevados o añade lastre.' },
    dominadas: { mu: ['Dorsal ancho', 'Bíceps', 'Antebrazo'], mis: ['Balancearse para coger impulso', 'No estirar los brazos abajo', 'Subir solo con los brazos sin bajar los hombros'], tip: 'Empieza el movimiento bajando los hombros, como si quisieras guardar los omóplatos en los bolsillos.' },
    jalon: { mu: ['Dorsal ancho', 'Bíceps', 'Romboides'], mis: ['Tirar con los brazos y echarse mucho hacia atrás', 'Bajar la barra detrás de la nuca', 'Encoger los hombros'], tip: 'Imagina que llevas los codos al bolsillo trasero del pantalón.' },
    remo: { mu: ['Dorsal y espalda media', 'Bíceps', 'Lumbar'], mis: ['Redondear la espalda', 'Levantar el torso al tirar', 'Tirar hacia el pecho en vez del ombligo'], tip: 'Mantén el torso fijo a unos 45° y mueve solo los codos hacia atrás.' },
    remodb: { mu: ['Dorsal ancho', 'Bíceps', 'Espalda media'], mis: ['Girar el torso al subir', 'Tirar con el brazo en vez del codo', 'Dejar caer la mancuerna'], tip: 'Tira hacia la cadera, no hacia el pecho, y pausa 1 segundo arriba.' },
    remopolea: { mu: ['Espalda media', 'Dorsal ancho', 'Bíceps'], mis: ['Balancear el torso adelante y atrás', 'Encoger los hombros', 'Redondear la espalda al estirar'], tip: 'Junta los omóplatos al final y vuelve estirando sin perder la postura.' },
    muerto: { mu: ['Espalda baja', 'Glúteo y femoral', 'Trapecio'], mis: ['Redondear la espalda', 'Separar la barra de las piernas', 'Tirar con los brazos en vez de empujar con las piernas'], tip: 'Inspira, aprieta el abdomen y empuja el suelo. Si la espalda se redondea, baja el peso.' },
    rumano: { mu: ['Femoral', 'Glúteo', 'Lumbar'], mis: ['Doblar demasiado las rodillas (sentadilla)', 'Redondear la espalda', 'Alejar la barra de las piernas'], tip: 'Es un movimiento de cadera: empuja el trasero hacia atrás hasta notar el estiramiento del femoral.' },
    sentadilla: { mu: ['Cuádriceps', 'Glúteo', 'Core'], mis: ['Rodillas hacia dentro', 'Levantar los talones', 'Inclinar el torso demasiado'], tip: 'Empuja las rodillas hacia fuera, en la dirección de los pies, y mantén el pecho alto.' },
    prensa: { mu: ['Cuádriceps', 'Glúteo'], mis: ['Despegar la cadera del asiento', 'Bloquear las rodillas arriba', 'Poner los pies demasiado bajos'], tip: 'Con los pies más altos trabajas más glúteo; más bajos, más cuádriceps.' },
    extension: { mu: ['Cuádriceps'], mis: ['Balancear el cuerpo', 'Soltar el peso abajo', 'Usar demasiado peso con poco recorrido'], tip: 'Aprieta 1 segundo arriba y baja en 2-3 segundos.' },
    curlfem: { mu: ['Femoral', 'Gemelo'], mis: ['Levantar la cadera del banco', 'Rebotar abajo', 'Recorrido corto'], tip: 'Mantén la cadera pegada al banco y baja despacio: la fase de bajada también cuenta.' },
    zancadas: { mu: ['Cuádriceps', 'Glúteo', 'Femoral'], mis: ['Paso demasiado corto', 'Rodilla delantera hacia dentro', 'Inclinar el torso hacia delante'], tip: 'Baja recto, como en un ascensor, con el torso erguido.' },
    hipthrust: { mu: ['Glúteo', 'Femoral'], mis: ['Arquear la zona lumbar arriba', 'Empujar con la punta del pie', 'No llegar a extender la cadera'], tip: 'Arriba, la barbilla pegada al pecho y las costillas hacia abajo: así trabaja el glúteo y no la espalda.' },
    gemelos: { mu: ['Gemelo', 'Sóleo'], mis: ['Rebotar abajo', 'Recorrido muy corto', 'Doblar las rodillas'], tip: 'Pausa 1 segundo arriba y otro abajo, en el estiramiento.' },
    ohp: { mu: ['Hombro', 'Tríceps', 'Core'], mis: ['Arquear la espalda', 'Empujar la barra hacia delante', 'No bloquear arriba'], tip: 'Aprieta glúteos y abdomen como si te fueran a dar un golpe. Pasa la cabeza bajo la barra al subir.' },
    ohpdb: { mu: ['Hombro', 'Tríceps'], mis: ['Arquear la espalda', 'Bajar poco', 'Chocar las mancuernas arriba'], tip: 'Sentado con respaldo cuidas más la espalda si el peso es alto.' },
    pressmaqh: { mu: ['Hombro', 'Tríceps'], mis: ['Despegar la espalda', 'Asiento demasiado bajo', 'Bloquear los codos de golpe'], tip: 'Empuja en vertical y baja hasta que las asas queden a la altura de las orejas.' },
    laterales: { mu: ['Hombro lateral'], mis: ['Balancear el cuerpo', 'Subir más arriba de los hombros', 'Usar demasiado peso'], tip: 'Sube con los codos ligeramente flexionados, como si vertieras agua de una jarra.' },
    facepull: { mu: ['Hombro posterior', 'Espalda alta', 'Manguito rotador'], mis: ['Tirar hacia el pecho', 'Echarse hacia atrás', 'Usar demasiado peso'], tip: 'Tira hacia la frente abriendo los codos y rota las manos hacia fuera al final.' },
    curl: { mu: ['Bíceps', 'Antebrazo'], mis: ['Balancear la espalda', 'Adelantar los codos', 'Bajar de golpe'], tip: 'Mantén los codos quietos junto al cuerpo y baja en 2-3 segundos.' },
    curldb: { mu: ['Bíceps', 'Antebrazo'], mis: ['Balancear el cuerpo', 'Despegar los codos del costado', 'Recorrido corto'], tip: 'Gira la palma hacia arriba mientras subes para contraer más el bíceps.' },
    pushdown: { mu: ['Tríceps'], mis: ['Despegar los codos del cuerpo', 'Inclinarse sobre la barra', 'No estirar del todo'], tip: 'Solo se mueven los antebrazos. Aprieta el tríceps 1 segundo abajo.' },
    nuca: { mu: ['Tríceps'], mis: ['Abrir los codos hacia fuera', 'Arquear la espalda', 'Bajar demasiado rápido'], tip: 'Mantén los codos apuntando al techo y cerca de las orejas.' },
    fondos: { mu: ['Tríceps', 'Pectoral inferior', 'Hombro frontal'], mis: ['Bajar demasiado y cargar el hombro', 'Encogerse de hombros', 'Balancear las piernas'], tip: 'Inclinado hacia delante trabajas más pecho; erguido, más tríceps. Baja solo hasta 90° en el codo.' },
    crunch: { mu: ['Abdominales'], mis: ['Tirar del cuello con las manos', 'Subir el torso entero', 'Ir demasiado rápido'], tip: 'Mira al techo y acerca las costillas a la cadera; no necesitas subir mucho.' },
    elevpiernas: { mu: ['Abdomen inferior', 'Flexores de cadera', 'Antebrazo'], mis: ['Balancearse', 'Subir solo con la cadera', 'Soltar las piernas de golpe'], tip: 'Inclina un poco la pelvis hacia atrás al subir para que trabaje el abdomen y no solo la cadera.' },
    crunchpolea: { mu: ['Abdominales'], mis: ['Tirar con los brazos', 'Doblar la cadera en vez de la columna', 'Usar demasiado peso'], tip: 'Lleva los codos hacia las rodillas redondeando la espalda, sin mover la cadera.' }
  };

  R.TOUR = [
    { ic: '🎯', t: 'Cada ejercicio es un juego', d: 'Registra tu mejor serie y consigue un rango, de Bronce a Diamante. Cada nivel te marca el siguiente objetivo.' },
    { ic: '📅', t: 'Te dice qué entrenar', d: 'La app mira qué músculos llevas más tiempo sin trabajar y te propone el entreno de hoy. Tú puedes elegir otro, cambiar la duración y editar los ejercicios.' },
    { ic: '⏱️', t: 'Entrena guiado', d: 'Pulsa Entrenar y la pantalla te muestra solo el ejercicio actual, el peso sugerido y el descanso entre series. Con calentamiento incluido.' },
    { ic: '🏆', t: 'Sube de rango', d: 'Cuando superes tu marca verás «Rango ascendido». Sube el peso cuando llegues al máximo de repeticiones y progresarás sin estancarte.' },
    { ic: '📈', t: 'Mide tu progreso', d: 'Racha, calendario, equilibrio muscular, logros y gráficas. Todo se guarda en tu móvil y puedes hacer copias de seguridad.' }
  ];

  R.FAQ = [
    ['¿Cómo elige la app el entrenamiento de hoy?', 'Mira cuándo entrenaste por última vez cada grupo muscular y propone el que más tiempo lleva sin trabajarse. Si ayer hiciste piernas, hoy toca otra cosa. También puedes seguir un programa semanal fijo desde Ajustes.'],
    ['¿Cómo se calculan los rangos?', 'Con tu mejor serie de cada ejercicio estimamos tu repetición máxima (peso × repeticiones) y la comparamos con tu peso corporal y con tablas de fuerza habituales. Tu rango solo sube.'],
    ['¿Qué peso pongo en las mancuernas?', 'El de una sola mancuerna. Si cada una pesa 12 kg, pon 12.'],
    ['¿Y en dominadas, fondos y flexiones?', 'Es el lastre que añades a tu peso corporal. Con 0 haces solo tu peso. Si usas banda o máquina de asistencia, pon la ayuda en negativo.'],
    ['¿Para qué sirven las series de calentamiento?', 'Preparan articulaciones y músculos antes de la primera serie pesada. Se proponen en los ejercicios básicos con peso. No cuentan para tus rangos ni tu volumen.'],
    ['¿Cuándo subo de peso?', 'Cuando llegues al máximo de repeticiones del rango recomendado en todas las series. La app te lo sugiere sola con una pequeña subida y vuelves al mínimo de repeticiones.'],
    ['¿Cuánto debo descansar entre series?', 'De 2 a 3 minutos en los ejercicios básicos (sentadilla, press, peso muerto, remo) y de 1 a 1,5 minutos en los de aislamiento. El descanso inteligente lo ajusta por ti.'],
    ['¿Qué hago si un ejercicio me duele?', 'Para. Un dolor agudo o en una articulación no es normal. Baja el peso, revisa la técnica o sustituye el ejercicio con el botón ⇄. Si el dolor continúa, consulta con un profesional.'],
    ['¿Qué significan RM, volumen y serie?', 'Serie: grupo de repeticiones seguidas. RM (1RM): el máximo peso que podrías levantar una vez. Volumen: peso × repeticiones sumado de todas las series.'],
    ['¿Se pierden mis datos?', 'Se guardan solo en tu móvil. Haz una copia de seguridad desde Ajustes → Datos, sobre todo antes de cambiar de móvil o borrar los datos del navegador.']
  ];
})(window.RANGO);
