import { beforeEach, describe, expect, it } from 'vitest';
import type { Guide } from '@/core/guides/types';
import { useFullviewStore } from '../fullview';

const initialState = useFullviewStore.getState();

function makeGuide(title: string): Guide {
  return {
    id: 'guide-1',
    title,
    createdAt: 1,
    updatedAt: 1,
    stepIds: [],
    starred: false,
    deletedAt: null,
    titleEdited: false,
    impact: 'unknown',
  };
}

describe('fullview export state', () => {
  beforeEach(() => {
    useFullviewStore.setState(initialState, true);
  });

  it('keeps every export format aligned with an edited guide title', () => {
    useFullviewStore.getState().setGuideExportData({
      guideId: 'guide-1',
      guide: makeGuide('Guide on tora.tsukaeru.ne.jp'),
      steps: [],
      screenshots: new Map(),
    });

    useFullviewStore.getState().setGuideTitle('Guide on send out de-provisioning requests');

    expect(useFullviewStore.getState().guideTitle).toBe('Guide on send out de-provisioning requests');
    expect(useFullviewStore.getState().guideExportData?.guide.title).toBe('Guide on send out de-provisioning requests');
  });
});
