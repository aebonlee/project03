import { useState } from 'react';
import { AppLayout, Stack, Field, Chip, Row, Pill, type Meta } from './ui';
import { ask, hasKey } from './lib/ai';

const M: Meta = {
  id: 3, icon: '🌱', title: '회복탄력성 루틴 코치', tagline: '멘탈 회복을 돕는 맞춤 루틴·습관 코칭', members: ['김건희', '이초월', '김서우'], color: '#10b981', ai: true,
  problem: '번아웃·무기력은 누구에게나 찾아오지만, 막상 “무엇부터 해야 할지” 막막합니다. 오늘의 기분·스트레스·가용 시간만 입력하면 실천 가능한 회복 루틴을 짜주고, AI 코치가 따뜻한 한마디를 건넵니다.',
  features: [
    { icon: '🧩', title: '맞춤 루틴 추천', desc: '기분·스트레스·시간에 맞춘 회복 활동 조합' },
    { icon: '💚', title: 'AI 코칭 멘트', desc: 'OpenAI가 상태에 맞춘 격려와 조언을 제공' },
    { icon: '⏱️', title: '시간 맞춤', desc: '10~60분, 가용 시간 안에서 루틴 구성' },
    { icon: '🔁', title: '바로 실천', desc: '단계별 팁으로 지금 바로 따라 하기' },
  ],
  howto: ['오늘 기분을 선택해요', '스트레스 수준과 가용 시간을 정해요', '맞춤 루틴 + AI 코칭 멘트를 받아 실천해요'],
  facts: [{ value: '8', label: '회복 활동' }, { value: 'GPT', label: 'AI 코치' }, { value: '10~60', label: '분 맞춤' }, { value: '5', label: '기분 단계' }],
  info: [
    { title: '회복탄력성이란?', body: '역경·스트레스에서 다시 균형을 찾는 마음의 힘입니다. 타고나는 것이 아니라 작은 습관의 반복으로 키울 수 있습니다.' },
    { title: '호흡·기록의 힘', body: '4-7-8 호흡은 교감신경을 진정시키고, 감정 기록(저널링)은 생각을 객관화해 불안을 줄입니다.' },
    { title: '도움이 필요할 때', body: '지속적인 무기력·불면·우울감이 2주 이상이면 전문가 상담을 권합니다. 정신건강 위기상담 ☎ 1577-0199.' },
  ],
  stack: ['React', 'TypeScript', 'OpenAI API', 'Vite'],
  links: [{ label: '정신건강 정보 (보건복지부)', url: 'https://www.mohw.go.kr' }],
};

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

function Feature() {
  const [mood, setMood] = useState('okay');
  const [stress, setStress] = useState(5);
  const [budget, setBudget] = useState(30);
  const [routine, setRoutine] = useState<Act[] | null>(null);
  const [coach, setCoach] = useState('');
  const total = routine ? routine.reduce((s, a) => s + a.minutes, 0) : 0;

  const run = async () => {
    const r = build(mood, stress, budget); setRoutine(r); setCoach('');
    const label = MOODS.find((m) => m.key === mood)?.label;
    try {
      const c = await ask('너는 따뜻한 멘탈 회복 코치야. 2~3문장으로 공감과 격려, 오늘 루틴 실천을 가볍게 응원해. 부담스럽지 않게.', `기분: ${label}, 스트레스 ${stress}/10. 추천 루틴: ${r.map((a) => a.title).join(', ')}`, { temperature: 0.8, max_tokens: 220 });
      setCoach(c);
    } catch { if (hasKey()) setCoach(''); }
  };

  return (
    <Stack>
      <Field label="오늘 기분"><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{MOODS.map((m) => <Chip key={m.key} active={mood === m.key} color={M.color} onClick={() => setMood(m.key)}>{m.emoji} {m.label}</Chip>)}</div></Field>
      <Row gap={20}>
        <div style={{ flex: '1 1 200px' }}><Field label={`스트레스 (${stress}/10)`}><input type="range" min={0} max={10} value={stress} onChange={(e) => setStress(+e.target.value)} style={{ accentColor: M.color }} /></Field></div>
        <div style={{ flex: '1 1 200px' }}><Field label={`가용 시간 (${budget}분)`}><input type="range" min={10} max={60} step={5} value={budget} onChange={(e) => setBudget(+e.target.value)} style={{ accentColor: M.color }} /></Field></div>
      </Row>
      <button className="btn" style={{ background: M.color }} onClick={run}>🌱 오늘의 회복 루틴 받기</button>
      {coach && <div className="box" style={{ borderLeft: `4px solid ${M.color}` }}><p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.8 }}>💚 {coach}</p></div>}
      {routine && (
        <Stack gap={12}>
          <div style={{ fontWeight: 700 }}>오늘의 루틴 · 총 <span style={{ color: M.color }}>{total}분</span> ({routine.length}단계)</div>
          {routine.map((a, i) => (
            <div key={i} className="box" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 28 }}>{a.emoji}</span>
              <div style={{ flex: 1 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><strong>{i + 1}. {a.title}</strong><Pill color={M.color}>{a.minutes}분</Pill></div><p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--sub)' }}>{a.tip}</p></div>
            </div>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export default function App() { return <AppLayout m={M} feature={<Feature />} />; }
