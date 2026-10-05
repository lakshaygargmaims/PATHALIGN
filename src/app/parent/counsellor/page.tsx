import { ChatPanel } from '@/components/chat/chat-panel';

export const metadata = { title: 'Family Counselling' };

export default function ParentCounsellorPage() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-slate-500">
        Talk to the AI counsellor in your own language. Share your concerns openly — salary, job security, social
        standing, cost — and get answers grounded in records, with sources you can check yourself.
      </p>
      <ChatPanel />
    </div>
  );
}
