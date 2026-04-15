import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageSquare, User, Search, ArrowLeft } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { Chat, Message, User as UserType } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  targetUserId?: string; // If provided, open chat with this user immediately
  targetUserName?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, currentUser, targetUserId, targetUserName }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for chats
  useEffect(() => {
    if (!currentUser || !isOpen) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.id),
      orderBy('lastTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      setChats(chatList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [currentUser, isOpen]);

  // Handle target user (start new chat)
  useEffect(() => {
    if (isOpen && targetUserId && currentUser && targetUserId !== currentUser.id) {
      startChat(targetUserId, targetUserName || 'User');
    }
  }, [isOpen, targetUserId]);

  const startChat = async (otherUserId: string, otherUserName: string) => {
    if (!currentUser) return;
    
    const chatId = [currentUser.id, otherUserId].sort().join('_');
    const chatDoc = await getDoc(doc(db, 'chats', chatId));

    if (!chatDoc.exists()) {
      const newChat: Chat = {
        id: chatId,
        participants: [currentUser.id, otherUserId],
        participantNames: {
          [currentUser.id]: currentUser.name,
          [otherUserId]: otherUserName
        },
        lastTimestamp: serverTimestamp()
      };
      await setDoc(doc(db, 'chats', chatId), newChat);
      setActiveChat(newChat);
    } else {
      setActiveChat({ id: chatId, ...chatDoc.data() } as Chat);
    }
  };

  // Listen for messages in active chat
  useEffect(() => {
    if (!activeChat || !isOpen) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, `chats/${activeChat.id}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${activeChat.id}/messages`);
    });

    return () => unsubscribe();
  }, [activeChat, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !currentUser) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, `chats/${activeChat.id}/messages`), {
        chatId: activeChat.id,
        senderId: currentUser.id,
        text,
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: text,
        lastTimestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/${activeChat.id}/messages`);
    }
  };

  const getOtherParticipantName = (chat: Chat) => {
    if (!currentUser) return 'User';
    const otherId = chat.participants.find(id => id !== currentUser.id);
    return chat.participantNames?.[otherId || ''] || 'User';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-red-600 text-white shrink-0">
              <div className="flex items-center gap-3">
                {activeChat && (
                  <button 
                    onClick={() => setActiveChat(null)}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <MessageSquare size={20} />
                  {activeChat ? getOtherParticipantName(activeChat) : 'আপনার মেসেজসমূহ'}
                </h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              {!activeChat ? (
                // Chat List
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {chats.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                      <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                      <p>এখনো কোনো চ্যাট শুরু হয়নি</p>
                    </div>
                  ) : (
                    chats.map(chat => (
                      <button
                        key={chat.id}
                        onClick={() => setActiveChat(chat)}
                        className="w-full flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl hover:border-red-200 hover:shadow-sm transition-all text-left group"
                      >
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600 shrink-0">
                          <User size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate">
                            {getOtherParticipantName(chat)}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">{chat.lastMessage || 'মেসেজ নেই'}</p>
                        </div>
                        {chat.lastTimestamp && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(chat.lastTimestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                // Message Window
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => {
                      const isMe = msg.senderId === currentUser?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                            isMe 
                            ? 'bg-red-600 text-white rounded-tr-none shadow-md' 
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-sm'
                          }`}>
                            <p>{msg.text}</p>
                            <span className={`text-[10px] mt-1 block ${isMe ? 'text-red-100' : 'text-slate-400'}`}>
                              {msg.timestamp?.toDate() ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder="মেসেজ লিখুন..."
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg shadow-red-100"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
