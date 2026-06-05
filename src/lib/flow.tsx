/**
 * 멀티페이지(v4) 공용 헬퍼 — 처리 파이프라인 애니메이션 + 단계 네비게이션.
 * 백엔드 없이도 "데이터 파이프라인이 도는 듯한" 처리 흐름을 시각화한다.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** 처리 단계를 순차 점등하며 run() 결과를 기다렸다가 onDone으로 넘긴다. */
export function Pipeline<T>({ steps, color, run, onDone, title = '처리 중…', icon = '✨' }: {
  steps: string[]; color: string; run: () => Promise<T>; onDone: (r: T) => void; title?: string; icon?: string;
}) {
  const [step, setStep] = useState(0);
  const box = useRef<{ v: T } | null>(null);
  useEffect(() => {
    let alive = true;
    run().then((v) => { box.current = { v }; }).catch(() => { box.current = null; });
    const iv = window.setInterval(() => {
      setStep((s) => {
        if (s >= steps.length - 1) {
          window.clearInterval(iv);
          const finish = () => { if (!alive) return; if (box.current) onDone(box.current.v); else window.setTimeout(finish, 180); };
          window.setTimeout(finish, 450);
          return s;
        }
        return s + 1;
      });
    }, 600);
    return () => { alive = false; window.clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="card pipe">
      <div className="pipe__spin" style={{ borderTopColor: color }} />
      <h3 style={{ margin: '4px 0 14px' }}>{icon} {title}</h3>
      <ul className="pipe-steps">
        {steps.map((t, i) => (
          <li key={i} className={`pipe-step ${i < step ? 'done' : i === step ? 'doing' : 'todo'}`}>
            <span className="pipe-step__n" style={i <= step ? { background: color, color: '#fff', borderColor: color } : undefined}>{i < step ? '✓' : i + 1}</span>
            <span className="pipe-step__t">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 단계형 플로우 네비게이션(상단 칩). */
export function FlowNav({ items, current, onJump, color, extra }: {
  items: { key: string; label: string }[]; current: string; onJump: (k: string) => void; color: string; extra?: ReactNode;
}) {
  return (
    <div className="flow">
      {items.map((it) => (
        <button key={it.key} className={`flow__step ${current === it.key ? 'on' : ''}`} style={current === it.key ? { background: color, color: '#fff', borderColor: color } : undefined} onClick={() => onJump(it.key)}>{it.label}</button>
      ))}
      {extra && <span style={{ marginLeft: 'auto' }}>{extra}</span>}
    </div>
  );
}
