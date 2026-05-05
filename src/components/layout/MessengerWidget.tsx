'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';
import { EVENT_NAMES } from '@/types/analytics';
import { metrikaEvents } from '@/lib/seo/metrika';

const TELEGRAM_URL = 'https://t.me/+79261505088';
const MAX_URL = 'https://max.ru/u/f9LHodD0cOJ7LGkDL9PvtHHVrZvCEayUREFPLzA_z2T6S8TZGGuCAzOPWpY';

const TOOLTIP_DELAY = 5000;
const TOOLTIP_DURATION = 8000;
const WOBBLE_INTERVAL = 18000;

export default function MessengerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipExiting, setTooltipExiting] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isWobbling, setIsWobbling] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  const pathname = usePathname();
  const widgetRef = useRef<HTMLDivElement>(null);
  const wobbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const enterTimer = setTimeout(() => setHasEntered(true), 1500);
    return () => clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    if (!hasEntered || isOpen || tooltipDismissed) return;
    const showTimer = setTimeout(() => setShowTooltip(true), TOOLTIP_DELAY);
    return () => clearTimeout(showTimer);
  }, [hasEntered, isOpen, tooltipDismissed]);

  useEffect(() => {
    if (!showTooltip || tooltipExiting) return;
    const hideTimer = setTimeout(() => {
      setTooltipExiting(true);
      setTimeout(() => {
        setShowTooltip(false);
        setTooltipExiting(false);
        setTooltipDismissed(true);
      }, 250);
    }, TOOLTIP_DURATION);
    return () => clearTimeout(hideTimer);
  }, [showTooltip, tooltipExiting]);

  useEffect(() => {
    if (!hasEntered) return;
    const startWobble = () => {
      if (!isOpen) {
        setIsWobbling(true);
        setTimeout(() => setIsWobbling(false), 800);
      }
      wobbleTimerRef.current = setTimeout(startWobble, WOBBLE_INTERVAL);
    };
    wobbleTimerRef.current = setTimeout(startWobble, WOBBLE_INTERVAL);
    return () => {
      if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
    };
  }, [hasEntered, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (pathname.startsWith('/admin')) return null;

  const handleToggle = () => {
    setIsOpen(prev => !prev);
    setShowTooltip(false);
    setTooltipExiting(false);
    setTooltipDismissed(true);
  };

  const handleMessengerClick = (messenger: 'telegram' | 'max') => {
    metrikaEvents.messengerClick(messenger);
    trackEvent(EVENT_NAMES.MESSENGER_CLICK);
    setIsOpen(false);
  };

  return (
    <div
      ref={widgetRef}
      className="fixed bottom-6 right-6 z-40"
      data-testid="messenger-widget"
    >
      <div
        className={`${hasEntered ? 'messenger-fab-enter' : 'opacity-0'}`}
        style={{ animationDelay: hasEntered ? '0ms' : undefined }}
      >
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-3 w-72 rounded-2xl bg-popover border border-border shadow-2xl p-5 animate-fade-in-up">
            <p className="text-sm font-semibold text-popover-foreground mb-4">
              Выберите мессенджер
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleMessengerClick('telegram')}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-colors group"
              >
                <div className="w-11 h-11 rounded-full bg-[#26A5E4] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-foreground text-sm">Telegram</div>
                  <div className="text-xs text-muted-foreground">Написать в Telegram</div>
                </div>
              </a>
              <a
                href={MAX_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleMessengerClick('max')}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-colors group"
              >
                <div className="w-11 h-11 rounded-full bg-[#007AFF] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 25 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12.3405 23.9342C9.97568 23.9342 8.87728 23.5899 6.97252 22.2125C5.76041 23.762 1.94518 24.9672 1.77774 22.9012C1.77774 21.3535 1.42788 20.0492 1.04269 18.6132C0.570922 16.8544 0.0461426 14.898 0.0461426 12.0546C0.0461426 5.27426 5.6424 0.175079 12.2777 0.175079C18.913 0.175079 24.1153 5.52322 24.1153 12.1205C24.1153 18.7178 18.7474 23.9342 12.3405 23.9342ZM12.4368 6.03673C9.20791 5.86848 6.68817 8.0948 6.13253 11.5794C5.6724 14.465 6.48821 17.9812 7.18602 18.1582C7.51488 18.2416 8.35763 17.564 8.87711 17.0475C9.73154 17.5981 10.712 18.0245 11.8019 18.0813C15.1168 18.254 18.0544 15.6761 18.228 12.382C18.4016 9.08792 15.7517 6.20946 12.4368 6.03673Z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-foreground text-sm">Макс</div>
                  <div className="text-xs text-muted-foreground">Написать в Макс</div>
                </div>
              </a>
            </div>
          </div>
        )}

        {showTooltip && !isOpen && (
          <div
            className={`absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap px-4 py-2.5 rounded-xl bg-popover border border-border shadow-lg text-sm font-medium text-popover-foreground ${tooltipExiting ? 'messenger-tooltip-exit' : 'messenger-tooltip-enter'}`}
          >
            Напишите нам!
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-popover" />
            </div>
          </div>
        )}

        <div className="relative">
          {!isOpen && (
            <span
              className="absolute inset-0 rounded-full bg-primary/40"
              style={{
                animation: 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
              }}
            />
          )}

          <button
            onClick={handleToggle}
            className={`relative w-[60px] h-[60px] rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center ${isWobbling ? 'messenger-fab-wobble' : ''}`}
            style={{
              animation: isOpen ? 'none' : 'glow-pulse 3s ease-in-out infinite',
            }}
            aria-label={isOpen ? 'Закрыть' : 'Написать нам'}
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <MessageSquare className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
