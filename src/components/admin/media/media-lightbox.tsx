/**
 * @fileoverview Lightbox para visualiza├º├úo de imagens em tela cheia.
 * Usa yet-another-react-lightbox com plugins Zoom, Thumbnails, Fullscreen, Download.
 * data-ai-id="media-lightbox"
 */
'use client';

import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Download from 'yet-another-react-lightbox/plugins/download';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import type { MediaItemWithLinks } from '@/app/admin/media/actions';

interface MediaLightboxProps {
  items: MediaItemWithLinks[];
  open: boolean;
  index: number;
  onClose: () => void;
}

export function MediaLightbox({ items, open, index, onClose }: MediaLightboxProps) {
  const slides = items
    .filter((item) => item.mimeType?.startsWith('image/'))
    .map((item) => ({
      src: item.urlOriginal,
      alt: item.altText || item.fileName || '',
      title: item.title || item.fileName || '',
      description: [
        item.caption,
        item.entityLinks?.map((l) => `${l.entityType}: ${l.publicId || l.entityName}`).join(' | '),
      ]
        .filter(Boolean)
        .join(' ÔÇö '),
    }));

  return (
    <div data-ai-id="media-lightbox">
      <Lightbox
        open={open}
        close={onClose}
        index={index}
        slides={slides}
        plugins={[Zoom, Thumbnails, Fullscreen, Download, Counter, Captions]}
        zoom={{ maxZoomPixelRatio: 5, scrollToZoom: true }}
        thumbnails={{ position: 'bottom', width: 80, height: 60, gap: 4 }}
        captions={{ showToggle: true }}
        styles={{
          container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' },
        }}
      />
    </div>
  );
}

