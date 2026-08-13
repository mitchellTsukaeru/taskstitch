<div align="center"><a name="readme-top"></a>

<img src="public/mascot.svg" width="140" height="140" alt="Mascota de TaskStitch" />

# TaskStitch

[English](./README.md) · **Español** · [Português (BR)](./README.pt-BR.md) · [Français](./README.fr.md) · [日本語](./README.ja.md)

**Captura cualquier flujo del navegador y conviértelo en una guía paso a paso. Sin cuenta, sin nube, sin rastreo.**

Le das a grabar, haces lo tuyo, y obtienes una guía pulida con capturas anotadas. Edítala, reprodúcela o expórtala.

TaskStitch es un fork personal mantenido de forma independiente de [Mimik de Westpoint](https://github.com/westpoint-io/mimik). Conserva la base local y de código abierto, y añade captura multisitio, pasos manuales con texto enriquecido, revisión explícita de IA, salida en japonés y mejoras de fiabilidad. TaskStitch no está afiliado ni respaldado por Westpoint.

<!-- SHIELD GROUP -->

[![License][license-shield]][license-link]
[![Manifest V3][mv3-shield]][mv3-link]
[![100% Local][local-shield]][local-link]
[![No Account][no-account-shield]][no-account-link]
<br/>
[![Stars][star-shield]][star-link]
[![Contributors][contributors-shield]][contributors-link]
![Last Commit][last-commit-shield]
[![Issues][issues-shield]][issues-link]

</div>

<details>
<summary><kbd>Tabla de contenidos</kbd></summary>

#### TOC

- [👋 Empezar](#-empezar)
- [✨ Funciones](#-funciones)
  - [🎬 Captura automática](#-captura-automática)
  - [📸 Capturas anotadas](#-capturas-anotadas)
  - [🔒 Smart Blur](#-smart-blur)
  - [🧠 Mejorar guía con IA (opcional)](#-mejorar-guía-con-ia-opcional)
  - [▶️ Reproducción Guide Me](#️-reproducción-guide-me)
  - [📤 Exportación multi-formato](#-exportación-multi-formato)
  - [🌍 Multi-idioma](#-multi-idioma)
  - [💾 Almacenamiento 100% local](#-almacenamiento-100-local)
- [🤝 Contribuir](#-contribuir)
- [📜 Licencia](#-licencia)

<br/>

</details>

## 👋 Empezar

TaskStitch convierte cualquier tarea repetitiva del navegador en una guía documentada y compartible en segundos. Corre por completo en tu navegador, sin backend, cuenta ni telemetría. Los datos permanecen en tu dispositivo salvo que ejecutes explícitamente Mejorar guía, que informa del texto y de las capturas representativas opcionales enviados directamente al proveedor elegido.

Ya sea que estés documentando herramientas internas, escribiendo tutoriales de producto, o formando a un compañero, TaskStitch captura cada clic, tecla y navegación automáticamente para que te concentres en lo importante.

| Navegador | Versión upstream | Instalación upstream |
| --------- | ---------------- | --------------------- |
| Chrome    | [![Chrome Version][chrome-version-shield]][chrome-link]   | [Chrome Web Store][chrome-link] |
| Firefox   | [![Firefox Version][firefox-version-shield]][firefox-link] | [Firefox Add-ons][firefox-link]  |

> [!NOTE]
>
> Las publicaciones de las tiendas pertenecen al proyecto upstream y puede que aún no incluyan las funciones específicas de este fork. Para ejecutar la versión actual de este repositorio, sigue las instrucciones de desarrollo o compilación en [CONTRIBUTING.md](./CONTRIBUTING.md).

> \[!IMPORTANT]
>
> **⭐️ Dale una estrella al repo** si TaskStitch te ahorra tiempo. Ayuda a que otras personas lo descubran.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## ✨ Funciones

### 🎬 Captura automática

Haces clic, escribes, navegas. TaskStitch lo ve todo. Cada acción relevante se convierte en un paso: clics en botones y enlaces, entradas de formulario, atajos de teclado, portapapeles, arrastrar y soltar, y navegaciones.

La fusión inteligente de eventos descarta los clics rápidos en elementos cercanos, para que tus guías queden limpias. La interceptación del clic ocurre *antes* de que la página cambie, así no se pierde nada en SPAs o recargas completas.

Inicia o detén la grabación desde cualquier lugar con <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd>, o <kbd>Command</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd> en macOS.

Pausa la grabación, cambia a otro sitio HTTP o HTTPS y reanuda para documentar flujos multi-plataforma en una sola guía. TaskStitch sigue la pestaña activa, conserva la URL de origen y descarta eventos tardíos de pestañas anteriores.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 📸 Capturas anotadas

Cada paso capturado puede incluir una captura con el elemento resaltado y un zoom al área importante. También puedes insertar en cualquier posición pasos manuales con texto enriquecido, una imagen importada o ambos. Las imágenes PNG, JPEG y WebP se decodifican y vuelven a codificar localmente para quitar metadatos.

Todos los pasos admiten negrita, cursiva, subrayado, código en línea, enlaces seguros, listas y deshacer/rehacer. El formato se conserva al exportar.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🔒 Smart Blur

TaskStitch detecta y difumina datos sensibles automáticamente en tus capturas: correos, teléfonos, números de identificación, tarjetas de crédito, IPs, direcciones MAC. Activa o desactiva cada categoría de forma independiente.

¿Necesitas ocultar algo personalizado? El selector manual te deja elegir cualquier elemento del DOM y enmascararlo en todas las capturas donde aparezca.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🧠 Mejorar guía con IA (opcional)

La grabación nunca llama a la IA. TaskStitch crea descripciones locales y un título determinista. Después puedes ejecutar **Mejorar guía** para solicitar un título y descripciones más específicos; revisas y eliges cada cambio antes de aplicarlo.

Usa tu propia clave de OpenAI o Anthropic, un modelo preconfigurado o personalizado y, opcionalmente, una URL base compatible. La solicitud excluye valores escritos, credenciales, JSON de texto enriquecido y pasos manuales.

El análisis de capturas está desactivado por defecto. Si lo habilitas para una solicitud, TaskStitch muestra el proveedor, el modelo y el número exacto de imágenes antes de enviar hasta ocho capturas representativas, reducidas localmente y con los difuminados guardados. Si el modelo rechaza imágenes, puedes reintentar explícitamente solo con texto.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### ▶️ Reproducción Guide Me

Reproduce cualquier guía en vivo sobre una página real. TaskStitch resalta el siguiente elemento, marca tu progreso paso a paso, y avanza solo conforme vas interactuando. Ideal para formar a un compañero o para guiarte a ti mismo.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 📤 Exportación multi-formato

Comparte tus guías en el formato que mejor encaje con tu flujo:

- **HTML**: autónomo, comparte donde sea, imágenes embebidas en base64
- **PDF**: listo para imprimir, A4 vertical con saltos automáticos y capturas anotadas
- **Markdown**: pega en Notion, GitHub, documentación interna, wikis

Todas las exportaciones se generan del lado del cliente. Nada pasa por un servidor.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🌍 Multi-idioma

La interfaz está disponible en inglés, español, portugués brasileño, francés y japonés. El idioma de salida de la IA se configura por separado y también admite japonés, así que puedes usar TaskStitch en inglés y generar guías en japonés.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 💾 Almacenamiento 100% local

Tus guías, texto enriquecido, capturas, claves API y URL compatibles viven en tu dispositivo. No hay backend, cuenta ni telemetría. Solo una solicitud explícita de Mejorar guía envía el texto informado y, si lo habilitas por separado, capturas representativas al proveedor configurado. Ningún servidor de TaskStitch recibe esos datos.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## 🤝 Contribuir

Se agradece todo tipo de contribución: reportes de bugs, ideas nuevas, PRs y traducciones.

Mira [CONTRIBUTING.md](./CONTRIBUTING.md) para el setup de desarrollo, la estructura del proyecto, y las pautas para contribuidores.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## 📜 Licencia

TaskStitch es un fork independiente de [Mimik de Westpoint](https://github.com/westpoint-io/mimik), distribuido bajo la licencia MIT. El aviso de copyright y la licencia originales de Westpoint se conservan en [LICENSE](./LICENSE).

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- LINK GROUP -->

[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-1E1B4B?style=flat-square

[license-shield]: https://img.shields.io/badge/license-MIT-4F46E5?style=flat-square&labelColor=1E1B4B
[license-link]: ./LICENSE

[mv3-shield]: https://img.shields.io/badge/manifest-v3-3730A3?style=flat-square&labelColor=1E1B4B
[mv3-link]: https://developer.chrome.com/docs/extensions/mv3/intro/

[local-shield]: https://img.shields.io/badge/storage-100%25%20local-4F46E5?style=flat-square&labelColor=1E1B4B
[local-link]: #-almacenamiento-100-local

[no-account-shield]: https://img.shields.io/badge/account-not%20required-4F46E5?style=flat-square&labelColor=1E1B4B
[no-account-link]: #-almacenamiento-100-local

[star-shield]: https://img.shields.io/github/stars/mitchellTsukaeru/taskstitch?style=flat-square&label=stars&color=4F46E5&labelColor=1E1B4B
[star-link]: https://github.com/mitchellTsukaeru/taskstitch/stargazers

[contributors-shield]: https://img.shields.io/github/contributors/mitchellTsukaeru/taskstitch?style=flat-square&labelColor=1E1B4B
[contributors-link]: https://github.com/mitchellTsukaeru/taskstitch/graphs/contributors

[last-commit-shield]: https://img.shields.io/github/last-commit/mitchellTsukaeru/taskstitch?style=flat-square&label=commit&labelColor=1E1B4B

[issues-shield]: https://img.shields.io/github/issues/mitchellTsukaeru/taskstitch?style=flat-square&labelColor=1E1B4B
[issues-link]: https://github.com/mitchellTsukaeru/taskstitch/issues

[chrome-version-shield]: https://img.shields.io/chrome-web-store/v/jmfohdaflahliammccpiadmkcibohgha?label=Chrome%20Version&style=flat-square&logo=googlechrome&logoColor=C7D2FE&color=4F46E5&labelColor=1E1B4B
[chrome-link]: https://chromewebstore.google.com/detail/mimik/jmfohdaflahliammccpiadmkcibohgha
[firefox-version-shield]: https://img.shields.io/amo/v/mimik?label=Firefox%20Version&style=flat-square&logo=firefoxbrowser&logoColor=C7D2FE&color=4F46E5&labelColor=1E1B4B
[firefox-link]: https://addons.mozilla.org/en-US/firefox/addon/mimik/
