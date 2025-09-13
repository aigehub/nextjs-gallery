// components/TopButton.tsx
'use client'; // Next.js 13+ App Router 需要标记客户端组件

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpIcon } from '@heroicons/react/24/solid'; // 安装：npm i @heroicons/react

export default function TopButton() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const toggle = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', toggle, { passive: true });
    return () => window.removeEventListener('scroll', toggle);
  }, []);

  const scrollToTop = () => {
    // 如果当前就在首页，直接滚到顶部；否则先跳回首页再滚
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/');
      // 跳转后等页面渲染完再滚动
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
    }
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="回到首页顶部"
      className="fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full bg-gray-800 text-white shadow-lg transition hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300"
    >
      <ChevronUpIcon className="h-6 w-6" />
    </button>
  );
}