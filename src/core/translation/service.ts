import { db } from '@/core/guides/db';
import { plainTextDocument } from '@/core/guides/rich-text';
import type { Guide, Step, TranslationJob } from '@/core/guides/types';

const translationChannel = new BroadcastChannel('taskstitch-translations');

function notifyTranslationChanged(jobId: string) {
  translationChannel.postMessage({ jobId });
}

export function onTranslationChanged(callback: (jobId: string) => void): () => void {
  const handler = (event: MessageEvent<{ jobId?: string }>) => {
    if (event.data?.jobId) callback(event.data.jobId);
  };
  translationChannel.addEventListener('message', handler);
  return () => translationChannel.removeEventListener('message', handler);
}

export async function createTranslationJob(
  sourceGuide: Guide,
  sourceSteps: Step[],
  targetLanguage: string,
): Promise<TranslationJob> {
  const now = Date.now();
  const items = [
    ...(sourceGuide.title.trim() ? [{ id: 'guide-title', text: sourceGuide.title }] : []),
    ...sourceSteps
      .filter((step) => step.description.trim())
      .map((step) => ({
        id: `step:${step.id}`,
        text: step.inputValue ? step.description.split(step.inputValue).join('{{INPUT_VALUE}}') : step.description,
      })),
  ];
  if (items.length === 0) throw new Error('This guide has no text to translate');
  const job: TranslationJob = {
    id: crypto.randomUUID(),
    sourceGuide: structuredClone(sourceGuide),
    sourceSteps: structuredClone(sourceSteps),
    targetLanguage,
    status: 'queued',
    items,
    translations: {},
    nextIndex: 0,
    completedItems: 0,
    totalItems: items.length,
    createdAt: now,
    updatedAt: now,
  };
  await db.translationJobs.add(job);
  notifyTranslationChanged(job.id);
  return job;
}

export async function getTranslationJob(jobId: string): Promise<TranslationJob | undefined> {
  return db.translationJobs.get(jobId);
}

export async function getActiveTranslationJob(sourceGuideId: string): Promise<TranslationJob | undefined> {
  const jobs = await db.translationJobs.orderBy('createdAt').reverse().toArray();
  return jobs.find(
    (job) =>
      job.sourceGuide.id === sourceGuideId &&
      (job.status === 'queued' || job.status === 'running' || job.status === 'failed'),
  );
}

export async function updateTranslationJob(jobId: string, changes: Partial<TranslationJob>): Promise<void> {
  await db.translationJobs.update(jobId, { ...changes, updatedAt: Date.now() });
  notifyTranslationChanged(jobId);
}

export async function cancelTranslationJob(jobId: string): Promise<void> {
  await updateTranslationJob(jobId, { status: 'cancelled', error: undefined });
}

export async function completeTranslationJob(jobId: string): Promise<string> {
  const job = await db.translationJobs.get(jobId);
  if (!job) throw new Error('Translation job not found');
  if (job.status === 'cancelled') throw new Error('Translation was cancelled');

  const guideId = crypto.randomUUID();
  const now = Date.now();
  const stepIds: string[] = [];
  const translatedSteps = job.sourceSteps.map((sourceStep, index) => {
    const id = crypto.randomUUID();
    stepIds.push(id);
    const translatedDescription = job.translations[`step:${sourceStep.id}`] ?? sourceStep.description;
    const description = sourceStep.inputValue
      ? translatedDescription.split('{{INPUT_VALUE}}').join(sourceStep.inputValue)
      : translatedDescription;
    return {
      ...structuredClone(sourceStep),
      id,
      guideId,
      index,
      description,
      richDescription: plainTextDocument(description),
      timestamp: now,
    } satisfies Step;
  });
  const guide: Guide = {
    id: guideId,
    title: job.translations['guide-title'] ?? job.sourceGuide.title,
    createdAt: now,
    updatedAt: now,
    stepIds,
    starred: false,
    deletedAt: null,
    titleEdited: true,
    sourceGuideId: job.sourceGuide.id,
    language: job.targetLanguage,
    impact: job.sourceGuide.impact ?? 'unknown',
    impactNote: job.sourceGuide.impactNote,
    guideMeOrigins: job.sourceGuide.guideMeOrigins,
  };

  await db.transaction('rw', db.guides, db.steps, db.translationJobs, async () => {
    await db.guides.add(guide);
    await db.steps.bulkAdd(translatedSteps);
    await db.translationJobs.update(jobId, {
      status: 'completed',
      translatedGuideId: guideId,
      completedItems: job.totalItems,
      updatedAt: Date.now(),
      error: undefined,
    });
  });
  notifyTranslationChanged(jobId);
  return guideId;
}
