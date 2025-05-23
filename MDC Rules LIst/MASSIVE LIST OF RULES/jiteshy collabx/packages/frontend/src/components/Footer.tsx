import { cn } from '@/lib/utils';
import { Command, Sun, Pencil, Share2 } from 'lucide-react';

export function Footer() {
  return (
    <div className="w-full lg:absolute bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 lg:from-transparent lg:via-transparent lg:to-transparent bottom-0 px-4 lg:px-6 pt-1 pb-2">
      <div className="flex justify-between items-center text-xs lg:text-sm text-slate-300">
        <span>
          © {new Date().getFullYear()} CollabX.
        </span>
        
        <div className="lg:flex items-center justify-center hidden">
          <div className="text-xs text-zinc-400 flex items-center">
            <span className="font-medium">⌘/Ctrl + ⇧/Shift +</span>
            <div className="flex ml-2 space-x-3">
              <div className="flex items-center">
                <div className="flex items-center px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-700">
                  <Share2 className="h-3 w-3 mr-1 text-zinc-800 dark:text-zinc-400" />
                  <span className='text-zinc-800 dark:text-zinc-400'>S</span>
                </div>
                <span className="ml-1.5 text-zinc-400">Share Session</span>
              </div>
            
              <div className="flex items-center">
                <div className="flex items-center px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-700">
                  <Command className="h-3 w-3 mr-1 text-zinc-800 dark:text-zinc-400" />
                  <span className='text-zinc-800 dark:text-zinc-400'>C</span>
                </div>
                <span className="ml-1.5 text-zinc-400">Copy Session</span>
              </div>
              
              <div className="flex items-center">
                <div className="flex items-center px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-700">
                  <Sun className="h-3 w-3 mr-1 text-zinc-800 dark:text-zinc-400" />
                  <span className='text-zinc-800 dark:text-zinc-400'>L</span>
                </div>
                <span className="ml-1.5 text-zinc-400">Theme</span>
              </div>
              
              <div className="flex items-center">
                <div className="flex items-center px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-700">
                  <Pencil className="h-3 w-3 mr-1 text-zinc-800 dark:text-zinc-400" />
                  <span className='text-zinc-800 dark:text-zinc-400'>E</span>
                </div>
                <span className="ml-1.5 text-zinc-400">Jump to Editor</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <a
            href="https://cursor.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Built with Cursor
          </a>
          <span className="text-zinc-500">|</span>
          <a
            href="https://github.com/jiteshy/collabx/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Report an Issue
          </a>
        </div>
      </div>
    </div>
  );
}
