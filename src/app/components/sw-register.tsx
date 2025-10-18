'use client'

import { useEffect } from 'react'

export default function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => {
            console.log('SW registered', reg);
            // 可根据 reg.waiting 等状态提示用户刷新
          })
          .catch(err => console.error('SW register failed', err));
      })
    }
  }, []);

  return null;
}
