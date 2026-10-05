import { ChatPanel } from '@/components/chat/chat-panel';

export const metadata = { title: 'AI Counsellor' };

export default function StudentCounsellorPage() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-slate-500">
        Ask questions in English or Hindi. The AI detects the underlying concern, retrieves available records and
        answers with sources — and hands over to a human counsellor whenever it cannot resolve your question.
      </p>
      <ChatPanel />
    </div>
  );
}
