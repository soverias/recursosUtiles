---
status: implemented
last_change: calculator
last_verified: 2026-05-16
---

# Spec: Calculator + Unit Converter

**Change**: calculator  
**Version**: 0.1  
**Date**: 2026-04-08  

---

## Feature: Calculadora numérica

### Scenario: Aritmética básica
- **Given** la app está abierta en modo Numérico
- **When** el usuario introduce `3 + 4` y pulsa `=`
- **Then** el resultado es `7`

### Scenario: Precedencia de operadores
- **Given** la expresión `2 + 3 * 4`
- **When** se evalúa
- **Then** el resultado es `14` (no `20`)

### Scenario: Paréntesis
- **Given** la expresión `(2 + 3) * 4`
- **When** se evalúa
- **Then** el resultado es `20`

### Scenario: Número decimal
- **Given** la expresión `1.5 + 2.5`
- **When** se evalúa
- **Then** el resultado es `4`

### Scenario: Número negativo unario
- **Given** la expresión `-3 * 2`
- **When** se evalúa
- **Then** el resultado es `-6`

### Scenario: Clear (C)
- **Given** hay una expresión `123 + 456`
- **When** el usuario pulsa `C`
- **Then** la expresión queda vacía y no hay resultado

### Scenario: Backspace (⌫)
- **Given** la expresión es `123`
- **When** el usuario pulsa `⌫`
- **Then** la expresión pasa a ser `12`

### Scenario: División por cero
- **Given** la expresión `5 / 0`
- **When** se evalúa
- **Then** se muestra el error `"División por cero"`

### Scenario: Igual con expresión vacía
- **Given** no hay ninguna expresión escrita
- **When** el usuario pulsa `=`
- **Then** no ocurre nada (sin error, sin resultado)

---

## Feature: Conversor de unidades

### Scenario: Selección de categoría
- **Given** el usuario selecciona la categoría `Datos`
- **When** el teclado se actualiza
- **Then** aparecen botones de unidad rápida: `TB`, `GB`, `MB`, `KB`, `B`

### Scenario: Selector de unidad de salida
- **Given** la categoría activa es `Datos` y la expresión es `2 GB`
- **When** el usuario selecciona `MB` como unidad de salida
- **Then** el resultado se muestra en MB: `2048 MB`

### Scenario: Datos — GB a MB
- **Given** la expresión `1 GB`
- **When** output unit = `MB` y se evalúa
- **Then** resultado = `1024 MB`

### Scenario: Datos — TB a GB
- **Given** la expresión `1 TB`
- **When** output unit = `GB` y se evalúa
- **Then** resultado = `1024 GB`

### Scenario: Datos — MB a KB
- **Given** la expresión `1 MB`
- **When** output unit = `KB` y se evalúa
- **Then** resultado = `1024 KB`

### Scenario: Peso — kg a g
- **Given** la expresión `1 kg`
- **When** output unit = `g` y se evalúa
- **Then** resultado = `1000 g`

### Scenario: Peso — lb a g
- **Given** la expresión `1 lb`
- **When** output unit = `g` y se evalúa
- **Then** resultado ≈ `453.592 g`

### Scenario: Volumen — L a mL
- **Given** la expresión `1 L`
- **When** output unit = `mL` y se evalúa
- **Then** resultado = `1000 mL`

### Scenario: Longitud — km a m
- **Given** la expresión `1 km`
- **When** output unit = `m` y se evalúa
- **Then** resultado = `1000 m`

### Scenario: Longitud — in a mm
- **Given** la expresión `1 in`
- **When** output unit = `mm` y se evalúa
- **Then** resultado = `25.4 mm`

### Scenario: Temperatura — °C a K
- **Given** la expresión `0 C`
- **When** output unit = `K` y se evalúa
- **Then** resultado = `273.15 K`

### Scenario: Temperatura — °F a K
- **Given** la expresión `32 F`
- **When** output unit = `K` y se evalúa
- **Then** resultado ≈ `273.15 K`

### Scenario: Categoría numérica — sin selector de output
- **Given** la categoría activa es `Numérico`
- **When** se muestra el UI
- **Then** el selector de unidad de salida no aparece

---

## Feature: Expresiones mixtas

### Scenario: Suma de datos en distintas unidades
- **Given** la expresión `2 GB + 500 MB`
- **When** output unit = `MB` y se evalúa
- **Then** resultado = `2548 MB`

### Scenario: Resultado en GB
- **Given** la expresión `2 GB + 512 MB`
- **When** output unit = `GB` y se evalúa
- **Then** resultado = `2.5 GB`

### Scenario: Suma de peso mixto
- **Given** la expresión `1 kg - 200 g`
- **When** output unit = `g` y se evalúa
- **Then** resultado = `800 g`

### Scenario: Suma de longitud mixta
- **Given** la expresión `100 cm + 1 m`
- **When** output unit = `cm` y se evalúa
- **Then** resultado = `200 cm`

### Scenario: Multiplicar unidad por escalar
- **Given** la expresión `2 GB * 3`
- **When** se evalúa
- **Then** resultado = `6 GB`

### Scenario: Temperatura suma (tratamiento delta)
- **Given** la expresión `20 C + 5 C`
- **When** se evalúa
- **Then** resultado = `25 C`

### Scenario: Temperatura suma entre °C y °F
- **Given** la expresión `0 C + 32 F`
- **When** output unit = `C` y se evalúa
- **Then** resultado = `17.78 C` (32 F = 17.78 C como delta)

### Scenario: Error — unidades incompatibles
- **Given** la expresión `2 GB + 3 kg`
- **When** se evalúa
- **Then** se muestra error `"No se puede operar GB con kg"`

### Scenario: Error — multiplicar dos unidades
- **Given** la expresión `2 GB * 3 MB`
- **When** se evalúa
- **Then** se muestra error sobre multiplicación de unidades

---

## Feature: Historial

### Scenario: Entrada aparece tras evaluar
- **Given** el usuario evalúa `3 + 4`
- **When** el resultado es `7`
- **Then** la entrada `"3 + 4 = 7"` aparece en el historial

### Scenario: Entradas más recientes primero
- **Given** se han evaluado `1+1` y luego `2+2`
- **When** se muestra el historial
- **Then** la entrada de `2+2` aparece antes que la de `1+1`

### Scenario: Cargar expresión desde historial
- **Given** hay una entrada `"3 + 4 = 7"` en el historial
- **When** el usuario toca esa entrada
- **Then** la expresión del campo de entrada pasa a ser `3 + 4`

### Scenario: Limpiar historial
- **Given** hay varias entradas en el historial
- **When** el usuario pulsa "Limpiar"
- **Then** la lista queda vacía

---

## Feature: PWA

### Scenario: Funciona offline
- **Given** el service worker está registrado
- **When** el dispositivo pierde conexión
- **Then** la app sigue cargando y funcionando correctamente

### Scenario: Manifest presente
- **Given** la app está desplegada
- **When** se accede al `manifest.webmanifest`
- **Then** contiene `name`, `short_name`, `display: standalone`, `start_url`, `icons`

### Scenario: Instalable como PWA
- **Given** el usuario accede desde un navegador compatible
- **When** el navegador detecta el manifest y service worker
- **Then** se puede mostrar el prompt de instalación
