// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { isTaskStitchFile, TaskStitchDropTarget } from '../TaskStitchDropTarget';

function dataTransfer(files: File[]) {
  return {
    files,
    types: ['Files'],
    dropEffect: 'none',
  };
}

describe('TaskStitchDropTarget', () => {
  it('recognizes TaskStitch guide files by extension or MIME type', () => {
    expect(isTaskStitchFile(new File(['guide'], 'Guide.TASKSTITCH'))).toBe(true);
    expect(
      isTaskStitchFile(
        new File(['guide'], 'download', {
          type: 'application/vnd.taskstitch.guide+json',
        }),
      ),
    ).toBe(true);
    expect(isTaskStitchFile(new File(['guide'], 'guide.json', { type: 'application/json' }))).toBe(false);
  });

  it('shows the drop affordance and forwards one TaskStitch file', () => {
    const onFile = vi.fn();
    const file = new File(['guide'], 'Example.taskstitch');
    const { container } = render(
      <TaskStitchDropTarget onFile={onFile}>
        <p>Library</p>
      </TaskStitchDropTarget>,
    );
    const target = container.firstElementChild as HTMLElement;

    fireEvent.dragEnter(target, { dataTransfer: dataTransfer([file]) });
    expect(screen.getByText('importGuide.dropTitle')).toBeTruthy();

    fireEvent.drop(target, { dataTransfer: dataTransfer([file]) });
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('rejects unsupported and multiple dropped files', () => {
    const onFile = vi.fn();
    const { container } = render(
      <TaskStitchDropTarget onFile={onFile}>
        <p>Library</p>
      </TaskStitchDropTarget>,
    );
    const target = container.firstElementChild as HTMLElement;

    fireEvent.drop(target, { dataTransfer: dataTransfer([new File(['x'], 'guide.pdf')]) });
    expect(screen.getByText('importGuide.dropTaskStitchFile')).toBeTruthy();

    fireEvent.drop(target, {
      dataTransfer: dataTransfer([new File(['a'], 'a.taskstitch'), new File(['b'], 'b.taskstitch')]),
    });
    expect(screen.getByText('importGuide.dropOneFile')).toBeTruthy();
    expect(onFile).not.toHaveBeenCalled();
  });
});
