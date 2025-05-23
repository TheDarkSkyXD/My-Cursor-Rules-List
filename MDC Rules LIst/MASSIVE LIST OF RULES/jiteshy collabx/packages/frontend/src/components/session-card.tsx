import { Copy, Share2, Users, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@collabx/shared';
import { useEffect, useState } from 'react';

interface SessionCardProps {
  sessionId: string;
  username: string;
  users: User[];
  copySessionLink: () => void;
  shareSessionLink?: () => void;
}

function CollaboratorShimmer() {
  return (
    <div className="flex items-center justify-between px-2 py-1 rounded-lg">
      <div className="flex items-center space-x-2 lg:space-x-3">
        <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
        <div className="flex flex-col space-y-1">
          <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-2 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex items-center space-x-1.5 lg:space-x-2">
        <div className="h-1.5 w-1.5 lg:h-2 lg:w-2 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
        <div className="h-2 w-12 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function SessionCard({ sessionId, username, users, copySessionLink, shareSessionLink }: SessionCardProps) {
  const isSessionFull = users.length >= 5;
  const [isWebShareSupported, setIsWebShareSupported] = useState(false);
  
  useEffect(() => {
    setIsWebShareSupported(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  return (
    <div className="bg-zinc-100 w-full h-[220px] overflow-auto scrollbar-hide lg:h-auto rounded-lg p-3 lg:p-4 shadow-sm border border-zinc-200 lg:mb-6 dark:bg-zinc-800 dark:border-zinc-700">
      <h3 className="font-semibold mb-2 text-slate-900 text-base lg:text-lg dark:text-zinc-200">
        Current Session
      </h3>
      <div className="flex items-center mb-2 pb-3 lg:pb-4 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex-1 h-9 bg-slate-200 border border-slate-300 rounded-sm overflow-hidden dark:bg-zinc-700 dark:border-zinc-600">
          <span className="px-2 lg:px-3 py-1.5 lg:py-2 text-slate-500 text-sm block truncate dark:text-zinc-400">
            {`${window.location.origin}/${sessionId}`}
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="ml-2 !bg-zinc-700 text-zinc-100 cursor-pointer hover:text-white hover:!bg-zinc-950 dark:!bg-zinc-700"
          onClick={copySessionLink}
          title="Copy session link"
        >
          <Copy className="h-3 w-3 lg:h-4 lg:w-4" />
        </Button>

        {isWebShareSupported && shareSessionLink && (
          <Button
            variant="outline"
            size="icon"
            className="ml-2 !bg-zinc-700 text-zinc-100 cursor-pointer hover:text-white hover:!bg-zinc-950 dark:!bg-zinc-700"
            onClick={shareSessionLink}
            title="Share session link"
          >
            <Share2 className="h-3 w-3 lg:h-4 lg:w-4" />
          </Button>
        )}
      </div>

      {/* Collaborators */}
      <div className="space-y-2 lg:space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-3 w-3 lg:h-4 lg:w-4 text-slate-500 dark:text-zinc-300" />
            <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-zinc-300">
              Active Collaborators
            </span>
          </div>
          <div className="text-xs lg:text-sm text-slate-700 dark:text-zinc-300">
            ({users.length}/5)
            {isSessionFull && (
              <span className="ml-1 text-amber-500">(Full)</span>
            )}
          </div>
        </div>

        <div className="space-y-1.5 lg:space-y-2">
          <AnimatePresence>
            {users.length === 0 ? (
              <>
                <CollaboratorShimmer />
              </>
            ) : (
              users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between px-2 py-1 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div
                      className="w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs text-white"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.username[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs lg:text-sm font-medium text-slate-900 dark:text-zinc-200">
                        {user.username}
                        {user.username === username && (
                          <span className="ml-1 text-amber-400">(You)</span>
                        )}
                      </span>
                      <span className="text-[10px] lg:text-xs text-slate-500 dark:text-zinc-400">
                        {user.username === username ? 'Current User' : 'Collaborator'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 lg:space-x-2">
                    <Circle className="h-1.5 w-1.5 lg:h-2 lg:w-2 text-green-500 fill-green-500" />
                    <span className="text-[10px] lg:text-xs text-slate-500 dark:text-zinc-400">
                      Active
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
