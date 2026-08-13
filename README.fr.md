<div align="center"><a name="readme-top"></a>

<img src="public/mascot.svg" width="140" height="140" alt="Mascotte de TaskStitch" />

# TaskStitch

[English](./README.md) · [Español](./README.es.md) · [Português (BR)](./README.pt-BR.md) · **Français** · [日本語](./README.ja.md)

**Capture n'importe quel flux dans ton navigateur et transforme-le en guide étape par étape. Pas de compte, pas de cloud, pas de tracking.**

Clique sur enregistrer, fais ce que tu as à faire, et récupère un guide soigné avec des captures annotées. Modifie, rejoue ou exporte.

TaskStitch est un fork personnel maintenu indépendamment de [Mimik par Westpoint](https://github.com/westpoint-io/mimik). Il conserve la base locale et open source tout en ajoutant la capture multisite, les étapes manuelles en texte enrichi, la révision explicite par IA, les sorties en japonais et des améliorations de fiabilité. TaskStitch n'est ni affilié à Westpoint ni approuvé par Westpoint.

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
<summary><kbd>Sommaire</kbd></summary>

#### TOC

- [👋 Pour commencer](#-pour-commencer)
- [✨ Fonctionnalités](#-fonctionnalités)
  - [🎬 Capture automatique](#-capture-automatique)
  - [📸 Captures annotées](#-captures-annotées)
  - [🔒 Smart Blur](#-smart-blur)
  - [🧠 Amélioration par IA (optionnel)](#-amélioration-par-ia-optionnel)
  - [▶️ Lecture Guide Me](#️-lecture-guide-me)
  - [📤 Export multi-format](#-export-multi-format)
  - [🌍 Multilingue](#-multilingue)
  - [💾 Stockage 100% local](#-stockage-100-local)
- [🤝 Contribuer](#-contribuer)
- [📜 Licence](#-licence)

<br/>

</details>

## 👋 Pour commencer

TaskStitch transforme n'importe quelle tâche répétitive dans le navigateur en un guide documenté et partageable en quelques secondes. Tout tourne dans ton navigateur, sans backend, compte ou télémétrie. Les données restent sur ton appareil sauf si tu lances explicitement Améliorer le guide, qui indique le texte et les captures représentatives facultatives envoyés directement au fournisseur choisi.

Que tu documentes des outils internes, que tu rédiges des tutoriels, ou que tu formes un collègue, TaskStitch capture chaque clic, frappe et navigation pour que tu puisses te concentrer sur le reste.

| Navigateur | Version upstream | Installation upstream |
| ---------- | ---------------- | --------------------- |
| Chrome     | [![Chrome Version][chrome-version-shield]][chrome-link]   | [Chrome Web Store][chrome-link] |
| Firefox    | [![Firefox Version][firefox-version-shield]][firefox-link] | [Firefox Add-ons][firefox-link]  |

> [!NOTE]
>
> Les versions publiées dans les stores sont maintenues par le projet upstream et peuvent ne pas encore inclure les fonctionnalités propres à ce fork. Pour exécuter la version actuelle de ce dépôt, suis les instructions de développement ou de compilation dans [CONTRIBUTING.md](./CONTRIBUTING.md).

> \[!IMPORTANT]
>
> **⭐️ Mets une étoile au repo** si TaskStitch te fait gagner du temps. Ça aide les autres à le découvrir.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## ✨ Fonctionnalités

### 🎬 Capture automatique

Tu cliques, tu tapes, tu navigues. TaskStitch voit tout. Chaque action utile devient une étape : clics sur boutons et liens, champs de formulaire, raccourcis clavier, presse-papiers, drag & drop, et navigations.

La fusion intelligente des événements écarte les clics rapprochés sur des éléments proches, pour garder tes guides propres. L'interception du clic se fait *avant* que la page ne change, donc rien ne se perd dans les SPA ou les rechargements complets.

Démarre ou arrête l'enregistrement depuis n'importe où avec <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd>, ou <kbd>Command</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd> sous macOS.

Mets l'enregistrement en pause, passe sur un autre site HTTP ou HTTPS, puis reprends pour documenter un flux multi-plateforme dans un seul guide. TaskStitch suit l'onglet actif, conserve l'URL source et rejette les événements tardifs des anciens onglets.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 📸 Captures annotées

Chaque étape capturée peut inclure une capture avec l'élément cliqué mis en surbrillance et zoomé. Tu peux aussi insérer n'importe où une étape manuelle avec du texte enrichi, une image importée, ou les deux. Les images PNG, JPEG et WebP sont décodées et réencodées localement pour retirer leurs métadonnées.

Toutes les étapes prennent en charge le gras, l'italique, le soulignement, le code en ligne, les liens sûrs, les listes et annuler/rétablir. La mise en forme est conservée à l'export.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🔒 Smart Blur

TaskStitch détecte et floute automatiquement les données sensibles dans tes captures : e-mails, numéros de téléphone, numéros de sécu, cartes bancaires, IPs, adresses MAC. Active ou désactive chaque catégorie indépendamment.

Besoin de cacher quelque chose de précis ? Le sélecteur manuel te laisse choisir n'importe quel élément du DOM et le masquer sur toutes les captures où il apparaît.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🧠 Amélioration par IA (optionnel)

L'enregistrement n'appelle jamais l'IA. TaskStitch crée localement des descriptions et un titre déterministe. Tu peux ensuite lancer **Améliorer le guide** pour demander un titre et des descriptions plus précis, puis sélectionner chaque proposition avant de l'appliquer.

Utilise ta propre clé OpenAI ou Anthropic, un modèle prédéfini ou personnalisé et, si besoin, une URL de base compatible. La requête exclut les valeurs saisies, les identifiants, le JSON de texte enrichi et les étapes manuelles.

L'analyse des captures est désactivée par défaut. Si tu l'actives pour une requête, TaskStitch affiche le fournisseur, le modèle et le nombre exact d'images avant d'envoyer jusqu'à huit captures représentatives, réduites localement et avec les floutages enregistrés. Si le modèle refuse les images, tu peux relancer explicitement en texte seul.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### ▶️ Lecture Guide Me

Rejoue n'importe quel guide en direct sur une vraie page. TaskStitch met en évidence l'élément suivant, suit ta progression étape par étape, et avance tout seul au fur et à mesure. Parfait pour former un collègue ou se guider soi-même dans un process.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 📤 Export multi-format

Partage tes guides dans le format qui colle à ton flux :

- **HTML** : autonome, à partager partout, images intégrées en base64
- **PDF** : prêt à imprimer, A4 portrait avec sauts de page auto et captures annotées
- **Markdown** : à coller dans Notion, GitHub, docs internes, wikis

Tous les exports sont générés côté client. Rien ne passe par un serveur.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🌍 Multilingue

L'interface est disponible en anglais, espagnol, portugais brésilien, français et japonais. La langue des sorties IA se configure séparément et prend aussi en charge le japonais, ce qui permet d'utiliser TaskStitch en anglais tout en générant des guides en japonais.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 💾 Stockage 100% local

Tes guides, contenus enrichis, captures, clés API et URL compatibles restent sur ton appareil. Pas de backend, de compte ou de télémétrie. Seule une demande explicite d'amélioration envoie le texte annoncé et, si tu l'actives séparément, des captures représentatives au fournisseur configuré. Aucun serveur TaskStitch ne les reçoit.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## 🤝 Contribuer

Toute contribution est la bienvenue : rapports de bugs, idées, PR et traductions.

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour le setup dev, la structure du projet, et les règles pour contribuer.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## 📜 Licence

TaskStitch est un fork indépendant de [Mimik par Westpoint](https://github.com/westpoint-io/mimik), distribué sous licence MIT. L'avis de copyright et la licence d'origine de Westpoint sont conservés dans [LICENSE](./LICENSE).

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
[local-link]: #-stockage-100-local

[no-account-shield]: https://img.shields.io/badge/account-not%20required-4F46E5?style=flat-square&labelColor=1E1B4B
[no-account-link]: #-stockage-100-local

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
