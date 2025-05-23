import { motion, AnimatePresence } from 'framer-motion';
import { UserTypingStatus } from '@collabx/shared';

interface TypingIndicatorProps {
  typingUsers: Map<string, UserTypingStatus>;
  currentUsername: string;
}

export function TypingIndicator({ typingUsers, currentUsername }: TypingIndicatorProps) {
  const activeTypers = Array.from(typingUsers.values())
    .filter(status => status.isTyping)
    .map(status => status.user.username)
    .filter(username => username !== currentUsername);

  if (activeTypers.length === 0) return null;

  let message = '';
  if (activeTypers.length === 1) {
    message = `${activeTypers[0]} is typing...`;
  } else if (activeTypers.length === 2) {
    message = `${activeTypers[0]} and ${activeTypers[1]} are typing...`;
  } else {
    message = `${activeTypers.length} people are typing...`;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="fixed md:absolute bottom-4 md:top-4 md:bottom-auto right-4 text-xs text-zinc-600 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-sm shadow-sm"
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
} 