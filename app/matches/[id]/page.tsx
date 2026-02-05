'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMatch } from '@/hooks/useMatches';
import { useMessages, useSendMessage } from '@/hooks/useMessages';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Send, User, Briefcase } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const matchId = params.id as string;
  const { data: match, isLoading: matchLoading } = useMatch(matchId);
  const { data: messages, isLoading: messagesLoading } = useMessages(matchId);
  const sendMessage = useSendMessage();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Enable real-time updates
  useRealtimeMessages(matchId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sendMessage.isPending) return;

    try {
      await sendMessage.mutateAsync({
        match_id: matchId,
        content: messageText.trim(),
      });
      setMessageText('');
    } catch (error) {
      alert('Failed to send message');
    }
  };

  if (matchLoading || messagesLoading) {
    return (
      <DashboardLayout>
        <div className="text-center text-gray-400 py-12">Loading chat...</div>
      </DashboardLayout>
    );
  }

  if (!match) {
    return (
      <DashboardLayout>
        <div className="text-center text-gray-400 py-12">Match not found</div>
      </DashboardLayout>
    );
  }

  const isOwnMessage = (senderId: string) => senderId === user?.id;

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col rounded-lg bg-gray-800">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-gray-700 p-4">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          {match.candidate?.avatar_url ? (
            <Image
              src={match.candidate.avatar_url}
              alt={match.candidate.full_name || 'Candidate'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="font-semibold text-white">
              {match.candidate?.full_name || 'Anonymous'}
            </h2>
            <p className="text-sm text-gray-400">{match.job?.title}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${isOwnMessage(message.sender_id) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    isOwnMessage(message.sender_id)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`mt-1 text-xs ${
                    isOwnMessage(message.sender_id) ? 'text-green-100' : 'text-gray-400'
                  }`}>
                    {format(new Date(message.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">
              No messages yet. Start the conversation!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t border-gray-700 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <button
              type="submit"
              disabled={!messageText.trim() || sendMessage.isPending}
              className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

