import { useState } from 'react';
import { Hero, Stack, Field, Chip, Row, Pill, type Meta } from './ui';

const M: Meta = { id: 3, icon: '🌱', title: '회복탄력성 루틴 코치', tagline: '멘탈 회복을 돕는 맞춤 루틴·습관 코칭', members: ['김건희', '이초월', '김서우'], color: '#10b981' };

const MOODS = [
  { key: 'down', label: '가라앉음', emoji: '😔' }, { key: 'anxious', label: '불안함', emoji: '😟' },
  { key: 'tired', label: '지침', emoji: '😮‍💨' }, { key: 'okay', label: '그저 그럼', emoji: '😐' }, { key: 'good', label: '괜찮음', emoji: '🙂' },
];
interface Act { title: string; minutes: number; emoji: string; for: string[]; tip: string; }
const POOL: Act[] = [
  { title: '4-7-8 호흡 명상', minutes: 5, emoji: '🌬️', for: ['anxious', 'down', 'tired'], tip: '4초 들이쉬고 7초 멈추고 8초 내쉬기 ×4회' },
  { title: '감사 한 줄 쓰기', minutes: 5, emoji: '📝', for: ['down', 'okay', 'good'], tip: '오늘 고마웠던 일 하나를 적어보세요' },
  { title: '가벼운 스트레칭', minutes: 10, emoji: '🤸', for: ['tired', 'okay', 'anxious'], tip: '목·어깨·허리 위주로 천천히' },
  { title: '햇빛 산책', minutes: 15, emoji: '🚶', for: ['down', 'tired', 'good'], tip: '바깥 공기를 쐬며 가볍게 걷기' },
  { title: '좋아하는 음악 듣기', minutes: 10, emoji: '🎧', for: ['down', 'anxious', 'okay'], tip: '플레이리스트 1개를 온전히 즐기기' },
  { title: '생각 비우기 글쓰기', minutes: 10, emoji: '🧠', for: ['anxious', 'okay'], tip: '머릿속 걱정을 종이에 쏟아내기' },
  { title: '물 한 잔 + 휴식', minutes: 5, emoji: '💧', for: ['tired', 'good', 'okay'], tip: '잠깐 화면에서 눈을 떼고 쉬기' },
  { title: '내일 할 일 3가지 정하기', minutes: 10, emoji: '✅', for: ['anxious', 'good', 'okay'], tip: '딱 3개만, 작게 정하기' },
];

const build = (mood: string, stress: number, budget: number): Act[] => {
  const scored = POOL.map((a) => ({ a, s: (a.for.includes(mood) ? 2 : 0) + (stress >= 7 && a.minutes <= 10 ? 1 : 0) })).sort((x, y) => y.s - x.s);
  const out: Act[] = []; let used = 0;
  for (const { a } of scored) if (used + a.minutes <= budget) { out.push(a); used += a.minutes; }
  return out.length ? out : [scored[0].a];
};

export default function App() {
  const [mood, setMood] = useState('okay');
  const [stress, setStress] = useState(5);
  const [budget, setBudget] = useState(30);
  const [routine, setRoutine] = useState<Act[] | null>(null);
  const total = routine ? routine.reduce((s, a) => s + a.minutes, 0) : 0;

  return (
    <div className="wrap">
      <Hero m={M} />
      <main style={{ marginTop: 22 }}>
        <Stack>
          <Field label="오늘 기분"><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{MOODS.map((m) => <Chip key={m.key} active={mood === m.key} color={M.color} onClick={() => setMood(m.key)}>{m.emoji} {m.label}</Chip>)}</div></Field>
          <Row gap={20}>
            <div style={{ flex: '1 1 200px' }}><Field label={`스트레스 수준 (${stress}/10)`}><input type="range" min={0} max={10} value={stress} onChange={(e) => setStress(+e.target.value)} style={{ accentColor: M.color }} /></Field></div>
            <div style={{ flex: '1 1 200px' }}><Field label={`가용 시간 (${budget}분)`}><input type="range" min={10} max={60} step={5} value={budget} onChange={(e) => setBudget(+e.target.value)} style={{ accentColor: M.color }} /></Field></div>
          </Row>
          <button className="btn" onClick={() => setRoutine(build(mood, stress, budget))}>🌱 오늘의 회복 루틴 받기</button>
          {routine && (
            <Stack gap={12}>
              <div style={{ fontWeight: 700 }}>오늘의 루틴 · 총 <span style={{ color: M.color }}>{total}분</span> ({routine.length}단계)</div>
              {routine.map((a, i) => (
                <div key={i} className="box" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <span style={{ fontSize: 28 }}>{a.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><strong>{i + 1}. {a.title}</strong><Pill color={M.color}>{a.minutes}분</Pill></div>
                    <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--sub)' }}>{a.tip}</p>
                  </div>
                </div>
              ))}
              <p style={{ margin: 0, fontSize: 13, color: 'var(--faint)' }}>💬 작은 실천이 회복탄력성을 키웁니다. 한 단계씩 천천히 해보세요.</p>
            </Stack>
          )}
        </Stack>
      </main>
    </div>
  );
}
