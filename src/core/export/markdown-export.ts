import { i18n } from '#imports';
import { blobToBase64, extractDomain, formatDate } from '@/core/export/utils';
import { guideImpact } from '@/core/guides/impact';
import { taskStitchFilename } from '@/core/guides/portable';
import type { Guide, Screenshot, Step } from '@/core/guides/types';
import { richTextToMarkdown } from './rich-text';

export async function exportGuideAsMarkdown(
  guide: Guide,
  steps: Step[],
  screenshots: Map<string, Screenshot>,
): Promise<string> {
  const domain = extractDomain(steps);
  const meta = [
    i18n.t('export.stepsCount', [String(steps.length)]),
    i18n.t('export.createdLabel', [formatDate(guide.createdAt)]),
    ...(domain ? [i18n.t('export.sourceLabel', [domain])] : []),
  ].join(' · ');

  const impact = guideImpact(guide.impact);
  const portableName = taskStitchFilename(guide.title);
  const lines: string[] = [
    `# ${guide.title}`,
    '',
    `*${meta}*`,
    '',
    '> **Run this interactively with TaskStitch**',
    '> **Add interactive guide file here**',
    `> Drag and drop \`${portableName}\` here while editing this document. Then import it into TaskStitch and select **Guide Me**.`,
    `> **Safety: ${impact.label}.** ${guide.impactNote || impact.description}`,
    '',
    '---',
    '',
  ];

  for (const step of steps) {
    const num = String(step.index + 1).padStart(2, '0');
    if (step.richDescription) {
      lines.push(
        `## ${i18n.t('export.stepLabel', [num])}`,
        '',
        richTextToMarkdown(step.richDescription, step.description),
        '',
      );
    } else {
      // Keep legacy guides byte-compatible until a step is rich-text edited.
      lines.push(`## ${i18n.t('export.stepLabel', [num])}: ${step.description}`, '');
    }

    const screenshot = screenshots.get(step.id);
    if (screenshot) {
      const b64 = await blobToBase64(screenshot.blob);
      lines.push(`![${i18n.t('export.stepLabel', [num])}](data:${screenshot.mimeType};base64,${b64})`, '');
    }
  }

  return lines.join('\n');
}
