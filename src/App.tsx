import { useEffect, useRef, useState } from 'react';
import { AppLayout, Stack, Field, Chip, useLocalStorage, type Meta } from './ui';
import { ask, hasKey } from './lib/ai';
import { Pipeline } from './lib/flow';

const PIPE = ['기분·스트레스 상태 분석', '회복 습관 데이터 매칭', '맞춤 루틴·호흡 처방', '확언·성찰 질문 생성'];
import { useReadAloud } from './lib/tts';

const M: Meta = {
  id: 3, icon: '🌱', title: '회복탄력성 루틴 코치', tagline: '오늘의 기분에 맞춰 AI가 회복 루틴·호흡·확언을 처방하고, 기분 변화를 함께 기록해요',
  members: ['김건희', '이초월', '김서우'], color: '#10b981', ai: true,
  problem:
    '번아웃·불안은 거창한 처방보다 매일의 작은 루틴으로 회복됩니다. 하지만 무엇을 어떻게 시작할지 막막하죠. ' +
    '본 코치는 오늘의 기분·스트레스·가능한 시간·목표를 입력하면 AI가 맞춤 회복 루틴과 호흡법·확언·성찰 질문을 처방하고, ' +
    '기분 체크인을 누적해 변화 추이를 시각화하며 호흡 타이머와 음성 낭독으로 실천을 돕습니다.',
  features: [
    { icon: '🧠', title: 'AI 회복 루틴 처방', desc: '기분·스트레스·시간·목표에 맞춘 하루 루틴을 이유와 함께 생성' },
    { icon: '🫁', title: '호흡 타이머', desc: '들숨·멈춤·날숨을 안내하는 애니메이션 호흡 가이드' },
    { icon: '💬', title: '확언 · 성찰 질문', desc: '오늘의 확언과 스스로 돌아보는 질문을 함께 제공' },
    { icon: '📈', title: '기분 추적', desc: '매일의 기분 체크인을 누적해 SVG 추세 그래프로 시각화' },
    { icon: '🔊', title: '음성 낭독', desc: '확언·호흡 안내를 브라우저 음성으로 읽어주기(키 불필요)' },
    { icon: '✅', title: '루틴 체크 · 연속일', desc: '루틴 완료를 체크하고 체크인 연속 기록을 확인' },
  ],
  howto: [
    '(선택) OpenAI API 키를 입력하면 실제 AI 처방이 켜집니다',
    '오늘의 기분·스트레스·가능한 시간·목표를 고릅니다',
    '“회복 루틴 받기”로 루틴·호흡·확언·성찰 질문을 받습니다',
    '호흡 타이머로 따라 하고, 기분 체크인을 눌러 변화를 기록합니다',
  ],
  facts: [
    { value: 'AI', label: '맞춤 처방' }, { value: '4-3-6', label: '호흡 가이드' }, { value: 'TTS', label: '음성 낭독' },
    { value: '추세', label: '기분 그래프' }, { value: '연속일', label: '습관 추적' }, { value: '무키', label: '폴백 동작' },
  ],
  info: [
    { title: '회복탄력성이란?', body: '역경에 적응하고 다시 일어서는 마음의 근력입니다. 타고나는 것이 아니라 규칙적인 수면·호흡·감사·관계 같은 작은 습관으로 길러집니다.' },
    { title: '왜 호흡인가요?', body: '느린 호흡(특히 날숨을 길게)은 부교감신경을 자극해 심박과 긴장을 낮춥니다. 4초 들숨·3초 멈춤·6초 날숨이 대표적인 안정 패턴입니다.' },
    { title: '기록의 힘', body: '기분을 숫자로 기록하면 막연한 불안이 객관화되고, 추세를 보며 좋아지고 있음을 확인할 수 있어 동기가 유지됩니다.' },
    { title: '안전 안내', body: '이 앱은 자기돌봄을 돕는 도구이며 의료 행위를 대체하지 않습니다. 지속적 우울·불안 시 전문가 상담을 권합니다.' },
  ],
  pipeline: [
    '상태 수집 — 기분·스트레스·가용 시간·회복 목표를 구조화',
    '처방 합성 — 근거 기반 회복 습관 가이드 + JSON 스키마 강제',
    'GPT 호출 — json_object 로 루틴·호흡·확언·성찰질문 일괄 수신',
    '검증·폴백 — 누락 시 내장 회복 루틴 템플릿으로 안전 처방',
    '실천 — 호흡 타이머 애니메이션 + 확언 TTS 낭독',
    '기록 — 기분 체크인 localStorage 누적 → SVG 추세 시각화',
  ],
  techNotes: [
    { title: '단일 구조화 처방', body: '루틴·호흡·확언·성찰을 한 번의 json_object 응답으로 받아 비용·지연을 줄이고, 파싱 실패는 폴백 템플릿으로 보정합니다.' },
    { title: '호흡 상태기계', body: '들숨→멈춤→날숨 단계를 타이머 기반 상태기계로 구현하고, CSS transform 스케일로 원을 부드럽게 확장·수축시킵니다.' },
    { title: 'SVG 추세 차트', body: '기분 로그를 정규화해 polyline 좌표로 변환, 외부 차트 라이브러리 없이 가벼운 스파크라인을 렌더합니다.' },
    { title: '오프라인·정적', body: '상태는 localStorage에만 저장, Web Speech API로 음성 낭독해 백엔드 없이 GitHub Pages에서 완결됩니다.' },
  ],
  targets: ['번아웃·불안을 겪는 직장인·학생', '자기돌봄 습관을 시작하려는 사람', '매일의 기분을 기록·관리하고 싶은 사람'],
  goals: [
    '오늘 상태에 맞는 회복 루틴·호흡·확언을 즉시 처방한다',
    '기분 체크인을 누적해 변화 추이를 객관화한다',
    'API 키가 없어도 내장 루틴 템플릿으로 동작하게 한다',
  ],
  scenarios: [
    '오늘의 기분·스트레스·가능 시간·목표를 고르고 회복 루틴을 받는다',
    '호흡 타이머를 따라 하고 확언을 TTS로 들으며 실천한다',
    '기분 체크인을 눌러 SVG 추세로 변화를 확인한다',
  ],
  screens: [
    { name: '상태 입력', desc: '오늘의 기분·스트레스·가능 시간·회복 목표 선택' },
    { name: '오늘의 루틴', desc: '시간대별 회복 루틴(이유 포함) + 완료 체크' },
    { name: '호흡 타이머', desc: '들숨·멈춤·날숨 애니메이션 호흡 가이드' },
    { name: '확언 · 성찰', desc: '오늘의 확언 + 성찰 질문 + TTS 낭독' },
    { name: '기분 추적', desc: '체크인 누적 SVG 추세 그래프 + 연속일' },
  ],
  pipelineDetail: [
    { step: '상태 수집', detail: '기분·스트레스·가용 시간·회복 목표를 구조화한다.' },
    { step: '처방 합성 · 스키마 강제', detail: '근거 기반 회복 습관 가이드를 system 프롬프트로 지시하고 JSON 스키마를 고정한다.' },
    { step: 'GPT 호출(json_object)', detail: 'json_object로 루틴·호흡·확언·성찰질문을 한 번에 수신한다.' },
    { step: '검증 · 폴백', detail: '누락 시 내장 회복 루틴 템플릿으로 안전 처방한다.' },
    { step: '실천', detail: '호흡 타이머 상태기계 애니메이션 + 확언 Web Speech 낭독.' },
    { step: '기록', detail: '기분 체크인을 localStorage(resilience.log)에 누적해 SVG 추세로 시각화한다.' },
  ],
  promptNotes: [
    'system 프롬프트로 근거 기반 회복 습관(수면·호흡·감사 등) 가이드와 안전 주의를 준다.',
    '루틴·호흡(들숨/멈춤/날숨 초)·확언·성찰질문을 하나의 json_object 스키마로 강제해 한 번에 받는다.',
    'API 키가 없으면 호출 없이 내장 회복 루틴 템플릿으로 동일 구조의 처방을 만든다.',
  ],
  architecture:
    '백엔드 없는 React SPA. 공통 레이아웃·5탭은 src/ui.tsx, 코칭 기능은 src/App.tsx가 담당한다. ' +
    'OpenAI 호출은 src/lib/ai.ts, 단계 애니메이션은 src/lib/flow.tsx, 음성 낭독은 src/lib/tts.ts가 처리하고, 기분 로그는 브라우저 localStorage에 저장한다.',
  structure: [
    { path: 'src/App.tsx', desc: '루틴 처방·호흡 타이머·기분 추적 + 메타(M)' },
    { path: 'src/ui.tsx', desc: '공통 레이아웃·5탭·UI 헬퍼' },
    { path: 'src/lib/ai.ts', desc: 'OpenAI chat 헬퍼(ask/hasKey)' },
    { path: 'src/lib/flow.tsx', desc: '단계 진행 애니메이션 Pipeline' },
    { path: 'src/lib/tts.ts', desc: 'Web Speech 한국어 낭독 훅' },
    { path: 'src/index.css', desc: '테마·호흡 타이머/그래프 스타일' },
  ],
  dataModel: [
    { name: 'Plan', desc: 'plan_title·routines·affirmations·breathing·reflections·weekly_goal 처방 결과' },
    { name: 'Routine', desc: 'time·activity·why 시간대별 루틴 한 건' },
    { name: 'Check', desc: 'd(날짜)·mood·stress 기분 체크인. localStorage "resilience.log"' },
  ],
  deploy:
    'Vite 빌드(base: "./") 후 GitHub Actions(deploy.yml)가 main push 시 GitHub Pages로 자동 배포 → aebonlee.github.io/project03/',
  stack: ['React 18', 'TypeScript', 'Vite', 'OpenAI GPT', 'Web Speech API', 'SVG', 'localStorage'],
  links: [
    { label: '보건복지부 정신건강', url: 'https://www.mohw.go.kr' },
    { label: 'Web Speech API (MDN)', url: 'https://developer.mozilla.org/docs/Web/API/SpeechSynthesis' },
  ],
};

const MOODS = [
  { score: 1, emoji: '😞', label: '많이 지침' }, { score: 2, emoji: '😟', label: '불안' },
  { score: 3, emoji: '😐', label: '그저 그럼' }, { score: 4, emoji: '🙂', label: '괜찮음' }, { score: 5, emoji: '😄', label: '좋음' },
];
const TIMES = [{ key: 5, label: '5분' }, { key: 15, label: '15분' }, { key: 30, label: '30분' }];
const GOALS = [
  { key: 'sleep', label: '수면 안정' }, { key: 'anxiety', label: '불안 완화' }, { key: 'focus', label: '집중력' },
  { key: 'relation', label: '관계 회복' }, { key: 'esteem', label: '자존감' },
];

interface Routine { time: string; activity: string; why: string }
interface Plan { plan_title: string; routines: Routine[]; affirmations: string[]; breathing: { name: string; inhale: number; hold: number; exhale: number }; reflections: string[]; weekly_goal: string }
interface Check { d: number; mood: number; stress: number }

function fallbackPlan(mood: number, time: number, goals: string[]): Plan {
  const goalLabel = GOALS.filter((g) => goals.includes(g.key)).map((g) => g.label).join('·') || '회복';
  const base: Routine[] = [
    { time: '아침', activity: '햇볕 5분 + 물 한 컵', why: '생체리듬을 깨워 기분의 기준선을 올려요.' },
    { time: '오후', activity: `${Math.min(time, 15)}분 가벼운 산책`, why: '몸을 움직이면 긴장 호르몬이 내려갑니다.' },
    { time: '저녁', activity: '감사한 일 3가지 적기', why: '긍정 경험에 주의를 돌려 회복탄력성을 키웁니다.' },
    { time: '잠들기 전', activity: '화면 끄고 4-3-6 호흡 10회', why: '날숨을 길게 해 신경계를 진정시킵니다.' },
  ];
  return {
    plan_title: `${goalLabel}를 위한 오늘의 회복 루틴`,
    routines: time <= 5 ? base.slice(2) : base,
    affirmations: ['나는 오늘 하루를 충분히 잘 보냈어.', '완벽하지 않아도 괜찮아, 나는 나아가고 있어.', '지금 이 순간, 나는 숨 쉬며 안전해.'],
    breathing: { name: '4-3-6 안정 호흡', inhale: 4, hold: 3, exhale: 6 },
    reflections: ['오늘 나를 가장 힘들게 한 것은 무엇이었나요?', '그럼에도 잘 해낸 작은 일은 무엇인가요?', '내일의 나에게 해주고 싶은 말은?'],
    weekly_goal: mood <= 2 ? '이번 주는 매일 같은 시간에 잠들기 한 가지만 지켜봐요.' : '이번 주는 하루 10분 산책을 5일 실천해 봐요.',
  };
}

async function getPlan(mood: number, stress: number, time: number, goals: string[]): Promise<Plan> {
  if (!hasKey()) return fallbackPlan(mood, time, goals);
  try {
    const goalLabel = GOALS.filter((g) => goals.includes(g.key)).map((g) => g.label).join(', ') || '전반적 회복';
    const out = await ask(
      '너는 따뜻하고 근거 있는 회복탄력성·정신건강 코치야. 의료행위가 아닌 자기돌봄 루틴을 제안한다. 위기 신호가 있으면 전문가 상담을 권한다. ' +
        '반드시 JSON만: {"plan_title":"","routines":[{"time":"","activity":"","why":""}],"affirmations":["확언"],"breathing":{"name":"","inhale":4,"hold":3,"exhale":6},"reflections":["성찰 질문"],"weekly_goal":""}',
      `기분(1~5): ${mood} / 스트레스(1~5): ${stress} / 하루 가용 시간: ${time}분 / 목표: ${goalLabel}. 루틴 3~4개, 확언 3개, 성찰 질문 3개, 한국어.`,
      { json: true, temperature: 0.7, max_tokens: 1100 },
    );
    const p = JSON.parse(out);
    if (!Array.isArray(p.routines) || !p.routines.length) return fallbackPlan(mood, time, goals);
    const b = p.breathing || {};
    return {
      plan_title: String(p.plan_title || '오늘의 회복 루틴'),
      routines: p.routines.map((r: Routine) => ({ time: String(r.time || ''), activity: String(r.activity || ''), why: String(r.why || '') })),
      affirmations: (p.affirmations || []).map(String),
      breathing: { name: String(b.name || '안정 호흡'), inhale: Number(b.inhale) || 4, hold: Number(b.hold) || 3, exhale: Number(b.exhale) || 6 },
      reflections: (p.reflections || []).map(String),
      weekly_goal: String(p.weekly_goal || ''),
    };
  } catch {
    return fallbackPlan(mood, time, goals);
  }
}

/* 호흡 타이머 */
function Breathing({ b, color }: { b: Plan['breathing']; color: string }) {
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [count, setCount] = useState(0);
  const tts = useReadAloud();
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  const seq: [typeof phase, number][] = [['inhale', b.inhale], ['hold', b.hold], ['exhale', b.exhale]];
  const start = () => {
    let i = 0; let cyc = 0;
    const step = () => {
      const [ph, sec] = seq[i];
      setPhase(ph); setCount(cyc + 1);
      if (ph === 'inhale' && tts.supported) tts.play(['들이쉬세요']);
      else if (ph === 'exhale' && tts.supported) tts.play(['천천히 내쉬세요']);
      timer.current = window.setTimeout(() => { i = (i + 1) % 3; if (i === 0) cyc += 1; if (cyc >= 5) { stop(); return; } step(); }, sec * 1000);
    };
    step();
  };
  const stop = () => { window.clearTimeout(timer.current); setPhase('idle'); tts.stop(); };
  const label = phase === 'inhale' ? '들이쉬기' : phase === 'hold' ? '잠시 멈춤' : phase === 'exhale' ? '내쉬기' : '시작 준비';
  const scale = phase === 'inhale' ? 1.35 : phase === 'exhale' ? 0.75 : phase === 'hold' ? 1.35 : 1;
  const dur = phase === 'inhale' ? b.inhale : phase === 'exhale' ? b.exhale : 0.3;

  return (
    <div className="breath">
      <div className="breath-circle" style={{ background: color, transform: `scale(${scale})`, transition: `transform ${dur}s ease-in-out` }}>
        <span>{phase === 'idle' ? '🫁' : `${label}`}</span>
      </div>
      <div className="breath-meta">
        <strong>{b.name}</strong>
        <span>들숨 {b.inhale}초 · 멈춤 {b.hold}초 · 날숨 {b.exhale}초 {phase !== 'idle' && `· ${count}/5회`}</span>
        <button className="btn" style={{ background: color, padding: '8px 16px', fontSize: 13 }} onClick={() => (phase === 'idle' ? start() : stop())}>{phase === 'idle' ? '▶ 호흡 시작' : '⏹ 멈춤'}</button>
      </div>
    </div>
  );
}

/* 기분 추세 스파크라인 */
function Trend({ log, color }: { log: Check[]; color: string }) {
  const data = log.slice(-14);
  if (data.length < 2) return <p style={{ fontSize: 13, color: 'var(--faint)', margin: 0 }}>체크인을 2회 이상 하면 추세 그래프가 표시돼요.</p>;
  const W = 280, H = 70, pad = 8;
  const pts = data.map((c, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((c.mood - 1) / 4) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, height: 'auto' }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((_c, i) => { const [x, y] = pts[i].split(',').map(Number); return <circle key={i} cx={x} cy={y} r="3" fill={color} />; })}
    </svg>
  );
}

function Feature() {
  const [mood, setMood] = useState(3);
  const [stress, setStress] = useState(3);
  const [time, setTime] = useState(15);
  const [goals, setGoals] = useState<string[]>(['anxiety']);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [gen, setGen] = useState(false);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [log, setLog] = useLocalStorage<Check[]>('resilience.log', []);
  const tts = useReadAloud();

  const toggle = (k: string) => setGoals(goals.includes(k) ? goals.filter((x) => x !== k) : [...goals, k]);
  const run = () => { setDone({}); setGen(true); requestAnimationFrame(() => document.getElementById('plan-top')?.scrollIntoView({ behavior: 'smooth' })); };
  const checkIn = () => setLog([...log, { d: log.length, mood, stress }].slice(-60));
  const streak = log.length;

  return (
    <Stack>
      <div className="studio">
        <Field label="오늘의 기분"><div className="chips">{MOODS.map((m) => <Chip key={m.score} active={mood === m.score} color={M.color} onClick={() => setMood(m.score)}>{m.emoji} {m.label}</Chip>)}</div></Field>
        <Field label={`스트레스 수준 · ${stress}/5`}><input type="range" min={1} max={5} value={stress} onChange={(e) => setStress(Number(e.target.value))} /></Field>
        <div className="studio-row">
          <Field label="하루 가용 시간"><div className="chips">{TIMES.map((t) => <Chip key={t.key} active={time === t.key} color={M.color} onClick={() => setTime(t.key)}>{t.label}</Chip>)}</div></Field>
          <Field label="회복 목표" hint="복수"><div className="chips">{GOALS.map((g) => <Chip key={g.key} active={goals.includes(g.key)} color={M.color} onClick={() => toggle(g.key)}>{g.label}</Chip>)}</div></Field>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" style={{ background: M.color }} disabled={gen} onClick={run}>{gen ? '🌱 루틴 짓는 중…' : '🌱 회복 루틴 받기'}</button>
          <button className="btn btn-ghost" onClick={checkIn}>📈 오늘 기분 체크인</button>
        </div>
      </div>

      {/* 기분 추세 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <strong>📈 내 기분 추세</strong><span style={{ fontSize: 12.5, color: 'var(--sub)' }}>누적 체크인 {streak}회</span>
        </div>
        <Trend log={log} color={M.color} />
      </div>

      <div id="plan-top" />
      {gen && <Pipeline color={M.color} icon="🌱" title="회복 루틴을 처방하는 중…" steps={PIPE} run={() => getPlan(mood, stress, time, goals)} onDone={(p) => { setPlan(p); setGen(false); }} />}
      {plan && !gen && (
        <Stack gap={18}>
          <h2 style={{ margin: 0, fontSize: 19 }}>🌱 {plan.plan_title}</h2>

          <Breathing b={plan.breathing} color={M.color} />

          <div className="learn">
            <h3 className="learn-h" style={{ color: M.color }}>📋 오늘의 루틴</h3>
            <Stack gap={8}>
              {plan.routines.map((r, i) => (
                <label key={i} className="chk" style={{ alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={!!done[i]} onChange={() => setDone({ ...done, [i]: !done[i] })} />
                  <span style={{ flex: 1 }}>
                    <b style={{ color: M.color }}>{r.time}</b> · <span style={{ textDecoration: done[i] ? 'line-through' : 'none', color: done[i] ? 'var(--faint)' : 'var(--text)' }}>{r.activity}</span>
                    <span style={{ display: 'block', fontSize: 12.5, color: 'var(--sub)', marginTop: 2 }}>{r.why}</span>
                  </span>
                </label>
              ))}
            </Stack>
          </div>

          {plan.affirmations.length > 0 && (
            <div className="learn">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="learn-h" style={{ color: M.color }}>💬 오늘의 확언</h3>
                {tts.supported && <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => (tts.speaking ? tts.stop() : tts.play(plan.affirmations))}>{tts.speaking ? '⏹️ 멈춤' : '🔊 읽어주기'}</button>}
              </div>
              <Stack gap={8}>{plan.affirmations.map((a, i) => <div key={i} className="callout-soft" style={{ background: `${M.color}10`, border: `1px solid ${M.color}30` }}><span>🌿</span><span>{a}</span></div>)}</Stack>
            </div>
          )}

          {plan.reflections.length > 0 && (
            <div className="learn">
              <h3 className="learn-h" style={{ color: M.color }}>🪞 오늘의 성찰</h3>
              <Stack gap={8}>{plan.reflections.map((q, i) => <div key={i} className="qrow"><span className="qno" style={{ background: M.color }}>Q{i + 1}</span><span>{q}</span></div>)}</Stack>
            </div>
          )}

          {plan.weekly_goal && (
            <div className="callout-soft" style={{ background: `${M.color}12`, border: `1px solid ${M.color}40` }}><span style={{ fontSize: 20 }}>🎯</span><p style={{ margin: 0 }}><b>이번 주 목표</b> · {plan.weekly_goal}</p></div>
          )}
        </Stack>
      )}
    </Stack>
  );
}

export default function App() { return <AppLayout m={M} feature={<Feature />} />; }
