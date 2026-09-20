# Jonnhys — Panel de Control

Panel de control de costos para el restaurante de comida italiana **Jonnhys**.

Calcula el costo real de cada receta a partir del precio de los insumos, controla los gastos fijos y el personal, y calcula el punto de equilibrio mensual.

**App:** https://blucl.github.io/Jonnhys-Recetas/

## Puesta en marcha

La app arranca con la base de datos vacía. Para empezar:

1. **Insumos** — carga cada ingrediente con su precio y el formato en que lo compras (por ejemplo: harina, $1.200, 1000 g). La app calcula sola el costo por gramo o unidad.
2. **Recetas** — arma cada plato indicando cuánto usa de cada insumo. Una receta también puede usar otra receta como ingrediente (por ejemplo, una salsa base). El semáforo avisa si el margen es bueno: 🟢 bajo 25 % de costo, 🟡 entre 25 % y 35 %, 🔴 sobre 35 %.
3. **Gastos y Personal** — carga el arriendo, servicios y sueldos. Los gastos se pueden ingresar en pesos o en UF (el valor del día se consulta automático).
4. **Equilibrio** — ingresa el ticket promedio y el margen para saber cuánto necesitas vender al mes para no perder plata.

Un plato puede tener **precio de venta $0**: sirve para recetas internas de control de costos que no se le cobran al cliente.

## Sincronizar entre varios dispositivos (opcional)

Sin configurar, los datos se guardan solo en el navegador de cada equipo. Para compartirlos entre el computador del local y el teléfono:

1. Abre [Google Sheets](https://sheets.google.com) → crea una hoja → **Extensiones → Apps Script**.
2. Pega el contenido de `Code.gs` de este repositorio y guarda.
3. **Implementar → Nueva implementación** → tipo *Aplicación web*, ejecutar como *Yo*, acceso *Cualquier usuario*.
4. Copia la URL que termina en `/exec` y pégala en la app, en **Configuración → Google Sheets**.

Cada cambio se sincroniza solo a los pocos segundos. Al abrir la app en otro equipo, baja lo más reciente.

> Cada negocio necesita su **propio** Apps Script. No reutilices la URL de otro local: los datos se mezclarían.

## Acceso

La app pide una contraseña al abrir. Es una barrera simple para que no entre cualquiera desde el enlace público — no protege datos sensibles, así que no guardes información confidencial aquí.
