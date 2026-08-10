import { Download, FileArchive, FileCode, FileDown, FileText, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { i18n } from '#imports';
import { downloadBlob, downloadText } from '@/core/export/download';
import { exportGuideAsHTML } from '@/core/export/html-export';
import { exportGuideAsMarkdown } from '@/core/export/markdown-export';
import { exportGuideAsPDF } from '@/core/export/pdf-export';
import type { Guide, Screenshot, Step } from '@/core/guides/types';
import { Button } from '@/ui/components/ui/button';
import { PortableExportDialog } from '@/ui/shared/PortableExportDialog';

interface ExportMenuProps {
  guideId: string;
  guide: Guide;
  steps: Step[];
  screenshots: Map<string, Screenshot>;
  onRequestClassification?: () => void;
}

export default function ExportMenu({ guide, steps, screenshots, onRequestClassification }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [portableOpen, setPortableOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function handleExport(type: 'html' | 'markdown' | 'pdf' | 'taskstitch') {
    setOpen(false);
    if (type === 'taskstitch') {
      setPortableOpen(true);
      return;
    }
    setExporting(true);
    try {
      if (type === 'html') {
        const html = await exportGuideAsHTML(guide, steps, screenshots);
        downloadText(html, `${guide.title}.html`, 'text/html');
      } else if (type === 'markdown') {
        const md = await exportGuideAsMarkdown(guide, steps, screenshots);
        downloadText(md, `${guide.title}.md`, 'text/markdown');
      } else {
        const blob = await exportGuideAsPDF(guide, steps, screenshots);
        downloadBlob(blob, `${guide.title}.pdf`);
      }
    } finally {
      setExporting(false);
    }
  }

  const items = [
    { type: 'html' as const, icon: FileCode, label: i18n.t('exportMenu.html') },
    { type: 'markdown' as const, icon: FileText, label: i18n.t('exportMenu.markdown') },
    { type: 'pdf' as const, icon: FileDown, label: i18n.t('exportMenu.pdf') },
    { type: 'taskstitch' as const, icon: FileArchive, label: 'Interactive guide' },
  ];

  return (
    <div ref={menuRef} className="relative">
      {portableOpen && (
        <PortableExportDialog
          guide={guide}
          steps={steps}
          screenshots={screenshots}
          onClose={() => setPortableOpen(false)}
          onRequestClassification={onRequestClassification}
        />
      )}
      <Button size="sm" onClick={() => setOpen((prev) => !prev)} disabled={exporting}>
        {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        {i18n.t('common.export')}
      </Button>

      {open && !exporting && (
        <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-10">
          {items.map((item) => (
            <button
              key={item.type}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary"
              onClick={() => handleExport(item.type)}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
