'use client';

import { useEffect } from 'react';

export function FontLoader() {
  useEffect(() => {
    try {
      if (document.fonts) {
        document.fonts.load('24px "Material Symbols Outlined"').then(() => {
          if (document.documentElement) {
            document.documentElement.classList.add('icons-ready');
          }
        });
      }
              } catch (e) {
            // Font loading failed
          }
  }, []);

  return null;
}
