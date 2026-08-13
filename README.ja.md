<div align="center"><a name="readme-top"></a>

<img src="public/mascot.svg" width="140" height="140" alt="TaskStitch マスコット" />

# TaskStitch

[English](./README.md) · [Español](./README.es.md) · [Português (BR)](./README.pt-BR.md) · [Français](./README.fr.md) · **日本語**

**ブラウザ上のあらゆる操作を自動で記録し、ステップ形式のガイドに変換します。アカウント、クラウド、トラッキングは不要です。**

記録を開始して、いつもの操作を行うだけ。注釈付きスクリーンショットを含む分かりやすいガイドを自動生成し、編集、再生、エクスポートできます。

TaskStitch は、[Westpoint の Mimik](https://github.com/westpoint-io/mimik) をベースに個人が独立して保守するフォークです。ローカルファーストかつオープンソースという基盤を維持しながら、複数サイトの記録、リッチテキストによる手動手順、明示的な AI レビュー、日本語出力、信頼性向上を追加しています。TaskStitch は Westpoint と提携しておらず、Westpoint の承認を受けた製品ではありません。

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
<summary><kbd>目次</kbd></summary>

#### TOC

- [👋 はじめに](#-はじめに)
- [✨ 機能](#-機能)
  - [🎬 自動キャプチャ](#-自動キャプチャ)
  - [📸 注釈付きスクリーンショット](#-注釈付きスクリーンショット)
  - [🔒 スマートぼかし](#-スマートぼかし)
  - [🧠 AI によるガイド改善（オプション）](#-ai-によるガイド改善オプション)
  - [▶️ Guide Me リプレイ](#️-guide-me-リプレイ)
  - [📤 複数形式でのエクスポート](#-複数形式でのエクスポート)
  - [🌍 多言語対応](#-多言語対応)
  - [💾 100% ローカルストレージ](#-100-ローカルストレージ)
- [🤝 コントリビューション](#-コントリビューション)
- [📜 ライセンス](#-ライセンス)

<br/>

</details>

## 👋 はじめに

TaskStitch は、ブラウザ上の繰り返し作業を、わずか数秒で共有可能な手順書に変換します。バックエンド、アカウント、テレメトリはなく、すべてブラウザ内で動作します。明示的に「ガイドを改善」を実行しない限り、データが端末外に送信されることはありません。実行時には、選択したプロバイダーへ直接送るテキストと任意の代表スクリーンショットが事前に表示されます。

社内ツールの操作手順、製品チュートリアル、新メンバー向けのオンボーディング資料など、用途を問わず、クリック、キー入力、画面遷移を TaskStitch が自動で記録します。そのため、ドキュメント作成ではなく、本来の作業に集中できます。

| ブラウザ | アップストリーム版 | アップストリーム版をインストール |
| -------- | ------------------ | -------------------------------- |
| Chrome   | [![Chrome Version][chrome-version-shield]][chrome-link]   | [Chrome ウェブストア][chrome-link] |
| Firefox  | [![Firefox Version][firefox-version-shield]][firefox-link] | [Firefox Add-ons][firefox-link]    |

> [!NOTE]
>
> ストア掲載版はアップストリームプロジェクトによって管理されているため、このリポジトリで説明しているフォーク固有の機能がまだ含まれていない場合があります。このリポジトリの最新版を実行するには、[CONTRIBUTING.md](./CONTRIBUTING.md) のローカル開発またはビルド手順を参照してください。

> \[!IMPORTANT]
>
> TaskStitch が役に立ったら、ぜひ **⭐️ リポジトリに Star** をお願いします。より多くの方に知ってもらう助けになります。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## ✨ 機能

### 🎬 自動キャプチャ

クリック、入力、画面遷移を TaskStitch が自動で記録します。ボタンやリンクのクリック、フォーム入力、キーボードショートカット、クリップボード操作、ドラッグ操作、ページ遷移など、意味のある操作がそれぞれ手順として追加されます。

スマートなイベント統合により、近接する要素への連続クリックを重複としてまとめ、ガイドを読みやすく保ちます。クリックイベントはページ遷移の前に取得されるため、SPA や通常のページ読み込みでも操作を取りこぼしません。

どの画面からでも <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd>、macOS では <kbd>Command</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd> を押して記録を開始または停止できます。

記録を一時停止し、別の HTTP または HTTPS サイトへ移動して再開することで、複数プラットフォームにまたがる操作を 1 つのガイドとして記録できます。TaskStitch はアクティブなタブのみを追跡し、各手順の元 URL を保持し、以前のタブから遅れて届いたイベントを破棄します。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 📸 注釈付きスクリーンショット

自動記録された各手順には、クリックした要素を強調して拡大表示したスクリーンショットを追加できます。また、リッチテキスト、インポート画像、またはその両方を含む手動手順を任意の位置に挿入できます。PNG、JPEG、WebP 画像はローカルで再エンコードされ、メタデータが削除されます。

すべての手順で、太字、斜体、下線、インラインコード、安全なリンク、番号付き・箇条書きリスト、元に戻す・やり直すを使用でき、書式はエクスポートにも保持されます。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🔒 スマートぼかし

TaskStitch は、メールアドレス、電話番号、米国社会保障番号（SSN）、クレジットカード番号、IP アドレス、MAC アドレスなどの機密情報をスクリーンショットから自動検出し、ぼかします。各カテゴリーは個別に有効または無効にできます。

任意の箇所を隠したい場合は、手動ぼかしピッカーで DOM 要素を選択できます。その要素が表示されるすべてのスクリーンショットで同じ箇所がマスクされます。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🧠 AI によるガイド改善（オプション）

記録中に AI が呼び出されることはありません。TaskStitch はローカルで説明文と決定的な初期タイトルを作成します。記録後に **ガイドを改善** を明示的に実行すると、より具体的なタイトルと説明文を提案できます。変更は自動適用されず、内容を確認して項目ごとに選択します。

OpenAI または Anthropic の API キー、プリセットまたはカスタムモデル ID、必要に応じて互換 API のベース URL を設定できます。送信内容には、入力した値、認証情報、リッチテキスト JSON、手動手順は含まれません。

スクリーンショット解析は既定で無効です。リクエストごとに有効化すると、送信前にプロバイダー、モデル、画像数を表示し、保存済みのぼかしを反映した代表画像を最大 8 枚、ローカルで縮小して送信します。モデルが画像を拒否した場合は、明示的にテキストのみで再試行できます。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### ▶️ Guide Me リプレイ

作成済みのガイドを実際のページ上で再生できます。TaskStitch が次にクリックする要素を強調し、進行状況を手順ごとに追跡します。操作を行うと自動で次の手順へ進むため、チームメンバーのオンボーディングや、自分で手順を確認する際に便利です。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 📤 複数形式でのエクスポート

用途に合わせて、ガイドを複数の形式で共有できます。

- **HTML**：画像を base64 で埋め込んだ自己完結型ファイルとして、どこでも共有可能
- **PDF**：注釈付きスクリーンショットと自動改ページを含む、印刷可能な A4 縦向き形式
- **Markdown**：Notion、GitHub、社内ドキュメント、Wiki へ貼り付け可能

すべてのエクスポートはクライアント側で生成され、サーバーには送信されません。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🌍 多言語対応

インターフェースは英語、スペイン語、ブラジルポルトガル語、フランス語、日本語に対応しています。AI の出力言語はインターフェースとは別に設定でき、日本語にも対応しています。そのため、英語版の TaskStitch を使用しながら日本語のガイドを生成することもできます。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 💾 100% ローカルストレージ

ガイド、リッチテキスト手順、スクリーンショット、API キー、互換 API URL はすべて端末内に保存されます。バックエンド、アカウント、テレメトリはありません。明示的な「ガイドを改善」リクエストだけが、事前表示されたテキストと、別途有効化した場合の代表スクリーンショットを設定済みプロバイダーへ送信します。これらを受信する TaskStitch のサーバーはありません。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## 🤝 コントリビューション

バグ報告、機能リクエスト、プルリクエスト、翻訳など、あらゆるコントリビューションを歓迎します。

開発環境のセットアップ、プロジェクト構成、コントリビューションのガイドラインについては、[CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## 📜 ライセンス

TaskStitch は [Westpoint の Mimik](https://github.com/westpoint-io/mimik) をベースとする独立したフォークで、MIT ライセンスの下で配布されています。Westpoint の元の著作権表示とライセンスは [LICENSE](./LICENSE) に保持されています。

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
[local-link]: #-100-ローカルストレージ

[no-account-shield]: https://img.shields.io/badge/account-not%20required-4F46E5?style=flat-square&labelColor=1E1B4B
[no-account-link]: #-100-ローカルストレージ

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
